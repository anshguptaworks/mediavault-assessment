import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { friendlyMessage } from '@/lib';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

/** A failed request, rendered so it is unmistakably not "zero results." */
export const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <div className={styles.error} role="alert">
    <div className={styles.iconWrap}>
      <Icon name="alert-triangle" size={32} strokeWidth={1.5} />
    </div>
    <p className={styles.title}>Couldn't load assets</p>
    <p className={styles.message}>{friendlyMessage(error)}</p>
    <Button variant="primary" onClick={onRetry}>
      Try again
    </Button>
  </div>
);
