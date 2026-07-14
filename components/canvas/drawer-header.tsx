import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface DrawerHeaderProps {
  domainLabel: string;
  itemCount: number;
  onClose: () => void;
}

export function DrawerHeader({ domainLabel, itemCount, onClose }: DrawerHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="glass-panel flex h-10 shrink-0 items-center gap-2 border-b px-2.5">
      <AppIcon className="h-6 w-6 shrink-0" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-semibold leading-tight">{domainLabel}</span>
        <span className="truncate text-[10px] leading-tight text-muted-foreground">
          {t('canvas.subtitle')}
        </span>
      </div>
      {itemCount > 0 && (
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {itemCount}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-7 w-7 text-muted-foreground"
        aria-label={t('canvas.close')}
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </header>
  );
}
