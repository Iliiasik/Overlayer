import { browser, type PublicPath } from 'wxt/browser';

export const APP_ICON_PATH = '/icon/128.png' as PublicPath;

export function appIconUrl(): string {
  return browser.runtime.getURL(APP_ICON_PATH);
}
