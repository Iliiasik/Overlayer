import '@/assets/tailwind.css';
import { MessageType, onMessage, type ExtensionState } from '@/lib/messaging';
import { isAnnotatableUrl, quickKeyForUrl } from '@/lib/storage/page-key';
import { createMarkStore, createNotesStore, type MarkStore } from '@/lib/storage/annotation-store';
import { removeAllMarks, restoreAnnotation, setMarksVisible } from '@/lib/text-marks/marker';
import { createCanvasController } from './canvas-controller';
import { createEdgeDockController } from './edge-dock-controller';
import { createHighlighterController } from './highlighter-controller';

const MARK_RESTORE_RETRY_MS = 1500;

async function restoreMarks(store: MarkStore): Promise<number> {
  await store.ready;
  const marks = store.getSnapshot();
  const unresolved = marks.filter((mark) => !restoreAnnotation(mark));
  if (unresolved.length > 0) {
    window.setTimeout(() => {
      for (const mark of unresolved) restoreAnnotation(mark);
    }, MARK_RESTORE_RETRY_MS);
  }
  return marks.length;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    let markStore = createMarkStore(window.location.href);
    let quickStore = createNotesStore(window.location.href);
    let marksVisible = true;
    const canvas = createCanvasController(ctx, () => quickStore);
    const dock = createEdgeDockController(
      ctx,
      () => markStore,
      () => quickStore,
      {
        openNotes: () => void canvas.toggle(),
        openHighlights: () => void highlighter.togglePanel(),
      },
    );
    const highlighter = createHighlighterController(
      ctx,
      () => markStore,
      (open) => dock.setPanelOpen(open),
    );

    const state = async (): Promise<ExtensionState> => {
      await Promise.all([markStore.ready, quickStore.ready]).catch(() => undefined);
      return {
        canvasOpen: canvas.isOpen(),
        marksVisible,
        markCount: markStore.getSnapshot().length,
        itemCount: quickStore.countItems(),
      };
    };

    onMessage(MessageType.ToggleCanvas, async () => {
      await canvas.toggle();
      return state();
    });
    onMessage(MessageType.ToggleMarks, async () => {
      marksVisible = !marksVisible;
      setMarksVisible(marksVisible, markStore.getSnapshot());
      highlighter.setVisible(marksVisible);
      return state();
    });
    onMessage(MessageType.GetState, state);
    onMessage(MessageType.CreateHighlight, () => highlighter.createFromSelection());

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      if (newUrl.href === markStore.url) return;
      markStore.dispose();
      removeAllMarks();
      markStore = createMarkStore(newUrl.href);
      if (quickKeyForUrl(newUrl.href) !== quickStore.key) {
        quickStore.dispose();
        quickStore = createNotesStore(newUrl.href);
        canvas.close();
      }
      canvas.handleLocationChange();
      highlighter.handleLocationChange();
      dock.handleLocationChange();
      void restoreMarks(markStore).then((markCount) => {
        if (markCount > 0) void highlighter.ensureMounted();
      });
    });

    if (!isAnnotatableUrl(window.location.href)) return;
    const markCount = await restoreMarks(markStore);
    if (markCount > 0) await highlighter.ensureMounted();
    await dock.ensureMounted();
  },
});
