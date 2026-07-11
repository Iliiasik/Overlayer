import { describe, expect, it } from 'vitest';
import { hexToHsv, hsvToHex } from '../color';

describe('color conversion', () => {
  it('round-trips primary colors', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#1687a7']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it('parses hue correctly', () => {
    expect(hexToHsv('#ff0000').h).toBe(0);
    expect(hexToHsv('#00ff00').h).toBe(120);
    expect(hexToHsv('#0000ff').h).toBe(240);
  });

  it('treats grayscale as zero saturation', () => {
    expect(hexToHsv('#808080').s).toBe(0);
    expect(hexToHsv('#808080').v).toBeCloseTo(0.5, 1);
  });

  it('clamps conversions to valid hex output', () => {
    const hex = hsvToHex({ h: 359.9, s: 1, v: 1 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
