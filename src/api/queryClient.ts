import { QueryClient } from '@tanstack/react-query';
import { ApiError, backoffDelayMs, shouldRetry } from '@/lib';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: (attempt, error) =>
        backoffDelayMs(attempt, error instanceof ApiError ? error.retryAfterMs : null),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Default: pause queries while offline and resume automatically on reconnect
      // rather than hammering a dead connection (see useOnlineStatus for the banner).
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
    },
  },
});
