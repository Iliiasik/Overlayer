import type { TextMarkAnnotation } from '@/lib/annotations/types';
import { flashMark, isMarkPresent, markElement, restoreAnnotation } from './marker';

const STEP_SETTLE_MS = 180;
const MAX_STEPS = 60;
const TOP_LOAD_RETRIES = 15;
const GROWTH_EPSILON = 50;
const STEP_FRACTION = 0.85;
const FOCUS_ATTEMPTS = 4;
const FOCUS_SETTLE_MS = 380;
const FOCUS_MARGIN = 8;

function findScroller(): HTMLElement {
  const root = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  let best = root;
  let bestSize = root.scrollHeight > root.clientHeight + GROWTH_EPSILON ? root.scrollHeight : 0;
  for (const element of document.querySelectorAll<HTMLElement>('*')) {
    if (element.clientHeight < window.innerHeight * 0.5) continue;
    if (element.scrollHeight <= element.clientHeight + GROWTH_EPSILON) continue;
    const { overflowY } = getComputedStyle(element);
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') continue;
    if (element.scrollHeight > bestSize) {
      best = element;
      bestSize = element.scrollHeight;
    }
  }
  return best;
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
    element.scrollIntoView({ behavior: attempt === 0 ? 'smooth' : 'auto', block: 'center' });
    await settle(FOCUS_SETTLE_MS);
    const settled = markElement(mark.id);
    if (settled && isInViewport(settled)) break;
  }
  if (!isMarkPresent(mark.id)) return false;
  flashMark(mark.id);
  return true;
}

export async function scrollToFindMark(mark: TextMarkAnnotation): Promise<boolean> {
  if (restoreAnnotation(mark)) return true;
  const scroller = findScroller();
  const viewport = scroller.clientHeight || window.innerHeight;
  const startTop = scroller.scrollTop;
  let steps = 0;

  const attempt = async (top: number): Promise<boolean> => {
    scroller.scrollTop = top;
    await settle();
    steps++;
    return restoreAnnotation(mark);
  };

  if (await attempt(Math.max(0, mark.anchor.position.y - viewport / 2))) return true;

  let height = scroller.scrollHeight;
  if (await attempt(0)) return true;
  for (let retry = 0; retry < TOP_LOAD_RETRIES && steps < MAX_STEPS; retry++) {
    if (scroller.scrollHeight <= height + GROWTH_EPSILON) break;
    height = scroller.scrollHeight;
    if (await attempt(0)) return true;
  }

  while (steps < MAX_STEPS) {
    const bottom = scroller.scrollHeight - viewport;
    if (scroller.scrollTop >= bottom - 2) {
      if (scroller.scrollHeight <= height + GROWTH_EPSILON) break;
      height = scroller.scrollHeight;
    }
    if (await attempt(Math.min(bottom, scroller.scrollTop + viewport * STEP_FRACTION))) {
      return true;
    }
  }

  scroller.scrollTop = startTop;
  return false;
}
