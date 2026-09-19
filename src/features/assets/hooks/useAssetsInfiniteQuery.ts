import { useInfiniteQuery } from '@tanstack/react-query';
import { PAGE_SIZE } from '@/constants';
import { listAssets } from '@/api';
import { ApiError, queryKeys } from '@/lib';
import { ApiErrorCode, type AssetPage, type AssetQuery } from '@/types';

/**
 * One cache entry per distinct filter/sort combination: a slow response for
 * a previous `q` lands in that key's own slot, so it can never overwrite
 * the view the user is looking at now. A stray `stale_cursor` (a page fetch
 * racing a filter change) is retried from the first page transparently
 * instead of surfaced as an error.
 */
export function useAssetsInfiniteQuery(filters: Omit<AssetQuery, 'cursor' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.list(filters),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }): Promise<AssetPage> => {
      try {
        return await listAssets({ ...filters, limit: PAGE_SIZE, cursor: pageParam }, signal);
      } catch (error) {
        if (error instanceof ApiError && error.code === ApiErrorCode.StaleCursor) {
          return await listAssets({ ...filters, limit: PAGE_SIZE, cursor: undefined }, signal);
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
