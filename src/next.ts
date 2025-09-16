import { NextResponse } from 'next/server';
import { Role, Message, Config, HttpError } from './core/types';
import { validateRequestBody } from './core/validation';
import { secureLog, SimpleRateLimit, getClientIdentifier, validateEnvironmentSecurity } from './core/security';
import { createStreamingResponse, transformNormalResponse } from './core/streaming';
import { ProviderManager } from './core/providers';
import { resolveConfig, validateConfig } from './core/config';

/**
 * Simple cache implementation for response caching
 */
class SimpleCache<T = unknown> {
  private cache = new Map<string, { data: T; expires: number }>();

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: T, ttl = 60_000) {
    this.cache.set(key, { data, expires: Date.now() + ttl });
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Creates a Next.js API route handler for EdgePilot AI
 */
export function createNextHandler(userConfig: Config = {}) {
  // Resolve and validate configuration
  const config = resolveConfig(userConfig);
  validateConfig(config);

  // Initialize core services
  const cache = config.cache ? new SimpleCache<any>() : undefined;
  const rateLimit = new SimpleRateLimit(100, 60000); // 100 requests per minute
  const providerManager = new ProviderManager({
    cloudflareApiKey: config.apiKey,
    cloudflareAccountId: config.accountId,
    openaiApiKey: process.env.OPENAI_API_KEY,
    debug: config.debug,
    maxRetries: config.maxRetries
  });

  // Perform security validation
  validateEnvironmentSecurity();

  /**
   * Handle streaming responses
   */
  async function handleStreaming(
    messages: Message[],
    model: string,
    providerOverride?: string,
    temperature?: number
  ): Promise<Response> {
    const response = await providerManager.call({
      messages,
      model,
      streaming: true,
      temperature,
      provider: providerOverride
    });

    return createStreamingResponse(response, {
      model,
      debug: config.debug
    });
  }

  /**
   * Handle non-streaming responses
   */
  async function handleNormal(
    messages: Message[],
    model: string,
    providerOverride?: string,
    temperature?: number
  ): Promise<any> {
    const cacheKey = cache ? JSON.stringify({ messages, model, temperature }) : null;

    // Check cache first
    if (cacheKey && cache) {
      const hit = cache.get(cacheKey);
      if (hit) {
        return { ...(hit as any), cached: true };
      }
    }

    // Make API call
    const response = await providerManager.call({
      messages,
      model,
      streaming: false,
      temperature,
      provider: providerOverride
    });

    const data = await response.json();
    const result = transformNormalResponse(data, model);

    // Cache the result
    if (cacheKey && cache) {
      cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Process a validated request
   */
  async function handleRequest(validatedRequest: {
    messages: Message[];
    stream?: boolean;
    model?: string;
    temperature?: number;
    provider?: string;
  }): Promise<Response | any> {
    const {
      messages,
      stream,
      model: selectedModel,
      temperature,
      provider: providerOverride
    } = validatedRequest;

    const model = selectedModel || config.model;
    const useStreaming = stream === true || (stream !== false && config.stream);

    if (useStreaming) {
      return handleStreaming(messages, model, providerOverride, temperature);
    } else {
      return handleNormal(messages, model, providerOverride, temperature);
    }
  }

  /**
   * Main POST handler
   */
  return async function POST(req: Request): Promise<Response> {
    try {
      // Rate limiting check
      const clientId = getClientIdentifier(req);
      if (!rateLimit.checkLimit(clientId)) {
        const status = rateLimit.getStatus(clientId);
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': status.remaining.toString(),
              'X-RateLimit-Reset': new Date(status.resetTime).toISOString()
            }
          }
        );
      }

      // Parse and validate request
      const body = await req.json();
      const validatedRequest = validateRequestBody(body);

      if (config.debug) {
        secureLog(`Processing request with ${validatedRequest.messages.length} messages`);
      }

      // Process request
      const result = await handleRequest(validatedRequest);
      if (result instanceof Response) return result;
      return NextResponse.json(result);

    } catch (error: any) {
      if (config.debug) {
        secureLog('Request error:', error.message);
      }

      if (error instanceof HttpError) {
        return NextResponse.json(
          { error: error.publicMessage },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}