import { useState } from 'react';
import { thumbnailUrl } from '@/api';
import { Icon } from '@/components/Icon';
import styles from './Thumbnail.module.css';

interface ThumbnailProps {
  assetId: string;
  hasThumbnail: boolean;
}

/**
 * Decorative (`alt=""`): the card's name text already gives the accessible
 * name, so the image itself should not be announced a second time.
 *
 * `hasThumbnail` comes on every asset, so the ~4% with no rendered
 * thumbnail never issue a request that we already know will 404 — and a
 * thumbnail that fails for any other reason falls back to the same stable
 * placeholder, at the same size, instead of a broken-image icon or a
 * layout shift.
 */
export const Thumbnail = ({ assetId, hasThumbnail }: ThumbnailProps) => {
  const [failed, setFailed] = useState(!hasThumbnail);

  if (failed) {
    return (
      <div className={styles.placeholder} aria-hidden="true">
        <Icon name="image-off" size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      className={styles.image}
      src={thumbnailUrl(assetId)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};
