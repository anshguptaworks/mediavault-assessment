import { Button } from '@/components/Button';
import { STATUS_LABELS, STATUS_SEQUENCE } from '@/constants';
import type { AssetStatus } from '@/types';
import styles from './BulkActionBar.module.css';

interface BulkActionBarProps {
  selectedCount: number;
  isApplying: boolean;
  onSetStatus: (status: AssetStatus) => void;
  onSelectAllLoaded: () => void;
  onClear: () => void;
}

export const BulkActionBar = ({
  selectedCount,
  isApplying,
  onSetStatus,
  onSelectAllLoaded,
  onClear,
}: BulkActionBarProps) => (
  <div className={styles.bar} role="toolbar" aria-label="Bulk actions">
    <span className={styles.count}>{selectedCount.toLocaleString()} selected</span>
    <Button size="sm" variant="ghost" onClick={onSelectAllLoaded}>
      Select all loaded
    </Button>
    <span className={styles.divider} aria-hidden="true" />
    <span className={styles.moveTo}>Move to:</span>
    {STATUS_SEQUENCE.map((status) => (
      <Button key={status} size="sm" disabled={isApplying} onClick={() => onSetStatus(status)}>
        {STATUS_LABELS[status]}
      </Button>
    ))}
    <Button size="sm" variant="ghost" className={styles.clear} onClick={onClear}>
      Clear selection
    </Button>
  </div>
);
