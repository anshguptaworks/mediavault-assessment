import { useEffect, useState } from 'react';

/**
 * Whether `element` is scrolled past `thresholdPx` — used to show/hide a
 * "back to top" affordance. The scroll handler is rAF-throttled so it never
 * runs more than once per frame, per the standard guidance for
 * high-frequency scroll listeners.
 */
export function useScrollVisibility(element: HTMLElement | null, thresholdPx: number): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!element) {
      setVisible(false);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(element.scrollTop > thresholdPx);
        ticking = false;
      });
    };

    handleScroll();
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [element, thresholdPx]);

  return visible;
}
