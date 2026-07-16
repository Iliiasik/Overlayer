import { browser } from 'wxt/browser';
import { MessageType } from './messaging';
import { setPendingJump } from './storage/pending-jump';

const OPEN_NOTES_DELAY_MS = 400;

export async function openTab(url: string): Promise<void> {
  await browser.tabs.create({ url });
}

export async function openTabToMark(url: string, markId: string): Promise<void> {
  await setPendingJump(url, markId);
  await openTab(url);
}

export async function openTabWithNotes(url: string): Promise<void> {
  const tab = await browser.tabs.create({ url });
  const tabId = tab.id;
  if (tabId == null) return;
  const listener = (updatedId: number, changeInfo: { status?: string }) => {
    if (updatedId !== tabId || changeInfo.status !== 'complete') return;
    browser.tabs.onUpdated.removeListener(listener);
    window.setTimeout(() => {
      void browser.tabs
        .sendMessage(tabId, { type: MessageType.ToggleCanvas })
        .catch(() => undefined);
    }, OPEN_NOTES_DELAY_MS);
  };
  browser.tabs.onUpdated.addListener(listener);
}
