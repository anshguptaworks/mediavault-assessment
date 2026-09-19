import type { AssetQuery } from '@/types';

/**
 * Centralized query-key factory. Every distinct filter/sort combination gets
 * its own cache entry, which is what structurally prevents a slow, stale
 * response from a previous query overwriting a newer one — the two live in
 * different cache slots instead of one shared piece of state.
 */
export const queryKeys = {
  all: ['assets'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Omit<AssetQuery, 'cursor' | 'limit'>) =>
    [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  facets: () => ['facets'] as const,
  collections: () => ['collections'] as const,
  stats: () => ['stats'] as const,
};
