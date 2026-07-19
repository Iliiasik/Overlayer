// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '@/lib/messaging';
import { takePendingJump } from '@/lib/storage/pending-jump';
import { openTab, openTabToMark, openTabWithNotes } from '../tabs';

const PAGE_URL = 'https://example.com/page';

type TabsCreate = typeof fakeBrowser.tabs.create;
type TabsSendMessage = typeof fakeBrowser.tabs.sendMessage;

describe('tabs', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a plain tab', async () => {
    const create = vi.fn(async () => ({ id: 5 }));
    fakeBrowser.tabs.create = create as unknown as TabsCreate;
    await openTab(PAGE_URL);
    expect(create).toHaveBeenCalledWith({ url: PAGE_URL });
  });

  it('stores a pending jump before opening the tab', async () => {
    fakeBrowser.tabs.create = vi.fn(async () => ({ id: 5 })) as unknown as TabsCreate;
    await openTabToMark(PAGE_URL, 'mark-9');
    expect(await takePendingJump(PAGE_URL)).toBe('mark-9');
  });

  it('sends ToggleCanvas after the notes tab finishes loading', async () => {
    fakeBrowser.tabs.create = vi.fn(async () => ({ id: 7 })) as unknown as TabsCreate;
    const send = vi.fn(async () => undefined);
    fakeBrowser.tabs.sendMessage = send as unknown as TabsSendMessage;
    await openTabWithNotes(PAGE_URL);
    await fakeBrowser.tabs.onUpdated.trigger(3, { status: 'complete' }, {} as never);
    await fakeBrowser.tabs.onUpdated.trigger(7, { status: 'loading' }, {} as never);
    vi.advanceTimersByTime(1000);
    expect(send).not.toHaveBeenCalled();
    await fakeBrowser.tabs.onUpdated.trigger(7, { status: 'complete' }, {} as never);
    vi.advanceTimersByTime(400);
    expect(send).toHaveBeenCalledWith(7, { type: MessageType.ToggleCanvas });
  });

  it('swallows sendMessage failures for tabs without the content script', async () => {
    fakeBrowser.tabs.create = vi.fn(async () => ({ id: 9 })) as unknown as TabsCreate;
    const send = vi.fn(async () => {
      throw new Error('no receiver');
    });
    fakeBrowser.tabs.sendMessage = send as unknown as TabsSendMessage;
    await openTabWithNotes(PAGE_URL);
    await fakeBrowser.tabs.onUpdated.trigger(9, { status: 'complete' }, {} as never);
    await vi.advanceTimersByTimeAsync(400);
    expect(send).toHaveBeenCalledWith(9, { type: MessageType.ToggleCanvas });
  });

  it('does nothing when the created tab has no id', async () => {
    fakeBrowser.tabs.create = vi.fn(async () => ({})) as unknown as TabsCreate;
    const send = vi.fn(async () => undefined);
    fakeBrowser.tabs.sendMessage = send as unknown as TabsSendMessage;
    await openTabWithNotes(PAGE_URL);
    await fakeBrowser.tabs.onUpdated.trigger(1, { status: 'complete' }, {} as never);
    vi.advanceTimersByTime(1000);
    expect(send).not.toHaveBeenCalled();
  });
});
