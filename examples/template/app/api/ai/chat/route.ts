import { createNextHandler } from 'edgepilot-ai/next';

export const runtime = 'edge';

// Handle missing environment variables during build
const handler = process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID
  ? createNextHandler({
      model: '@cf/meta/llama-3.1-8b-instruct',
      stream: true,
      cache: false,
      debug: process.env.NODE_ENV !== 'production'
    })
  : async () => new Response(
      JSON.stringify({ error: 'EdgePilot AI not configured. Please set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );

export const POST = handler;