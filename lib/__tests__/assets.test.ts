import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_ICON_PATH, appIconUrl } from '../assets';

describe('appIconUrl', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    fakeBrowser.runtime.getURL = ((path: string) =>
      `chrome-extension://overlayer${path}`) as typeof fakeBrowser.runtime.getURL;
  });

  it('resolves the packaged icon path', () => {
    expect(APP_ICON_PATH).toBe('/icon/128.png');
    expect(appIconUrl()).toBe('chrome-extension://overlayer/icon/128.png');
  });
});
