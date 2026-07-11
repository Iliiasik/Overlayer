import { describe, expect, it } from 'vitest';
import { isExternalUrl, normalizeUrl } from '../url';

describe('normalizeUrl', () => {
  it('accepts plain https urls', () => {
    expect(normalizeUrl('https://example.com/page')).toBe('https://example.com/page');
  });

  it('prepends https to bare domains', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
  });

  it('rejects empty input', () => {
    expect(normalizeUrl('   ')).toBeNull();
  });

  it('rejects non-http schemes', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeUrl('chrome://settings')).toBeNull();
  });

  it('rejects invalid urls', () => {
    expect(normalizeUrl('https://')).toBeNull();
  });
});

describe('isExternalUrl', () => {
  it('detects same origin', () => {
    expect(isExternalUrl('https://example.com/other', 'https://example.com')).toBe(false);
  });

  it('detects different origin', () => {
    expect(isExternalUrl('https://evil.com', 'https://example.com')).toBe(true);
  });

  it('treats malformed urls as external', () => {
    expect(isExternalUrl('not a url', 'https://example.com')).toBe(true);
  });
});
