import { useCallback, useRef, useState } from 'react';

/**
 * Selection is a plain `Set`, kept independent of the (potentially huge and
 * virtualized) item list. `resetKey` is the current filter/sort signature —
 * when it changes, selection resets to empty via React's documented
 * "adjust state while rendering" pattern rather than an effect, since it's
 * really the same state being keyed differently, not a side effect to sync.
 */
export function useAssetSelection(visibleIds: readonly string[], resetKey: string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trackedResetKey, setTrackedResetKey] = useState(resetKey);
  const anchorIndexRef = useRef<number | null>(null);

  if (resetKey !== trackedResetKey) {
    setTrackedResetKey(resetKey);
    setSelectedIds(new Set());
    anchorIndexRef.current = null;
  }

  const toggle = useCallback((id: string, index: number) => {
    anchorIndexRef.current = index;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const extendRangeTo = useCallback(
    (index: number) => {
      const anchor = anchorIndexRef.current ?? index;
      const [start, end] = anchor <= index ? [anchor, index] : [index, anchor];
      setSelectedIds((previous) => {
        const next = new Set(previous);
        for (let i = start; i <= end; i += 1) {
          const id = visibleIds[i];
          if (id) next.add(id);
        }
        return next;
      });
    },
    [visibleIds],
  );

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visibleIds));
  }, [visibleIds]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    anchorIndexRef.current = null;
  }, []);

  return { selectedIds, toggle, extendRangeTo, selectAllVisible, clear };
}
