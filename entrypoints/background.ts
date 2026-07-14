import { browser } from 'wxt/browser';
import { MessageType, sendToActiveTab } from '@/lib/messaging';
import { annotationRepository } from '@/lib/storage/annotation-repository';
import { isAnnotatableUrl, isNotesKey, isQuickKey } from '@/lib/storage/page-key';
import { runMigrations } from '@/lib/storage/schema';
import { settingsRepository } from '@/lib/storage/settings-repository';

const TOGGLE_CANVAS_COMMAND = 'toggle-canvas';
const VISIBILITY_COMMAND = 'toggle-visibility';
const HIGHLIGHT_MENU_ID = 'overlayer-highlight';
const NOTES_MENU_ID = 'overlayer-notes';
const MENU_URL_PATTERNS = ['http://*/*', 'https://*/*', 'file:///*'];

async function refreshBadge(tabId: number, url: string | undefined): Promise<void> {
  const count = isAnnotatableUrl(url) ? await annotationRepository.countForUrl(url) : 0;
  await browser.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' });
}

async function refreshActiveTabBadge(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) await refreshBadge(tab.id, tab.url);
}

async function rebuildContextMenus(): Promise<void> {
  const settings = await settingsRepository.get();
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({
    id: HIGHLIGHT_MENU_ID,
    title: browser.i18n.getMessage('contextHighlight'),
    contexts: ['selection'],
    documentUrlPatterns: MENU_URL_PATTERNS,
  });
  if (settings.notesContextMenu) {
    browser.contextMenus.create({
      id: NOTES_MENU_ID,
      title: browser.i18n.getMessage('contextNotes'),
      contexts: ['page'],
      documentUrlPatterns: MENU_URL_PATTERNS,
    });
  }
}

export default defineBackground(() => {
  void runMigrations();
  void browser.action.setBadgeBackgroundColor({ color: '#1687a7' });

  browser.runtime.onInstalled.addListener(() => {
    void rebuildContextMenus().catch(() => undefined);
  });

  settingsRepository.onChanged(() => {
    void rebuildContextMenus().catch(() => undefined);
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (tab?.id == null) return;
    if (info.menuItemId === HIGHLIGHT_MENU_ID) {
      void browser.tabs
        .sendMessage(tab.id, { type: MessageType.CreateHighlight })
        .catch(() => undefined);
    }
    if (info.menuItemId === NOTES_MENU_ID) {
      void browser.tabs
        .sendMessage(tab.id, { type: MessageType.ToggleCanvas })
        .catch(() => undefined);
    }
  });

  browser.commands.onCommand.addListener((command) => {
    if (command === TOGGLE_CANVAS_COMMAND) {
      void sendToActiveTab({ type: MessageType.ToggleCanvas }).catch(() => undefined);
    }
    if (command === VISIBILITY_COMMAND) {
      void sendToActiveTab({ type: MessageType.ToggleMarks }).catch(() => undefined);
    }
  });

  browser.tabs.onActivated.addListener(({ tabId }) => {
    void browser.tabs
      .get(tabId)
      .then((tab) => refreshBadge(tabId, tab.url))
      .catch(() => undefined);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      void refreshBadge(tabId, tab.url).catch(() => undefined);
    }
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (
      area === 'local' &&
      Object.keys(changes).some((key) => isNotesKey(key) || isQuickKey(key))
    ) {
      void refreshActiveTabBadge().catch(() => undefined);
    }
  });
});
