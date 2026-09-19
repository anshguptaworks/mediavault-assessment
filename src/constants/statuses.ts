import { AssetStatus } from '@/types';

/** Progression order the four statuses read as — draft moves right, never left by accident. */
export const STATUS_SEQUENCE: readonly AssetStatus[] = [
  AssetStatus.Draft,
  AssetStatus.InReview,
  AssetStatus.Approved,
  AssetStatus.Archived,
];

export const STATUS_LABELS: Record<AssetStatus, string> = {
  [AssetStatus.Draft]: 'Draft',
  [AssetStatus.InReview]: 'In review',
  [AssetStatus.Approved]: 'Approved',
  [AssetStatus.Archived]: 'Archived',
};

/** 1-based step in the progression, used for the status pill's dot/glyph — not color alone. */
export const STATUS_STEP: Record<AssetStatus, number> = {
  [AssetStatus.Draft]: 1,
  [AssetStatus.InReview]: 2,
  [AssetStatus.Approved]: 3,
  [AssetStatus.Archived]: 4,
};

/** `{value, label}` shape for the status MultiSelectDropdown. */
export const STATUS_OPTIONS: readonly { value: AssetStatus; label: string }[] =
  STATUS_SEQUENCE.map((status) => ({ value: status, label: STATUS_LABELS[status] }));
