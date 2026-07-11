import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllData, exportData, importData } from '../backup';

describe('backup', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('round-trips storage through export and import', async () => {
    await fakeBrowser.storage.local.set({ 'notes:https://a.com:1': { annotations: [] } });
    const json = await exportData();
    await clearAllData();
    await importData(json);
    const restored = await fakeBrowser.storage.local.get(null);
    expect(restored['notes:https://a.com:1']).toEqual({ annotations: [] });
  });

  it('rejects foreign json files', async () => {
    await expect(importData('{"foo":"bar"}')).rejects.toThrow();
    await expect(importData('[]')).rejects.toThrow();
    await expect(importData('not json')).rejects.toThrow();
  });

  it('includes app marker and schema version in exports', async () => {
    const parsed = JSON.parse(await exportData());
    expect(parsed.app).toBe('overlayer-backup');
    expect(typeof parsed.schemaVersion).toBe('number');
    expect(parsed.exportedAt).toBeTruthy();
  });
});
