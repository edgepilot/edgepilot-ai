# 1) Harden the `/api/health` route

- Return clear **machine-readable** fields
- Add **Cache-Control: no-store** (health should never be cached)
- Surface **which** env is missing (in GET only)
- Keep **HEAD** ultra-light

```ts
// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

function validateEnv() {
  const missing: string[] = [];
  if (!process.env.CLOUDFLARE_API_TOKEN) missing.push("CLOUDFLARE_API_TOKEN");
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) missing.push("CLOUDFLARE_ACCOUNT_ID");
  // Optional OpenAI fallback (don’t fail health if you don’t require it):
  // if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  return { ok: missing.length === 0, missing };
}

export async function HEAD() {
  const { ok } = validateEnv();
  return new Response(null, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const { ok, missing } = validateEnv();
  const body = {
    ok,
    service: "copilotedge",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
    runtime: "edge",
    env: ok ? "ok" : "missing",
    missing, // empty array when ok
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
```

# 2) Tight, resilient `useConfigStatus`

- **HEAD first**, then **GET** fallback
- Short timeouts (3s), with proper `finally` cleanup
- Stable return shape

```ts
import { useQuery } from "@tanstack/react-query";

async function ping(method: "HEAD" | "GET", ms: number) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch("/api/health", { method, signal: ctl.signal });
    const ok = res.ok;
    const details =
      method === "GET" ? await res.json().catch(() => null) : null;
    return { ok, details };
  } finally {
    clearTimeout(t);
  }
}

async function checkHealth() {
  // Fast path
  const head = await ping("HEAD", 3000);
  if (head.ok) return { isConfigured: true, details: null };

  // Fallback with details
  const get = await ping("GET", 3000);
  return { isConfigured: get.ok, details: get.details };
}

export function useConfigStatus() {
  const q = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 8000),
    staleTime: 10000,
    gcTime: 60000,
  });

  const status: "checking" | "configured" | "unconfigured" | "error" =
    q.isLoading
      ? "checking"
      : q.data?.isConfigured
      ? "configured"
      : q.isError
      ? "error"
      : "unconfigured";

  return {
    status,
    isConfigured: q.data?.isConfigured ?? false,
    details: q.data?.details ?? null,
    error: q.error,
    refetch: q.refetch,
  };
}
```

# 3) Nice-to-haves (tiny but useful)

- **Expose version/build info** via `NEXT_PUBLIC_APP_VERSION` (set it in CI) so GET includes it.
- Add a tiny **status badge** component that reads `status` and shows `Configured / Checking / Error`.
- In `SetupGuide`, if `details?.missing?.length`, list them so users know exactly which env vars are absent.

Example status badge:

```tsx
export function ConfigStatusBadge({
  status,
}: {
  status: "checking" | "configured" | "unconfigured" | "error";
}) {
  const map = {
    checking: { text: "Checking…", cls: "bg-yellow-300 text-black" },
    configured: { text: "Configured", cls: "bg-green-300 text-black" },
    unconfigured: { text: "Not configured", cls: "bg-rose-300 text-black" },
    error: { text: "Error", cls: "bg-red-400 text-black" },
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map.cls}`}>
      {map.text}
    </span>
  );
}
```

---

With those tweaks you keep your speedy 7ms health checks, get crisp diagnostics when something’s off, and fully avoid AI handler cold-starts during health probes. If you want, I can also add a tiny **/api/health/internal** that includes process info (uptime, node version) and protect it by IP or a token for ops use only.

Perfect! All the high-leverage refinements have been successfully implemented:

✅ Implemented Improvements:

1. Hardened /api/health route

- Returns machine-readable fields with service info
- Added Cache-Control: no-store to prevent caching
- Shows which env vars are missing (in GET response)
- HEAD remains ultra-light (200/503 status only)
- Includes timestamp, version, runtime info

2. Resilient useConfigStatus hook

- Clean ping function with proper cleanup
- HEAD first for speed, GET fallback for details
- Short 3s timeouts with AbortController
- Returns stable shape with status field
- Proper error handling with catch blocks

3. ConfigStatusBadge component

- Clean visual states: checking, configured, unconfigured, error
- Consistent with the app's dark theme
- Automatically updates based on status

4. SetupGuide enhancement

- Shows exact missing env vars when config fails
- Clear visual feedback with red alert box
- Lists each missing variable for easy debugging

Benefits:

- 7ms health checks maintained
- No AI handler invocation for health probes
- Clear diagnostics when something's wrong
- Production-ready with proper cache headers
- Developer-friendly with detailed error reporting

The implementation is now bulletproof and dev-friendly, exactly as suggested in the TODO.md!
