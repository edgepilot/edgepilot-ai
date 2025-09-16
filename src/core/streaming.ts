import { Message } from './types';

/**
 * Retry configuration for network operations
 */
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      (error.status >= 500 && error.status < 600)
    );
  }
};

/**
 * Exponential backoff retry utility with jitter
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or condition not met
      if (attempt === config.maxAttempts || !config.retryCondition!(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      // Add jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() - 0.5);
      const finalDelay = Math.max(100, delay + jitter);

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

/**
 * API response structure from providers
 */
export interface ProviderResponse {
  response?: string;
  result?: {
    response: string;
  };
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
}

/**
 * Streaming response utilities for processing Server-Sent Events
 */

export interface StreamingOptions {
  model: string;
  debug?: boolean;
  timeout?: number;
  maxChunkSize?: number;
  retryAttempts?: number;
}

/**
 * Creates a streaming response from a fetch Response with SSE parsing
 */
export async function createStreamingResponse(
  response: Response,
  options: StreamingOptions
): Promise<Response> {
  if (!response.body) {
    throw new Error('No response body available for streaming');
  }

  const reader = response.body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Timeout and reliability settings
  const timeout = options.timeout ?? 60000; // 60 second default
  const maxChunkSize = options.maxChunkSize ?? 8192; // 8KB chunks
  let streamStartTime = Date.now();
  let lastChunkTime = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Resource cleanup on abort/close
      const cleanup = () => {
        try {
          reader.cancel();
          controller.close();
        } catch (error) {
          if (options.debug) {
            console.warn('[EdgePilot] Cleanup error:', error);
          }
        }
      };

      // Handle client disconnection through AbortController
      // Note: controller.signal is not available on ReadableStreamDefaultController
      // Client disconnection is handled through the stream's cancel method

      try {
        // Send initial role delta
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({
            id: `chat-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: options.model,
            choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
          })}\n\n`
        ));

        let buffer = '';
        let totalChunksProcessed = 0;
        const maxChunks = 10000; // Prevent unbounded processing

        while (true) {
          const now = Date.now();

          // Timeout protection: check stream duration and inactivity
          if (now - streamStartTime > timeout) {
            throw new Error(`Streaming timeout: total duration exceeded ${timeout}ms`);
          }
          if (now - lastChunkTime > 30000) { // 30s inactivity timeout
            throw new Error(`Streaming timeout: no data received for 30 seconds`);
          }

          // Prevent runaway loops
          if (totalChunksProcessed > maxChunks) {
            throw new Error(`Streaming aborted: exceeded maximum chunks (${maxChunks})`);
          }

          const readPromise = reader.read();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Read timeout')), 10000); // 10s read timeout
          });

          const { done, value } = await Promise.race([readPromise, timeoutPromise]) as { done: boolean; value?: Uint8Array };

          if (done) break;

          lastChunkTime = Date.now();
          totalChunksProcessed++;

          // Validate chunk size to prevent memory attacks
          if (value && value.length > maxChunkSize) {
            if (options.debug) {
              console.warn(`[EdgePilot] Large chunk detected: ${value.length} bytes, truncating`);
            }
            // Truncate oversized chunks
            const truncatedValue = value.slice(0, maxChunkSize);
            buffer += decoder.decode(truncatedValue, { stream: true });
          } else if (value) {
            buffer += decoder.decode(value, { stream: true });
          }

          // Prevent buffer from growing unbounded
          if (buffer.length > maxChunkSize * 4) {
            if (options.debug) {
              console.warn('[EdgePilot] Buffer size exceeded, truncating');
            }
            buffer = buffer.slice(-maxChunkSize * 2); // Keep recent half
          }

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
                // Sanitize content length
                const sanitizedContent = content.length > 4096 ? content.slice(0, 4096) : content;

                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({
                    id: `chat-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: options.model,
                    choices: [{ index: 0, delta: { content: sanitizedContent }, finish_reason: null }]
                  })}\n\n`
                ));
              }
            } catch (parseError) {
              if (options.debug) {
                console.warn('[EdgePilot] Failed to parse streaming chunk:', parseError);
              }
              // Continue processing despite parse errors
            }
          }
        }

        // Send completion
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({
            id: `chat-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: options.model,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
          })}\n\ndata: [DONE]\n\n`
        ));

        controller.close();
      } catch (error) {
        if (options.debug) {
          console.error('[EdgePilot] Streaming error:', error);
        }
        controller.error(error);
      } finally {
        // Ensure cleanup happens even on error
        try {
          reader.cancel();
        } catch (cleanupError) {
          if (options.debug) {
            console.warn('[EdgePilot] Reader cleanup error:', cleanupError);
          }
        }
      }
    },

    // Add cancel method for proper cleanup
    cancel() {
      try {
        reader.cancel();
      } catch (error) {
        if (options.debug) {
          console.warn('[EdgePilot] Stream cancel error:', error);
        }
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

/**
 * Standard API response format
 */
export interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cached?: boolean;
}

/**
 * Transforms a non-streaming response into the expected format
 */
export function transformNormalResponse(data: ProviderResponse, model: string): ApiResponse {
  // Transform provider choices to our format
  const choices = data.choices?.map((choice, index) => ({
    index,
    message: choice.message || {
      role: 'assistant',
      content: choice.delta?.content || data.result?.response || data.response || 'No response'
    },
    finish_reason: choice.finish_reason || 'stop'
  })) || [{
    index: 0,
    message: {
      role: 'assistant',
      content: data.result?.response || data.response || 'No response'
    },
    finish_reason: 'stop'
  }];

  return {
    id: `chat-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices,
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}