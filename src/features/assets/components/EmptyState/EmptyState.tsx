import { Icon } from '@/components/Icon';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * Distinct from ErrorState on purpose — "no results for this filter" and
 * "the request failed" must never look the same, per the brief. This one
 * reads as a dead end you can back out of, not a failure.
 */
export const EmptyState = ({ hasActiveFilters, onClearFilters }: EmptyStateProps) => (
  <div className={styles.empty}>
    <div className={styles.iconWrap}>
      <Icon name="inbox" size={32} strokeWidth={1.5} />
    </div>
    <p className={styles.title}>Nothing matches these filters.</p>
    {hasActiveFilters ? (
      <button type="button" className={styles.clear} onClick={onClearFilters}>
        Clear search and filters
      </button>
    ) : (
      <p className={styles.hint}>This library doesn't have any assets yet.</p>
    )}
  </div>
);
