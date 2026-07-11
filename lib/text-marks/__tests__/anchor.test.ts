// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { captureRange, resolveQuote } from '../anchor';

function setBody(html: string): void {
  document.body.innerHTML = html;
}

function rangeOver(node: Node, start: number, end: number): Range {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

describe('captureRange', () => {
  beforeEach(() => setBody('<p>The quick brown fox jumps over the lazy dog</p>'));

  it('captures quote with prefix and suffix', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    const anchor = captureRange(rangeOver(textNode, 10, 19));
    expect(anchor).not.toBeNull();
    expect(anchor!.quote).toBe('brown fox');
    expect(anchor!.prefix).toBe('The quick ');
    expect(anchor!.suffix).toBe(' jumps over the lazy dog');
  });

  it('returns null for whitespace-only selection', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    expect(captureRange(rangeOver(textNode, 3, 4))).toBeNull();
  });
});

describe('resolveQuote', () => {
  it('finds the quote after unrelated content changed', () => {
    setBody('<div>Something new above</div><p>The quick brown fox jumps</p>');
    const range = resolveQuote({ quote: 'brown fox', prefix: 'The quick ', suffix: ' jumps' });
    expect(range).not.toBeNull();
    expect(range!.toString()).toBe('brown fox');
  });

  it('finds quote spanning multiple text nodes', () => {
    setBody('<p>The <b>quick brown</b> fox jumps</p>');
    const range = resolveQuote({ quote: 'quick brown fox', prefix: 'The ', suffix: ' jumps' });
    expect(range).not.toBeNull();
    expect(range!.toString()).toBe('quick brown fox');
  });

  it('disambiguates duplicates by context', () => {
    setBody('<p>alpha target beta</p><p>gamma target delta</p>');
    const range = resolveQuote({ quote: 'target', prefix: 'gamma ', suffix: ' delta' });
    expect(range).not.toBeNull();
    const paragraph = range!.startContainer.parentElement;
    expect(paragraph?.textContent).toContain('gamma');
  });

  it('returns null when the quote disappeared', () => {
    setBody('<p>Totally different content</p>');
    expect(resolveQuote({ quote: 'brown fox', prefix: '', suffix: '' })).toBeNull();
  });

  it('finds the quote when whitespace changed after reload', () => {
    setBody('<p>The quick\n   brown fox jumps</p>');
    const range = resolveQuote({ quote: 'quick brown', prefix: 'The ', suffix: ' fox' });
    expect(range).not.toBeNull();
    expect(range!.toString().replace(/\s+/g, ' ')).toBe('quick brown');
  });

  it('finds a quote captured with a newline inside', () => {
    setBody('<p>The quick brown fox jumps</p>');
    const range = resolveQuote({ quote: 'quick\nbrown', prefix: '', suffix: '' });
    expect(range).not.toBeNull();
    expect(range!.toString()).toBe('quick brown');
  });
});
