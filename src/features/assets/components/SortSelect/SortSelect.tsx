import { Select } from '@/components/Select';
import { SORT_OPTIONS } from '@/constants';
import type { SortValue } from '@/types';

interface SortSelectProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
}

export const SortSelect = ({ value, onChange }: SortSelectProps) => (
  <Select
    label="Sort"
    options={SORT_OPTIONS}
    value={value}
    onChange={(next) => onChange(next as SortValue)}
  />
);
