import { describe, expect, it } from 'vitest';
import { byteSize, formatBytes } from '../format';

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('byteSize', () => {
  it('measures serialized size including multibyte characters', () => {
    expect(byteSize('abc')).toBe(5);
    expect(byteSize({ a: 1 })).toBe(7);
    expect(byteSize('я')).toBeGreaterThan(2);
  });
});
