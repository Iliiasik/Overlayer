import {
  Bookmark,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  Home,
  Mail,
  Phone,
  Play,
  ShoppingCart,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const BUTTON_ICONS: Record<string, LucideIcon> = {
  link: ExternalLink,
  globe: Globe,
  home: Home,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  mail: Mail,
  phone: Phone,
  cart: ShoppingCart,
  file: FileText,
  play: Play,
  zap: Zap,
};

const DEFAULT_BUTTON_ICON = 'link';

export function buttonIcon(name: string | undefined): LucideIcon {
  return BUTTON_ICONS[name ?? DEFAULT_BUTTON_ICON] ?? ExternalLink;
}
