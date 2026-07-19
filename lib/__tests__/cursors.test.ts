import { describe, expect, it } from 'vitest';
import { CURSORS } from '../cursors';

describe('CURSORS', () => {
  it('builds inline svg cursors with hotspots and fallbacks', () => {
    for (const value of Object.values(CURSORS)) {
      expect(value).toMatch(/^url\("data:image\/svg\+xml,/);
    }
    expect(CURSORS.arrow.endsWith('5 3, default')).toBe(true);
    expect(CURSORS.grab.endsWith('12 12, grab')).toBe(true);
    expect(CURSORS.resizeH.endsWith('12 12, ew-resize')).toBe(true);
    expect(CURSORS.resizeD.endsWith('12 12, nwse-resize')).toBe(true);
  });
});
