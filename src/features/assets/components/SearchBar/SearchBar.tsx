import type { ChangeEvent } from 'react';
import { Icon } from '@/components/Icon';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className={styles.wrapper}>
    <Icon name="search" size={16} className={styles.icon} />
    <input
      className={styles.input}
      type="text"
      placeholder="Search by name or tag"
      aria-label="Search assets"
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
    />
    {value && (
      <button
        type="button"
        className={styles.clear}
        aria-label="Clear search"
        onClick={() => onChange('')}
      >
        <Icon name="close" size={14} />
      </button>
    )}
  </div>
);
