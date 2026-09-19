import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAsset, updateAsset } from '@/api';
import { ApiError, VersionConflictError, queryKeys } from '@/lib';
import { ApiErrorCode, type Asset } from '@/types';

interface UpdateAssetInput {
  id: string;
  version: number;
  patch: Partial<Pick<Asset, 'name' | 'status' | 'tags'>>;
}

/** Single-asset edits. On `409 version_conflict`, fetches the row as it now
 *  exists and surfaces it via `VersionConflictError.latestAsset` instead of
 *  a bare string, so the panel can offer reapply-or-keep. Never auto-retries
 *  a conflict — the version the edit was based on is already gone. */
export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, version, patch }: UpdateAssetInput): Promise<Asset> => {
      try {
        return await updateAsset(id, version, patch);
      } catch (error) {
        if (error instanceof ApiError && error.code === ApiErrorCode.VersionConflict) {
          const latest = await getAsset(id);
          throw new VersionConflictError(latest, error.message);
        }
        throw error;
      }
    },
    onSuccess: (asset) => {
      queryClient.setQueryData(queryKeys.detail(asset.id), asset);
      patchAssetInListCaches(queryClient, asset.id, () => asset);
    },
    onError: (error) => {
      if (error instanceof VersionConflictError) {
        queryClient.setQueryData(queryKeys.detail(error.latestAsset.id), error.latestAsset);
      }
    },
  });
}

/** Shared by single-edit and bulk mutations: walks every cached list page
 *  and replaces one asset in place, so the grid never needs to be told to
 *  refetch after a write — it already has the new truth. */
export function patchAssetInListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  updater: (asset: Asset) => Asset,
): void {
  queryClient.setQueriesData<{ pages: { items: Asset[] }[] } | undefined>(
    { queryKey: queryKeys.lists() },
    (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((asset) => (asset.id === id ? updater(asset) : asset)),
        })),
      };
    },
  );
}

export type { UpdateAssetInput };
