// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createStickyAnnotation, createTextMarkAnnotation } from '@/lib/annotations/factory';
import { isMarkPresent, removeAllMarks, restoreAnnotations } from '@/lib/text-marks/marker';
import { annotationRepository, createNotePage } from '../annotation-repository';
import { createNotesStore } from '../annotation-store';
import { buildSiteIndex, listDomainMarks, siteIndexSize, type SiteEntry } from '../site-index';

const DOMAIN_COUNT = 150;
const MARK_PAGES_PER_DOMAIN = 2;

function sticky() {
  return createStickyAnnotation({ x: 10, y: 20 }, { color: '#000', strokeWidth: 0, opacity: 1 });
}

function mark(quote: string) {
  return createTextMarkAnnotation({ quote, prefix: '', suffix: '' }, { x: 0, y: 0 }, '#000');
}

async function measure(run: () => Promise<void> | void): Promise<number> {
  const start = performance.now();
  await run();
  return performance.now() - start;
}

describe('performance', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('handles a thousand quick note items across ten pages', async () => {
    const store = createNotesStore('https://example.com/');
    await store.ready;
    const duration = await measure(() => {
      for (let page = 0; page < 10; page++) {
        const pageId = store.addPage();
        for (let item = 0; item < 100; item++) store.addItem(pageId, sticky());
      }
    });
    expect(store.countItems()).toBe(1000);
    expect(duration).toBeLessThan(2000);
    store.dispose();
  });

  it('translates and reorders items on a large page quickly', async () => {
    const store = createNotesStore('https://example.com/');
    await store.ready;
    const pageId = store.getPages()[0].id;
    const items = Array.from({ length: 500 }, () => sticky());
    for (const item of items) store.addItem(pageId, item);
    const duration = await measure(() => {
      for (const item of items.slice(0, 200)) {
        store.translateItem(pageId, item.id, 1, 1);
      }
      store.reorderItem(pageId, items[0].id, 'front');
    });
    expect(duration).toBeLessThan(1500);
    store.dispose();
  });

  it('builds the site index for hundreds of records quickly', async () => {
    const entries: Record<string, unknown> = {};
    for (let d = 0; d < DOMAIN_COUNT; d++) {
      const domain = `site-${d}.com`;
      entries[`quick:${domain}`] = {
        domain,
        origin: `https://www.${domain}`,
        pages: [
          createNotePage(Array.from({ length: 5 }, () => sticky())),
          createNotePage(Array.from({ length: 5 }, () => sticky())),
        ],
        updatedAt: d,
      };
      for (let p = 0; p < MARK_PAGES_PER_DOMAIN; p++) {
        entries[`notes:https://${domain}:${p}`] = {
          origin: `https://${domain}`,
          path: `/page-${p}`,
          annotations: Array.from({ length: 8 }, (_, i) => mark(`quote ${d} ${p} ${i}`)),
          updatedAt: d,
        };
      }
    }
    await fakeBrowser.storage.local.set(entries);
    let sites: SiteEntry[] = [];
    const duration = await measure(async () => {
      sites = await buildSiteIndex();
    });
    expect(sites).toHaveLength(DOMAIN_COUNT);
    expect(sites[0].markCount).toBe(8 * MARK_PAGES_PER_DOMAIN);
    expect(siteIndexSize(sites)).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000);
  });

  it('lists domain marks across many pages quickly', async () => {
    const entries: Record<string, unknown> = {};
    for (let p = 0; p < 200; p++) {
      entries[`notes:https://example.com:${p}`] = {
        origin: 'https://example.com',
        path: `/article-${p}`,
        annotations: Array.from({ length: 10 }, (_, i) => mark(`quote ${p} ${i}`)),
        updatedAt: p,
      };
    }
    await fakeBrowser.storage.local.set(entries);
    let rows: Awaited<ReturnType<typeof listDomainMarks>> = [];
    const duration = await measure(async () => {
      rows = await listDomainMarks('https://example.com/article-0');
    });
    expect(rows).toHaveLength(2000);
    expect(duration).toBeLessThan(500);
  });

  it('restores a hundred marks on a large document in one pass', { timeout: 20000 }, async () => {
    document.body.innerHTML = Array.from(
      { length: 2000 },
      (_, i) => `<p>Paragraph ${i} with sentence alpha beta gamma delta ${i} epsilon.</p>`,
    ).join('');
    const marks = Array.from({ length: 100 }, (_, i) => {
      const n = i * 20;
      return createTextMarkAnnotation(
        {
          quote: `sentence alpha beta gamma delta ${n}`,
          prefix: `Paragraph ${n} with `,
          suffix: ' epsilon.',
        },
        { x: 0, y: 0 },
        '#000',
      );
    });
    let restored = 0;
    const firstPass = await measure(() => {
      restored = restoreAnnotations(marks);
    });
    expect(restored).toBe(100);
    expect(marks.every((mark) => isMarkPresent(mark.id))).toBe(true);
    expect(firstPass).toBeLessThan(10000);

    const noopPass = await measure(() => {
      expect(restoreAnnotations(marks)).toBe(0);
    });
    expect(noopPass).toBeLessThan(Math.max(500, firstPass / 4));

    removeAllMarks();
    document.body.innerHTML = '';
  });

  it('saves and reloads a heavy quick record quickly', async () => {
    const url = 'https://example.com/';
    const pages = [createNotePage(Array.from({ length: 1500 }, () => sticky()))];
    const duration = await measure(async () => {
      await annotationRepository.saveQuick(url, pages);
      const loaded = await annotationRepository.loadQuick(url);
      expect(loaded[0].items).toHaveLength(1500);
      expect(await annotationRepository.countForUrl(url)).toBe(1500);
    });
    expect(duration).toBeLessThan(1000);
  });
});
