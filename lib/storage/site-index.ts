import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { byteSize } from '@/lib/format';
import { annotationRepository, pageItemCount, type NotePage } from './annotation-repository';
import { pageKeyForUrl } from './page-key';

export interface HighlightPageEntry {
  key: string;
  url: string;
  path: string;
  marks: TextMarkAnnotation[];
  sizeBytes: number;
  updatedAt: number;
}

export interface QuickNotesEntry {
  key: string;
  domain: string;
  url: string;
  pages: NotePage[];
  itemCount: number;
  sizeBytes: number;
  updatedAt: number;
}

export interface SiteEntry {
  domain: string;
  url: string;
  notes: QuickNotesEntry | null;
  highlightPages: HighlightPageEntry[];
  markCount: number;
  updatedAt: number;
}

function domainOfOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, '');
    return host || origin;
  } catch {
    return origin;
  }
}

function urlForQuickDomain(domain: string): string {
  if (domain.startsWith('file:')) return `file://${domain.slice('file:'.length)}`;
  return `https://${domain}/`;
}

export function quoteOf(mark: TextMarkAnnotation): string {
  return mark.anchor.text?.quote ?? '';
}

export function siteIndexSize(sites: SiteEntry[]): number {
  return sites.reduce(
    (sum, site) =>
      sum +
      (site.notes?.sizeBytes ?? 0) +
      site.highlightPages.reduce((pages, page) => pages + page.sizeBytes, 0),
    0,
  );
}

export interface DomainMark {
  mark: TextMarkAnnotation;
  url: string;
  path: string;
  currentPage: boolean;
}

export async function listDomainMarks(currentUrl: string): Promise<DomainMark[]> {
  const records = await annotationRepository.listMarkRecords();
  const currentKey = pageKeyForUrl(currentUrl);
  const domain = domainOfOrigin(new URL(currentUrl).origin);
  return records
    .filter(({ record }) => domainOfOrigin(record.origin) === domain)
    .flatMap(({ key, record }) =>
      record.annotations.map((mark) => ({
        mark,
        url: `${record.origin}${record.path}`,
        path: record.path,
        currentPage: key === currentKey,
      })),
    );
}

export async function buildSiteIndex(): Promise<SiteEntry[]> {
  const [quickRecords, markRecords] = await Promise.all([
    annotationRepository.listQuickRecords(),
    annotationRepository.listMarkRecords(),
  ]);
  const sites = new Map<string, SiteEntry>();
  const ensure = (domain: string, url: string): SiteEntry => {
    let entry = sites.get(domain);
    if (!entry) {
      entry = { domain, url, notes: null, highlightPages: [], markCount: 0, updatedAt: 0 };
      sites.set(domain, entry);
    }
    return entry;
  };

  for (const { key, record } of quickRecords) {
    const url = record.origin ? `${record.origin}/` : urlForQuickDomain(record.domain);
    const entry = ensure(record.domain, url);
    entry.notes = {
      key,
      domain: record.domain,
      url,
      pages: record.pages,
      itemCount: pageItemCount(record.pages),
      sizeBytes: byteSize(record),
      updatedAt: record.updatedAt,
    };
    entry.updatedAt = Math.max(entry.updatedAt, record.updatedAt);
  }

  for (const { key, record } of markRecords) {
    const domain = domainOfOrigin(record.origin);
    const entry = ensure(domain, `${record.origin}/`);
    if (entry.url === urlForQuickDomain(entry.domain)) entry.url = `${record.origin}/`;
    entry.highlightPages.push({
      key,
      url: `${record.origin}${record.path}`,
      path: record.path,
      marks: record.annotations,
      sizeBytes: byteSize(record),
      updatedAt: record.updatedAt,
    });
    entry.markCount += record.annotations.length;
    entry.updatedAt = Math.max(entry.updatedAt, record.updatedAt);
  }

  for (const entry of sites.values()) {
    entry.highlightPages.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return [...sites.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
