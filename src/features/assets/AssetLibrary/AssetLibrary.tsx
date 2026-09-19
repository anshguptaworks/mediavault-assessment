import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useAnnounce } from '@/components/LiveRegion';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import { OfflineBanner } from '@/components/OfflineBanner';
import { BULK_OUTCOME_AUTO_DISMISS_MS, STATUS_OPTIONS } from '@/constants';
import { formatCount, mergeBulkResults, summarizeBulkResults } from '@/lib';
import type { AssetStatus, BulkStatusResult } from '@/types';
import {
  AssetDetailPanel,
  AssetGrid,
  BulkActionBar,
  BulkOutcomeBanner,
  SearchBar,
  SortSelect,
  type AssetGridHandle,
} from '../components';
import {
  useAssetFilters,
  useAssetSelection,
  useAssetsInfiniteQuery,
  useBulkStatusMutation,
} from '../hooks';
import styles from './AssetLibrary.module.css';

interface LastBulkOutcome {
  status: AssetStatus;
  result: BulkStatusResult;
}

/**
 * Composition root for the feature: wires filters, the infinite query,
 * selection, bulk mutation and the detail panel together. Kept deliberately
 * thin — every non-trivial behavior lives in a hook or a component that can
 * be read (and tested) on its own.
 */
export const AssetLibrary = () => {
  const { filters, query, qInput, setQInput, setStatus, setKind, setTag, setSort } = useAssetFilters();
  const filtersKey = useMemo(() => JSON.stringify(query), [query]);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useAssetsInfiniteQuery(query);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const selection = useAssetSelection(
    useMemo(() => items.map((asset) => asset.id), [items]),
    filtersKey,
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const openIndexRef = useRef<number | null>(null);
  const assetGridRef = useRef<AssetGridHandle>(null);

  const bulkMutation = useBulkStatusMutation();
  const [lastOutcome, setLastOutcome] = useState<LastBulkOutcome | null>(null);
  const announce = useAnnounce();

  useEffect(() => {
    if (!isLoading && !isError) {
      announce(`${formatCount(total)} asset${total === 1 ? '' : 's'} found`);
    }
  }, [filtersKey, isLoading, isError, total, announce]);

  const hasActiveFilters = Boolean(
    filters.q || filters.status.length || filters.kind.length || filters.tag.length,
  );

  const handleClearFilters = useCallback(() => {
    setQInput('');
    setStatus([]);
    setKind([]);
    setTag([]);
  }, [setQInput, setStatus, setKind, setTag]);

  const handleStatusChange = useCallback(
    (values: string[]) => setStatus(values as AssetStatus[]),
    [setStatus],
  );

  const handleOpen = useCallback((id: string, index: number) => {
    openIndexRef.current = index;
    setActiveId(id);
  }, []);

  const handleClose = useCallback(() => {
    setActiveId(null);
    const index = openIndexRef.current;
    if (index !== null) assetGridRef.current?.focusCard(index);
  }, []);

  const runBulkUpdate = useCallback(
    (ids: string[], status: AssetStatus, mergeIntoPrevious = false) => {
      bulkMutation.mutate(
        { ids, status },
        {
          onSuccess: (result) => {
            setLastOutcome((previous) => ({
              status,
              result: mergeIntoPrevious && previous ? mergeBulkResults(previous.result, result) : result,
            }));
            announce(`${result.applied} updated, ${result.failed} failed`, {
              assertive: result.failed > 0,
            });
          },
          onError: () => {
            announce('The bulk update failed. Nothing was changed.', { assertive: true });
          },
        },
      );
    },
    [bulkMutation, announce],
  );

  const { selectedIds, clear: clearSelection } = selection;
  const handleBulkSetStatus = useCallback(
    (status: AssetStatus) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;
      runBulkUpdate(ids, status);
      clearSelection();
    },
    [selectedIds, clearSelection, runBulkUpdate],
  );

  const handleRetryFailed = useCallback(() => {
    if (!lastOutcome) return;
    const { retryableFailures } = summarizeBulkResults(lastOutcome.result.results);
    if (retryableFailures.length === 0) return;
    runBulkUpdate(
      retryableFailures.map((failure) => failure.id),
      lastOutcome.status,
      true,
    );
  }, [lastOutcome, runBulkUpdate]);

  const handleDismissOutcome = useCallback(() => setLastOutcome(null), []);

  // Auto-dismiss only a clean success — a banner with a Retry action stays
  // put until the reviewer acts on or dismisses it themselves.
  useEffect(() => {
    if (!lastOutcome || lastOutcome.result.failed > 0) return;
    const timer = window.setTimeout(() => setLastOutcome(null), BULK_OUTCOME_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [lastOutcome]);

  const handleRetryGrid = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.controlsRow}>
          <h1 className={styles.title}>MediaVault</h1>
          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <MultiSelectDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={filters.status}
                onChange={handleStatusChange}
              />
              <SortSelect value={filters.sort} onChange={setSort} />
            </div>
            <SearchBar value={qInput} onChange={setQInput} />
          </div>
        </div>

        {selection.selectedIds.size === 0 && (
          <div className={styles.metaRow}>
            <span className={styles.resultCount}>
              {isLoading ? 'Loading…' : `${formatCount(items.length)} of ${formatCount(total)} shown`}
            </span>
            {hasActiveFilters && (
              <button type="button" className={styles.clearAll} onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </header>

      <OfflineBanner />

      {selection.selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selection.selectedIds.size}
          isApplying={bulkMutation.isPending}
          onSetStatus={handleBulkSetStatus}
          onSelectAllLoaded={selection.selectAllVisible}
          onClear={selection.clear}
        />
      )}

      {lastOutcome && (
        <div className={styles.outcome}>
          <BulkOutcomeBanner
            result={lastOutcome.result}
            isRetrying={bulkMutation.isPending}
            onRetryFailed={handleRetryFailed}
            onDismiss={handleDismissOutcome}
          />
        </div>
      )}

      <main className={styles.content}>
        <AssetGrid
          ref={assetGridRef}
          queryKey={filtersKey}
          items={items}
          isInitialLoading={isLoading}
          isError={isError}
          error={error}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onRetry={handleRetryGrid}
          selectedIds={selection.selectedIds}
          activeId={activeId}
          onOpen={handleOpen}
          onToggleSelect={selection.toggle}
          onExtendSelectTo={selection.extendRangeTo}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
        {activeId && <AssetDetailPanel id={activeId} onClose={handleClose} />}
      </main>
    </div>
  );
};
