import { useEffect, useState } from 'react';

/** Debounces a fast-changing value (e.g. every keystroke) into a slower one
 *  that is safe to use as a query dependency without tripping the rate limit. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
