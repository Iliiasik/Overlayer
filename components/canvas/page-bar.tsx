import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface PageBarProps {
  title: string;
  index: number;
  count: number;
  onTitleChange: (title: string) => void;
  onNavigate: (index: number) => void;
  onAdd: () => void;
  onDelete: () => void;
}

export function PageBar({
  title,
  index,
  count,
  onTitleChange,
  onNavigate,
  onAdd,
  onDelete,
}: PageBarProps) {
  const { t } = useTranslation();

  return (
    <div className="glass-panel flex h-9 shrink-0 items-center gap-0.5 border-b px-2">
      <input
        value={title}
        maxLength={80}
        placeholder={t('canvas.pageTitle')}
        aria-label={t('canvas.pageTitle')}
        onChange={(event) => onTitleChange(event.target.value)}
        className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm font-medium outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={index === 0}
        aria-label={t('canvas.prevPage')}
        onClick={() => onNavigate(index - 1)}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-7 text-center text-[11px] tabular-nums text-muted-foreground">
        {index + 1}/{count}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={index === count - 1}
        aria-label={t('canvas.nextPage')}
        onClick={() => onNavigate(index + 1)}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label={t('canvas.addPage')}
        onClick={onAdd}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {count > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('canvas.deletePage')}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
