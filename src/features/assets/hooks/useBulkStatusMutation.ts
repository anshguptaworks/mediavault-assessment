import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { bulkSetStatus } from '@/api';
import { queryKeys } from '@/lib';
import type { Asset, AssetStatus, BulkStatusResult } from '@/types';
import { patchAssetInListCaches } from './useUpdateAssetMutation';

interface BulkStatusVariables {
  ids: string[];
  status: AssetStatus;
}

interface BulkMutationContext {
  /** Snapshot of the pre-mutation asset for every id in the request — the
   *  only thing a rollback or an "undo" needs, so a full cache copy is
   *  unnecessary. */
  originalById: Map<string, Asset>;
}

function collectOriginalAssets(queryClient: QueryClient, ids: readonly string[]): Map<string, Asset> {
  const idSet = new Set(ids);
  const originalById = new Map<string, Asset>();
  const lists = queryClient.getQueriesData<{ pages: { items: Asset[] }[] }>({
    queryKey: queryKeys.lists(),
  });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      for (const asset of page.items) {
        if (idSet.has(asset.id) && !originalById.has(asset.id)) {
          originalById.set(asset.id, asset);
        }
      }
    }
  }
  return originalById;
}

/** Applies optimistically, then reconciles against the `207` per-id result:
 *  successes get the real (version-bumped) asset, only the ids that failed
 *  roll back. A total request failure rolls the whole batch back. */
export function useBulkStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<BulkStatusResult, Error, BulkStatusVariables, BulkMutationContext>({
    mutationFn: ({ ids, status }) => bulkSetStatus(ids, status),
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() });
      const originalById = collectOriginalAssets(queryClient, ids);
      for (const id of ids) {
        patchAssetInListCaches(queryClient, id, (asset) => ({ ...asset, status }));
      }
      return { originalById };
    },
    onError: (_error, _variables, context) => {
      context?.originalById.forEach((original, id) => {
        patchAssetInListCaches(queryClient, id, () => original);
      });
    },
    onSuccess: (result, _variables, context) => {
      for (const item of result.results) {
        if (item.ok) {
          patchAssetInListCaches(queryClient, item.id, () => item.asset);
        } else {
          const original = context?.originalById.get(item.id);
          if (original) patchAssetInListCaches(queryClient, item.id, () => original);
        }
      }
    },
  });
}

export type { BulkMutationContext, BulkStatusVariables };
