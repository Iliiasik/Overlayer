import { describe, expect, it } from 'vitest';
import { imageUrlFromStrings } from '../images';

describe('imageUrlFromStrings', () => {
  it('prefers the first uri-list entry', () => {
    expect(imageUrlFromStrings('# comment\nhttps://a.com/x.png\nhttps://b.com/y.png', '')).toBe(
      'https://a.com/x.png',
    );
  });

  it('falls back to plain text', () => {
    expect(imageUrlFromStrings('', ' https://a.com/pic.jpg ')).toBe('https://a.com/pic.jpg');
  });

  it('rejects non-http urls and garbage', () => {
    expect(imageUrlFromStrings('data:image/png;base64,AAA', '')).toBeNull();
    expect(imageUrlFromStrings('javascript:alert(1)', '')).toBeNull();
    expect(imageUrlFromStrings('', 'not a url')).toBeNull();
    expect(imageUrlFromStrings('', '')).toBeNull();
  });
});
