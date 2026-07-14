import { Bold, FileText, Globe, Italic, Search, StickyNote, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Pager } from '@/components/ui/pagination';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { isolateEvents } from '@/lib/events';
import { annotationRepository } from '@/lib/storage/annotation-repository';
import { listDomainMarks, type DomainMark } from '@/lib/storage/site-index';
import { isMarkPresent, restoreAnnotation, scrollToMark } from '@/lib/text-marks/marker';
import { cn } from '@/lib/utils';

interface HighlightsPanelProps {
  marks: TextMarkAnnotation[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (mark: TextMarkAnnotation) => void;
}

const SKELETON_DELAY_MS = 250;

function DelayedSkeleton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SKELETON_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="mt-1 h-2.5 w-2.5 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

type StyleFilter = 'bold' | 'italic' | 'note';
type SearchScope = 'page' | 'domain';

const ITEM_HEIGHT = 56;
const PANEL_CHROME_HEIGHT = 330;
const MIN_PAGE_SIZE = 4;

function computePageSize(): number {
  const available = window.innerHeight - PANEL_CHROME_HEIGHT;
  return Math.max(MIN_PAGE_SIZE, Math.floor(available / ITEM_HEIGHT));
}

export function HighlightsPanel({ marks, onClose, onSelect, onDelete }: HighlightsPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('page');
  const [domainMarks, setDomainMarks] = useState<DomainMark[] | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [styleFilters, setStyleFilters] = useState<Set<StyleFilter>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(computePageSize);

  useEffect(() => {
    const onResize = () => setPageSize(computePageSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (scope !== 'domain') return;
    let cancelled = false;
    void listDomainMarks(window.location.href).then((rows) => {
      if (!cancelled) setDomainMarks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, marks]);

  const rows: DomainMark[] | null = useMemo(() => {
    if (scope === 'page') {
      return marks.map((mark) => ({
        mark,
        url: window.location.href,
        path: '',
        currentPage: true,
      }));
    }
    return domainMarks;
  }, [scope, marks, domainMarks]);

  const colors = useMemo(
    () => [...new Set((rows ?? []).map((row) => row.mark.style.color))],
    [rows],
  );

  const toggleStyleFilter = (filter: StyleFilter) => {
    setStyleFilters((previous) => {
      const next = new Set(previous);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const visible = useMemo(() => {
    if (!rows) return [];
    const needle = query.trim().toLowerCase();
    return rows
      .filter(({ mark }) => {
        if (colorFilter && mark.style.color !== colorFilter) return false;
        if (styleFilters.has('bold') && !mark.bold) return false;
        if (styleFilters.has('italic') && !mark.italic) return false;
        if (styleFilters.has('note') && !mark.note) return false;
        if (!needle) return true;
        const quote = mark.anchor.text?.quote.toLowerCase() ?? '';
        return quote.includes(needle) || mark.note.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        if (a.currentPage !== b.currentPage) return a.currentPage ? -1 : 1;
        if (a.path !== b.path) return a.path.localeCompare(b.path);
        return a.mark.anchor.position.y - b.mark.anchor.position.y;
      });
  }, [rows, query, colorFilter, styleFilters]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  const applyFilter = (action: () => void) => {
    setPage(1);
    action();
  };

  const jumpTo = (row: DomainMark) => {
    if (!row.currentPage) {
      window.open(row.url, '_blank', 'noopener');
      return;
    }
    if (!isMarkPresent(row.mark.id)) restoreAnnotation(row.mark);
    if (!isMarkPresent(row.mark.id)) return;
    scrollToMark(row.mark.id);
    onSelect(row.mark.id);
  };

  const deleteRow = (row: DomainMark) => {
    if (row.currentPage) {
      onDelete(row.mark);
    } else {
      void annotationRepository.removeMark(row.url, row.mark.id).then(() => {
        setDomainMarks((current) =>
          current ? current.filter((entry) => entry.mark.id !== row.mark.id) : current,
        );
      });
    }
  };

  const styleFilterButtons: { filter: StyleFilter; icon: typeof Bold; label: string }[] = [
    { filter: 'bold', icon: Bold, label: t('highlighter.bold') },
    { filter: 'italic', icon: Italic, label: t('highlighter.italic') },
    { filter: 'note', icon: StickyNote, label: t('highlighter.withNote') },
  ];

  return (
    <div
      className="glass-card fixed bottom-4 right-3 top-4 z-20 flex w-80 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl"
      style={{ pointerEvents: 'auto' }}
      {...isolateEvents}
    >
      <div className="flex items-center gap-2 border-b p-3">
        <span className="text-sm font-semibold">{t('highlighter.panelTitle')}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {scope === 'page' ? marks.length : (rows?.length ?? '…')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 text-muted-foreground"
          aria-label={t('common.cancel')}
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 border-b p-3">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            placeholder={t('highlighter.search')}
            onChange={(event) => applyFilter(() => setQuery(event.target.value))}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Segmented<SearchScope>
          stretch
          aria-label={t('highlighter.searchScope')}
          value={scope}
          onChange={(next) =>
            applyFilter(() => {
              setScope(next);
              if (next === 'domain') setDomainMarks(null);
            })
          }
          options={[
            { value: 'page', label: t('highlighter.scopePage'), icon: FileText },
            { value: 'domain', label: t('highlighter.scopeSite'), icon: Globe },
          ]}
        />
        <div className="flex items-center gap-1.5">
          {colors.map((value) => (
            <button
              key={value}
              type="button"
              aria-label={value}
              aria-pressed={colorFilter === value}
              onClick={() =>
                applyFilter(() => setColorFilter((current) => (current === value ? null : value)))
              }
              className={cn(
                'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                colorFilter === value ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: value }}
            />
          ))}
          <div className="ml-auto flex items-center gap-1">
            {styleFilterButtons.map(({ filter, icon: Icon, label }) => (
              <Button
                key={filter}
                variant={styleFilters.has(filter) ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                aria-label={label}
                aria-pressed={styleFilters.has(filter)}
                onClick={() => applyFilter(() => toggleStyleFilter(filter))}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {rows === null ? (
          <DelayedSkeleton />
        ) : visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t('highlighter.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {pageItems.map((row) => {
              const present = row.currentPage && isMarkPresent(row.mark.id);
              return (
                <li key={row.mark.id}>
                  <Item
                    role="button"
                    tabIndex={0}
                    onClick={() => jumpTo(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') jumpTo(row);
                    }}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-accent',
                      row.currentPage && !present && 'opacity-50',
                    )}
                  >
                    <ItemMedia>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.mark.style.color }}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle
                        className={cn(
                          'line-clamp-2 font-normal',
                          row.mark.bold && 'font-bold',
                          row.mark.italic && 'italic',
                        )}
                      >
                        {row.mark.anchor.text?.quote}
                      </ItemTitle>
                      {scope === 'domain' && !row.currentPage && (
                        <ItemDescription className="truncate">{row.path}</ItemDescription>
                      )}
                      {row.mark.note && (
                        <ItemDescription className="flex items-start gap-1">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{row.mark.note}</span>
                        </ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('common.delete')}
                        className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={(event: MouseEvent) => {
                          event.stopPropagation();
                          deleteRow(row);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ItemActions>
                  </Item>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {totalPages > 1 && (
        <div className="shrink-0 border-t p-2">
          <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
