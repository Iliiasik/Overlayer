import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createStickyAnnotation, createTextMarkAnnotation } from '@/lib/annotations/factory';
import { DEFAULT_CAMERA } from '@/lib/canvas/camera';
import { annotationRepository } from '../annotation-repository';

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

  it('shares one board across pages and www variants of a domain', async () => {
    await annotationRepository.saveBoard(URL_A, [sticky()], DEFAULT_CAMERA);
    expect((await annotationRepository.loadBoard(URL_B)).items).toHaveLength(1);
    expect((await annotationRepository.loadBoard('https://other.com/')).items).toHaveLength(0);
  });

  it('persists the board camera', async () => {
    const camera = { x: -120, y: 40, scale: 1.5 };
    await annotationRepository.saveBoard(URL_A, [sticky()], camera);
    expect((await annotationRepository.loadBoard(URL_B)).camera).toEqual(camera);
  });

  it('removes records when the last entry is deleted', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveBoard(URL_A, [sticky()], DEFAULT_CAMERA);
    await annotationRepository.saveMarks(URL_A, []);
    await annotationRepository.saveBoard(URL_A, [], DEFAULT_CAMERA);
    expect(await annotationRepository.listAll()).toHaveLength(0);
  });

  it('counts marks and board items together for a url', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveBoard(URL_A, [sticky(), sticky()], DEFAULT_CAMERA);
    expect(await annotationRepository.countForUrl(URL_A)).toBe(3);
  });

  it('lists boards and mark pages with kinds and sizes', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveBoard(URL_A, [sticky()], DEFAULT_CAMERA);
    const entries = await annotationRepository.listAll();
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.kind).sort()).toEqual(['board', 'marks']);
    expect(entries.find((entry) => entry.kind === 'board')?.label).toBe('example.com');
    for (const entry of entries) {
      expect(entry.sizeBytes).toBeGreaterThan(0);
    }
  });

  it('clearAll removes only note and board records', async () => {
    await annotationRepository.saveMarks(URL_A, [mark()]);
    await annotationRepository.saveBoard(URL_A, [sticky()], DEFAULT_CAMERA);
    await fakeBrowser.storage.local.set({ settings: { theme: 'green' } });
    await annotationRepository.clearAll();
    expect(await annotationRepository.listAll()).toHaveLength(0);
    const kept = await fakeBrowser.storage.local.get('settings');
    expect(kept.settings).toEqual({ theme: 'green' });
  });
});
