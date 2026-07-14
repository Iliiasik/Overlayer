import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTextMarkAnnotation } from '@/lib/annotations/factory';
import { pageKeyForUrl } from '../page-key';
import { runMigrations, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from '../schema';

const URL = 'https://example.com/page';

describe('runMigrations', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('stamps the current schema version', async () => {
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(SCHEMA_VERSION_KEY);
    expect(stored[SCHEMA_VERSION_KEY]).toBe(SCHEMA_VERSION);
  });

  it('drops legacy drawing annotations and keeps text marks', async () => {
    const mark = createTextMarkAnnotation(
      { quote: 'q', prefix: '', suffix: '' },
      { x: 0, y: 0 },
      '#000',
    );
    const key = pageKeyForUrl(URL);
    await fakeBrowser.storage.local.set({
      [key]: {
        origin: 'https://example.com',
        path: '/page',
        annotations: [mark, { id: 'old', type: 'brush', points: [0, 0, 1, 1] }],
        updatedAt: 1,
      },
    });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(key);
    const record = stored[key] as { annotations: unknown[] };
    expect(record.annotations).toHaveLength(1);
  });

  it('removes records left without marks', async () => {
    const key = pageKeyForUrl(URL);
    await fakeBrowser.storage.local.set({
      [key]: {
        origin: 'https://example.com',
        path: '/page',
        annotations: [{ id: 'old', type: 'sticky', text: 'x' }],
        updatedAt: 1,
      },
    });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(key);
    expect(stored[key]).toBeUndefined();
  });

  it('converts legacy quick boards into pages', async () => {
    await fakeBrowser.storage.local.set({
      'quick:example.com': {
        domain: 'example.com',
        items: [{ id: 'a', type: 'sticky', text: 'x', position: { x: 0, y: 0 } }],
        camera: { x: 0, y: 0, scale: 1 },
        updatedAt: 42,
      },
    });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get('quick:example.com');
    const record = stored['quick:example.com'] as {
      pages: { title: string; items: unknown[]; createdAt: number }[];
      items?: unknown;
    };
    expect(record.items).toBeUndefined();
    expect(record.pages).toHaveLength(1);
    expect(record.pages[0].title).toBe('');
    expect(record.pages[0].items).toHaveLength(1);
    expect(record.pages[0].createdAt).toBe(42);
  });

  it('drops empty legacy quick records and dead board records', async () => {
    await fakeBrowser.storage.local.set({
      'quick:empty.com': { domain: 'empty.com', items: [], updatedAt: 1 },
      'board:example.com': { domain: 'example.com', items: [{ id: 'a' }], updatedAt: 1 },
    });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(null);
    expect(stored['quick:empty.com']).toBeUndefined();
    expect(stored['board:example.com']).toBeUndefined();
  });

  it('leaves already-migrated quick records untouched', async () => {
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

  it('does not run migrations twice', async () => {
    await runMigrations();
    const key = pageKeyForUrl(URL);
    await fakeBrowser.storage.local.set({
      [key]: {
        origin: 'https://example.com',
        path: '/page',
        annotations: [{ id: 'old', type: 'sticky', text: 'x' }],
        updatedAt: 1,
      },
    });
    await runMigrations();
    const stored = await fakeBrowser.storage.local.get(key);
    expect(stored[key]).toBeDefined();
  });
});
