import type { TextAnchor } from '@/lib/annotations/types';

const CONTEXT_LENGTH = 32;

interface TextIndex {
  text: string;
  nodes: Text[];
  starts: number[];
}

interface NormalizedText {
  value: string;
  map: number[];
}

const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'TITLE',
  'IFRAME',
  'OBJECT',
  'TEXTAREA',
  'SELECT',
]);

function isElementVisible(element: Element): boolean {
  if (SKIPPED_TAGS.has(element.tagName)) return false;
  const style = element.ownerDocument?.defaultView?.getComputedStyle(element);
  if (!style) return true;
  return (
    style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse'
  );
}

function buildTextIndex(root: Node): TextIndex {
  const walker = (root.ownerDocument ?? document).createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return isElementVisible(node as Element)
            ? NodeFilter.FILTER_SKIP
            : NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = '';
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    starts.push(text.length);
    text += node.textContent ?? '';
    node = walker.nextNode();
  }
  return { text, nodes, starts };
}

function normalizeWithMap(text: string): NormalizedText {
  let value = '';
  const map: number[] = [];
  let inWhitespace = false;
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) {
      if (!inWhitespace) {
        value += ' ';
        map.push(i);
        inWhitespace = true;
      }
    } else {
      value += text[i];
      map.push(i);
      inWhitespace = false;
    }
  }
  return { value, map };
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ');
}

function locate(index: TextIndex, offset: number): { node: Text; offset: number } | null {
  for (let i = index.starts.length - 1; i >= 0; i--) {
    if (index.starts[i] <= offset) {
      return { node: index.nodes[i], offset: offset - index.starts[i] };
    }
  }
  return null;
}

function firstIndexedOffset(index: TextIndex, node: Node): number | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const at = index.nodes.indexOf(node as Text);
    return at === -1 ? null : index.starts[at];
  }
  for (const child of node.childNodes) {
    const offset = firstIndexedOffset(index, child);
    if (offset !== null) return offset;
  }
  return null;
}

function globalOffset(index: TextIndex, container: Node, offset: number): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const at = index.nodes.indexOf(container as Text);
    return at === -1 ? null : index.starts[at] + offset;
  }
  for (let i = offset; i < container.childNodes.length; i++) {
    const found = firstIndexedOffset(index, container.childNodes[i]);
    if (found !== null) return found;
  }
  return null;
}

export function captureRange(range: Range, root: Node = document.body): TextAnchor | null {
  const quote = range.toString();
  if (!quote.trim()) return null;
  const index = buildTextIndex(root);
  let start = globalOffset(index, range.startContainer, range.startOffset);
  let end = globalOffset(index, range.endContainer, range.endOffset);
  if (start === null || end === null || end < start) {
    const found = index.text.indexOf(quote);
    if (found === -1) return { quote, prefix: '', suffix: '' };
    start = found;
    end = found + quote.length;
  }
  return {
    quote,
    prefix: index.text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: index.text.slice(end, end + CONTEXT_LENGTH),
  };
}

export interface ResolvedQuote {
  range: Range;
  start: number;
}

function resolveInIndex(
  anchor: TextAnchor,
  root: Node,
  index: TextIndex,
  haystack: NormalizedText,
): ResolvedQuote | null {
  const quote = normalize(anchor.quote);
  if (!quote.trim()) return null;
  const prefix = normalize(anchor.prefix);
  const suffix = normalize(anchor.suffix);

  const candidates: number[] = [];
  let from = 0;
  while (true) {
    const found = haystack.value.indexOf(quote, from);
    if (found === -1) break;
    candidates.push(found);
    from = found + 1;
  }
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((start) => {
      const before = haystack.value.slice(Math.max(0, start - prefix.length), start);
      const after = haystack.value.slice(
        start + quote.length,
        start + quote.length + suffix.length,
      );
      const score = Number(before === prefix) + Number(after === suffix);
      return { start, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const rawStart = haystack.map[best.start];
  const rawEnd = haystack.map[best.start + quote.length - 1] + 1;
  const startLocation = locate(index, rawStart);
  const endLocation = locate(index, rawEnd);
  if (!startLocation || !endLocation) return null;

  const range = (root.ownerDocument ?? document).createRange();
  range.setStart(startLocation.node, startLocation.offset);
  range.setEnd(endLocation.node, endLocation.offset);
  return { range, start: rawStart };
}

export function resolveQuote(anchor: TextAnchor, root: Node = document.body): Range | null {
  return resolveQuotes([anchor], root)[0]?.range ?? null;
}

export function resolveQuotes(
  anchors: TextAnchor[],
  root: Node = document.body,
): (ResolvedQuote | null)[] {
  if (anchors.length === 0) return [];
  const index = buildTextIndex(root);
  const haystack = normalizeWithMap(index.text);
  return anchors.map((anchor) => resolveInIndex(anchor, root, index, haystack));
}
