import '@/assets/tailwind.css';
import { MessageType, onMessage, type ExtensionState } from '@/lib/messaging';
import { isAnnotatableUrl, quickKeyForUrl } from '@/lib/storage/page-key';
import { createMarkStore, createNotesStore, type MarkStore } from '@/lib/storage/annotation-store';
import { takePendingJump } from '@/lib/storage/pending-jump';
import { removeAllMarks, setMarksVisible } from '@/lib/text-marks/marker';
import { createMarkRestorer } from '@/lib/text-marks/restorer';
import { createCanvasController } from './canvas-controller';
import { createEdgeDockController } from './edge-dock-controller';
import { createHighlighterController, type HighlighterController } from './highlighter-controller';

async function runPendingJump(store: MarkStore, highlighter: HighlighterController): Promise<void> {
  const markId = await takePendingJump(store.url);
  if (!markId) return;
  const mark = store.getSnapshot().find((candidate) => candidate.id === markId);
  if (!mark) return;
  await highlighter.promptJump(mark);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    let markStore = createMarkStore(window.location.href);
    let quickStore = createNotesStore(window.location.href);
    let marksVisible = true;
    let restorer = createMarkRestorer(markStore, () => marksVisible);
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
      restorer.dispose();
      markStore.dispose();
      removeAllMarks();
      markStore = createMarkStore(newUrl.href);
      restorer = createMarkRestorer(markStore, () => marksVisible);
      if (quickKeyForUrl(newUrl.href) !== quickStore.key) {
        quickStore.dispose();
        quickStore = createNotesStore(newUrl.href);
        canvas.close();
      }
      canvas.handleLocationChange();
      highlighter.handleLocationChange();
      dock.handleLocationChange();
      void restorer.start().then((markCount) => {
        if (markCount > 0) void highlighter.ensureMounted();
        void runPendingJump(markStore, highlighter);
      });
    });

    if (!isAnnotatableUrl(window.location.href)) return;
    const markCount = await restorer.start();
    if (markCount > 0) await highlighter.ensureMounted();
    await dock.ensureMounted();
    void runPendingJump(markStore, highlighter);

    window.requestIdleCallback(() => void canvas.prewarm(), { timeout: 2000 });
  },
});
