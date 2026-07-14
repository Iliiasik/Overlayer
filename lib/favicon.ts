import { browser } from 'wxt/browser';

export function faviconUrl(pageUrl: string, size = 32): string {
  const getUrl = browser.runtime.getURL as (path: string) => string;
  const url = new URL(getUrl('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.toString();
}
