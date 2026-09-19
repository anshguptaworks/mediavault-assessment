# Submission

## Video walkthrough

**Link:** https://www.loom.com/share/46faf7efb89c4080abcac314fa93f4e4

---

## How to run it

```bash
node --version   # 20.11+
npm install
npm run dev
```

Starts the mock API (`:8787`) and the app (`:5173`) together, chaos and latency on
by default. Nothing else to set up.

## Time spent

Roughly 12-14 hours, spread over several days. Most of it went into Tasks 0-4
(search correctness, scale, bulk actions, resilience) since that's where the
brief says the real signal is. Task 6 and accessibility got a solid pass but
would've been the first things trimmed if I'd run short on time.

---

## Baseline defects found

| # | Defect | Where | Fixed / left / out of scope |
| --- | --- | --- | --- |
| 1 | Bulk update sent every selected id in one call — API rejects past 50 | `App.tsx` | Fixed — chunked with bounded concurrency |
| 2 | Every keystroke fired a request, nothing debounced | `App.tsx` | Fixed — 350ms debounce before it commits |
| 3 | No cancellation — a slow response for an old query could overwrite a newer one | `useAssets.ts` | Fixed — each filter combo has its own cache slot, and the stale request is actually aborted, not just ignored |
| 4 | No retry, backoff, or `Retry-After` handling | `api/client.ts` | Fixed — exponential backoff with jitter, capped attempts |
| 5 | No de-duplication of identical concurrent requests | `api/client.ts` | Fixed — handled for free by the query cache key |
| 6 | Errors flattened to a string, no way to tell retryable from not | `api/client.ts` | Fixed — structured error with a code + retryable flag |
| 7 | No pagination — only ever loaded one page of 12,400 | `useAssets.ts` | Fixed — cursor-based infinite query |
| 8 | Grid rendered every row, no virtualization | `AssetGrid.tsx` | Fixed — row-based virtualization |
| 9 | Grid re-rendered every card on any selection change | `AssetGrid.tsx` | Fixed — verified with an actual render counter, not assumed |
| 10 | Not reachable by keyboard at all | `AssetGrid.tsx` | Fixed — roving tabindex, arrow keys/Enter/Space/Home/End |
| 11 | Detail panel save didn't update the list — stale rows after an edit | `App.tsx` | Fixed — mutation writes straight into the cache the grid reads |
| 12 | No handling for a stale-version conflict on save | `AssetDetail.tsx` | Fixed — shows the real current row, lets the user reapply or keep it |
| 13 | No URL sync — reload or a shared link lost the current view | `App.tsx` | Fixed |
| 14 | Missing thumbnails still got requested and showed a broken image | `AssetGrid.tsx` | Fixed — skips the request, shows a stable placeholder |
| 15 | No offline detection | — | Fixed — banner, auto-pause and resume |
| 16 | No error boundary — one crash blanked the whole page | `App.tsx` | Fixed |
| 17 | Checkboxes had no accessible name | `AssetGrid.tsx` | Fixed — per-asset `aria-label` |
| 18 | No real visual system — status shown by class name only | `styles.css` | Addressed in Task 6, see Interface decisions |
| 19 | Grid column count could be miscalculated near certain widths, leaving a short, broken-looking row | `useGridColumns.ts` | Fixed — traced to a padding-measurement bug, verified across the failing widths |
| 20 | Pagination could silently stall after switching filters, if the new result set happened to land on the same row count as the old one | `AssetGrid.tsx` | Fixed |
| 21 | The "couldn't load more" retry button re-fetched every page instead of just the one that failed | `AssetGrid.tsx` | Fixed |
| 22 | Retrying a failed bulk subset could wipe other still-relevant failures off the outcome banner | `AssetLibrary.tsx` | Fixed — a retry now merges into the existing outcome instead of replacing it |
| 23 | The `tag` filter wasn't wired into the URL at all, even though the API and types already supported it | `useAssetFilters.ts` | Fixed |
| 24 | A border color used on every input and button didn't meet WCAG's non-text contrast minimum | `tokens.css` | Fixed — re-checked with the same contrast script |
| 25 | Loading skeletons left a visible gap in a partially-filled row instead of continuing the shimmer | `AssetGrid.tsx` | Fixed |

Left out of scope: kind/tag/owner/collection filters have no picker in the UI —
status + search + sort matched what the brief and baseline actually exercised.
`tag` and `kind` still round-trip through the URL if set manually.

---

## Key decisions

**Data fetching and caching.** TanStack Query for everything, on top of a thin
fetch wrapper that only normalizes errors — it never retries on its own.
Rolling a custom cache/fetch layer felt like exactly the kind of infrastructure
bug surface this brief is testing for, so I didn't.

**Stale response handling.** Every distinct filter/sort combination gets its
own cache entry. A slow response for a filter the user has since left lands in
a slot nothing is reading from — it can't overwrite the current view even in
principle.

**Request cancellation.** A separate guarantee from the above: the obsolete
request is actually aborted, not just ignored. Verified live by rapidly
toggling a filter and watching the network log — the two superseded requests
showed up as cancelled, only the final one completed.

**Virtualization.** TanStack Virtual, virtualizing rows rather than individual
cards, since the layout is a responsive grid with a variable column count.
Column count is measured from the container's real width, not assumed, so
keyboard navigation always matches what's actually on screen.

