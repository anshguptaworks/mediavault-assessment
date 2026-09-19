import { useQuery } from '@tanstack/react-query';
import { getAsset } from '@/api';
import { queryKeys } from '@/lib';

export function useAssetQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getAsset(id as string, signal),
    enabled: id !== null,
  });
}
