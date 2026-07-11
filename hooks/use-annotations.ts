import { useSyncExternalStore } from 'react';

interface ReadableStore<T> {
  getSnapshot(): T[];
  subscribe(listener: () => void): () => void;
}

export function useAnnotations<T>(store: ReadableStore<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
