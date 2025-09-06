import { registerDriver, type ProviderDriver } from "./core/driver";
import type { ChatRequest } from "./core/types";

/**
 * Cloudflare Workers AI driver that integrates with the existing
 * createNextHandler implementation
 */
const cloudflareDriver: ProviderDriver = {
  name: "cloudflare",
  
  async fetchStream(req: ChatRequest, signal?: AbortSignal): Promise<Response> {
    // Get env vars at runtime for edge compatibility
    const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    // Check for required credentials
    if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
      return new Response(JSON.stringify({ 
        error: "Missing Cloudflare credentials",
        details: "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set" 
      }), {
        status: 503,
        headers: { "content-type": "application/json" }
      });
    }

    const model = req.model || '@cf/meta/llama-3.1-8b-instruct';
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: req.messages,
          stream: req.stream ?? true,
          temperature: req.temperature ?? 0.7,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ 
          error: `Cloudflare API error: ${response.status}`,
          details: errorText 
        }), {
          status: response.status,
          headers: { "content-type": "application/json" }
        });
      }

      // If streaming, convert Cloudflare's format to our SSE format
      if (req.stream !== false && response.body) {
        const reader = response.body.getReader();
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
          async start(controller) {
            const decoder = new TextDecoder();
            let buffer = '';
            
            // Send initial meta event
            controller.enqueue(encoder.encode(`data: {"type":"meta","model":"${model}"}\n\n`));
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (!line.trim()) continue;
                  
                  // Parse Cloudflare's streaming format
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      controller.enqueue(encoder.encode(`data: {"type":"done"}\n\n`));
                      continue;
                    }
                    
                    try {
                      const json = JSON.parse(data);
                      // Convert to our format
                      if (json.response) {
                        // Non-streaming response
                        controller.enqueue(encoder.encode(`data: {"type":"content","text":"${json.response}"}\n\n`));
                      } else if (json.choices?.[0]?.delta?.content) {
                        // Streaming delta
                        const text = json.choices[0].delta.content;
                        controller.enqueue(encoder.encode(`data: {"type":"content","text":"${text}"}\n\n`));
                      }
                    } catch (e) {
                      console.error('Parse error:', e);
                    }
                  }
                }
              }
              
              // Send done event
              controller.enqueue(encoder.encode(`data: {"type":"done"}\n\n`));
            } catch (error) {
              controller.enqueue(encoder.encode(`data: {"type":"error","message":"${error}"}\n\n`));
            } finally {
              controller.close();
            }
          }
        });
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
      
      // Non-streaming response
      return response;
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Request failed",
        message: String(error) 
      }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }
  }
};

// Register the driver on import
registerDriver(cloudflareDriver);

// Export for explicit registration if needed
export function registerCloudflareDriver() {
  registerDriver(cloudflareDriver);
}