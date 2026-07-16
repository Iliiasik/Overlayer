import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from '../schema';

describe('runMigrations', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('stamps the current schema version', async () => {
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(SCHEMA_VERSION_KEY);
    expect(stored[SCHEMA_VERSION_KEY]).toBe(SCHEMA_VERSION);
  });

  it('leaves existing data untouched', async () => {
    const record = {
      domain: 'example.com',
      pages: [{ id: 'p', title: 't', items: [], createdAt: 1, updatedAt: 1 }],
      updatedAt: 1,
    };
    await fakeBrowser.storage.local.set({ 'quick:example.com': record });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get('quick:example.com');
    expect(stored['quick:example.com']).toEqual(record);
  });

  it('does not rewrite the stamp when already current', async () => {
    await runMigrations();
    await fakeBrowser.storage.local.set({ [SCHEMA_VERSION_KEY]: SCHEMA_VERSION });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(SCHEMA_VERSION_KEY);
    expect(stored[SCHEMA_VERSION_KEY]).toBe(SCHEMA_VERSION);
  });
});
