import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_SORT, SEARCH_DEBOUNCE_MS, SORT_OPTIONS } from '@/constants';
import { useDebouncedValue, useUrlState } from '@/hooks';
import { AssetKind, AssetStatus, type AssetQuery, type SortValue } from '@/types';

export interface AssetFilters {
  q: string;
  status: AssetStatus[];
  kind: AssetKind[];
  tag: string[];
  sort: SortValue;
}

const VALID_STATUSES = new Set<string>(Object.values(AssetStatus));
const VALID_KINDS = new Set<string>(Object.values(AssetKind));
const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((option) => option.value));

function parseList<T extends string>(raw: string | null, valid: ReadonlySet<string>): T[] {
  if (!raw) return [];
  return raw.split(',').filter((value): value is T => valid.has(value));
}

// Tags aren't a fixed enum (they come from whatever's on the assets), so
// there's no valid-set to filter against — just split and drop empties.
function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
}

function parseFilters(params: URLSearchParams): AssetFilters {
  const sortParam = params.get('sort');
  return {
    q: params.get('q') ?? '',
    status: parseList<AssetStatus>(params.get('status'), VALID_STATUSES),
    kind: parseList<AssetKind>(params.get('kind'), VALID_KINDS),
    tag: parseTags(params.get('tag')),
    sort: sortParam && VALID_SORTS.has(sortParam) ? (sortParam as SortValue) : DEFAULT_SORT,
  };
}

function serializeFilters(filters: AssetFilters, params: URLSearchParams): void {
  if (filters.q) params.set('q', filters.q);
  if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.kind.length) params.set('kind', filters.kind.join(','));
  if (filters.tag.length) params.set('tag', filters.tag.join(','));
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
}

/**
 * Owns filter state and its URL mirror. The search box has its own
 * immediate value (`qInput`) so typing never stutters; only the debounced
 * value is committed into `filters` (and the URL / query key), which is
 * what keeps ordinary typing from spawning a request — or a history entry —
 * per keystroke.
 */
export function useAssetFilters() {
  const [filters, setFilters] = useUrlState<AssetFilters>({
    parse: parseFilters,
    serialize: serializeFilters,
  });
  const [qInput, setQInput] = useState(filters.q);
  const debouncedQ = useDebouncedValue(qInput, SEARCH_DEBOUNCE_MS);

  if (debouncedQ !== filters.q) {
    setFilters((previous) => ({ ...previous, q: debouncedQ }));
  }

  const setStatus = useCallback(
    (status: AssetStatus[]) => setFilters((previous) => ({ ...previous, status })),
    [setFilters],
  );
  const setKind = useCallback(
    (kind: AssetKind[]) => setFilters((previous) => ({ ...previous, kind })),
    [setFilters],
  );
  const setTag = useCallback(
    (tag: string[]) => setFilters((previous) => ({ ...previous, tag })),
    [setFilters],
  );
  const setSort = useCallback(
    (sort: SortValue) => setFilters((previous) => ({ ...previous, sort })),
    [setFilters],
  );

  const query = useMemo<Omit<AssetQuery, 'cursor' | 'limit'>>(
    () => ({
      q: filters.q || undefined,
      status: filters.status.length ? filters.status : undefined,
      kind: filters.kind.length ? filters.kind : undefined,
      tag: filters.tag.length ? filters.tag : undefined,
      sort: filters.sort,
    }),
    [filters],
  );

  return { filters, query, qInput, setQInput, setStatus, setKind, setTag, setSort };
}
