import { Message } from './types';

/**
 * Streaming response utilities for processing Server-Sent Events
 */

export interface StreamingOptions {
  model: string;
  debug?: boolean;
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
                    model: options.model,
                    choices: [{ index: 0, delta: { content }, finish_reason: null }]
                  })}\n\n`
                ));
              }
            } catch (parseError) {
              if (options.debug) {
                console.warn('[EdgePilot] Failed to parse streaming chunk:', parseError);
              }
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
 * Transforms a non-streaming response into the expected format
 */
export function transformNormalResponse(data: any, model: string): any {
  return {
    id: `chat-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: data.choices || [{
      index: 0,
      message: {
        role: 'assistant',
        content: data.result?.response || data.response || 'No response'
      },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}