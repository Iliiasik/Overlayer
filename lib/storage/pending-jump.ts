import { browser } from 'wxt/browser';
import { pageKeyForUrl } from './page-key';

const PENDING_JUMP_KEY = 'pendingJump';
const PENDING_JUMP_TTL_MS = 60_000;

interface PendingJump {
  pageKey: string;
  markId: string;
  createdAt: number;
}

export async function setPendingJump(url: string, markId: string): Promise<void> {
  const jump: PendingJump = { pageKey: pageKeyForUrl(url), markId, createdAt: Date.now() };
  await browser.storage.local.set({ [PENDING_JUMP_KEY]: jump });
}

export async function takePendingJump(url: string): Promise<string | null> {
  const stored = await browser.storage.local.get(PENDING_JUMP_KEY);
  const jump = stored[PENDING_JUMP_KEY] as PendingJump | undefined;
  if (!jump) return null;
  if (Date.now() - jump.createdAt > PENDING_JUMP_TTL_MS) {
    await browser.storage.local.remove(PENDING_JUMP_KEY);
    return null;
  }
  if (jump.pageKey !== pageKeyForUrl(url)) return null;
  await browser.storage.local.remove(PENDING_JUMP_KEY);
  return jump.markId;
}
