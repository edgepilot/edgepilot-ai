import { NextResponse } from 'next/server';
import { createNextHandler } from '@edgecraft/copilotkit-workers-ai';

export const runtime = 'edge';

export const POST = createNextHandler({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  model: '@cf/meta/llama-3.1-8b-instruct',
  stream: true,
  cache: false,
  maxRetries: 2,
  debug: process.env.NODE_ENV !== 'production'
});

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'ai/chat', streaming: true });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
