import { useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { ART_GRID_WIDTH, renderArtPixels } from '@/lib/impression-art';
import type { ThemeSetting } from '@/lib/storage/settings-repository';
import { cn } from '@/lib/utils';
import type { ArtRequest, ArtResponse } from './impression-worker';

export { impressionPaper } from '@/lib/impression-art';

const CACHE_LIMIT = 8;

const imageCache = new Map<string, ImageData>();
let artWorker: Worker | null | undefined;
let requestId = 0;

function getWorker(): Worker | null {
  if (artWorker !== undefined) return artWorker;
  if (import.meta.env.DEV) {
    artWorker = null;
    return artWorker;
  }
  try {
    artWorker = new Worker(new URL('./impression-worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    artWorker = null;
  }
  return artWorker;
}

function cacheImage(key: string, image: ImageData): void {
  if (imageCache.size >= CACHE_LIMIT) {
    const oldest = imageCache.keys().next().value;
    if (oldest) imageCache.delete(oldest);
  }
  imageCache.set(key, image);
}

function applyImage(canvas: HTMLCanvasElement, image: ImageData): void {
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d')?.putImageData(image, 0, 0);
}

function requestPaint(canvas: HTMLCanvasElement, theme: ThemeSetting): void {
  const surfaceWidth = canvas.offsetWidth || window.innerWidth;
  const surfaceHeight = canvas.offsetHeight || window.innerHeight;
  const width = ART_GRID_WIDTH;
  const height = Math.max(72, Math.round((width * surfaceHeight) / surfaceWidth));
  const key = `${theme}:${width}x${height}:${Math.round(surfaceWidth)}`;
  const cached = imageCache.get(key);
  if (cached) {
    applyImage(canvas, cached);
    return;
  }
  const worker = getWorker();
  if (!worker) {
    const image = new ImageData(renderArtPixels(width, height, surfaceWidth, theme), width, height);
    cacheImage(key, image);
    applyImage(canvas, image);
    return;
  }
  const id = ++requestId;
  const listener = (event: MessageEvent<ArtResponse>): void => {
    if (event.data.id !== id) return;
    worker.removeEventListener('message', listener);
    const image = new ImageData(event.data.pixels, event.data.width, event.data.height);
    cacheImage(key, image);
    if (canvas.isConnected) applyImage(canvas, image);
  };
  worker.addEventListener('message', listener);
  const request: ArtRequest = { id, width, height, surfaceWidth, theme };
  worker.postMessage(request);
}

export function ImpressionBlob({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scheduled = 0;
    const schedule = () => {
      window.cancelAnimationFrame(scheduled);
      scheduled = window.requestAnimationFrame(() => requestPaint(canvas, settings.theme));
    };
    requestPaint(canvas, settings.theme);
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    return () => {
      window.cancelAnimationFrame(scheduled);
      observer.disconnect();
    };
  }, [settings.theme]);

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute -z-10', className)}>
      <canvas ref={canvasRef} className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
