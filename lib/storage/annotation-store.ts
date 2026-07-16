import { browser } from 'wxt/browser';
import type { CanvasItem, TextMarkAnnotation } from '@/lib/annotations/types';
import { quickKeyForUrl, pageKeyForUrl } from './page-key';
import {
  annotationRepository,
  createNotePage,
  pageItemCount,
  type NotePage,
  type PageRecord,
  type QuickRecord,
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

export interface NotesStore {
  readonly url: string;
  readonly key: string;
  readonly ready: Promise<void>;
  getPages(): NotePage[];
  subscribe(listener: () => void): () => void;
  countItems(): number;
  addPage(): string;
  removePage(pageId: string): void;
  renamePage(pageId: string, title: string): void;
  addItem(pageId: string, item: CanvasItem): void;
  removeItem(pageId: string, itemId: string): void;
  patchItem(pageId: string, itemId: string, changes: Partial<CanvasItem>): void;
  translateItem(pageId: string, itemId: string, dx: number, dy: number): void;
  reorderItem(pageId: string, itemId: string, place: 'front' | 'back'): void;
  dispose(): void;
}

function withBlankPage(pages: NotePage[]): NotePage[] {
  return pages.length > 0 ? pages : [createNotePage()];
}

export function createNotesStore(url: string): NotesStore {
  const key = quickKeyForUrl(url);
  let pages: NotePage[] = withBlankPage([]);
  let lastPersisted: string | undefined;
  const listeners = new Set<() => void>();
  const scheduler = createScheduler();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const commit = (next: NotePage[]) => {
    pages = withBlankPage(next);
    emit();
    scheduler.schedule(() => {
      lastPersisted = JSON.stringify(pages);
      void annotationRepository.saveQuick(url, pages);
    });
  };

  const patchPage = (pageId: string, mutate: (page: NotePage) => NotePage) => {
    commit(
      pages.map((page) => (page.id === pageId ? { ...mutate(page), updatedAt: Date.now() } : page)),
    );
  };

  const mapItems = (pageId: string, mapper: (items: CanvasItem[]) => CanvasItem[]) => {
    patchPage(pageId, (page) => ({ ...page, items: mapper(page.items) }));
  };

  const ready = annotationRepository.loadQuick(url).then((loaded) => {
    pages = withBlankPage(loaded);
    emit();
  });

  const unwatch = watchStorageKey(key, (newValue) => {
    const next = (newValue as QuickRecord | undefined)?.pages ?? [];
    const serialized = JSON.stringify(next);
    if (serialized === lastPersisted) return;
    scheduler.cancel();
    lastPersisted = serialized;
    pages = withBlankPage(next);
    emit();
  });

  return {
    url,
    key,
    ready,
    getPages: () => pages,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    countItems: () => pageItemCount(pages),
    addPage() {
      const page = createNotePage();
      commit([...pages, page]);
      return page.id;
    },
    removePage(pageId) {
      commit(pages.filter((page) => page.id !== pageId));
    },
    renamePage(pageId, title) {
      patchPage(pageId, (page) => ({ ...page, title }));
    },
    addItem(pageId, item) {
      mapItems(pageId, (items) => [...items, item]);
    },
    removeItem(pageId, itemId) {
      mapItems(pageId, (items) => items.filter((item) => item.id !== itemId));
    },
    patchItem(pageId, itemId, changes) {
      mapItems(pageId, (items) =>
        items.map((item) =>
          item.id === itemId
            ? ({ ...item, ...changes, updatedAt: Date.now() } as CanvasItem)
            : item,
        ),
      );
    },
    translateItem(pageId, itemId, dx, dy) {
      mapItems(pageId, (items) =>
        items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                position: { x: item.position.x + dx, y: item.position.y + dy },
                updatedAt: Date.now(),
              }
            : item,
        ),
      );
    },
    reorderItem(pageId, itemId, place) {
      mapItems(pageId, (items) => {
        const target = items.find((item) => item.id === itemId);
        if (!target) return items;
        const rest = items.filter((item) => item.id !== itemId);
        return place === 'front' ? [...rest, target] : [target, ...rest];
      });
    },
    dispose() {
      unwatch();
      scheduler.cancel();
      listeners.clear();
    },
  };
}
