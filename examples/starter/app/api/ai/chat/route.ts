// Import from the copilotedge package
import { createNextHandler } from 'copilotedge/next';

export const runtime = 'edge';

// Create the handler with default model
const handler = createNextHandler({
  model: process.env.EDGECRAFT_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  stream: true,
  cache: false,
  debug: process.env.NODE_ENV !== 'production'
});

// Export the POST handler
export const POST = handler;

// Health check endpoints
export async function GET() {
  return new Response(JSON.stringify({ 
    ok: true, 
    endpoint: 'ai/chat', 
    streaming: true,
    configured: true
  }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}