import { Globe, PenTool, StickyNote, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { toast } from '@/lib/toast';
import { annotationRepository, type StorageSummary } from '@/lib/storage/annotation-repository';
import { Section } from './section';

export function PagesSection() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<StorageSummary[]>([]);

  const reload = () => void annotationRepository.listAll().then(setEntries);

  useEffect(reload, []);

  const removeEntry = async (key: string) => {
    await annotationRepository.removeEntry(key);
    reload();
    toast(t('options.pageDeleted'));
  };

  const totalSize = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);

  return (
    <Section
      title={t('options.pages')}
      description={
        entries.length > 0
          ? t('options.totalSize', { size: formatBytes(totalSize) })
          : t('options.pagesHint')
      }
    >
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <Globe className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('options.pagesEmpty')}</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {entry.kind === 'board' ? (
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                ) : entry.kind === 'quick' ? (
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {entry.label}
                  {entry.kind === 'board'
                    ? ` · ${t('options.boardScope')}`
                    : entry.kind === 'quick'
                      ? ` · ${t('options.quickScope')}`
                      : entry.detail}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(entry.updatedAt)}
                  {' · '}
                  {formatBytes(entry.sizeBytes)}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {t('options.annotationCount', { count: entry.annotationCount })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('common.delete')}
                title={t('common.delete')}
                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void removeEntry(entry.key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
