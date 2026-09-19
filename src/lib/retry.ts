import { RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS, RETRY_MAX_DELAY_MS } from '@/constants';
import { ApiError } from './errors';

/** Exponential backoff with full jitter, capped, and short-circuited by the
 *  server's own `Retry-After` when it gives one. */
export function backoffDelayMs(attempt: number, retryAfterMs?: number | null): number {
  if (retryAfterMs != null) return retryAfterMs;
  const exponential = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  return Math.random() * exponential;
}

/** Shared predicate for both React Query's `retry` option and any manual
 *  retry loop (bulk chunk requests) — one place decides what is safe to repeat. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= RETRY_MAX_ATTEMPTS) return false;
  if (error instanceof ApiError) return error.retryable;
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Applies the same retry/backoff policy to a single write call — one
 *  PATCH, or one bulk chunk — made outside a query hook. */
export async function withRetry<T>(
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn(attempt, signal);
    } catch (error) {
      if (signal?.aborted || !shouldRetry(attempt, error)) throw error;
      const retryAfterMs = error instanceof ApiError ? error.retryAfterMs : null;
      await sleep(backoffDelayMs(attempt, retryAfterMs));
      attempt += 1;
    }
  }
}
