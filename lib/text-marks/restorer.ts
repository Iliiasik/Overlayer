import type { MarkStore } from '@/lib/storage/annotation-store';
import { isMarkPresent, restoreAnnotations, setMarksVisible } from './marker';

const RESTORE_RETRY_MS = 800;

export interface MarkRestorer {
  start(): Promise<number>;
  dispose(): void;
}

export function createMarkRestorer(store: MarkStore, isVisible: () => boolean): MarkRestorer {
  let observer: MutationObserver | null = null;
  let timer: number | undefined;
  let scheduled = false;
  let disposed = false;
  let unsubscribe: (() => void) | null = null;

  const missing = () => store.getSnapshot().filter((mark) => !isMarkPresent(mark.id));

  const attempt = () => {
    scheduled = false;
    if (disposed) return;
    const restored = restoreAnnotations(missing());
    if (restored > 0 && !isVisible()) setMarksVisible(false, store.getSnapshot());
    sync();
  };

  const schedule = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    timer = window.setTimeout(attempt, RESTORE_RETRY_MS);
  };

  const sync = () => {
    if (disposed) return;
    if (store.getSnapshot().length > 0) {
      if (!observer) {
        observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } else if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  return {
    async start() {
      await store.ready;
      unsubscribe ??= store.subscribe(sync);
      const marks = store.getSnapshot();
      restoreAnnotations(marks);
      sync();
      return marks.length;
    },

    dispose() {
      disposed = true;
      observer?.disconnect();
      observer = null;
      window.clearTimeout(timer);
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}
