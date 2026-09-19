import { SortDirection, SortField, type SortValue } from '@/types';

export interface SortOption {
  value: SortValue;
  label: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: `${SortField.UpdatedAt}:${SortDirection.Desc}`, label: 'Recently updated' },
  { value: `${SortField.Name}:${SortDirection.Asc}`, label: 'Name A–Z' },
  { value: `${SortField.SizeBytes}:${SortDirection.Desc}`, label: 'Largest first' },
  { value: `${SortField.CreatedAt}:${SortDirection.Desc}`, label: 'Newest' },
];

export const DEFAULT_SORT: SortValue = `${SortField.UpdatedAt}:${SortDirection.Desc}`;
