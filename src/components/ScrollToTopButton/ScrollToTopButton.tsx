import { Icon } from '@/components/Icon';
import styles from './ScrollToTopButton.module.css';

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const ScrollToTopButton = ({ visible, onClick }: ScrollToTopButtonProps) => (
  <button
    type="button"
    className={[styles.button, visible && styles.visible].filter(Boolean).join(' ')}
    onClick={onClick}
    aria-label="Scroll to top"
    tabIndex={visible ? 0 : -1}
  >
    <Icon name="arrow-up" size={20} />
  </button>
);
