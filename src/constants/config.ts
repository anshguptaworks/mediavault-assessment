/** Tuning knobs gathered in one place so the "why" for each number lives
 *  with it, not buried inside the hook or component that uses it. */

/** Above the API's 90-350ms baseline latency, so typing doesn't spawn a
 *  request per keystroke, but low enough to still feel live. */
export const SEARCH_DEBOUNCE_MS = 350;

/** Under the server's 50-per-request cap; above its own default of 24, so
 *  scrolling needs fewer round trips. */
export const PAGE_SIZE = 40;

/** Server-enforced caps, mirrored so the client can chunk before sending. */
export const MAX_BULK_STATUS_IDS = 50;
export const MAX_BATCH_FETCH_IDS = 25;

/** Chunks of MAX_BULK_STATUS_IDS aren't all fired at once — this caps how
 *  many are in flight together. */
export const BULK_CONCURRENCY = 3;

/** Number of retries allowed after the initial attempt — so up to 5 requests
 *  total for a call that keeps failing. Both `shouldRetry` (React Query's
 *  own `retry` option) and `withRetry` (manual writes) check this against
 *  the same 0-indexed failure count, so the two retry paths behave
 *  identically. */
export const RETRY_MAX_ATTEMPTS = 4;
export const RETRY_BASE_DELAY_MS = 400;
export const RETRY_MAX_DELAY_MS = 8000;

/** Grid layout. */
export const CARD_MIN_WIDTH_PX = 220;
export const CARD_ROW_GAP_PX = 16;
export const VIRTUALIZER_OVERSCAN_ROWS = 3;

/** Scroll distance (px) down the grid before "back to top" appears. */
export const SCROLL_TOP_THRESHOLD_PX = 600;

/** How long a fully-successful bulk outcome banner stays before
 *  auto-dismissing. Only applies when nothing failed — a banner offering a
 *  Retry action stays until the reviewer dismisses it themselves, since
 *  auto-hiding something actionable can lose their only path to fix it. */
export const BULK_OUTCOME_AUTO_DISMISS_MS = 5000;
