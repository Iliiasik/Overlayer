import { ChevronDown, Globe, Highlighter, Search, StickyNote, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { browser } from 'wxt/browser';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Pager, usePager } from '@/components/ui/pagination';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { faviconUrl } from '@/lib/favicon';
import { formatBytes } from '@/lib/format';
import { openTab, openTabToMark, openTabWithNotes } from '@/lib/tabs';
import { toast } from '@/lib/toast';
import { annotationRepository } from '@/lib/storage/annotation-repository';
import { isNotesKey, isQuickKey } from '@/lib/storage/page-key';
import {
  buildSiteIndex,
  quoteOf,
  siteIndexSize,
  type HighlightPageEntry,
  type QuickNotesEntry,
  type SiteEntry,
} from '@/lib/storage/site-index';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { cn } from '@/lib/utils';
import { Section } from './section';

type ManagerTab = 'sites' | 'notes' | 'text';

const SITES_PAGE_SIZE = 6;
const LIST_PAGE_SIZE = 8;
const QUOTES_PAGE_SIZE = 5;

function useDateFormat(): (timestamp: number) => string {
  const { i18n } = useTranslation();
  const format = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language],
  );
  return useCallback((timestamp: number) => format.format(timestamp), [format]);
}

function faviconCandidates(url: string): string[] {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return [url];
    if (parsed.hostname.startsWith('www.')) return [url];
    const www = new URL(url);
    www.hostname = `www.${www.hostname}`;
    return [url, www.toString()];
  } catch {
    return [url];
  }
}

function SiteFavicon({ url }: { url: string }) {
  const candidates = useMemo(() => faviconCandidates(url), [url]);
  const [attempt, setAttempt] = useState(0);
  if (attempt >= candidates.length) {
    return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
  return (
    <img
      src={faviconUrl(candidates[attempt])}
      alt=""
      className="h-4 w-4"
      onError={() => setAttempt((current) => current + 1)}
    />
  );
}

function DeleteButton({ onDelete, label }: { onDelete: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        onDelete();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function SearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2.5 focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm outline-none"
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
      <Globe className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-foreground/70">{text}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-2.5 py-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuoteList({
  marks,
  onOpen,
  onDeleteMark,
}: {
  marks: TextMarkAnnotation[];
  onOpen: (mark: TextMarkAnnotation) => void;
  onDeleteMark: (markId: string) => void;
}) {
  const { t } = useTranslation();
  const pager = usePager(marks, QUOTES_PAGE_SIZE);
  return (
    <div className="flex flex-col gap-0.5 pb-1 pl-11">
      {pager.slice.map((mark) => (
        <Item
          key={mark.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(mark)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onOpen(mark);
          }}
          className="cursor-pointer py-1.5 transition-colors hover:bg-accent"
        >
          <ItemMedia>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: mark.style.color }}
            />
          </ItemMedia>
          <ItemContent>
            <ItemTitle
              className={cn(
                'line-clamp-2 break-words font-normal',
                mark.bold && 'font-bold',
                mark.italic && 'italic',
              )}
            >
              {quoteOf(mark)}
            </ItemTitle>
            {mark.note && (
              <ItemDescription className="line-clamp-1 break-words">{mark.note}</ItemDescription>
            )}
          </ItemContent>
          <ItemActions>
            <DeleteButton label={t('common.delete')} onDelete={() => onDeleteMark(mark.id)} />
          </ItemActions>
        </Item>
      ))}
      <Pager page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </div>
  );
}

function HighlightPageRow({
  page,
  onDelete,
  onDeleteMark,
}: {
  page: HighlightPageEntry;
  onDelete: (key: string) => void;
  onDeleteMark: (pageUrl: string, markId: string) => void;
}) {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  const [open, setOpen] = useState(false);
  const marks = page.marks;
  if (marks.length === 0) return null;
  return (
    <>
      <Item
        role="button"
        tabIndex={0}
        onClick={() => void openTab(page.url)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void openTab(page.url);
        }}
        className="cursor-pointer transition-colors hover:bg-accent"
      >
        <ItemMedia className="h-9 w-9 rounded-lg bg-muted">
          <Highlighter className="h-4 w-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="truncate font-normal">{page.path}</ItemTitle>
          <ItemDescription className="truncate">
            {t('options.highlightCount', { count: marks.length })}
            {' · '}
            {formatDate(page.updatedAt)}
            {' · '}
            {formatBytes(page.sizeBytes)}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={(event: MouseEvent) => {
              event.stopPropagation();
              setOpen((current) => !current);
            }}
          >
            {open ? t('options.hide') : t('options.show')}
          </Button>
          <DeleteButton label={t('common.delete')} onDelete={() => onDelete(page.key)} />
        </ItemActions>
      </Item>
      {open && (
        <QuoteList
          marks={marks}
          onOpen={(mark) => void openTabToMark(page.url, mark.id)}
          onDeleteMark={(markId) => onDeleteMark(page.url, markId)}
        />
      )}
    </>
  );
}

