import { Bold, Italic, Search, StickyNote, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { isolateEvents } from '@/lib/events';
import { isMarkPresent, restoreAnnotation, scrollToMark } from '@/lib/text-marks/marker';
import { cn } from '@/lib/utils';

interface HighlightsPanelProps {
  marks: TextMarkAnnotation[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

type StyleFilter = 'bold' | 'italic' | 'note';

const ITEM_HEIGHT = 52;
const PANEL_CHROME_HEIGHT = 240;
const MIN_PAGE_SIZE = 4;

function computePageSize(): number {
  const available = window.innerHeight - PANEL_CHROME_HEIGHT;
  return Math.max(MIN_PAGE_SIZE, Math.floor(available / ITEM_HEIGHT));
}

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(sorted[i]);
  }
  return result;
}

export function HighlightsPanel({ marks, onClose, onSelect }: HighlightsPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [styleFilters, setStyleFilters] = useState<Set<StyleFilter>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(computePageSize);

  useEffect(() => {
    const onResize = () => setPageSize(computePageSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const colors = useMemo(() => [...new Set(marks.map((mark) => mark.style.color))], [marks]);

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
    const needle = query.trim().toLowerCase();
    return marks
      .filter((mark) => {
        if (colorFilter && mark.style.color !== colorFilter) return false;
        if (styleFilters.has('bold') && !mark.bold) return false;
        if (styleFilters.has('italic') && !mark.italic) return false;
        if (styleFilters.has('note') && !mark.note) return false;
        if (!needle) return true;
        const quote = mark.anchor.text?.quote.toLowerCase() ?? '';
        return quote.includes(needle) || mark.note.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.anchor.position.y - b.anchor.position.y);
  }, [marks, query, colorFilter, styleFilters]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  const applyFilter = (action: () => void) => {
    setPage(1);
    action();
  };

  const jumpTo = (mark: TextMarkAnnotation) => {
    if (!isMarkPresent(mark.id)) restoreAnnotation(mark);
    if (!isMarkPresent(mark.id)) return;
    scrollToMark(mark.id);
    onSelect(mark.id);
  };

  const styleFilterButtons: { filter: StyleFilter; icon: typeof Bold; label: string }[] = [
    { filter: 'bold', icon: Bold, label: t('highlighter.bold') },
    { filter: 'italic', icon: Italic, label: t('highlighter.italic') },
    { filter: 'note', icon: StickyNote, label: t('highlighter.withNote') },
  ];

  return (
    <div
      className="fixed bottom-4 right-3 top-4 z-20 flex w-80 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
      style={{ pointerEvents: 'auto' }}
      {...isolateEvents}
    >
      <div className="flex items-center gap-2 border-b p-3">
        <span className="text-sm font-semibold">{t('highlighter.panelTitle')}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {marks.length}
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
                title={label}
                onClick={() => applyFilter(() => toggleStyleFilter(filter))}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 p-1.5">
        {visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t('highlighter.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {pageItems.map((mark) => {
              const present = isMarkPresent(mark.id);
              return (
                <li key={mark.id}>
                  <Item
                    role="button"
                    tabIndex={0}
                    onClick={() => jumpTo(mark)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') jumpTo(mark);
                    }}
                    className={cn(
                      'cursor-pointer items-start transition-colors hover:bg-accent',
                      !present && 'opacity-50',
                    )}
                  >
                    <ItemMedia className="mt-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: mark.style.color }}
                      />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle
                        className={cn(
                          'line-clamp-2 font-normal',
                          mark.bold && 'font-bold',
                          mark.italic && 'italic',
                        )}
                      >
                        {mark.anchor.text?.quote}
                      </ItemTitle>
                      {mark.note && (
                        <ItemDescription className="flex items-start gap-1">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{mark.note}</span>
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </Item>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {totalPages > 1 && (
        <div className="border-t p-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                />
              </PaginationItem>
              {pageNumbers(safePage, totalPages).map((entry, index) =>
                entry === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={entry}>
                    <PaginationLink isActive={entry === safePage} onClick={() => setPage(entry)}>
                      {entry}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
