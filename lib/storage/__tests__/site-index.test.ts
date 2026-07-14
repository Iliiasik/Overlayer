import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createStickyAnnotation, createTextMarkAnnotation } from '@/lib/annotations/factory';
import { annotationRepository, createNotePage } from '../annotation-repository';
import { buildSiteIndex, listDomainMarks, marksMatching, siteIndexSize } from '../site-index';

function mark(quote: string) {
  return createTextMarkAnnotation({ quote, prefix: '', suffix: '' }, { x: 0, y: 0 }, '#000');
}

function sticky() {
  return createStickyAnnotation({ x: 0, y: 0 }, { color: '#000', strokeWidth: 0, opacity: 1 });
}

describe('buildSiteIndex', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('groups quick notes and highlight pages under one domain', async () => {
    await annotationRepository.saveQuick('https://www.example.com/a', [createNotePage([sticky()])]);
    await annotationRepository.saveMarks('https://example.com/articles/1', [mark('alpha')]);
    await annotationRepository.saveMarks('https://example.com/articles/2', [
      mark('beta'),
      mark('gamma'),
    ]);
    const sites = await buildSiteIndex();
    expect(sites).toHaveLength(1);
    const site = sites[0];
    expect(site.domain).toBe('example.com');
    expect(site.notes?.itemCount).toBe(1);
    expect(site.highlightPages).toHaveLength(2);
    expect(site.markCount).toBe(3);
  });

  it('keeps the real origin with www for favicons', async () => {
    await annotationRepository.saveQuick('https://www.example.com/a', [createNotePage([sticky()])]);
    const sites = await buildSiteIndex();
    expect(sites[0].url).toBe('https://www.example.com/');
  });

  it('upgrades a legacy synthetic url from a mark record origin', async () => {
    await fakeBrowser.storage.local.set({
      'quick:example.com': {
        domain: 'example.com',
        pages: [{ id: 'p', title: 't', items: [], createdAt: 1, updatedAt: 1 }],
        updatedAt: 1,
      },
    });
    await annotationRepository.saveMarks('https://www.example.com/a', [mark('x')]);
    const sites = await buildSiteIndex();
    expect(sites[0].url).toBe('https://www.example.com/');
  });

  it('keeps different domains separate', async () => {
    await annotationRepository.saveMarks('https://one.com/a', [mark('x')]);
    await annotationRepository.saveMarks('https://two.com/a', [mark('y')]);
    const sites = await buildSiteIndex();
    expect(sites.map((site) => site.domain).sort()).toEqual(['one.com', 'two.com']);
  });

  it('sums record sizes', async () => {
    await annotationRepository.saveQuick('https://example.com/', [createNotePage([sticky()])]);
    await annotationRepository.saveMarks('https://example.com/a', [mark('x')]);
    const sites = await buildSiteIndex();
    expect(siteIndexSize(sites)).toBeGreaterThan(0);
  });
});

describe('marksMatching', () => {
  it('filters by quote text, case-insensitive', () => {
    const marks = [mark('Hello World'), mark('other')];
    expect(marksMatching(marks, 'hello')).toHaveLength(1);
    expect(marksMatching(marks, '')).toHaveLength(2);
    expect(marksMatching(marks, 'nothing')).toHaveLength(0);
  });
});

describe('listDomainMarks', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns marks for every page of the current domain', async () => {
    await annotationRepository.saveMarks('https://example.com/a', [mark('on a')]);
    await annotationRepository.saveMarks('https://www.example.com/b', [mark('on b')]);
    await annotationRepository.saveMarks('https://other.com/c', [mark('elsewhere')]);
    const rows = await listDomainMarks('https://example.com/a');
    expect(rows).toHaveLength(2);
    const current = rows.find((row) => row.currentPage);
    expect(current?.mark.anchor.text?.quote).toBe('on a');
    const other = rows.find((row) => !row.currentPage);
    expect(other?.path).toBe('/b');
  });
});
