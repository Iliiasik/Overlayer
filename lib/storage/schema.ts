import { browser } from 'wxt/browser';
import { createNotePage, type PageRecord, type QuickRecord } from './annotation-repository';
import type { CanvasItem } from '@/lib/annotations/types';
import { isBoardKey, isNotesKey, isQuickKey } from './page-key';

export const SCHEMA_VERSION = 3;
export const SCHEMA_VERSION_KEY = 'schemaVersion';

type Migration = () => Promise<void>;

interface LegacyBoardRecord {
  domain: string;
  items?: CanvasItem[];
  pages?: unknown;
  updatedAt: number;
}

const migrations: Record<number, Migration> = {
  2: async () => {
    const all = await browser.storage.local.get(null);
    const removals: string[] = [];
    const updates: Record<string, PageRecord> = {};
    for (const [key, value] of Object.entries(all)) {
      if (!isNotesKey(key)) continue;
      const record = value as PageRecord;
      const marks = (record.annotations ?? []).filter((a) => a.type === 'textmark');
      if (marks.length === 0) {
        removals.push(key);
      } else if (marks.length !== record.annotations.length) {
        updates[key] = { ...record, annotations: marks };
      }
    }
    if (removals.length > 0) await browser.storage.local.remove(removals);
    if (Object.keys(updates).length > 0) await browser.storage.local.set(updates);
  },
  3: async () => {
    const all = await browser.storage.local.get(null);
    const removals = Object.keys(all).filter(isBoardKey);
    const updates: Record<string, QuickRecord> = {};
    for (const [key, value] of Object.entries(all)) {
      if (!isQuickKey(key)) continue;
      const record = value as LegacyBoardRecord;
      if (Array.isArray(record.pages)) continue;
      const items = record.items ?? [];
      if (items.length === 0) {
        removals.push(key);
      } else {
        const page = { ...createNotePage(items), createdAt: record.updatedAt };
        updates[key] = { domain: record.domain, pages: [page], updatedAt: record.updatedAt };
      }
    }
    if (removals.length > 0) await browser.storage.local.remove(removals);
    if (Object.keys(updates).length > 0) await browser.storage.local.set(updates);
  },
};

export async function runMigrations(): Promise<void> {
  const stored = await browser.storage.local.get(SCHEMA_VERSION_KEY);
  const current = typeof stored[SCHEMA_VERSION_KEY] === 'number' ? stored[SCHEMA_VERSION_KEY] : 0;
  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    await migrations[version]?.();
  }
  if (current !== SCHEMA_VERSION) {
    await browser.storage.local.set({ [SCHEMA_VERSION_KEY]: SCHEMA_VERSION });
  }
}
