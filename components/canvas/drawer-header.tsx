import { Frame, StickyNote, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Tip } from '@/components/ui/tooltip';

interface DrawerHeaderProps {
  domainLabel: string;
  expanded: boolean;
  itemCount: number;
  onToggleExpanded: () => void;
  onClose: () => void;
}

export function DrawerHeader({
  domainLabel,
  expanded,
  itemCount,
  onToggleExpanded,
  onClose,
}: DrawerHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b bg-background px-2.5">
      <AppIcon className="h-6 w-6 shrink-0" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-semibold leading-tight">{domainLabel}</span>
        <span className="truncate text-[10px] leading-tight text-muted-foreground">
          {expanded ? t('canvas.title') : t('canvas.subtitle')}
        </span>
      </div>
      {itemCount > 0 && (
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {itemCount}
        </span>
      )}
      <div className="ml-auto flex items-center gap-0.5">
        <Tip label={expanded ? t('canvas.backToNotes') : t('canvas.openBoard')} side="left">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={expanded ? t('canvas.backToNotes') : t('canvas.openBoard')}
            onClick={onToggleExpanded}
          >
            {expanded ? <StickyNote className="h-4 w-4" /> : <Frame className="h-4 w-4" />}
          </Button>
        </Tip>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label={t('canvas.close')}
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
