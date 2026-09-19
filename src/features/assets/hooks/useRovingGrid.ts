import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

interface UseRovingGridOptions {
  itemCount: number;
  columns: number;
  /** Ask the virtualizer to bring an index into the mounted range. */
  scrollToIndex: (index: number) => void;
  onOpen: (index: number) => void;
  onToggleSelect: (index: number) => void;
  onExtendSelectTo: (index: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Roving tabindex for a virtualized grid: one tab stop, arrow keys move a
 *  focused index. If the target card isn't mounted, `registerItem`'s ref
 *  callback focuses it the moment `scrollToIndex` mounts it — no polling. */
export function useRovingGrid({
  itemCount,
  columns,
  scrollToIndex,
  onOpen,
  onToggleSelect,
  onExtendSelectTo,
}: UseRovingGridOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemNodes = useRef(new Map<number, HTMLElement>());
  const pendingFocusIndex = useRef<number | null>(null);
  // One ref-callback per index, cached: registerRef is a plain prop on
  // AssetCard (not a real `ref`), so a fresh closure per render would
  // defeat memo() on every card.
  const refCallbacks = useRef(new Map<number, (node: HTMLElement | null) => void>());

  // Clamped, not stored: keeps one valid tab stop even if filtering shrinks
  // the list out from under the current index.
  const displayFocusedIndex = itemCount === 0 ? 0 : Math.min(focusedIndex, itemCount - 1);

  const registerItem = useCallback((index: number) => {
    const cached = refCallbacks.current.get(index);
    if (cached) return cached;

    const callback = (node: HTMLElement | null) => {
      if (node) {
        itemNodes.current.set(index, node);
        if (pendingFocusIndex.current === index) {
          pendingFocusIndex.current = null;
          node.focus();
        }
      } else {
        itemNodes.current.delete(index);
      }
    };
    refCallbacks.current.set(index, callback);
    return callback;
  }, []);

  const moveFocusTo = useCallback(
    (index: number) => {
      const clamped = clamp(index, 0, Math.max(0, itemCount - 1));
      setFocusedIndex(clamped);
      const node = itemNodes.current.get(clamped);
      if (node) {
        node.focus();
      } else {
        pendingFocusIndex.current = clamped;
        scrollToIndex(clamped);
      }
    },
    [itemCount, scrollToIndex],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
          nextIndex = index + 1;
          break;
        case 'ArrowLeft':
          nextIndex = index - 1;
          break;
        case 'ArrowDown':
          nextIndex = index + columns;
          break;
        case 'ArrowUp':
          nextIndex = index - columns;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = itemCount - 1;
          break;
        case 'Enter':
          event.preventDefault();
          onOpen(index);
          return;
        case ' ':
          event.preventDefault();
          onToggleSelect(index);
          return;
        default:
          return;
      }

      event.preventDefault();
      const clamped = clamp(nextIndex, 0, Math.max(0, itemCount - 1));
      if (event.shiftKey) onExtendSelectTo(clamped);
      moveFocusTo(clamped);
    },
    [columns, itemCount, moveFocusTo, onExtendSelectTo, onOpen, onToggleSelect],
  );

  return { focusedIndex: displayFocusedIndex, registerItem, handleKeyDown, moveFocusTo };
}
