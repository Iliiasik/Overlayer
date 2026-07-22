import type { i18n } from 'i18next';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { ShadowRootContentScriptUi } from 'wxt/utils/content-script-ui/shadow-root';
import { EdgeDock } from '@/components/edge-dock';
import { ThemeRoot } from '@/components/theme-root';
import { ensureFontFace } from '@/lib/fonts';
import { pinShadowHost } from '@/lib/shadow-host';
import { initI18n } from '@/lib/i18n';
import type { MarkStore, NotesStore } from '@/lib/storage/annotation-store';

const DOCK_Z_INDEX = 2147483645;

export interface EdgeDockActions {
  openNotes(): void;
  openHighlights(): void;
}

export interface EdgeDockController {
  ensureMounted(): Promise<void>;
  setPanelOpen(open: boolean): void;
  handleLocationChange(): void;
}

export function createEdgeDockController(
  ctx: ContentScriptContext,
  getMarkStore: () => MarkStore,
  getNotesStore: () => NotesStore,
  actions: EdgeDockActions,
): EdgeDockController {
  let ui: ShadowRootContentScriptUi<ReactDOM.Root> | null = null;
  let i18nInstance: i18n | null = null;
  let panelOpen = false;

  function render(): void {
    const root = ui?.mounted;
    if (!root || !i18nInstance) return;
    const markStore = getMarkStore();
    root.render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeRoot>
          <EdgeDock
            markStore={markStore}
            notesStore={getNotesStore()}
            panelOpen={panelOpen}
            onOpenNotes={actions.openNotes}
            onOpenHighlights={actions.openHighlights}
          />
        </ThemeRoot>
      </I18nextProvider>,
    );
  }

  return {
    async ensureMounted() {
      if (ui) return;
      ensureFontFace();
      i18nInstance ??= await initI18n();
      ui = await createShadowRootUi(ctx, {
        name: 'overlayer-dock',
        position: 'overlay',
        zIndex: DOCK_Z_INDEX,
        anchor: 'html',
        onMount: (container) => ReactDOM.createRoot(container),
        onRemove: (root) => root?.unmount(),
      });
      ui.mount();
      pinShadowHost(ui.shadowHost, DOCK_Z_INDEX);
      render();
    },

    setPanelOpen(open) {
      if (panelOpen === open) return;
      panelOpen = open;
      render();
    },

    handleLocationChange() {
      render();
    },
  };
}
