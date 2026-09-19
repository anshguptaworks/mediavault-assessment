import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon } from '@/components/Icon';
import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  'aria-label': string;
}

/**
 * A custom-drawn checkbox (rounded box + checkmark icon) instead of the
 * bare native control — the native input is still there and still handles
 * every click/keyboard/change event, just made invisible and stretched over
 * the visible box, so nothing about its behavior or accessibility changes.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...rest }, ref) => (
    <span className={[styles.box, checked && styles.checked, className].filter(Boolean).join(' ')}>
      <input ref={ref} type="checkbox" checked={checked} className={styles.input} {...rest} />
      <Icon name="check" size={12} strokeWidth={3} className={styles.icon} />
    </span>
  ),
);

Checkbox.displayName = 'Checkbox';
