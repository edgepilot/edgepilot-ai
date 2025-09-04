import { NextResponse } from 'next/server';
import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';

export const runtime = 'edge';

// Read once at module level, but DO NOT assert non-null
// We'll gate the POST export below based on presence
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Defaults; allow overriding via env if you want
const DEFAULT_MODEL = process.env.EDGECRAFT_MODEL ?? '@cf/meta/llama-3.1-8b-instruct';
const DEBUG = process.env.NODE_ENV !== 'production';

// If envs are present, build the real handler once
const realPost =
  CF_API_TOKEN && CF_ACCOUNT_ID
    ? createNextHandler({
        apiKey: CF_API_TOKEN,
        accountId: CF_ACCOUNT_ID,
        model: DEFAULT_MODEL,
        stream: true,
        cache: false,
        maxRetries: 2,
        debug: DEBUG,
      })
    : null;

// Helper to add permissive CORS for demos
function cors(res: Response, origin = '*') {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(res.body, { 
    status: res.status, 
    statusText: res.statusText,
    headers 
  });
}

// --- Health-ish helpers (lightweight, never hit the model) ---
export async function GET() {
  // Keep as a cheap OK—your /api/health route does the real env validation
  const response = NextResponse.json({ 
    ok: true, 
    endpoint: 'ai/chat', 
    streaming: true,
    model: DEFAULT_MODEL,
    configured: !!realPost
  });
  return cors(response);
}

export async function HEAD() {
  return cors(new Response(null, { status: 200 }));
}

export async function OPTIONS() {
  // Preflight CORS
  return cors(new Response(null, { status: 204 }));
}

// --- Main POST handler ---
export const POST = async (req: Request) => {
  // Fail fast if missing envs to avoid throwing at module init time
  if (!realPost) {
    return cors(
      NextResponse.json(
        {
          ok: false,
          error: 'Service unavailable: missing Cloudflare Workers AI credentials',
          missing: {
            CLOUDFLARE_API_TOKEN: !CF_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: !CF_ACCOUNT_ID,
          },
          help: 'Please set the required environment variables in .env.local',
        },
        { status: 503 }
      )
    );
  }

  // Optional: Allow simple per-request model overrides for demos
  let overrideModel: string | undefined;
  
  // Only allow overrides in development/demo mode
  if (DEBUG) {
    try {
      const clone = req.clone(); // body can only be read once
      const data = await clone.json().catch(() => null);
      
      // Check for model override in the request
      if (data && typeof data.model === 'string' && data.model.trim()) {
        const requestedModel = data.model.trim();
        
        // Validate it's a supported model (basic validation)
        const supportedModels = [
          '@cf/meta/llama-3.1-8b-instruct',
          '@cf/meta/llama-3.1-70b-instruct',
          '@cf/meta/llama-3.3-70b-instruct',
          '@cf/mistral/mistral-7b-instruct-v0.2',
          'gpt-oss-20b',
          'gpt-oss-120b'
        ];
        
        if (supportedModels.includes(requestedModel)) {
          overrideModel = requestedModel;
        }
      }
    } catch {
      // Ignore parse errors; treat as normal streaming call
    }
  }

  // Use override model if provided and different from default
  if (overrideModel && overrideModel !== DEFAULT_MODEL) {
    // Build a one-off handler with the override model
    const onceHandler = createNextHandler({
      apiKey: CF_API_TOKEN,
      accountId: CF_ACCOUNT_ID,
      model: overrideModel,
      stream: true,
      cache: false,
      maxRetries: 2,
      debug: DEBUG,
    });
    
    try {
      const res = await onceHandler(req);
      return cors(res);
    } catch (error) {
      console.error(`Model override failed for ${overrideModel}:`, error);
      // Fall back to default handler
    }
  }

  // Normal path with default model
  try {
    const res = await realPost(req);
    return cors(res);
  } catch (error) {
    console.error('AI handler error:', error);
    return cors(
      NextResponse.json(
        {
          ok: false,
          error: 'Internal server error',
          message: DEBUG ? String(error) : 'An error occurred processing your request',
        },
        { status: 500 }
      )
    );
  }
};