import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createStickyAnnotation, createTextMarkAnnotation } from '@/lib/annotations/factory';
import { annotationRepository, createNotePage } from '../annotation-repository';

const URL_A = 'https://www.example.com/articles/1';
const URL_B = 'https://example.com/articles/2';

function mark() {
  return createTextMarkAnnotation(
    { quote: 'quote', prefix: 'pre', suffix: 'post' },
    { x: 10, y: 20 },
    '#000',
  );
}

function sticky() {
  return createStickyAnnotation({ x: 10, y: 20 }, { color: '#000', strokeWidth: 3, opacity: 1 });
}

describe('annotationRepository', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('saves and loads marks for an exact url', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    expect(await annotationRepository.loadMarks(URL_A)).toHaveLength(1);
    expect(await annotationRepository.loadMarks(URL_B)).toHaveLength(0);
  });

  it('shares quick pages across paths and www variants of a domain', async () => {
    await annotationRepository.saveQuick(URL_A, [createNotePage([sticky()])]);
    expect(await annotationRepository.loadQuick(URL_B)).toHaveLength(1);
    expect(await annotationRepository.loadQuick('https://other.com/')).toHaveLength(0);
  });

  it('keeps page titles and order', async () => {
    const first = { ...createNotePage([sticky()]), title: 'first' };
    const second = { ...createNotePage(), title: 'second' };
    await annotationRepository.saveQuick(URL_A, [first, second]);
    const pages = await annotationRepository.loadQuick(URL_A);
    expect(pages.map((page) => page.title)).toEqual(['first', 'second']);
  });

  it('removes records when the last entry is deleted', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveQuick(URL_A, [createNotePage([sticky()])]);
    await annotationRepository.saveMarks(URL_A, []);
    await annotationRepository.saveQuick(URL_A, [createNotePage()]);
    expect(await annotationRepository.listAll()).toHaveLength(0);
  });

  it('keeps records whose pages have only a title', async () => {
    await annotationRepository.saveQuick(URL_A, [{ ...createNotePage(), title: 'plans' }]);
    expect(await annotationRepository.listAll()).toHaveLength(1);
  });

  it('counts marks and quick items together for a url', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveQuick(URL_A, [
      createNotePage([sticky()]),
      createNotePage([sticky()]),
    ]);
    expect(await annotationRepository.countForUrl(URL_A)).toBe(3);
  });

  it('lists quick and mark records with kinds and sizes', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveQuick(URL_A, [createNotePage([sticky()])]);
    const entries = await annotationRepository.listAll();
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.kind).sort()).toEqual(['marks', 'quick']);
    expect(entries.find((entry) => entry.kind === 'quick')?.label).toBe('example.com');
    for (const entry of entries) {
      expect(entry.sizeBytes).toBeGreaterThan(0);
    }
  });

  it('lists full mark records for search', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    const records = await annotationRepository.listMarkRecords();
    expect(records).toHaveLength(1);
    expect(records[0].record.annotations[0].anchor.text?.quote).toBe('quote');
  });

  it('clearAll removes only note and quick records', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveQuick(URL_A, [createNotePage([sticky()])]);
    await fakeBrowser.storage.local.set({ settings: { theme: 'green' } });
    await annotationRepository.clearAll();
    expect(await annotationRepository.listAll()).toHaveLength(0);
    const kept = await fakeBrowser.storage.local.get('settings');
    expect(kept.settings).toEqual({ theme: 'green' });
  });
});
