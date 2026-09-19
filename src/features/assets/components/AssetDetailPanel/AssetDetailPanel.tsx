import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useAnnounce } from '@/components/LiveRegion';
import { STATUS_LABELS, STATUS_SEQUENCE } from '@/constants';
import { VersionConflictError, formatBytes, formatDate, formatDuration, friendlyMessage } from '@/lib';
import type { Asset, AssetStatus } from '@/types';
import { useAssetQuery, useUpdateAssetMutation } from '../../hooks';
import { ErrorState } from '../ErrorState';
import { StatusPill } from '../StatusPill';
import { Thumbnail } from '../Thumbnail';
import { ConflictNotice } from './ConflictNotice';
import styles from './AssetDetailPanel.module.css';

interface AssetDetailPanelProps {
  id: string;
  onClose: () => void;
}

interface PendingConflict {
  latestAsset: Asset;
  attemptedStatus: AssetStatus;
}

export const AssetDetailPanel = ({ id, onClose }: AssetDetailPanelProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { data: asset, isLoading, isError, error, refetch } = useAssetQuery(id);
  const updateMutation = useUpdateAssetMutation();
  const announce = useAnnounce();

  const [conflict, setConflict] = useState<PendingConflict | null>(null);
  const [trackedId, setTrackedId] = useState(id);
  if (id !== trackedId) {
    setTrackedId(id);
    setConflict(null);
  }

  // Moving focus into the panel is a genuine effect: it's an imperative
  // browser action that must happen after the panel (re)renders for a new
  // asset, not something derivable from render output.
  useEffect(() => {
    panelRef.current?.focus();
  }, [id]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose();
  };

  const handleSetStatus = (status: AssetStatus) => {
    if (!asset) return;
    updateMutation.mutate(
      { id: asset.id, version: asset.version, patch: { status } },
      {
        onSuccess: () => announce(`${asset.name} set to ${STATUS_LABELS[status]}`),
        onError: (mutationError) => {
          if (mutationError instanceof VersionConflictError) {
            setConflict({ latestAsset: mutationError.latestAsset, attemptedStatus: status });
            announce('This asset changed while you were viewing it.', { assertive: true });
          }
        },
      },
    );
  };

  const handleReapply = () => {
    if (!conflict) return;
    const { latestAsset, attemptedStatus } = conflict;
    updateMutation.mutate(
      { id: latestAsset.id, version: latestAsset.version, patch: { status: attemptedStatus } },
      {
        onSuccess: () => {
          setConflict(null);
          announce(`${latestAsset.name} set to ${STATUS_LABELS[attemptedStatus]}`);
        },
        onError: (mutationError) => {
          if (mutationError instanceof VersionConflictError) {
            setConflict({ latestAsset: mutationError.latestAsset, attemptedStatus });
          }
        },
      },
    );
  };

  const nonConflictSaveError =
    updateMutation.isError && !(updateMutation.error instanceof VersionConflictError)
      ? updateMutation.error
      : null;

  return (
    <aside
      ref={panelRef}
      className={styles.panel}
      aria-label={asset ? `${asset.name} details` : 'Asset details'}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.head}>
        <h2 className={styles.heading}>Asset detail</h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close detail panel">
          <Icon name="close" size={18} />
        </button>
      </div>

      {isLoading && <p className={styles.muted}>Loading…</p>}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {asset && (
        <div className={styles.body}>
          <Thumbnail assetId={asset.id} hasThumbnail={asset.hasThumbnail} />
          <h3 className={styles.name}>{asset.name}</h3>
          <p className={styles.assetId}>{asset.id}</p>
          <StatusPill status={asset.status} />

          {conflict && (
            <ConflictNotice
              latestAsset={conflict.latestAsset}
              attemptedStatus={conflict.attemptedStatus}
              isReapplying={updateMutation.isPending}
              onReapply={handleReapply}
              onDiscard={() => setConflict(null)}
            />
          )}

          {nonConflictSaveError && (
            <Banner tone="danger" title="Couldn't save">
              {friendlyMessage(nonConflictSaveError)}
            </Banner>
          )}

          <dl className={styles.facts}>
            <dt>Kind</dt>
            <dd>{asset.kind}</dd>
            <dt>Size</dt>
            <dd>{formatBytes(asset.sizeBytes)}</dd>
            {asset.width != null && asset.height != null && (
              <>
                <dt>Dimensions</dt>
                <dd>
                  {asset.width}×{asset.height}
                </dd>
              </>
            )}
            {asset.durationSec != null && (
              <>
                <dt>Duration</dt>
                <dd>{formatDuration(asset.durationSec)}</dd>
              </>
            )}
            <dt>Owner</dt>
            <dd>{asset.owner.name}</dd>
            <dt>Updated</dt>
            <dd>{formatDate(asset.updatedAt)}</dd>
            <dt>Version</dt>
            <dd>{asset.version}</dd>
          </dl>

          {asset.tags.length > 0 && (
            <ul className={styles.tags}>
              {asset.tags.map((tag) => (
                <li key={tag}>
                  <Icon name="tag" size={12} />
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <p className={styles.sectionLabel}>Status</p>
          <div className={styles.statusButtons}>
            {STATUS_SEQUENCE.map((status) => (
              <Button
                key={status}
                size="sm"
                disabled={updateMutation.isPending || status === asset.status}
                onClick={() => handleSetStatus(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
