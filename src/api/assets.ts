import {
  BULK_CONCURRENCY,
  MAX_BATCH_FETCH_IDS,
  MAX_BULK_STATUS_IDS,
} from '@/constants';
import { chunk, mapWithConcurrency, withRetry } from '@/lib';
import type {
  Asset,
  AssetPage,
  AssetQuery,
  AssetStatus,
  BatchAssetsResult,
  BulkStatusResult,
  Collection,
  Facets,
  HealthStatus,
} from '@/types';
import { apiRequest } from './httpClient';

function toSearchParams(query: AssetQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status?.length) params.set('status', query.status.join(','));
  if (query.kind?.length) params.set('kind', query.kind.join(','));
  if (query.tag?.length) params.set('tag', query.tag.join(','));
  if (query.collectionId) params.set('collectionId', query.collectionId);
  if (query.owner) params.set('owner', query.owner);
  if (query.sort) params.set('sort', query.sort);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  return params.toString();
}

export function listAssets(query: AssetQuery, signal?: AbortSignal): Promise<AssetPage> {
  return apiRequest<AssetPage>(`/api/assets?${toSearchParams(query)}`, { signal });
}

export function getAsset(id: string, signal?: AbortSignal): Promise<Asset> {
  return apiRequest<Asset>(`/api/assets/${id}`, { signal });
}

/** Chunks past the server's 25-id cap and merges results back into one shape. */
export async function getAssetsByIds(
  ids: string[],
  signal?: AbortSignal,
): Promise<BatchAssetsResult> {
  const batches = await mapWithConcurrency(
    chunk(ids, MAX_BATCH_FETCH_IDS),
    BULK_CONCURRENCY,
    (batchIds) =>
      apiRequest<BatchAssetsResult>(`/api/assets/batch?ids=${batchIds.join(',')}`, { signal }),
  );
  return batches.reduce<BatchAssetsResult>(
    (acc, page) => ({ items: [...acc.items, ...page.items], missing: [...acc.missing, ...page.missing] }),
    { items: [], missing: [] },
  );
}

export function updateAsset(
  id: string,
  version: number,
  patch: Partial<Pick<Asset, 'name' | 'status' | 'tags'>>,
  signal?: AbortSignal,
): Promise<Asset> {
  return withRetry(
    () =>
      apiRequest<Asset>(`/api/assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ version, patch }),
        signal,
      }),
    signal,
  );
}

/** Chunks past the server's 50-id cap with bounded concurrency. Per-item
 *  results (legal-hold, random conflict) are left for the caller — those
 *  are business outcomes, not request failures. */
export async function bulkSetStatus(
  ids: string[],
  status: AssetStatus,
  signal?: AbortSignal,
): Promise<BulkStatusResult> {
  const chunks = chunk(ids, MAX_BULK_STATUS_IDS);
  const chunkResults = await mapWithConcurrency(chunks, BULK_CONCURRENCY, (chunkIds) =>
    withRetry(
      () =>
        apiRequest<BulkStatusResult>('/api/assets/bulk-status', {
          method: 'POST',
          body: JSON.stringify({ ids: chunkIds, status }),
          signal,
        }),
      signal,
    ),
  );
  return chunkResults.reduce<BulkStatusResult>(
    (acc, result) => ({
      applied: acc.applied + result.applied,
      failed: acc.failed + result.failed,
      results: [...acc.results, ...result.results],
    }),
    { applied: 0, failed: 0, results: [] },
  );
}

export const thumbnailUrl = (id: string): string => `/api/thumb/${id}.svg`;

export function getFacets(signal?: AbortSignal): Promise<Facets> {
  return apiRequest<Facets>('/api/facets', { signal });
}

export function getCollections(signal?: AbortSignal): Promise<{ items: Collection[] }> {
  return apiRequest<{ items: Collection[] }>('/api/collections', { signal });
}

export function getStats<T = unknown>(signal?: AbortSignal): Promise<T> {
  return apiRequest<T>('/api/stats', { signal });
}

export function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/api/health', { signal });
}