function QuickNotesRow({
  notes,
  onDelete,
}: {
  notes: QuickNotesEntry;
  onDelete: (key: string) => void;
}) {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  return (
    <Item
      role="button"
      tabIndex={0}
      onClick={() => void openTabWithNotes(notes.url)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') void openTabWithNotes(notes.url);
      }}
      className="cursor-pointer transition-colors hover:bg-accent"
    >
      <ItemMedia className="h-9 w-9 rounded-lg bg-muted">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="truncate font-normal">{t('options.quickScope')}</ItemTitle>
        <ItemDescription className="truncate">
          {t('options.pageCount', { count: notes.pages.length })}
          {' · '}
          {t('options.annotationCount', { count: notes.itemCount })}
          {' · '}
          {formatDate(notes.updatedAt)}
          {' · '}
          {formatBytes(notes.sizeBytes)}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <DeleteButton label={t('common.delete')} onDelete={() => onDelete(notes.key)} />
      </ItemActions>
    </Item>
  );
}

function SitesTab({
  sites,
  onDelete,
  onDeleteMark,
}: {
  sites: SiteEntry[];
  onDelete: (key: string) => void;
  onDeleteMark: (pageUrl: string, markId: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sites;
    return sites.filter((site) => site.domain.toLowerCase().includes(needle));
  }, [sites, query]);

  const pager = usePager(visible, SITES_PAGE_SIZE);

  const search = (value: string) => {
    pager.setPage(1);
    setQuery(value);
  };

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={query} placeholder={t('options.searchSites')} onChange={search} />
      {visible.length === 0 ? (
        <EmptyState text={query ? t('highlighter.empty') : t('options.pagesEmpty')} />
      ) : (
        <ul className="flex flex-col divide-y">
          {pager.slice.map((site) => {
            const isOpen = expanded === site.domain;
            return (
              <li key={site.domain} className="py-1 first:pt-0 last:pb-0">
                <Item
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isOpen ? null : site.domain)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setExpanded(isOpen ? null : site.domain);
                  }}
                  className="cursor-pointer transition-colors hover:bg-accent"
                >
                  <ItemMedia className="h-9 w-9 rounded-lg bg-muted">
                    <SiteFavicon url={site.url} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="truncate">{site.domain}</ItemTitle>
                    <ItemDescription className="truncate">
                      {[
                        site.notes
                          ? t('options.annotationCount', { count: site.notes.itemCount })
                          : null,
                        site.markCount > 0
                          ? t('options.highlightCount', { count: site.markCount })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </ItemDescription>
                  </ItemContent>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </Item>
                {isOpen && (
                  <div className="ml-5 flex flex-col gap-0.5 border-l pl-3 pt-1">
                    {site.notes && <QuickNotesRow notes={site.notes} onDelete={onDelete} />}
                    {site.highlightPages.map((page) => (
                      <HighlightPageRow
                        key={page.key}
                        page={page}
                        onDelete={onDelete}
                        onDeleteMark={onDeleteMark}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </div>
  );
}

function NotesTab({ sites, onDelete }: { sites: SiteEntry[]; onDelete: (key: string) => void }) {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  const entries = useMemo(
    () =>
      sites
        .filter((site): site is SiteEntry & { notes: QuickNotesEntry } => site.notes != null)
        .sort((a, b) => b.notes.updatedAt - a.notes.updatedAt),
    [sites],
  );
  const pager = usePager(entries, LIST_PAGE_SIZE);

  if (entries.length === 0) return <EmptyState text={t('options.pagesEmpty')} />;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y">
        {pager.slice.map((site) => (
          <li key={site.notes.key} className="py-1 first:pt-0 last:pb-0">
            <Item
              role="button"
              tabIndex={0}
              onClick={() => void openTabWithNotes(site.notes.url)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void openTabWithNotes(site.notes.url);
              }}
              className="cursor-pointer transition-colors hover:bg-accent"
            >
              <ItemMedia className="h-9 w-9 rounded-lg bg-muted">
                <SiteFavicon url={site.url} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="truncate">
                  {site.domain}
                  {` · ${t('options.quickScope')}`}
                </ItemTitle>
                <ItemDescription className="truncate">
                  {t('options.pageCount', { count: site.notes.pages.length })}
                  {' · '}
                  {t('options.annotationCount', { count: site.notes.itemCount })}
                  {' · '}
                  {formatDate(site.notes.updatedAt)}
                  {' · '}
                  {formatBytes(site.notes.sizeBytes)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <DeleteButton
                  label={t('common.delete')}
                  onDelete={() => onDelete(site.notes.key)}
                />
              </ItemActions>
            </Item>
          </li>
        ))}
      </ul>
      <Pager page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </div>
  );
}

interface TextRow {
  mark: TextMarkAnnotation;
  page: HighlightPageEntry;
  domain: string;
}

function TextTab({
  sites,
  onDeleteMark,
}: {
  sites: SiteEntry[];
  onDeleteMark: (pageUrl: string, markId: string) => void;
}) {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const all: TextRow[] = sites.flatMap((site) =>
      site.highlightPages.flatMap((page) =>
        page.marks.map((mark) => ({ mark, page, domain: site.domain })),
      ),
    );
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? all.filter((row) => quoteOf(row.mark).toLowerCase().includes(needle))
      : all;
    return filtered.sort((a, b) => b.mark.updatedAt - a.mark.updatedAt);
  }, [sites, query]);

  const pager = usePager(rows, LIST_PAGE_SIZE);

  const search = (value: string) => {
    pager.setPage(1);
    setQuery(value);
  };

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={query} placeholder={t('options.searchQuotes')} onChange={search} />
      {rows.length === 0 ? (
        <EmptyState text={query ? t('highlighter.empty') : t('options.pagesEmpty')} />
      ) : (
        <ul className="flex flex-col divide-y">
          {pager.slice.map((row) => (
            <li key={row.mark.id} className="py-1 first:pt-0 last:pb-0">
              <Item
                role="button"
                tabIndex={0}
                onClick={() => void openTabToMark(row.page.url, row.mark.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void openTabToMark(row.page.url, row.mark.id);
                }}
                className="cursor-pointer transition-colors hover:bg-accent"
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
                      'line-clamp-2 break-words font-normal',
                      row.mark.bold && 'font-bold',
                      row.mark.italic && 'italic',
                    )}
                  >
                    {quoteOf(row.mark)}
                  </ItemTitle>
                  <ItemDescription className="truncate">
                    {row.domain}
                    {row.page.path !== '/' ? row.page.path : ''}
                    {' · '}
                    {formatDate(row.mark.updatedAt)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DeleteButton
                    label={t('common.delete')}
                    onDelete={() => onDeleteMark(row.page.url, row.mark.id)}
                  />
                </ItemActions>
              </Item>
            </li>
          ))}
        </ul>
      )}
      <Pager page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </div>
  );
}

export function PagesSection() {
  const { t } = useTranslation();
  const [sites, setSites] = useState<SiteEntry[] | null>(null);
  const [tab, setTab] = useState<ManagerTab>('sites');

  const reload = useCallback(() => {
    void buildSiteIndex().then(setSites);
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    let timer: number | undefined;
    const listener = (changes: Record<string, unknown>, area: string) => {
      if (area !== 'local') return;
      if (!Object.keys(changes).some((key) => isNotesKey(key) || isQuickKey(key))) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(reload, 400);
    };
    browser.storage.onChanged.addListener(listener);
    return () => {
      window.clearTimeout(timer);
      browser.storage.onChanged.removeListener(listener);
    };
  }, [reload]);

  const removeEntry = useCallback(
    (key: string) => {
      void annotationRepository.removeEntry(key).then(() => {
        reload();
        toast(t('options.pageDeleted'));
      });
    },
    [reload, t],
  );

  const removeMark = useCallback(
    (pageUrl: string, markId: string) => {
      void annotationRepository.removeMark(pageUrl, markId).then(() => {
        reload();
        toast(t('options.pageDeleted'));
      });
    },
    [reload, t],
  );

  const totalSize = sites ? siteIndexSize(sites) : 0;

  return (
    <Section
      title={t('options.pages')}
      description={
        sites && sites.length > 0
          ? t('options.totalSize', { size: formatBytes(totalSize) })
          : t('options.pagesHint')
      }
    >
      <div className="mb-4">
        <Segmented<ManagerTab>
          aria-label={t('options.pages')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'sites', label: t('options.tabSites'), icon: Globe },
            { value: 'notes', label: t('options.tabNotes'), icon: StickyNote },
            { value: 'text', label: t('options.tabText'), icon: Highlighter },
          ]}
        />
      </div>
      {sites === null ? (
        <ListSkeleton />
      ) : sites.length === 0 ? (
        <EmptyState text={t('options.pagesEmpty')} />
      ) : tab === 'sites' ? (
        <SitesTab sites={sites} onDelete={removeEntry} onDeleteMark={removeMark} />
      ) : tab === 'notes' ? (
        <NotesTab sites={sites} onDelete={removeEntry} />
      ) : (
        <TextTab sites={sites} onDeleteMark={removeMark} />
      )}
    </Section>
  );
}
