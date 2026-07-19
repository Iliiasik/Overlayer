// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureFontFace } from '../fonts';

describe('ensureFontFace', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    fakeBrowser.runtime.getURL = ((path: string) =>
      `chrome-extension://overlayer${path}`) as typeof fakeBrowser.runtime.getURL;
    document.getElementById('overlayer-font')?.remove();
  });

  it('injects all Raleway faces exactly once', () => {
    ensureFontFace();
    ensureFontFace();
    const styles = document.querySelectorAll('#overlayer-font');
    expect(styles).toHaveLength(1);
    const css = styles[0].textContent ?? '';
    expect(css.match(/@font-face/g)).toHaveLength(6);
    expect(css).toContain("font-family:'Raleway'");
    expect(css).toContain('chrome-extension://overlayer/fonts/Raleway-BoldItalic.woff2');
  });
});
