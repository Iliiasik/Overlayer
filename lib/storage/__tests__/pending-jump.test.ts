import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { setPendingJump, takePendingJump } from '../pending-jump';

const URL = 'https://example.com/commits?page=2';

describe('pendingJump', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('hands the mark id to the matching page exactly once', async () => {
    await setPendingJump(URL, 'mark-1');
    expect(await takePendingJump(URL)).toBe('mark-1');
    expect(await takePendingJump(URL)).toBeNull();
  });

  it('ignores jumps intended for another page', async () => {
    await setPendingJump(URL, 'mark-1');
    expect(await takePendingJump('https://example.com/other')).toBeNull();
    expect(await takePendingJump(URL)).toBe('mark-1');
  });

  it('expires stale jumps', async () => {
    await fakeBrowser.storage.local.set({
      pendingJump: { pageKey: 'notes:x', markId: 'old', createdAt: Date.now() - 120_000 },
    });
    expect(await takePendingJump(URL)).toBeNull();
    const stored = await fakeBrowser.storage.local.get('pendingJump');
    expect(stored.pendingJump).toBeUndefined();
  });
});
