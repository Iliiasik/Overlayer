import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { flashMark, isMarkPresent, markElement, restoreAnnotation } from './marker';

const STEP_SETTLE_MS = 180;
const SWEEP_BUDGET = 60;
const SIDE_SWEEP_BUDGET = 40;
const SIDE_SCROLLER_LIMIT = 3;
const SIDE_MIN_WIDTH = 160;
const START_UP_WAVES = 6;
const RESUME_UP_WAVES = 25;
const SCROLLABLE_EPSILON = 50;
const GROWTH_POLL_MS = 250;
const GROWTH_TIMEOUT_MS = 2500;
const STEP_FRACTION = 0.85;
const FOCUS_ATTEMPTS = 4;
const FOCUS_SETTLE_MS = 380;
const FOCUS_MARGIN = 8;

function findScroller(): HTMLElement {
  const root = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  let best = root;
  let bestSize = root.scrollHeight > root.clientHeight + SCROLLABLE_EPSILON ? root.scrollHeight : 0;
  for (const element of document.querySelectorAll<HTMLElement>('*')) {
    if (element.clientHeight < window.innerHeight * 0.5) continue;
    if (element.scrollHeight <= element.clientHeight + SCROLLABLE_EPSILON) continue;
    const { overflowY } = getComputedStyle(element);
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') continue;
    if (element.scrollHeight > bestSize) {
      best = element;
      bestSize = element.scrollHeight;
    }
  }
  return best;
}

function findSideScrollers(): HTMLElement[] {
  const found: HTMLElement[] = [];
  const root = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  if (root.scrollWidth > root.clientWidth + SCROLLABLE_EPSILON) found.push(root);
  for (const element of document.querySelectorAll<HTMLElement>('*')) {
    if (element.clientWidth < SIDE_MIN_WIDTH) continue;
    if (element.scrollWidth <= element.clientWidth + SCROLLABLE_EPSILON) continue;
    const { overflowX } = getComputedStyle(element);
    if (overflowX !== 'auto' && overflowX !== 'scroll' && overflowX !== 'overlay') continue;
    found.push(element);
  }
  return found.sort((a, b) => b.scrollWidth - a.scrollWidth).slice(0, SIDE_SCROLLER_LIMIT);
}

function settle(ms: number = STEP_SETTLE_MS): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => window.setTimeout(resolve, ms));
  });
}

function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.height > 0 && rect.top >= FOCUS_MARGIN && rect.bottom <= window.innerHeight - FOCUS_MARGIN
  );
}

export async function focusMark(mark: TextMarkAnnotation): Promise<boolean> {
  for (let attempt = 0; attempt < FOCUS_ATTEMPTS; attempt++) {
    if (!isMarkPresent(mark.id) && !restoreAnnotation(mark)) return false;
    const element = markElement(mark.id);
    if (!element) return false;
    if (attempt > 0 && isInViewport(element)) break;
    element.scrollIntoView({
      behavior: attempt === 0 ? 'smooth' : 'auto',
      block: 'center',
      inline: 'center',
    });
    await settle(FOCUS_SETTLE_MS);
    const settled = markElement(mark.id);
    if (settled && isInViewport(settled)) break;
  }
  if (!isMarkPresent(mark.id)) return false;
  flashMark(mark.id);
  return true;
}

export interface MarkSearch {
  start(): Promise<boolean>;
  resume(): Promise<boolean>;
  cancel(): void;
}

function textSignature(element: HTMLElement): string {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let text = '';
  let node = walker.nextNode();
  while (node && text.length < 300) {
    text += node.textContent ?? '';
    node = walker.nextNode();
  }
  return text;
}

export function createMarkSearch(mark: TextMarkAnnotation): MarkSearch {
  const scroller = findScroller();
  const viewport = scroller.clientHeight || window.innerHeight;
  const startTop = scroller.scrollTop;
  const sideOrigins = new Map<HTMLElement, number>();

  const attempt = async (top: number): Promise<boolean> => {
    scroller.scrollTop = top;
    await settle();
    return restoreAnnotation(mark);
  };

  const topSignature = (): string =>
    `${scroller.scrollHeight}:${Math.round(scroller.scrollTop)}:${textSignature(scroller)}`;

  const sideSignature = (element: HTMLElement): string =>
    `${element.scrollWidth}:${Math.round(element.scrollLeft)}:${textSignature(element)}`;

  const waitForChange = async (signature: () => string): Promise<boolean> => {
    const initial = signature();
    const deadline = performance.now() + GROWTH_TIMEOUT_MS;
    while (performance.now() < deadline) {
      await settle(GROWTH_POLL_MS);
      if (signature() !== initial) return true;
    }
    return false;
  };

  const loadUpwards = async (waves: number): Promise<boolean> => {
    for (let wave = 0; wave < waves; wave++) {
      if (await attempt(0)) return true;
      if (!(await waitForChange(topSignature))) return false;
      if (restoreAnnotation(mark)) return true;
    }
    return false;
  };

  const sweepDown = async (): Promise<boolean> => {
    let steps = 0;
    while (steps < SWEEP_BUDGET) {
      const bottom = scroller.scrollHeight - viewport;
      if (scroller.scrollTop >= bottom - 2 && !(await waitForChange(topSignature))) break;
      if (await attempt(Math.min(bottom, scroller.scrollTop + viewport * STEP_FRACTION))) {
        return true;
      }
      steps++;
    }
    return false;
  };

  const sweepAcross = async (): Promise<boolean> => {
    for (const element of findSideScrollers()) {
      if (!sideOrigins.has(element)) sideOrigins.set(element, element.scrollLeft);
      const width = element.clientWidth || window.innerWidth;
      element.scrollLeft = 0;
      await settle();
      if (restoreAnnotation(mark)) return true;
      let steps = 0;
      while (steps < SIDE_SWEEP_BUDGET) {
        const end = element.scrollWidth - width;
        if (element.scrollLeft >= end - 2 && !(await waitForChange(() => sideSignature(element)))) {
          break;
        }
        element.scrollLeft = Math.min(end, element.scrollLeft + width * STEP_FRACTION);
        await settle();
        if (restoreAnnotation(mark)) return true;
        steps++;
      }
      element.scrollLeft = sideOrigins.get(element) ?? 0;
    }
    return false;
  };

  return {
    async start() {
      if (restoreAnnotation(mark)) return true;
      if (await attempt(Math.max(0, mark.anchor.position.y - viewport / 2))) return true;
      if (await loadUpwards(START_UP_WAVES)) return true;
      if (await sweepDown()) return true;
      return sweepAcross();
    },

    async resume() {
      if (restoreAnnotation(mark)) return true;
      if (await loadUpwards(RESUME_UP_WAVES)) return true;
      if (await sweepDown()) return true;
      return sweepAcross();
    },

    cancel() {
      scroller.scrollTop = startTop;
      for (const [element, left] of sideOrigins) element.scrollLeft = left;
    },
  };
}
