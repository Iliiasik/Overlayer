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
