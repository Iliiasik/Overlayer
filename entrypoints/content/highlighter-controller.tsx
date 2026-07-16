import type { i18n } from 'i18next';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import type { ShadowRootContentScriptUi } from 'wxt/utils/content-script-ui/shadow-root';
import { HighlighterApp, type HighlighterHandle } from '@/components/highlighter/highlighter-app';
import { ThemeRoot } from '@/components/theme-root';
import { ensureFontFace } from '@/lib/fonts';
import { pinShadowHost, setShadowHostVisible } from '@/lib/shadow-host';
import { initI18n } from '@/lib/i18n';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import type { MarkStore } from '@/lib/storage/annotation-store';

const HIGHLIGHTER_Z_INDEX = 2147483646;
const HANDLE_WAIT_MS = 500;

export interface HighlighterController {
  ensureMounted(): Promise<void>;
  createFromSelection(): Promise<void>;
  togglePanel(): Promise<void>;
  promptJump(mark: TextMarkAnnotation): Promise<void>;
  setVisible(visible: boolean): void;
  handleLocationChange(): void;
}

export function createHighlighterController(
  ctx: ContentScriptContext,
  getStore: () => MarkStore,
  onPanelChange?: (open: boolean) => void,
): HighlighterController {
  let ui: ShadowRootContentScriptUi<ReactDOM.Root> | null = null;
  let i18nInstance: i18n | null = null;
  let handle: HighlighterHandle | null = null;

  function render(): void {
    const root = ui?.mounted;
    if (!root || !i18nInstance) return;
    const store = getStore();
    root.render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeRoot>
          <HighlighterApp
            key={store.url}
            store={store}
            handleRef={(next) => {
              handle = next;
            }}
            onPanelChange={onPanelChange}
          />
        </ThemeRoot>
      </I18nextProvider>,
    );
  }

  async function ensureMounted(): Promise<void> {
    if (ui) return;
    ensureFontFace();
    i18nInstance ??= await initI18n();
    ui = await createShadowRootUi(ctx, {
      name: 'overlayer-highlighter',
      position: 'overlay',
      zIndex: HIGHLIGHTER_Z_INDEX,
      anchor: 'html',
      onMount: (container) => ReactDOM.createRoot(container),
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
    pinShadowHost(ui.shadowHost, HIGHLIGHTER_Z_INDEX);
    render();
  }

  async function waitForHandle(): Promise<HighlighterHandle | null> {
    const deadline = Date.now() + HANDLE_WAIT_MS;
    while (!handle && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    return handle;
  }

  const selectionListener = () => {
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed) {
      document.removeEventListener('mouseup', selectionListener);
      void ensureMounted();
    }
  };
  ctx.addEventListener(document, 'mouseup', selectionListener);

  return {
    ensureMounted,
    async createFromSelection() {
      await ensureMounted();
      (await waitForHandle())?.createFromSelection();
    },
    async togglePanel() {
      await ensureMounted();
      (await waitForHandle())?.togglePanel();
    },
    async promptJump(mark) {
      await ensureMounted();
      (await waitForHandle())?.promptJump(mark);
    },
    setVisible(visible) {
      if (ui) setShadowHostVisible(ui.shadowHost, visible);
    },
    handleLocationChange() {
      render();
    },
  };
}
