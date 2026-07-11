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

function buildTextIndex(root: Node): TextIndex {
  const walker = (root.ownerDocument ?? document).createTreeWalker(root, NodeFilter.SHOW_TEXT);
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

export function captureRange(range: Range, root: Node = document.body): TextAnchor | null {
  const quote = range.toString();
  if (!quote.trim()) return null;
  const index = buildTextIndex(root);
  const beforeRange = range.cloneRange();
  beforeRange.setStart(root, 0);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const start = beforeRange.toString().length;
  return {
    quote,
    prefix: index.text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: index.text.slice(start + quote.length, start + quote.length + CONTEXT_LENGTH),
  };
}

export function resolveQuote(anchor: TextAnchor, root: Node = document.body): Range | null {
  const quote = normalize(anchor.quote);
  if (!quote.trim()) return null;
  const index = buildTextIndex(root);
  const haystack = normalizeWithMap(index.text);
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
  return range;
}
