import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { resolveQuote, resolveQuotes } from './anchor';

export const MARK_TAG = 'overlayer-mark';
const HIGHLIGHT_ALPHA = '59';

function markSelector(id: string): string {
  return `${MARK_TAG}[data-ovl-id="${id}"]`;
}

function applyMarkStyle(element: HTMLElement, annotation: TextMarkAnnotation): void {
  const { color } = annotation.style;
  element.style.backgroundColor = `${color}${HIGHLIGHT_ALPHA}`;
  element.style.fontWeight = annotation.bold ? '700' : 'inherit';
  element.style.fontStyle = annotation.italic ? 'italic' : 'inherit';
  element.style.textDecoration = annotation.note ? `underline dotted ${color}` : 'inherit';
  element.style.borderRadius = '2px';
  element.style.setProperty('box-decoration-break', 'clone');
  element.style.setProperty('-webkit-box-decoration-break', 'clone');
}

function textNodesIn(range: Range): Text[] {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) return [root as Text];
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

export function wrapAnnotation(annotation: TextMarkAnnotation, range: Range): boolean {
  const doc = range.startContainer.ownerDocument ?? document;
  let wrapped = 0;
  for (const node of textNodesIn(range)) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (start >= end || !node.textContent?.slice(start, end).trim()) continue;
    const sub = doc.createRange();
    sub.setStart(node, start);
    sub.setEnd(node, end);
    const mark = doc.createElement(MARK_TAG);
    mark.dataset.ovlId = annotation.id;
    applyMarkStyle(mark, annotation);
    sub.surroundContents(mark);
    wrapped++;
  }
  return wrapped > 0;
}

export function unwrapAnnotation(id: string): void {
  for (const element of document.querySelectorAll(markSelector(id))) {
    const parent = element.parentNode;
    if (!parent) continue;
    while (element.firstChild) parent.insertBefore(element.firstChild, element);
    element.remove();
    parent.normalize();
  }
}

export function updateAnnotationStyle(annotation: TextMarkAnnotation): void {
  for (const element of document.querySelectorAll<HTMLElement>(markSelector(annotation.id))) {
    applyMarkStyle(element, annotation);
  }
}

export function isMarkPresent(id: string): boolean {
  return document.querySelector(markSelector(id)) !== null;
}

export function restoreAnnotation(annotation: TextMarkAnnotation): boolean {
  if (isMarkPresent(annotation.id)) return true;
  if (!annotation.anchor.text) return false;
  const range = resolveQuote(annotation.anchor.text);
  return range ? wrapAnnotation(annotation, range) : false;
}

export function restoreAnnotations(annotations: TextMarkAnnotation[]): number {
  const missing = annotations.filter(
    (annotation) => annotation.anchor.text && !isMarkPresent(annotation.id),
  );
  if (missing.length === 0) return 0;
  const resolved = resolveQuotes(missing.map((annotation) => annotation.anchor.text!));
  return missing
    .flatMap((annotation, index) => {
      const match = resolved[index];
      return match ? [{ annotation, match }] : [];
    })
    .sort((a, b) => b.match.start - a.match.start)
    .filter(({ annotation, match }) => wrapAnnotation(annotation, match.range)).length;
}

export function markIdAt(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(MARK_TAG)?.dataset.ovlId ?? null;
}

export function markClientRect(id: string): DOMRect | null {
  return document.querySelector(markSelector(id))?.getBoundingClientRect() ?? null;
}

export function markElement(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(markSelector(id));
}

export function flashMark(id: string): void {
  for (const element of document.querySelectorAll<HTMLElement>(markSelector(id))) {
    element.animate(
      [
        { boxShadow: `0 0 0 4px ${element.style.backgroundColor}` },
        { boxShadow: '0 0 0 0 transparent' },
      ],
      { duration: 900, easing: 'ease-out' },
    );
  }
}

export function setMarksVisible(visible: boolean, marks: TextMarkAnnotation[]): void {
  if (visible) {
    for (const mark of marks) updateAnnotationStyle(mark);
    return;
  }
  for (const element of document.querySelectorAll<HTMLElement>(`${MARK_TAG}[data-ovl-id]`)) {
    element.style.backgroundColor = 'transparent';
    element.style.fontWeight = 'inherit';
    element.style.fontStyle = 'inherit';
    element.style.textDecoration = 'inherit';
  }
}

export function removeAllMarks(): void {
  for (const element of document.querySelectorAll(`${MARK_TAG}[data-ovl-id]`)) {
    const parent = element.parentNode;
    if (!parent) continue;
    while (element.firstChild) parent.insertBefore(element.firstChild, element);
    element.remove();
  }
}
