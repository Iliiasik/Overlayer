import { browser } from 'wxt/browser';
import type { CanvasItem, TextMarkAnnotation } from '@/lib/annotations/types';
import { DEFAULT_CAMERA, type Camera } from '@/lib/canvas/camera';
import { byteSize } from '@/lib/format';
import {
  boardDomainForUrl,
  boardKeyForUrl,
  isBoardKey,
  isNotesKey,
  isQuickKey,
  pageKeyForUrl,
  quickKeyForUrl,
} from './page-key';

export type BoardKind = 'canvas' | 'quick';

export interface PageRecord {
  origin: string;
  path: string;
  annotations: TextMarkAnnotation[];
  updatedAt: number;
}

export interface BoardRecord {
  domain: string;
  items: CanvasItem[];
  camera: Camera;
  updatedAt: number;
}

export interface StorageSummary {
  key: string;
  kind: 'marks' | 'board' | 'quick';
  label: string;
  detail: string;
  annotationCount: number;
  sizeBytes: number;
  updatedAt: number;
}

function boardKeyFor(url: string, kind: BoardKind): string {
  return kind === 'quick' ? quickKeyForUrl(url) : boardKeyForUrl(url);
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

function boardSummary(key: string, kind: 'board' | 'quick', record: BoardRecord): StorageSummary {
  return {
    key,
    kind,
    label: record.domain,
    detail: '',
    annotationCount: record.items.length,
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
    const { origin, pathname, search } = new URL(url);
    const record: PageRecord = {
      origin,
      path: pathname + search,
      annotations: marks,
      updatedAt: Date.now(),
    };
    await write(pageKeyForUrl(url), record, marks.length === 0);
  },

  async loadBoard(
    url: string,
    kind: BoardKind = 'canvas',
  ): Promise<{ items: CanvasItem[]; camera: Camera }> {
    const record = await read<BoardRecord>(boardKeyFor(url, kind));
    return { items: record?.items ?? [], camera: record?.camera ?? DEFAULT_CAMERA };
  },

  async saveBoard(
    url: string,
    items: CanvasItem[],
    camera: Camera,
    kind: BoardKind = 'canvas',
  ): Promise<void> {
    const record: BoardRecord = {
      domain: boardDomainForUrl(url),
      items,
      camera,
      updatedAt: Date.now(),
    };
    await write(boardKeyFor(url, kind), record, items.length === 0);
  },

  async countForUrl(url: string): Promise<number> {
    const [marks, board, quick] = await Promise.all([
      this.loadMarks(url),
      this.loadBoard(url),
      this.loadBoard(url, 'quick'),
    ]);
    return marks.length + board.items.length + quick.items.length;
  },

  async listAll(): Promise<StorageSummary[]> {
    const all = await browser.storage.local.get(null);
    return Object.entries(all)
      .flatMap(([key, value]): StorageSummary[] => {
        if (isBoardKey(key)) return [boardSummary(key, 'board', value as BoardRecord)];
        if (isQuickKey(key)) return [boardSummary(key, 'quick', value as BoardRecord)];
        if (isNotesKey(key)) return [markSummary(key, value as PageRecord)];
        return [];
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async removeEntry(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  },

  async clearAll(): Promise<void> {
    const all = await browser.storage.local.get(null);
    const keys = Object.keys(all).filter(
      (key) => isNotesKey(key) || isBoardKey(key) || isQuickKey(key),
    );
    await browser.storage.local.remove(keys);
  },
};
