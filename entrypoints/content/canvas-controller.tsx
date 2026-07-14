import type { i18n } from 'i18next';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { ShadowRootContentScriptUi } from 'wxt/utils/content-script-ui/shadow-root';
import { CanvasApp } from '@/components/canvas/canvas-app';
import { ThemeRoot } from '@/components/theme-root';
import { ensureFontFace } from '@/lib/fonts';
import { pinShadowHost } from '@/lib/shadow-host';
import { initI18n } from '@/lib/i18n';
import type { NotesStore } from '@/lib/storage/annotation-store';

const CANVAS_Z_INDEX = 2147483647;

export interface CanvasController {
  toggle(): Promise<void>;
  close(): void;
  isOpen(): boolean;
  handleLocationChange(): void;
}

export function createCanvasController(
  ctx: ContentScriptContext,
  getStore: () => NotesStore,
): CanvasController {
  let ui: ShadowRootContentScriptUi<ReactDOM.Root> | null = null;
  let i18nInstance: i18n | null = null;
  let open = false;

  function render(): void {
    const root = ui?.mounted;
    if (!root || !i18nInstance) return;
    const store = getStore();
    root.render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeRoot>
          <CanvasApp key={store.key} store={store} open={open} onClose={() => setOpen(false)} />
        </ThemeRoot>
      </I18nextProvider>,
    );
  }

  function setOpen(next: boolean): void {
    open = next;
    render();
  }

  async function ensureMounted(): Promise<void> {
    if (ui) return;
    ensureFontFace();
    i18nInstance ??= await initI18n();
    ui = await createShadowRootUi(ctx, {
      name: 'overlayer-canvas',
      position: 'overlay',
      zIndex: CANVAS_Z_INDEX,
      anchor: 'html',
      onMount: (container) => ReactDOM.createRoot(container),
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
    pinShadowHost(ui.shadowHost, CANVAS_Z_INDEX);
    render();
  }

  return {
    async toggle() {
      if (!ui) {
        await ensureMounted();
        window.requestAnimationFrame(() => setOpen(true));
        return;
      }
      setOpen(!open);
    },

    close() {
      if (open) setOpen(false);
    },

    isOpen: () => open,

    handleLocationChange() {
      render();
    },
  };
}
