import { memo, type KeyboardEvent, type MouseEvent } from 'react';
import { Checkbox } from '@/components/Checkbox';
import { formatBytes, formatDate } from '@/lib';
import { kindLabel } from '@/constants';
import type { Asset } from '@/types';
import { StatusPill } from '../StatusPill';
import { Thumbnail } from '../Thumbnail';
import styles from './AssetCard.module.css';

interface AssetCardProps {
  asset: Asset;
  index: number;
  colIndex: number;
  selected: boolean;
  isOpen: boolean;
  tabIndex: 0 | -1;
  registerRef: (node: HTMLDivElement | null) => void;
  onOpen: (id: string, index: number) => void;
  onToggleSelect: (id: string, index: number) => void;
  onExtendSelectTo: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void;
}

/** Memoized with per-card props reduced to primitives (not the raw
 *  `Set`/`activeId`) and callbacks that take `id`/`index` instead of
 *  closing over them — both required for `memo` to actually skip renders. */
function AssetCardImpl({
  asset,
  index,
  colIndex,
  selected,
  isOpen,
  tabIndex,
  registerRef,
  onOpen,
  onToggleSelect,
  onExtendSelectTo,
  onKeyDown,
}: AssetCardProps) {
  const handleCardClick = () => onOpen(asset.id, index);

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.shiftKey) {
      event.preventDefault();
      onExtendSelectTo(index);
    } else {
      onToggleSelect(asset.id, index);
    }
  };

  return (
    <div
      ref={registerRef}
      role="gridcell"
      aria-colindex={colIndex + 1}
      aria-selected={selected}
      tabIndex={tabIndex}
      className={[styles.card, selected && styles.selected, isOpen && styles.open]
        .filter(Boolean)
        .join(' ')}
      onClick={handleCardClick}
      onKeyDown={(event) => onKeyDown(event, index)}
    >
      <Thumbnail assetId={asset.id} hasThumbnail={asset.hasThumbnail} />
      <div className={styles.body}>
        <p className={styles.name} title={asset.name}>
          {asset.name}
        </p>
        <p className={styles.meta}>
          {kindLabel(asset.kind)} · {formatBytes(asset.sizeBytes)} · {formatDate(asset.updatedAt)}
        </p>
        <StatusPill status={asset.status} />
      </div>
      <Checkbox
        className={styles.checkbox}
        tabIndex={-1}
        aria-label={`Select ${asset.name}`}
        checked={selected}
        onChange={() => undefined}
        onClick={handleCheckboxClick}
      />
    </div>
  );
}

export const AssetCard = memo(AssetCardImpl);
