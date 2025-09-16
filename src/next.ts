import { NextResponse } from 'next/server';
import { Role, Message, Config, HttpError } from './core/types';
import { validateRequestBody } from './core/validation';
import { secureLog, SimpleRateLimit, getClientIdentifier, validateEnvironmentSecurity } from './core/security';

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

export function createNextHandler(userConfig: Config = {}) {
  const apiKey = userConfig.apiKey || process.env.CLOUDFLARE_API_TOKEN || '';
  const accountId = userConfig.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const model = userConfig.model || '@cf/meta/llama-3.1-8b-instruct';
  const defaultStream = userConfig.stream ?? true;
  const debug = userConfig.debug ?? false;
  const maxRetries = userConfig.maxRetries ?? 3;
  const cache = userConfig.cache === false ? undefined : new SimpleCache<any>();
  const providerPref = (process.env.EDGEPILOT_PROVIDER || 'cloudflare').toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // Initialize security features
  const rateLimit = new SimpleRateLimit(100, 60000); // 100 requests per minute
  validateEnvironmentSecurity();

  if (!apiKey) throw new HttpError(401, 'Unauthorized', 'API key required');
  if (!accountId) throw new HttpError(401, 'Unauthorized', 'Account ID required');

  function validateMessages(messages: any): Message[] {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpError(400, 'Invalid request', 'Messages must be a non-empty array');
    }
    return messages.map((msg: any, index: number) => {
      if (!msg || !msg.role || !msg.content) {
        throw new HttpError(400, 'Invalid request', `Invalid message at index ${index}`);
      }
      return {
        role: String(msg.role),
        content: String(msg.content).slice(0, 10_000)
      };
    });
  }

  function extractMessages(body: any): Message[] | null {
    if (body && body.messages && Array.isArray(body.messages)) {
      return validateMessages(body.messages);
    }
    if (body && body.query && body.variables?.messages) {
      return validateMessages(body.variables.messages);
    }
    return null;
  }

  async function callCloudflareAI(messages: Message[], streaming = false, selectedModel?: string, temperature?: number) {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: selectedModel || model, messages, stream: streaming, ...(typeof temperature === 'number' ? { temperature } : {}) })
    });
    if (!response.ok) {
      const status = response.status;
      // Read provider error for server-side debugging only
      try {
        const errTxt = await response.text();
        if (debug) console.error('[EdgePilot] Provider error:', status, errTxt?.slice(0, 500));
      } catch {}
      if (status === 401 || status === 403) throw new HttpError(401, 'Unauthorized');
      if (status === 429) throw new HttpError(429, 'Rate limit exceeded');
      throw new HttpError(503, 'Service unavailable');
    }
    return response;
  }

  async function callWithFallback(messages: Message[], streaming = false, selectedModel?: string, temperature?: number) {
    const primary = selectedModel || model;
    // Reasonable fallbacks known to be widely available
    const fallbacks = [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/openchat/openchat-3.5-1210'
    ];
    const tried = new Set<string>();
    const order = [primary, ...fallbacks].filter((m) => {
      if (!m) return false;
      if (tried.has(m)) return false;
      tried.add(m);
      return true;
    });
    let lastErr: any;
    for (const m of order) {
      try {
        return await callCloudflareAI(messages, streaming, m, temperature);
      } catch (e: any) {
        lastErr = e;
        if (debug) console.warn('[EdgePilot] model failed:', m, e?.status || e?.message);
        // Only fall back on non-auth errors
        if (e instanceof HttpError && (e.status === 401 || e.status === 403)) throw e;
        // else try next
      }
    }
    throw lastErr;
  }

  async function callOpenAI(messages: Message[], streaming = false, selectedModel?: string, temperature?: number) {
    const key = openaiKey;
    if (!key) throw new HttpError(503, 'Service unavailable');
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const mdl = selectedModel || openaiModel;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: mdl, messages, stream: streaming, ...(typeof temperature === 'number' ? { temperature } : {}) })
    });
    if (!response.ok) {
      const status = response.status;
      try { const txt = await response.text(); if (debug) console.error('[EdgePilot] OpenAI error:', status, txt?.slice(0,500)); } catch {}
      if (status === 401 || status === 403) throw new HttpError(401, 'Unauthorized');
      if (status === 429) throw new HttpError(429, 'Rate limit exceeded');
      throw new HttpError(503, 'Service unavailable');
    }
    return response;
  }

  async function retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (i < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 8000);
          if (debug) console.log(`[EdgePilot] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
    throw lastError;
  }

  async function handleStreaming(messages: Message[], selectedModel?: string, providerOverride?: string, temperature?: number) {
    const response = await retry(async () => {
      const useOpenAI = (providerOverride || providerPref) === 'openai';
      if (useOpenAI) return callOpenAI(messages, true, selectedModel, temperature);
      try {
        return await callWithFallback(messages, true, selectedModel, temperature);
      } catch (e: any) {
        if (!(e instanceof HttpError && (e.status === 401 || e.status === 403)) && openaiKey) {
          return callOpenAI(messages, true, selectedModel, temperature);
        }
        throw e;
      }
    });
    if (!response.body) throw new HttpError(503, 'Service unavailable');

    const reader = response.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              id: `chat-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: selectedModel || model,
              choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
            })}\n\n`
          ));

          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.response || parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      id: `chat-${Date.now()}`,
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: selectedModel || model,
                      choices: [{ index: 0, delta: { content }, finish_reason: null }]
                    })}\n\n`
                  ));
                }
              } catch {}
            }
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              id: `chat-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: selectedModel || model,
              choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
            })}\n\ndata: [DONE]\n\n`
          ));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }

  async function handleNormal(messages: Message[], selectedModel?: string, providerOverride?: string, temperature?: number) {
    const cacheKey = cache ? JSON.stringify(messages) : null;
    if (cacheKey && cache) {
      const hit = cache.get(cacheKey);
      if (hit) return { ...(hit as any), cached: true };
    }

    const response = await retry(async () => {
      const useOpenAI = (providerOverride || providerPref) === 'openai';
      if (useOpenAI) return callOpenAI(messages, false, selectedModel, temperature);
      try {
        return await callWithFallback(messages, false, selectedModel, temperature);
      } catch (e: any) {
        if (!(e instanceof HttpError && (e.status === 401 || e.status === 403)) && openaiKey) {
          return callOpenAI(messages, false, selectedModel, temperature);
        }
        throw e;
      }
    });
    const data = await response.json();
    const result = {
      id: `chat-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: selectedModel || model,
      choices: data.choices || [{
        index: 0,
        message: { role: 'assistant', content: data.result?.response || data.response || 'No response' },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
    if (cacheKey && cache) cache.set(cacheKey, result);
    return result;
  }

  async function handleRequest(validatedRequest: {
    messages: Message[];
    stream?: boolean;
    model?: string;
    temperature?: number;
    provider?: string;
  }) {
    const { messages, stream, model: selectedModel, temperature, provider: providerOverride } = validatedRequest;
    const useStreaming = stream === true || (stream !== false && defaultStream);
    return useStreaming ? handleStreaming(messages, selectedModel, providerOverride, temperature) : handleNormal(messages, selectedModel, providerOverride, temperature);
  }

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

      const body = await req.json();

      // Secure validation and sanitization
      const validatedRequest = validateRequestBody(body);

      if (debug) {
        secureLog(`Processing request with ${validatedRequest.messages.length} messages`);
      }

      const result = await handleRequest(validatedRequest);
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (error: any) {
      if (debug) {
        secureLog('Request error:', error.message);
      }
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.publicMessage }, { status: error.status });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
