import { browser } from 'wxt/browser';

export const SCHEMA_VERSION = 3;
export const SCHEMA_VERSION_KEY = 'schemaVersion';

type Migration = () => Promise<void>;

const migrations: Record<number, Migration> = {};

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
