// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { captureRange, resolveQuote } from '../anchor';

describe('anchor visibility filtering', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves to visible text, not script or hidden duplicates', () => {
    document.body.innerHTML =
      '<script type="application/json">{"title":"Fix palette rendering"}</script>' +
      '<div style="display:none">Fix palette rendering</div>' +
      '<p id="visible">Fix palette rendering</p>';
    const range = resolveQuote({ quote: 'Fix palette rendering', prefix: '', suffix: '' });
    expect(range).not.toBeNull();
    expect(range?.startContainer.parentElement?.closest('#visible')).not.toBeNull();
  });

  it('skips visibility:hidden subtrees', () => {
    document.body.innerHTML =
      '<div style="visibility:hidden">unique snippet</div><p id="real">unique snippet</p>';
    const range = resolveQuote({ quote: 'unique snippet', prefix: '', suffix: '' });
    expect(range?.startContainer.parentElement?.closest('#real')).not.toBeNull();
  });

  it('returns null when the quote only exists in hidden content', () => {
    document.body.innerHTML = '<div style="display:none">ghost text</div><p>other</p>';
    expect(resolveQuote({ quote: 'ghost text', prefix: '', suffix: '' })).toBeNull();
  });

  it('captures context from visible text only', () => {
    document.body.innerHTML = '<div style="display:none">HIDDEN</div><p>alpha beta gamma</p>';
    const textNode = document.querySelector('p')!.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 6);
    range.setEnd(textNode, 10);
    const anchor = captureRange(range);
    expect(anchor?.quote).toBe('beta');
    expect(anchor?.prefix).toBe('alpha ');
    expect(anchor?.suffix).toBe(' gamma');
  });
});
