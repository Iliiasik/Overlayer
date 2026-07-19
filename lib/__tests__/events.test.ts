import { describe, expect, it, vi } from 'vitest';
import { isolateEvents } from '../events';

describe('isolateEvents', () => {
  it('stops propagation for every isolated event', () => {
    const handlers = Object.values(isolateEvents);
    expect(handlers).toHaveLength(6);
    for (const handler of handlers) {
      const stopPropagation = vi.fn();
      handler({ stopPropagation } as never);
      expect(stopPropagation).toHaveBeenCalledTimes(1);
    }
  });
});
