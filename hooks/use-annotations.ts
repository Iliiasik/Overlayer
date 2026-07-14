import { useSyncExternalStore } from 'react';
import type { NotePage } from '@/lib/storage/annotation-repository';
import type { NotesStore } from '@/lib/storage/annotation-store';

interface ReadableStore<T> {
  getSnapshot(): T[];
  subscribe(listener: () => void): () => void;
}

export function useAnnotations<T>(store: ReadableStore<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function usePages(store: NotesStore): NotePage[] {
  return useSyncExternalStore(store.subscribe, store.getPages);
}
