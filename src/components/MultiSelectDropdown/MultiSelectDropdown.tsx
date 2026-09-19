import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/Checkbox';
import { Icon } from '@/components/Icon';
import styles from './MultiSelectDropdown.module.css';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: readonly MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** A button that opens a checkbox-list popover — closes on outside click,
 *  Escape, or its own close button. No native <select multiple>: that
 *  control's UX (ctrl/cmd-click to multi-pick) isn't discoverable enough
 *  for a filter bar. */
export const MultiSelectDropdown = ({ label, options, selected, onChange }: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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

  const toggleValue = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={[styles.trigger, selected.length > 0 && styles.triggerActive].filter(Boolean).join(' ')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}
        {/* Always rendered (space reserved via `visibility`, not
         *  mount/unmount) so selecting the first option doesn't grow the
         *  button and shift everything anchored to its left. */}
        <span className={styles.count} style={selected.length === 0 ? { visibility: 'hidden' } : undefined}>
          {selected.length || 1}
        </span>
        <Icon name="chevron-down" size={16} />
      </button>

      {isOpen && (
        <div className={styles.panel} role="group" aria-label={label}>
          {options.map((option) => (
            <label key={option.value} className={styles.option}>
              <Checkbox
                aria-label={option.label}
                checked={selected.includes(option.value)}
                onChange={() => toggleValue(option.value)}
              />
              {option.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
