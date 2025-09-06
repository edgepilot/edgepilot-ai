import { NextResponse } from 'next/server';

export const runtime = 'edge';

function validateEnv() {
  const missing: string[] = [];
  if (!process.env.CLOUDFLARE_API_TOKEN) missing.push('CLOUDFLARE_API_TOKEN');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
  // Optional: Add other env vars if needed
  // if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  return { ok: missing.length === 0, missing };
}

export async function HEAD() {
  const { ok } = validateEnv();
  return new Response(null, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  const { ok, missing } = validateEnv();
  const body = {
    ok,
    service: 'edgepilot',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
    runtime: 'edge',
    env: ok ? 'ok' : 'missing',
    missing, // empty array when ok
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}