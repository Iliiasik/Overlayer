// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBrushAnnotation,
  createStickyAnnotation,
  createTextMarkAnnotation,
} from '@/lib/annotations/factory';
import { DEFAULT_CAMERA } from '@/lib/canvas/camera';
import { annotationRepository } from '../annotation-repository';
import { createBoardStore, createMarkStore } from '../annotation-store';

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

describe('boardStore', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
  });

  it('loads persisted items and camera on creation', async () => {
    await annotationRepository.saveBoard(URL, [sticky()], { x: 5, y: 6, scale: 2 });
    const store = createBoardStore(URL);
    await store.ready;
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getCamera()).toEqual({ x: 5, y: 6, scale: 2 });
  });

  it('collapses rapid mutations into one save', async () => {
    const save = vi.spyOn(annotationRepository, 'saveBoard');
    const store = createBoardStore(URL);
    await store.ready;
    store.add(sticky());
    store.add(sticky());
    store.setCamera({ x: 1, y: 1, scale: 1 });
    await vi.advanceTimersByTimeAsync(600);
    expect(save).toHaveBeenCalledTimes(1);
    save.mockRestore();
  });

  it('translate moves position, brush points and arrow ends', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    const brush = createBrushAnnotation([0, 0, 10, 10], {
      color: '#000',
      strokeWidth: 3,
      opacity: 1,
    });
    store.add(brush);
    store.translate(brush.id, 5, 7);
    const moved = store.getSnapshot()[0];
    expect(moved.position).toEqual({ x: 5, y: 7 });
    expect(moved.type === 'brush' && moved.points).toEqual([5, 7, 15, 17]);
  });

  it('replace substitutes an item with segments', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    const brush = createBrushAnnotation([0, 0, 10, 10], {
      color: '#000',
      strokeWidth: 3,
      opacity: 1,
    });
    store.add(brush);
    const segment = { ...brush, id: crypto.randomUUID(), points: [0, 0, 4, 4] };
    store.replace(new Map([[brush.id, [segment]]]));
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe(segment.id);
  });

  it('reorder moves an item to the front or back', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    const first = sticky();
    const second = sticky();
    const third = sticky();
    store.add(first);
    store.add(second);
    store.add(third);
    store.reorder(first.id, 'front');
    expect(store.getSnapshot().map((item) => item.id)).toEqual([second.id, third.id, first.id]);
    store.reorder(third.id, 'back');
    expect(store.getSnapshot().map((item) => item.id)).toEqual([third.id, second.id, first.id]);
  });

  it('keeps quick notes separate from the canvas board', async () => {
    const board = createBoardStore(URL);
    const quick = createBoardStore(URL, 'quick');
    await Promise.all([board.ready, quick.ready]);
    board.add(sticky());
    quick.add(sticky());
    quick.add(sticky());
    await vi.advanceTimersByTimeAsync(600);
    expect((await annotationRepository.loadBoard(URL)).items).toHaveLength(1);
    expect((await annotationRepository.loadBoard(URL, 'quick')).items).toHaveLength(2);
    expect(quick.key).not.toBe(board.key);
  });

  it('adopts an external clear from another tab', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    store.add(sticky());
    await vi.advanceTimersByTimeAsync(600);
    const listener = vi.fn();
    store.subscribe(listener);
    await fakeBrowser.storage.local.clear();
    expect(store.getSnapshot()).toHaveLength(0);
    expect(listener).toHaveBeenCalled();
  });

  it('does not clobber local state with its own persisted write', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    store.add(sticky());
    await vi.advanceTimersByTimeAsync(600);
    store.add(sticky());
    expect(store.getSnapshot()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(store.getSnapshot()).toHaveLength(2);
    expect((await annotationRepository.loadBoard(URL)).items).toHaveLength(2);
  });

  it('clear empties the board and deletes the record', async () => {
    const store = createBoardStore(URL);
    await store.ready;
    store.add(sticky());
    await vi.advanceTimersByTimeAsync(600);
    store.clear();
    await vi.advanceTimersByTimeAsync(600);
    expect((await annotationRepository.loadBoard(URL)).items).toHaveLength(0);
    expect(store.getCamera()).toEqual(DEFAULT_CAMERA);
  });
});
