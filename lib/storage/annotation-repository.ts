import { browser } from 'wxt/browser';
import type { CanvasItem, TextMarkAnnotation } from '@/lib/annotations/types';
import { byteSize } from '@/lib/format';
import {
  boardDomainForUrl,
  isNotesKey,
  isQuickKey,
  pageKeyForUrl,
  pagePath,
  quickKeyForUrl,
} from './page-key';

export interface PageRecord {
  origin: string;
  path: string;
  annotations: TextMarkAnnotation[];
  updatedAt: number;
}

export interface NotePage {
  id: string;
  title: string;
  items: CanvasItem[];
  createdAt: number;
  updatedAt: number;
}

export interface QuickRecord {
  domain: string;
  origin?: string;
  pages: NotePage[];
  updatedAt: number;
}

export interface StorageSummary {
  key: string;
  kind: 'marks' | 'quick';
  label: string;
  detail: string;
  annotationCount: number;
  sizeBytes: number;
  updatedAt: number;
}

export function createNotePage(items: CanvasItem[] = []): NotePage {
  const now = Date.now();
  return { id: crypto.randomUUID(), title: '', items, createdAt: now, updatedAt: now };
}

export function pageItemCount(pages: NotePage[]): number {
  return pages.reduce((sum, page) => sum + page.items.length, 0);
}

export function isQuickEmpty(pages: NotePage[]): boolean {
  return pages.every((page) => page.items.length === 0 && page.title.trim() === '');
}

async function read<T>(key: string): Promise<T | null> {
  const stored = await browser.storage.local.get(key);
  return (stored[key] as T | undefined) ?? null;
}

async function write(key: string, record: object, empty: boolean): Promise<void> {
  if (empty) {
    await browser.storage.local.remove(key);
  } else {
    await browser.storage.local.set({ [key]: record });
  }
}

function markSummary(key: string, record: PageRecord): StorageSummary {
  return {
    key,
    kind: 'marks',
    label: record.origin.replace(/^https?:\/\//, ''),
    detail: record.path,
    annotationCount: record.annotations.length,
    sizeBytes: byteSize(record),
    updatedAt: record.updatedAt,
  };
}

function quickSummary(key: string, record: QuickRecord): StorageSummary {
  return {
    key,
    kind: 'quick',
    label: record.domain,
    detail: '',
    annotationCount: pageItemCount(record.pages),
    sizeBytes: byteSize(record),
    updatedAt: record.updatedAt,
  };
}

export const annotationRepository = {
  async loadMarks(url: string): Promise<TextMarkAnnotation[]> {
    const record = await read<PageRecord>(pageKeyForUrl(url));
    return (record?.annotations ?? []).filter((a) => a.type === 'textmark');
  },

  async saveMarks(url: string, marks: TextMarkAnnotation[]): Promise<void> {
    const { origin } = new URL(url);
    const record: PageRecord = {
      origin,
      path: pagePath(url),
      annotations: marks,
      updatedAt: Date.now(),
    };
    await write(pageKeyForUrl(url), record, marks.length === 0);
  },

  async loadQuick(url: string): Promise<NotePage[]> {
    const record = await read<QuickRecord>(quickKeyForUrl(url));
    return record?.pages ?? [];
  },

  async saveQuick(url: string, pages: NotePage[]): Promise<void> {
    const { origin, protocol } = new URL(url);
    const record: QuickRecord = {
      domain: boardDomainForUrl(url),
      origin: protocol === 'file:' ? undefined : origin,
      pages,
      updatedAt: Date.now(),
    };
    await write(quickKeyForUrl(url), record, isQuickEmpty(pages));
  },

  async removeMark(pageUrl: string, markId: string): Promise<void> {
    const marks = await this.loadMarks(pageUrl);
    await this.saveMarks(
      pageUrl,
      marks.filter((mark) => mark.id !== markId),
    );
  },

  async countForUrl(url: string): Promise<number> {
    const [marks, pages] = await Promise.all([this.loadMarks(url), this.loadQuick(url)]);
    return marks.length + pageItemCount(pages);
  },

  async listAll(): Promise<StorageSummary[]> {
    const all = await browser.storage.local.get(null);
    return Object.entries(all)
      .flatMap(([key, value]): StorageSummary[] => {
        if (isQuickKey(key)) return [quickSummary(key, value as QuickRecord)];
        if (isNotesKey(key)) return [markSummary(key, value as PageRecord)];
        return [];
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async listMarkRecords(): Promise<{ key: string; record: PageRecord }[]> {
    const all = await browser.storage.local.get(null);
    return Object.entries(all)
      .filter(([key]) => isNotesKey(key))
      .map(([key, value]) => ({ key, record: value as PageRecord }));
  },

  async listQuickRecords(): Promise<{ key: string; record: QuickRecord }[]> {
    const all = await browser.storage.local.get(null);
    return Object.entries(all)
      .filter(([key]) => isQuickKey(key))
      .map(([key, value]) => ({ key, record: value as QuickRecord }));
  },

  async removeEntry(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  },

  async clearAll(): Promise<void> {
    const all = await browser.storage.local.get(null);
    const keys = Object.keys(all).filter((key) => isNotesKey(key) || isQuickKey(key));
    await browser.storage.local.remove(keys);
  },
};
