import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import styles from './ErrorBoundary.module.css';

interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export const ErrorFallback = ({ error, onReset }: ErrorFallbackProps) => (
  <div className={styles.fallback} role="alert">
    <Icon name="alert-triangle" size={24} />
    <p className={styles.title}>This part of the page hit a problem.</p>
    <p className={styles.detail}>{error.message || 'An unexpected error occurred.'}</p>
    <Button variant="primary" onClick={onReset}>
      Try again
    </Button>
  </div>
);
