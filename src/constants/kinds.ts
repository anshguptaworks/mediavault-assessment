import { AssetKind } from '@/types';

export const KIND_LABELS: Record<AssetKind, string> = {
  [AssetKind.Image]: 'Image',
  [AssetKind.Video]: 'Video',
  [AssetKind.Document]: 'Document',
};

export function kindLabel(kind: AssetKind): string {
  return KIND_LABELS[kind];
}
