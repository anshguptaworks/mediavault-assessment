import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CARD_MIN_WIDTH_PX, CARD_ROW_GAP_PX, SCROLL_TOP_THRESHOLD_PX, VIRTUALIZER_OVERSCAN_ROWS } from '@/constants';
import { useGridColumns, useScrollVisibility } from '@/hooks';
import type { Asset } from '@/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { friendlyMessage } from '@/lib';
import { AssetCard } from '../AssetCard';
import { AssetCardSkeleton } from '../AssetCardSkeleton';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { useRovingGrid } from '../../hooks';
import styles from './AssetGrid.module.css';

const ROW_HEIGHT_ESTIMATE_PX = 300;

export interface AssetGridHandle {
  /** Used by the container to return focus to the card that was open when
   *  the detail panel closes. */
  focusCard: (index: number) => void;
}

interface AssetGridProps {
  /** Identifies the current filter/sort combination — see the fetch-guard
   *  effect below for why this needs to be an explicit prop rather than
   *  inferred from row count. */
  queryKey: string;
  items: Asset[];
  isInitialLoading: boolean;
  isError: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onRetry: () => void;
  selectedIds: Set<string>;
  activeId: string | null;
  onOpen: (id: string, index: number) => void;
  onToggleSelect: (id: string, index: number) => void;
  onExtendSelectTo: (index: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/** The scroll container never unmounts (the detail panel overlays it rather
 *  than replacing it), which is the entire mechanism behind scroll position
 *  surviving panel open/close — no explicit restore code needed. */
export const AssetGrid = forwardRef<AssetGridHandle, AssetGridProps>((
  {
    queryKey,
    items,
    isInitialLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onRetry,
    selectedIds,
    activeId,
    onOpen,
    onToggleSelect,
    onExtendSelectTo,
    hasActiveFilters,
    onClearFilters,
  },
  forwardedRef,
) => {
  const { containerRef, element, columns } = useGridColumns(CARD_MIN_WIDTH_PX, CARD_ROW_GAP_PX);
  const dataRowCount = Math.max(1, Math.ceil(items.length / columns));
  const rowCount = items.length === 0 ? 0 : dataRowCount + (hasNextPage ? 1 : 0);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => element,
    estimateSize: () => ROW_HEIGHT_ESTIMATE_PX,
    overscan: VIRTUALIZER_OVERSCAN_ROWS,
  });

  // useVirtualizer returns a new object every render; reading through a ref
  // keeps scrollToIndex stable (keyed only on `columns`) without ever
  // calling a stale method.
  const rowVirtualizerRef = useRef(rowVirtualizer);
  rowVirtualizerRef.current = rowVirtualizer;
  const scrollToIndex = useCallback(
    (index: number) => {
      rowVirtualizerRef.current.scrollToIndex(Math.floor(index / columns), { align: 'auto' });
    },
    [columns],
  );

  useEffect(() => {
    element?.scrollTo({ top: 0 });
  }, [queryKey, element]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVirtualRow = virtualRows[virtualRows.length - 1];

  const requestedFor = useRef<{ queryKey: string; rowCount: number } | null>(null);
  useEffect(() => {
    if (!lastVirtualRow) return;
    const reachedLoaderRow = lastVirtualRow.index >= dataRowCount - 1;
    const alreadyRequested =
      requestedFor.current?.queryKey === queryKey && requestedFor.current?.rowCount === dataRowCount;
    if (reachedLoaderRow && hasNextPage && !isFetchingNextPage && !alreadyRequested) {
      requestedFor.current = { queryKey, rowCount: dataRowCount };
      fetchNextPage();
    }
  }, [lastVirtualRow, dataRowCount, hasNextPage, isFetchingNextPage, fetchNextPage, queryKey]);

  const openByIndex = useCallback(
    (index: number) => {
      const asset = items[index];
      if (asset) onOpen(asset.id, index);
    },
    [items, onOpen],
  );

  const toggleByIndex = useCallback(
    (index: number) => {
      const asset = items[index];
      if (asset) onToggleSelect(asset.id, index);
    },
    [items, onToggleSelect],
  );

  const { focusedIndex, registerItem, handleKeyDown, moveFocusTo } = useRovingGrid({
    itemCount: items.length,
    columns,
    scrollToIndex,
    onOpen: openByIndex,
    onToggleSelect: toggleByIndex,
    onExtendSelectTo,
  });

  useImperativeHandle(forwardedRef, () => ({ focusCard: moveFocusTo }), [moveFocusTo]);

  const showScrollTop = useScrollVisibility(element, SCROLL_TOP_THRESHOLD_PX) && !activeId;
  const scrollToTop = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element?.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [element]);

  if (isError && items.length === 0) {
    return (
      <div className={styles.stateWrapper}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isInitialLoading && items.length === 0) {
    // Enough skeletons to fill several rows at the current column count,
    // not a fixed guess — a wide window shouldn't show two sparse rows of
    // shimmer above a wall of empty space while the first page loads.
    const skeletonCount = Math.max(columns * 4, 12);
    return (
      <div className={styles.skeletonGrid} aria-hidden="true">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <AssetCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.stateWrapper}>
        <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={styles.viewport}
        role="grid"
        aria-label="Assets"
        aria-rowcount={dataRowCount}
        aria-multiselectable="true"
      >
        <div className={styles.spacer} style={{ height: rowVirtualizer.getTotalSize() }}>
          {virtualRows.map((virtualRow) => {
            const rowStart = virtualRow.index * columns;
            const rowItems = items.slice(rowStart, rowStart + columns);
            const skeletonsNeeded = rowItems.length === 0
              ? columns
              : hasNextPage
                ? columns - rowItems.length
                : 0;
            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                role="row"
                aria-rowindex={virtualRow.index + 1}
                className={styles.row}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {rowItems.map((asset, colIndex) => {
                  const index = rowStart + colIndex;
                  return (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      index={index}
                      colIndex={colIndex}
                      selected={selectedIds.has(asset.id)}
                      isOpen={activeId === asset.id}
                      tabIndex={index === focusedIndex ? 0 : -1}
                      registerRef={registerItem(index)}
                      onOpen={onOpen}
                      onToggleSelect={onToggleSelect}
                      onExtendSelectTo={onExtendSelectTo}
                      onKeyDown={handleKeyDown}
                    />
                  );
                })}
                {Array.from({ length: skeletonsNeeded }).map((_, i) => (
                  <AssetCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            );
          })}
        </div>
        {isError && (
          <div className={styles.inlineError}>
            <Banner
              tone="danger"
              icon="alert-triangle"
              title="Couldn't load more assets"
              action={
                <Button variant="danger" size="sm" onClick={() => fetchNextPage()}>
                  Retry
                </Button>
              }
            >
              {friendlyMessage(error)}
            </Banner>
          </div>
        )}
      </div>
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </>
  );
});

AssetGrid.displayName = 'AssetGrid';
