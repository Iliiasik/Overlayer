import { browser } from 'wxt/browser';
import type { CanvasItem, TextMarkAnnotation } from '@/lib/annotations/types';
import { DEFAULT_CAMERA, type Camera } from '@/lib/canvas/camera';
import { boardKeyForUrl, pageKeyForUrl, quickKeyForUrl } from './page-key';
import {
  annotationRepository,
  type BoardKind,
  type BoardRecord,
  type PageRecord,
} from './annotation-repository';

const SAVE_DEBOUNCE_MS = 500;

interface Persisted {
  schedule(save: () => void): void;
  cancel(): void;
}

function createScheduler(): Persisted {
  let timer: number | undefined;
  return {
    schedule(save) {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, SAVE_DEBOUNCE_MS);
    },
    cancel() {
      window.clearTimeout(timer);
    },
  };
}

type StorageChanges = Record<string, { newValue?: unknown }>;

function watchStorageKey(key: string, onChange: (newValue: unknown) => void): () => void {
  const listener = (changes: StorageChanges, area: string): void => {
    if (area !== 'local' || !(key in changes)) return;
    onChange(changes[key].newValue);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

export interface MarkStore {
  readonly url: string;
  readonly ready: Promise<void>;
  getSnapshot(): TextMarkAnnotation[];
  subscribe(listener: () => void): () => void;
  add(mark: TextMarkAnnotation): void;
  remove(id: string): void;
  patch(id: string, changes: Partial<TextMarkAnnotation>): void;
  dispose(): void;
}

export function createMarkStore(url: string): MarkStore {
  let marks: TextMarkAnnotation[] = [];
  let lastPersisted: string | undefined;
  const listeners = new Set<() => void>();
  const scheduler = createScheduler();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const commit = (next: TextMarkAnnotation[]) => {
    marks = next;
    emit();
    scheduler.schedule(() => {
      lastPersisted = JSON.stringify(marks);
      void annotationRepository.saveMarks(url, marks);
    });
  };

  const ready = annotationRepository.loadMarks(url).then((loaded) => {
    marks = loaded;
    emit();
  });

  const unwatch = watchStorageKey(pageKeyForUrl(url), (newValue) => {
    const record = newValue as PageRecord | undefined;
    const next = (record?.annotations ?? []).filter((a) => a.type === 'textmark');
    const serialized = JSON.stringify(next);
    if (serialized === lastPersisted) return;
    scheduler.cancel();
    lastPersisted = serialized;
    marks = next;
    emit();
  });

  return {
    url,
    ready,
    getSnapshot: () => marks,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(mark) {
      commit([...marks, mark]);
    },
    remove(id) {
      commit(marks.filter((mark) => mark.id !== id));
    },
    patch(id, changes) {
      commit(
        marks.map((mark) =>
          mark.id === id ? { ...mark, ...changes, updatedAt: Date.now() } : mark,
        ),
      );
    },
    dispose() {
      unwatch();
      scheduler.cancel();
      listeners.clear();
    },
  };
}

export interface BoardStore {
  readonly url: string;
  readonly key: string;
  readonly ready: Promise<void>;
  getSnapshot(): CanvasItem[];
  subscribe(listener: () => void): () => void;
  add(item: CanvasItem): void;
  remove(id: string): void;
  patch(id: string, changes: Partial<CanvasItem>): void;
  translate(id: string, dx: number, dy: number): void;
  replace(replacements: Map<string, CanvasItem[]>): void;
  reorder(id: string, place: 'front' | 'back'): void;
  clear(): void;
  getCamera(): Camera;
  setCamera(camera: Camera): void;
  dispose(): void;
}

export function createBoardStore(url: string, kind: BoardKind = 'canvas'): BoardStore {
  const key = kind === 'quick' ? quickKeyForUrl(url) : boardKeyForUrl(url);
  let items: CanvasItem[] = [];
  let camera: Camera = DEFAULT_CAMERA;
  let lastPersisted: string | undefined;
  const listeners = new Set<() => void>();
  const scheduler = createScheduler();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const persist = () =>
    scheduler.schedule(() => {
      lastPersisted = JSON.stringify(items);
      void annotationRepository.saveBoard(url, items, camera, kind);
    });

  const commit = (next: CanvasItem[]) => {
    items = next;
    emit();
    persist();
  };

  const ready = annotationRepository.loadBoard(url, kind).then((loaded) => {
    items = loaded.items;
    camera = loaded.camera;
    emit();
  });

  const unwatch = watchStorageKey(key, (newValue) => {
    const record = newValue as BoardRecord | undefined;
    const next = record?.items ?? [];
    const serialized = JSON.stringify(next);
    if (serialized === lastPersisted) return;
    scheduler.cancel();
    lastPersisted = serialized;
    items = next;
    camera = record?.camera ?? camera;
    emit();
  });

  return {
    url,
    key,
    ready,
    getSnapshot: () => items,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(item) {
      commit([...items, item]);
    },
    remove(id) {
      commit(items.filter((item) => item.id !== id));
    },
    patch(id, changes) {
      commit(
        items.map((item) =>
          item.id === id ? ({ ...item, ...changes, updatedAt: Date.now() } as CanvasItem) : item,
        ),
      );
    },
    translate(id, dx, dy) {
      commit(
        items.map((item) => {
          if (item.id !== id) return item;
          const moved: CanvasItem = {
            ...item,
            position: { x: item.position.x + dx, y: item.position.y + dy },
            updatedAt: Date.now(),
          };
          if (moved.type === 'brush') {
            moved.points = moved.points.map((value, index) =>
              index % 2 === 0 ? value + dx : value + dy,
            );
          }
          if (moved.type === 'arrow') {
            moved.to = { x: moved.to.x + dx, y: moved.to.y + dy };
          }
          return moved;
        }),
      );
    },
    replace(replacements) {
      commit(items.flatMap((item) => replacements.get(item.id) ?? [item]));
    },
    reorder(id, place) {
      const target = items.find((item) => item.id === id);
      if (!target) return;
      const rest = items.filter((item) => item.id !== id);
      commit(place === 'front' ? [...rest, target] : [target, ...rest]);
    },
    clear() {
      commit([]);
    },
    getCamera: () => camera,
    setCamera(next) {
      camera = next;
      if (items.length > 0) persist();
    },
    dispose() {
      unwatch();
      scheduler.cancel();
      listeners.clear();
    },
  };
}
