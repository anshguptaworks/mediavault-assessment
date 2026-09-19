import {
  AlertTriangle,
  ArrowUp,
  Check,
  ChevronDown,
  ImageOff,
  Inbox,
  Search,
  Tag,
  WifiOff,
  X,
  type LucideProps,
} from 'lucide-react';

/** One place mapping our own semantic names to lucide-react icons — call
 *  sites never import from lucide-react directly, so swapping the icon set
 *  later only touches this file. */
const ICONS = {
  search: Search,
  close: X,
  'chevron-down': ChevronDown,
  'arrow-up': ArrowUp,
  check: Check,
  'alert-triangle': AlertTriangle,
  'image-off': ImageOff,
  inbox: Inbox,
  tag: Tag,
  'wifi-off': WifiOff,
};

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
}

export const Icon = ({ name, size = 20, strokeWidth = 2, ...rest }: IconProps) => {
  const LucideIcon = ICONS[name];
  return <LucideIcon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
};
