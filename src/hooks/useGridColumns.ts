import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks how many columns the CSS grid (auto-fill/minmax) is rendering, via
 * `ResizeObserver` on the container width — keyboard arrow-key math needs
 * the real number, not a guess. The container is state, not a plain
 * `useRef`: a container that mounts later (e.g. behind a loading branch)
 * needs its arrival to itself re-trigger the observer-setup effect, which a
 * mutated ref can't do.
 */
export function useGridColumns(minColumnWidthPx: number, gapPx: number) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(1);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const compute = () => {
      const style = getComputedStyle(element);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const width = element.clientWidth - paddingX;
      const count = Math.max(1, Math.floor((width + gapPx) / (minColumnWidthPx + gapPx)));
      setColumns(count);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, minColumnWidthPx, gapPx]);

  return { containerRef, element, columns };
}
