// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStickyAnnotation, createTextMarkAnnotation } from '@/lib/annotations/factory';
import { annotationRepository, createNotePage } from '../annotation-repository';
import { createMarkStore, createNotesStore } from '../annotation-store';

const URL = 'https://example.com/page';

function mark() {
  return createTextMarkAnnotation(
    { quote: 'quote', prefix: '', suffix: '' },
    { x: 1, y: 2 },
    '#000',
  );
}

function sticky() {
  return createStickyAnnotation({ x: 1, y: 2 }, { color: '#000', strokeWidth: 3, opacity: 1 });
}

describe('markStore', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
  });

  it('loads persisted marks on creation', async () => {
    await annotationRepository.saveMarks(URL, [mark()]);
    const store = createMarkStore(URL);
    await store.ready;
    expect(store.getSnapshot()).toHaveLength(1);
  });

  it('notifies subscribers and persists after the debounce window', async () => {
    const store = createMarkStore(URL);
    await store.ready;
    const listener = vi.fn();
    store.subscribe(listener);
    store.add(mark());
    expect(listener).toHaveBeenCalledTimes(1);
    expect(await annotationRepository.loadMarks(URL)).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(600);
    expect(await annotationRepository.loadMarks(URL)).toHaveLength(1);
  });

  it('patch updates a single mark', async () => {
    const store = createMarkStore(URL);
    await store.ready;
    const annotation = mark();
    store.add(annotation);
    store.patch(annotation.id, { note: 'hello' });
    expect(store.getSnapshot()[0].note).toBe('hello');
  });
});

describe('notesStore', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
  });

  it('starts with a single blank page', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    expect(store.getPages()).toHaveLength(1);
    expect(store.getPages()[0].title).toBe('');
    expect(store.getPages()[0].items).toHaveLength(0);
  });

  it('loads persisted pages on creation', async () => {
    await annotationRepository.saveQuick(URL, [createNotePage([sticky()])]);
    const store = createNotesStore(URL);
    await store.ready;
    expect(store.getPages()).toHaveLength(1);
    expect(store.getPages()[0].items).toHaveLength(1);
  });

  it('migrates a legacy single-board record into one page', async () => {
    await fakeBrowser.storage.local.set({
      'quick:example.com': { domain: 'example.com', items: [sticky()], updatedAt: 7 },
    });
    const store = createNotesStore(URL);
    await store.ready;
    expect(store.getPages()).toHaveLength(1);
    expect(store.getPages()[0].items).toHaveLength(1);
  });

  it('collapses rapid mutations into one save', async () => {
    const save = vi.spyOn(annotationRepository, 'saveQuick');
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    store.addItem(pageId, sticky());
    store.addItem(pageId, sticky());
    store.renamePage(pageId, 'todo');
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(1);
    save.mockRestore();
  });

  it('adds, switches and removes pages', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const first = store.getPages()[0].id;
    store.renamePage(first, 'one');
    const second = store.addPage();
    expect(store.getPages()).toHaveLength(2);
    store.addItem(second, sticky());
    store.removePage(first);
    expect(store.getPages()).toHaveLength(1);
    expect(store.getPages()[0].id).toBe(second);
  });

  it('keeps one blank page after removing the last page', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    store.addItem(pageId, sticky());
    store.removePage(pageId);
    expect(store.getPages()).toHaveLength(1);
    expect(store.getPages()[0].items).toHaveLength(0);
  });

  it('persists titles even without items', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    store.renamePage(store.getPages()[0].id, 'groceries');
    await vi.advanceTimersByTimeAsync(600);
    const pages = await annotationRepository.loadQuick(URL);
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe('groceries');
  });

  it('removes the record when pages are blank', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    store.addItem(pageId, sticky());
    await vi.advanceTimersByTimeAsync(600);
    expect(await annotationRepository.listAll()).toHaveLength(1);
    const itemId = store.getPages()[0].items[0].id;
    store.removeItem(pageId, itemId);
    await vi.advanceTimersByTimeAsync(600);
    expect(await annotationRepository.listAll()).toHaveLength(0);
  });

  it('translate moves the item position', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    const item = sticky();
    store.addItem(pageId, item);
    store.translateItem(pageId, item.id, 5, 7);
    expect(store.getPages()[0].items[0].position).toEqual({ x: 6, y: 9 });
  });

  it('reorder moves an item to the front or back', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    const first = sticky();
    const second = sticky();
    const third = sticky();
    store.addItem(pageId, first);
    store.addItem(pageId, second);
    store.addItem(pageId, third);
    store.reorderItem(pageId, first.id, 'front');
    expect(store.getPages()[0].items.map((item) => item.id)).toEqual([
      second.id,
      third.id,
      first.id,
    ]);
    store.reorderItem(pageId, third.id, 'back');
    expect(store.getPages()[0].items.map((item) => item.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);
  });

  it('counts items across pages', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const first = store.getPages()[0].id;
    store.addItem(first, sticky());
    const second = store.addPage();
    store.addItem(second, sticky());
    store.addItem(second, sticky());
    expect(store.countItems()).toBe(3);
  });

  it('adopts an external clear from another tab', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    store.addItem(store.getPages()[0].id, sticky());
    await vi.advanceTimersByTimeAsync(600);
    const listener = vi.fn();
    store.subscribe(listener);
    await fakeBrowser.storage.local.clear();
    expect(store.countItems()).toBe(0);
    expect(store.getPages()).toHaveLength(1);
    expect(listener).toHaveBeenCalled();
  });

  it('does not clobber local state with its own persisted write', async () => {
    const store = createNotesStore(URL);
    await store.ready;
    const pageId = store.getPages()[0].id;
    store.addItem(pageId, sticky());
    await vi.advanceTimersByTimeAsync(600);
    store.addItem(pageId, sticky());
    expect(store.getPages()[0].items).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(store.getPages()[0].items).toHaveLength(2);
    expect((await annotationRepository.loadQuick(URL))[0].items).toHaveLength(2);
  });
});
