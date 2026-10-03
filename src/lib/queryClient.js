import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 *
 * STALE TIMES EXPLAINED - the number that matters is staleTime, which is how long a cached result
 * is served WITHOUT a refetch on mount. 
 *
 * gcTime (5 min) is how long an unmounted query is retained before eviction. It has to comfortably
 * exceed staleTime, or the cache would drop a result between the user leaving a page and coming
 * back - which is precisely the blink this is here to prevent.
 *
 * retry: 1, not the default 3. A rejected request here is almost always a real answer - 401, 403,
 * 404 - and retrying those three times just delays the error message the user needs to see.
 *
 * refetchOnWindowFocus is left on deliberately: complaints arrive from other people, so returning
 * to the tab and having the list quietly update is correct behaviour for this app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      // A failed reply or complaint must not be retried automatically - the user wrote that text
      // and may not still want it sent.
      retry: 0,
    },
  },
});