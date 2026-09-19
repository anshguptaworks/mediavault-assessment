import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import styles from './Banner.module.css';

type BannerTone = 'info' | 'warning' | 'danger' | 'success';

interface BannerProps {
  tone: BannerTone;
  title: string;
  icon?: IconName;
  children?: ReactNode;
  action?: ReactNode;
}

const ROLE_BY_TONE: Record<BannerTone, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
};

export const Banner = ({ tone, title, icon, children, action }: BannerProps) => (
  <div className={[styles.banner, styles[tone]].join(' ')} role={ROLE_BY_TONE[tone]}>
    {icon && (
      <span className={styles.icon}>
        <Icon name={icon} size={18} />
      </span>
    )}
    <div className={styles.body}>
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.message}>{children}</p>}
    </div>
    {action && <div className={styles.action}>{action}</div>}
  </div>
);
