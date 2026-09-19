import { Skeleton } from '@/components/Skeleton';
import styles from './AssetCardSkeleton.module.css';

/** Same footprint as a real AssetCard, so the grid's height never jumps
 *  between "loading" and "loaded". */
export const AssetCardSkeleton = () => (
  <div className={styles.card} aria-hidden="true">
    <Skeleton height="auto" radius="sm" />
    <div className={styles.body}>
      <Skeleton height={14} width="70%" />
      <Skeleton height={11} width="45%" />
      <Skeleton height={20} width={72} radius="md" />
    </div>
  </div>
);
