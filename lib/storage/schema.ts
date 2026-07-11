import { browser } from 'wxt/browser';
import type { PageRecord } from './annotation-repository';
import { isNotesKey } from './page-key';

export const SCHEMA_VERSION = 2;
export const SCHEMA_VERSION_KEY = 'schemaVersion';

type Migration = () => Promise<void>;

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
