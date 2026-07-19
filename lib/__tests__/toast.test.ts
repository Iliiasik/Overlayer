import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, getToasts, subscribeToasts, toast } from '../toast';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const item of [...getToasts()]) dismissToast(item.id);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    toast('saved', { description: 'ok' });
    const [item] = getToasts().slice(-1);
    expect(item?.title).toBe('saved');
    expect(item?.description).toBe('ok');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    toast('again');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('dismisses by id and ignores unknown ids', () => {
    toast('one');
    const [item] = getToasts().slice(-1);
    const id = item?.id ?? -1;
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    dismissToast(999_999);
    expect(listener).not.toHaveBeenCalled();
    dismissToast(id);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getToasts().some((entry) => entry.id === id)).toBe(false);
    unsubscribe();
  });

  it('auto-dismisses after the duration', () => {
    toast('temp');
    const [item] = getToasts().slice(-1);
    const id = item?.id ?? -1;
    vi.advanceTimersByTime(5000);
    expect(getToasts().some((entry) => entry.id === id)).toBe(false);
  });
});
