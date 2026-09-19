import { STATUS_LABELS, STATUS_SEQUENCE, STATUS_STEP } from '@/constants';
import type { AssetStatus } from '@/types';
import styles from './StatusPill.module.css';

interface StatusPillProps {
  status: AssetStatus;
}

/**
 * Status is never color-only: the four dots make the draft→archived
 * progression readable by shape (how many are filled) as well as by the
 * label text, so it still reads correctly for someone who can't separate
 * the hues apart.
 */
export const StatusPill = ({ status }: StatusPillProps) => {
  const step = STATUS_STEP[status];
  return (
    <span className={[styles.pill, styles[status]].join(' ')}>
      <span className={styles.steps} aria-hidden="true">
        {STATUS_SEQUENCE.map((_, index) => (
          <i
            key={index}
            className={index < step ? styles.stepFilled : styles.stepEmpty}
          />
        ))}
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
};
