import styles from './Skeleton.module.css';

interface SkeletonProps {
  height: number | string;
  width?: number | string;
  radius?: 'sm' | 'md';
}

/** A shimmer block sized exactly like the content it stands in for, so
 *  nothing shifts once the real content arrives. */
export const Skeleton = ({ height, width = '100%', radius = 'sm' }: SkeletonProps) => (
  <span
    className={[styles.skeleton, styles[radius]].join(' ')}
    style={{ height, width }}
    aria-hidden="true"
  />
);
