import { NextResponse } from 'next/server';
import { Role, Message, Config, HttpError } from './core/types';
import { validateRequestBody } from './core/validation';
import { secureLog, SimpleRateLimit, getClientIdentifier, validateEnvironmentSecurity } from './core/security';
import { createStreamingResponse, transformNormalResponse, ApiResponse } from './core/streaming';
import { ProviderManager } from './core/providers';
import { resolveConfig, validateConfig } from './core/config';
import { ResponseCache } from './core/cache';

/**
 * Creates a Next.js API route handler for EdgePilot AI
 *
 * This function creates a fully-featured AI chat handler with:
 * - Automatic rate limiting (100 requests/minute)
 * - Input validation and sanitization
 * - Multi-provider support (Cloudflare AI + OpenAI fallback)
 * - Response caching with memory management
 * - Streaming and non-streaming responses
 * - Comprehensive error handling
 * - Security features and environment validation
 *
 * @param userConfig - Configuration options to override defaults
 * @returns A Next.js API route handler function for POST requests
 *
 * @example
 * ```typescript
 * // app/api/ai/chat/route.ts
 * import { createNextHandler } from 'edgepilot-ai/next';
 *
 * export const runtime = 'edge';
 *
 * const handler = createNextHandler({
 *   model: '@cf/meta/llama-3.1-8b-instruct',
 *   stream: true,
 *   cache: true,
 *   debug: process.env.NODE_ENV !== 'production'
 * });
 *
 * export const POST = handler;
 * ```
 */
export function createNextHandler(userConfig: Config = {}) {
  // Resolve and validate configuration
  const config = resolveConfig(userConfig);
  validateConfig(config);

  // Initialize core services
  const cache = config.cache ? new ResponseCache() : undefined;
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
  ): Promise<ApiResponse> {
    const cacheKey = cache ? ResponseCache.generateKey({ messages, model, temperature }) : null;

    // Check cache first
    if (cacheKey && cache) {
      const hit = cache.get(cacheKey);
      if (hit) {
        return { ...hit, cached: true };
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
    const result = transformNormalResponse(data, model) as ApiResponse;

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
  }): Promise<Response | ApiResponse> {
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