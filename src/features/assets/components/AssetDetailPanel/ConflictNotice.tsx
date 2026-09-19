import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { STATUS_LABELS } from '@/constants';
import type { Asset, AssetStatus } from '@/types';
import styles from './AssetDetailPanel.module.css';

interface ConflictNoticeProps {
  latestAsset: Asset;
  attemptedStatus: AssetStatus;
  isReapplying: boolean;
  onReapply: () => void;
  onDiscard: () => void;
}

/**
 * A 409 means the version this edit was based on no longer exists. Neither
 * silent option is safe: reapplying blind could clobber whatever the other
 * edit changed, discarding silently loses the reviewer's own intent. So the
 * conflict is shown plainly, with the row's current state, and the
 * reviewer — who has the context to know which matters more here — decides.
 */
export const ConflictNotice = ({
  latestAsset,
  attemptedStatus,
  isReapplying,
  onReapply,
  onDiscard,
}: ConflictNoticeProps) => (
  <Banner tone="warning" icon="alert-triangle" title="Someone else changed this asset">
    <div className={styles.conflict}>
      <p>
        It's now <strong>{STATUS_LABELS[latestAsset.status]}</strong> (version {latestAsset.version}).
        You were trying to set it to <strong>{STATUS_LABELS[attemptedStatus]}</strong>.
      </p>
      <div className={styles.conflictActions}>
        <Button size="sm" variant="primary" disabled={isReapplying} onClick={onReapply}>
          {isReapplying ? 'Applying…' : `Set to ${STATUS_LABELS[attemptedStatus]} anyway`}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Keep {STATUS_LABELS[latestAsset.status]}
        </Button>
      </div>
    </div>
  </Banner>
);