**Optimistic updates and rollback.** Bulk status changes apply immediately,
then reconcile against the server's real per-id result — only the ids that
actually failed roll back. Failures are split into "retry might work" (a
transient conflict) vs. "retry never will" (legal hold), since treating them
the same would mislead the reviewer.

**Retry and backoff.** Exponential backoff with full jitter, capped at 5
attempts total, honoring `Retry-After` when the server gives one.
Retryability is decided structurally from the error code, never by matching
on the message text.

**409 conflict handling.** If someone else changed the row first, the client
fetches the current version and shows it plainly, letting the reviewer choose
to reapply their change or keep what's there. Doing either silently felt like
the wrong call.

**State and URL sync.** Filters live in the URL via `replaceState`, not
`pushState`, so editing a filter doesn't stack up one history entry per
keystroke. Selection resets automatically when the filter set changes.

---

## Performance

Measured in Chrome, dev server, chaos and latency on.

| Metric | Before | After | How measured |
| --- | --- | --- | --- |
| Cards re-rendered on one selection toggle | All of them | Exactly one | Render counter, toggled a checkbox, diffed |
| Rendered DOM nodes at 240+ loaded | N/A (baseline never paginated) | 36-40, constant regardless of scroll depth | Counted `[role=gridcell]` after scrolling several pages |
| Requests fired while typing | One per keystroke | One per 350ms pause | Watched the network log while typing |
| Production bundle, gzipped | 48 kB | 86 kB (81.5 kB JS + 4.6 kB CSS) | `npm run build` |
| Longest task during sustained scroll | — | Not captured | Didn't have DevTools Performance-panel access this session |

The render-count fix was a real bug, not a formality — the first measurement
genuinely failed (every card re-rendered) even though `AssetCard` was already
memoized. Two unstable prop references were defeating it; both are fixed and
re-verified.

One honest caveat: DOM node count staying flat isn't the same as memory
staying flat. React Query keeps every fetched page in memory, so the
in-memory list does grow as you scroll — it's just not reflected in the DOM.
I didn't measure the actual heap growth.

Bundle size nearly doubled from the 48 kB baseline, mostly from
`@tanstack/react-query`, `@tanstack/react-virtual`, and the icon library — a
trade I think is worth it for what those libraries buy structurally, but it's
a real number, not a free one.

---

## Accessibility

**Keyboard model.** Roving tabindex — one tab stop for the whole grid, arrow
keys move a single focused index using the actual column count, Enter opens
the detail panel, Space toggles selection, Shift+Arrow extends a range, and
Escape closes the panel and returns focus to the card that opened it.

**Semantics.** Real `role="grid"`/`row`/`gridcell` with `aria-selected` and
`aria-multiselectable`; every checkbox has an accessible name; result counts
and bulk outcomes are announced through a live region instead of spamming on
every keystroke.

**How I tested it.** In-browser, checking `document.activeElement` and the
actual accessibility tree after each interaction, not just visually. I did
not run an actual screen reader (VoiceOver/NVDA) — that's a real gap, not a
pass I'm claiming.

**Known gaps.** No screen reader pass. Kind/tag/collection filters have no
UI, so there's nothing to test there.

---

## Interface decisions

Optimizing for someone who scans hundreds of cards for a long stretch: status
needs to read at a glance without relying on color, and nothing should
visually jump while more of a 12,400-row list streams in underneath you.

- **Visual system.** One small token set for spacing, radius, type, and
  color, used everywhere through CSS variables, with a light and dark pass.
- **Status.** The four statuses read as a progression — a filled-dot
  indicator plus the label — never color alone.
- **States.** Loading, empty, error, offline, and partial-failure all look
  and read differently from each other. The loading skeleton also continues
  seamlessly into a partially-filled row instead of leaving a gap.
- **Contrast.** Checked against the actual WCAG formula with a small script,
  not eyeballed — it caught three real failures, all fixed.
- **Copy.** Every user-facing error message is rewritten in plain language;
  the server's raw message is logged but never shown.
- Verified down to 390px width — no overflow, no clipped controls, and the
  detail panel becomes a full-screen view instead of a squeezed sidebar.

Screenshots: `docs/screenshots/grid.png`, `docs/screenshots/mobile.png`

---

## Trade-offs and cuts

- Implemented retry-for-the-failed-subset on bulk actions, not a full "undo
  the batch" — a real undo needs to restore each asset to its own prior
  status, which felt lower-value than what the brief actually calls out.
- Kind/tag/owner/collection filters are modeled but have no UI — kept the
  surface area matched to what the brief and baseline actually exercise.
- Skipped the optional items (SSE live updates, `/api/stats`, tests) for time.
- Offline write queueing isn't implemented — detection and auto-resume are;
  queueing is explicitly called a bonus in the brief, not a requirement.
- No screen-reader pass, no DevTools long-task trace — see Accessibility and
  Performance for what I could verify instead.

## Critique of the API

- Bulk status updates don't take a `version`, so the client can't say "only
  apply this if the row hasn't changed" the way a single PATCH can — it can
  only react to a conflict after the fact.
- No bulk endpoint for anything other than status.
- Cursor pagination has no "how far in am I" signal beyond the running
  total — fine for infinite scroll, but would block a "jump to page N" UI.

## Anything you would like us to look at

- The keyboard-focus/virtualization interaction (`useRovingGrid.ts`) —
  focusing a card that isn't mounted yet, without polling — was the fiddliest
  part of this whole submission.
- The render-count bug in the Performance section: "memo() is in place" and
  "memo() is actually working" turned out to be two different claims that
  need two different kinds of evidence.
