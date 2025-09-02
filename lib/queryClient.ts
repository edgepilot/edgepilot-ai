import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until data is considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache time: how long to keep unused data in cache
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});