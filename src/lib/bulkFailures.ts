import { BulkFailureCode, type BulkStatusItemResult, type BulkStatusResult } from '@/types';

/** `conflict` is a transient race with another writer — safe to retry.
 *  `legal_hold` is deterministic and `not_found` means the row is gone —
 *  neither will ever succeed by trying again. */
export function isBulkFailureRetryable(code: BulkFailureCode): boolean {
  return code === BulkFailureCode.Conflict;
}

const BULK_FAILURE_MESSAGES: Record<BulkFailureCode, string> = {
  [BulkFailureCode.NotFound]: 'No longer exists',
  [BulkFailureCode.LegalHold]: 'On legal hold — cannot be archived',
  [BulkFailureCode.Conflict]: 'Changed by someone else — retry should work',
};

export function bulkFailureLabel(code: BulkFailureCode): string {
  return BULK_FAILURE_MESSAGES[code];
}

export interface BulkOutcomeSummary {
  appliedIds: string[];
  retryableFailures: Extract<BulkStatusItemResult, { ok: false }>[];
  permanentFailures: Extract<BulkStatusItemResult, { ok: false }>[];
}

export function summarizeBulkResults(results: BulkStatusItemResult[]): BulkOutcomeSummary {
  const appliedIds: string[] = [];
  const retryableFailures: Extract<BulkStatusItemResult, { ok: false }>[] = [];
  const permanentFailures: Extract<BulkStatusItemResult, { ok: false }>[] = [];

  for (const result of results) {
    if (result.ok) {
      appliedIds.push(result.id);
    } else if (isBulkFailureRetryable(result.code)) {
      retryableFailures.push(result);
    } else {
      permanentFailures.push(result);
    }
  }

  return { appliedIds, retryableFailures, permanentFailures };
}

/** Folds a retry-of-the-failed-subset result back into the outcome it came
 *  from, instead of replacing it outright — a straight replace would drop
 *  the original permanent failures (and other still-valid successes) from
 *  the banner the moment the retryable subset resolves. Rows the retry
 *  touched are superseded by its own result; every other row is untouched. */
export function mergeBulkResults(previous: BulkStatusResult, retryResult: BulkStatusResult): BulkStatusResult {
  const retriedIds = new Set(retryResult.results.map((result) => result.id));
  const carriedOver = previous.results.filter((result) => !retriedIds.has(result.id));
  const results = [...carriedOver, ...retryResult.results];
  const applied = results.filter((result) => result.ok).length;
  return { applied, failed: results.length - applied, results };
}
