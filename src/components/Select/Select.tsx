import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  /** Visually-hidden label for assistive tech — the trigger itself shows
   *  the current value, not this. */
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

/** A custom single-select popover matching MultiSelectDropdown's
 *  interaction, so Sort and Status read as one family of control instead of
 *  a native `<select>` sitting next to a custom one. */
export const Select = ({ label, options, value, onChange }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePick = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.triggerLabel}>{current?.label ?? label}</span>
        <Icon name="chevron-down" size={16} className={isOpen ? styles.chevronOpen : undefined} />
      </button>

      {isOpen && (
        <ul className={styles.panel} role="listbox" aria-label={label}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={[styles.option, selected && styles.optionSelected]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handlePick(option.value)}
                >
                  {option.label}
                  {selected && <Icon name="check" size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
