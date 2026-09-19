import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { bulkFailureLabel, summarizeBulkResults } from '@/lib';
import type { BulkStatusResult } from '@/types';
import styles from './BulkOutcomeBanner.module.css';

interface BulkOutcomeBannerProps {
  result: BulkStatusResult;
  isRetrying: boolean;
  onRetryFailed: () => void;
  onDismiss: () => void;
}

/**
 * "Did it work" is never a yes/no for a bulk action — this always names
 * exactly which assets did not change and groups the reasons into "retrying
 * will probably fix this" (a random write conflict) vs. "retrying will
 * never fix this" (legal hold, or the row is gone), since those need
 * different next steps from the reviewer.
 */
export const BulkOutcomeBanner = ({
  result,
  isRetrying,
  onRetryFailed,
  onDismiss,
}: BulkOutcomeBannerProps) => {
  const { appliedIds, retryableFailures, permanentFailures } = summarizeBulkResults(result.results);
  const tone = result.failed === 0 ? 'success' : appliedIds.length === 0 ? 'danger' : 'warning';
  const icon = result.failed === 0 ? 'check' : 'alert-triangle';

  return (
    <Banner
      tone={tone}
      icon={icon}
      title={`${result.applied} updated, ${result.failed} failed`}
      action={
        <div className={styles.actions}>
          {retryableFailures.length > 0 && (
            <Button size="sm" variant="primary" disabled={isRetrying} onClick={onRetryFailed}>
              {isRetrying ? 'Retrying…' : `Retry ${retryableFailures.length} failed`}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      }
    >
      {result.failed > 0 && (
        <ul className={styles.reasons}>
          {[...permanentFailures, ...retryableFailures].slice(0, 6).map((failure) => (
            <li key={failure.id}>
              <code>{failure.id}</code> — {bulkFailureLabel(failure.code)}
            </li>
          ))}
          {result.failed > 6 && <li>…and {result.failed - 6} more</li>}
        </ul>
      )}
    </Banner>
  );
};
