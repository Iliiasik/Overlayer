import { browser } from 'wxt/browser';
import { SCHEMA_VERSION } from './schema';

const BACKUP_MARKER = 'overlayer-backup';

interface BackupFile {
  app: typeof BACKUP_MARKER;
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export async function exportData(): Promise<string> {
  const data = await browser.storage.local.get(null);
  const backup: BackupFile = {
    app: BACKUP_MARKER,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importData(json: string): Promise<void> {
  const parsed = JSON.parse(json) as Partial<BackupFile>;
  if (parsed.app !== BACKUP_MARKER || typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('invalid backup file');
  }
  await browser.storage.local.set(parsed.data);
}

export async function clearAllData(): Promise<void> {
  await browser.storage.local.clear();
}
