import { Role, Message, Config, HttpError } from './core/types';

/**
 * Creates a fetch-compatible handler for EdgePilot AI that works with Cloudflare Workers
 * and other edge runtimes. This handler processes AI chat requests and returns responses
 * from either Cloudflare Workers AI or OpenAI based on configuration.
 *
 * @param config - Configuration options for the handler
 * @param config.apiKey - Cloudflare API token (defaults to CLOUDFLARE_API_TOKEN env var)
 * @param config.accountId - Cloudflare account ID (defaults to CLOUDFLARE_ACCOUNT_ID env var)
 * @param config.model - Default AI model to use (defaults to @cf/meta/llama-3.1-8b-instruct)
 *
 * @returns A fetch handler function that processes AI requests
 *
 * @example
 * ```typescript
 * // Basic usage with Cloudflare Workers
 * import { createFetchHandler } from 'edgepilot-ai/fetch';
 *
 * const handler = createFetchHandler({
 *   model: '@cf/meta/llama-3.1-8b-instruct'
 * });
 *
 * export default {
 *   fetch: handler
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With explicit configuration
 * const handler = createFetchHandler({
 *   apiKey: 'your-api-token',
 *   accountId: 'your-account-id',
 *   model: '@cf/mistral/mistral-7b-instruct-v0.2'
 * });
 * ```
 */
export function createFetchHandler(config: Config) {
  const apiKey = config?.apiKey || process.env.CLOUDFLARE_API_TOKEN || '';
  const accountId = config?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const model = config?.model || '@cf/meta/llama-3.1-8b-instruct';
  const providerPref = (process.env.EDGEPILOT_PROVIDER || 'cloudflare').toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

  if (!apiKey) throw new HttpError(401, 'Unauthorized', 'API key is required');
  if (!accountId) throw new HttpError(401, 'Unauthorized', 'Account ID is required');

  function validateMessages(messages: any): Message[] {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpError(400, 'Invalid request', 'Messages must be a non-empty array');
    }
    return messages.map((msg: any, index: number) => {
      if (!msg?.role || !msg?.content) {
        throw new HttpError(400, 'Invalid request', `Invalid message at index ${index}`);
      }
      return { role: String(msg.role), content: String(msg.content).slice(0, 10_000) };
    });
  }

  function extractMessages(body: any): Message[] {
    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'Invalid request', 'Invalid request body');
    }
    if (Array.isArray(body.messages)) {
      return validateMessages(body.messages);
    }
    if (body.query && body.variables?.messages) {
      return validateMessages(body.variables.messages);
    }
    throw new HttpError(400, 'Invalid request', 'No messages found in request');
  }

  function transformResponse(cfResponse: any, streaming: boolean, effectiveModel: string) {
    if (streaming) return cfResponse;
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: effectiveModel,
      choices: cfResponse.choices || [{
        index: 0,
        message: { role: 'assistant', content: cfResponse.result?.response || cfResponse.response || '' },
        finish_reason: 'stop'
      }]
    };
  }

  return async function handler(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const messages = extractMessages(body);
      const streaming = body.stream === true;
      const selectedModel = typeof body?.model === 'string' && body.model.trim() ? String(body.model).trim() : undefined;
      const temperature = typeof body?.temperature === 'number' ? Number(body.temperature) : undefined;

      async function cfCall(m: string) {
        return fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: m, messages, stream: streaming, ...(typeof temperature === 'number' ? { temperature } : {}) }),
          signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(30_000) : undefined
        });
      }
      async function openaiCall(m: string) {
        return fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: m, messages, stream: streaming, ...(typeof temperature === 'number' ? { temperature } : {}) }),
          signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(30_000) : undefined
        });
      }

      let response: Response | null = null;
      if (providerPref === 'openai') {
        response = await openaiCall(selectedModel || openaiModel);
      } else {
        // Try CF models, then OpenAI as last resort (if key present)
        const tryModels = [selectedModel || model, '@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.1-70b-instruct', '@cf/openchat/openchat-3.5-1210']
          .filter((m, i, arr) => m && arr.indexOf(m) === i) as string[];
        for (const m of tryModels) {
          response = await cfCall(m);
          if (response.ok || response.status === 401 || response.status === 403) break;
        }
        if (response && !response.ok && openaiKey) {
          response = await openaiCall(openaiModel);
        }
      }
      const cfResponse = response as Response;

      if (!cfResponse.ok) {
        const status = cfResponse.status;
        try {
          const errTxt = await cfResponse.text();
          // eslint-disable-next-line no-console
          console.error('[EdgePilot:fetch] Provider error:', status, errTxt?.slice(0, 500));
        } catch {}
        if (status === 401 || status === 403) return new Response('Unauthorized', { status: 401 });
        if (status === 429) return new Response('Rate limit exceeded', { status: 429 });
        return new Response('Service unavailable', { status: 503 });
      }

      if (streaming && cfResponse.body) {
        return new Response(cfResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      }

      const data = await cfResponse.json();
      const transformed = transformResponse(data, false, selectedModel || model);
      return new Response(JSON.stringify(transformed), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return new Response(JSON.stringify({ error: error.publicMessage }), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
