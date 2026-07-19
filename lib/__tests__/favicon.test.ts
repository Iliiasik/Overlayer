import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { faviconUrl } from '../favicon';

describe('faviconUrl', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    fakeBrowser.runtime.getURL = ((path: string) =>
      `chrome-extension://overlayer${path}`) as typeof fakeBrowser.runtime.getURL;
  });

  it('builds the favicon endpoint with page url and default size', () => {
    const url = new URL(faviconUrl('https://ebay.com/'));
    expect(url.pathname).toBe('/_favicon/');
    expect(url.searchParams.get('pageUrl')).toBe('https://ebay.com/');
    expect(url.searchParams.get('size')).toBe('32');
  });

  it('honours a custom size', () => {
    const url = new URL(faviconUrl('https://github.com/', 16));
    expect(url.searchParams.get('size')).toBe('16');
  });
});
