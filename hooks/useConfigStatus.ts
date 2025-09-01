import { useQuery } from '@tanstack/react-query';

async function checkEnvConfig(endpoint: string = '/api/ai/chat') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'healthcheck' }], stream: false })
  });
  
  if (!response.ok && response.status === 500) {
    throw new Error('Configuration check failed');
  }
  
  return { isConfigured: response.ok };
}

export function useConfigStatus() {
  const query = useQuery({
    queryKey: ['config-status'],
    queryFn: () => checkEnvConfig(),
    // Check on mount and every 30 seconds
    refetchInterval: 30000,
    // Keep retrying if failed
    retry: true,
    retryDelay: 5000,
  });

  return {
    isConfigured: query.data?.isConfigured ?? false,
    isChecking: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
