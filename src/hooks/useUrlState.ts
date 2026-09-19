import { useEffect, useState } from 'react';

interface UrlStateOptions<T> {
  parse: (params: URLSearchParams) => T;
  serialize: (value: T, params: URLSearchParams) => void;
}

function readFromLocation<T>(parse: UrlStateOptions<T>['parse']): T {
  return parse(new URLSearchParams(window.location.search));
}

/**
 * Mirrors state into the URL query string via `replaceState` (not
 * `pushState` — filter edits shouldn't stack up a history entry per
 * keystroke). Reloading or sharing the URL restores the same view.
 */
export function useUrlState<T>({ parse, serialize }: UrlStateOptions<T>) {
  const [state, setState] = useState<T>(() => readFromLocation(parse));

  useEffect(() => {
    const params = new URLSearchParams();
    serialize(state, params);
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', url);
    }
  }, [state, serialize]);

  useEffect(() => {
    const onPopState = () => setState(readFromLocation(parse));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [parse]);

  return [state, setState] as const;
}
