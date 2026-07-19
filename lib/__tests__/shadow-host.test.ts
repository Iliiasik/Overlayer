// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { pinShadowHost, setShadowHostVisible } from '../shadow-host';

describe('shadow host', () => {
  it('pins the host with important inline styles', () => {
    const host = document.createElement('div');
    pinShadowHost(host, 42);
    expect(host.style.getPropertyValue('position')).toBe('absolute');
    expect(host.style.getPropertyValue('z-index')).toBe('42');
    expect(host.style.getPropertyPriority('z-index')).toBe('important');
    expect(host.hasAttribute('popover')).toBe(false);
  });

  it('promotes the host to a manual popover when supported', () => {
    const host = document.createElement('div');
    host.showPopover = vi.fn();
    pinShadowHost(host, 1);
    expect(host.getAttribute('popover')).toBe('manual');
    expect(host.showPopover).toHaveBeenCalledTimes(1);
  });

  it('drops the popover attribute when showPopover throws', () => {
    const host = document.createElement('div');
    host.showPopover = vi.fn(() => {
      throw new Error('unsupported');
    });
    pinShadowHost(host, 1);
    expect(host.hasAttribute('popover')).toBe(false);
  });

  it('toggles visibility with important priority', () => {
    const host = document.createElement('div');
    setShadowHostVisible(host, false);
    expect(host.style.getPropertyValue('visibility')).toBe('hidden');
    setShadowHostVisible(host, true);
    expect(host.style.getPropertyValue('visibility')).toBe('visible');
    expect(host.style.getPropertyPriority('visibility')).toBe('important');
  });
});
