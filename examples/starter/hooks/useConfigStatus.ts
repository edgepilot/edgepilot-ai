import { useQuery } from '@tanstack/react-query';

async function ping(method: 'HEAD' | 'GET', ms: number) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch('/api/health', { method, signal: ctl.signal });
    const ok = res.ok;
    const details = method === 'GET' ? await res.json().catch(() => null) : null;
    return { ok, details };
  } finally {
    clearTimeout(t);
  }
}

async function checkHealth() {
  // Fast path
  const head = await ping('HEAD', 3000).catch(() => ({ ok: false, details: null }));
  if (head.ok) return { isConfigured: true, details: null };

  // Fallback with details
  const get = await ping('GET', 3000).catch(() => ({ ok: false, details: null }));
  return { isConfigured: get.ok, details: get.details };
}

export function useConfigStatus() {
  const q = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 8000),
    staleTime: 10000,
    gcTime: 60000,
  });

  const status: 'checking' | 'configured' | 'unconfigured' | 'error' =
    q.isLoading
      ? 'checking'
      : q.data?.isConfigured
      ? 'configured'
      : q.isError
      ? 'error'
      : 'unconfigured';

  return {
    status,
    isConfigured: q.data?.isConfigured ?? false,
    isChecking: q.isLoading,
    details: q.data?.details ?? null,
    error: q.error,
    refetch: q.refetch,
  };
}