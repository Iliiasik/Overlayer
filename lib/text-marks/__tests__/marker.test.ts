// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createTextMarkAnnotation } from '@/lib/annotations/factory';
import type { TextMarkAnnotation } from '@/lib/annotations/types';
import {
  isMarkPresent,
  markIdAt,
  unwrapAnnotation,
  updateAnnotationStyle,
  wrapAnnotation,
} from '../marker';

function mark(): TextMarkAnnotation {
  return createTextMarkAnnotation(
    { quote: 'quick brown', prefix: 'The ', suffix: ' fox' },
    { x: 0, y: 0 },
    '#1687a7',
  );
}

function rangeOver(node: Node, start: number, end: number): Range {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

describe('marker', () => {
  beforeEach(() => {
    document.body.innerHTML = '<p>The quick brown fox jumps</p>';
  });

  it('wraps a single text node range', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    const annotation = mark();
    expect(wrapAnnotation(annotation, rangeOver(textNode, 4, 15))).toBe(true);
    const element = document.querySelector('overlayer-mark') as HTMLElement;
    expect(element.textContent).toBe('quick brown');
    expect(element.dataset.ovlId).toBe(annotation.id);
    expect(document.body.textContent).toBe('The quick brown fox jumps');
  });

  it('wraps ranges spanning multiple text nodes', () => {
    document.body.innerHTML = '<p>The <b>quick</b> brown fox</p>';
    const annotation = mark();
    const range = document.createRange();
    range.setStart(document.querySelector('b')!.firstChild!, 0);
    range.setEnd(document.querySelector('b')!.nextSibling!, 6);
    expect(wrapAnnotation(annotation, range)).toBe(true);
    expect(document.querySelectorAll('overlayer-mark')).toHaveLength(2);
    expect(document.body.textContent).toBe('The quick brown fox');
  });

  it('unwraps marks and restores original text structure', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    const annotation = mark();
    wrapAnnotation(annotation, rangeOver(textNode, 4, 15));
    unwrapAnnotation(annotation.id);
    expect(document.querySelector('overlayer-mark')).toBeNull();
    expect(document.body.textContent).toBe('The quick brown fox jumps');
    expect(isMarkPresent(annotation.id)).toBe(false);
  });

  it('applies style updates to existing marks', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    const annotation = mark();
    wrapAnnotation(annotation, rangeOver(textNode, 4, 15));
    updateAnnotationStyle({ ...annotation, bold: true, italic: true, note: 'hi' });
    const element = document.querySelector('overlayer-mark') as HTMLElement;
    expect(element.style.fontWeight).toBe('700');
    expect(element.style.fontStyle).toBe('italic');
    expect(element.style.textDecoration).toContain('dotted');
  });

  it('resolves the annotation id from a click target', () => {
    const textNode = document.querySelector('p')!.firstChild!;
    const annotation = mark();
    wrapAnnotation(annotation, rangeOver(textNode, 4, 15));
    const element = document.querySelector('overlayer-mark')!;
    expect(markIdAt(element)).toBe(annotation.id);
    expect(markIdAt(document.body)).toBeNull();
  });
});
