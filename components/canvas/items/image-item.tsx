import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CURSORS } from '@/lib/cursors';
import type { ImageAnnotation } from '@/lib/annotations/types';
import { clampWidthWithin } from './sheet';
import { ItemShell, type ItemProps } from './shell';
import { useItemDrag } from './use-item-drag';

const MIN_IMAGE_WIDTH = 60;

function dataUrlToBitmap(dataUrl: string): Promise<ImageBitmap> {
  const [meta, base64] = dataUrl.split(',');
  const mime = /data:(.*?)(;|$)/.exec(meta)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return createImageBitmap(new Blob([bytes], { type: mime }));
}

function useBitmapCanvas(dataUrl: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);

  useEffect(() => {
    let cancelled = false;
    void dataUrlToBitmap(dataUrl).then((result) => {
      if (cancelled) {
        result.close();
      } else {
        setBitmap(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  return canvasRef;
}

export function ImageItem({
  annotation,
  scale,
  onPatch,
  onTranslate,
  bounds,
}: ItemProps<ImageAnnotation>) {
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const canvasRef = useBitmapCanvas(annotation.dataUrl);
  const { offset, onPointerDown } = useItemDrag(
    scale,
    (dx, dy) => onTranslate(annotation.id, dx, dy),
    undefined,
    { position: annotation.position, bounds },
  );

  const width = resizeWidth ?? annotation.width;
  const ratio = annotation.height / annotation.width;

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = annotation.width;
    let next = startWidth;
    const onMove = (move: PointerEvent) => {
      const raw = Math.max(MIN_IMAGE_WIDTH, startWidth + (move.clientX - startX) / scale);
      next = clampWidthWithin(bounds, annotation.position, raw);
      setResizeWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizeWidth(null);
      onPatch(annotation.id, { width: next, height: Math.round(next * ratio) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <ItemShell
      itemId={annotation.id}
      position={annotation.position}
      offset={offset}
      className="group"
      style={{ cursor: CURSORS.grab }}
      onPointerDown={onPointerDown}
    >
      <canvas
        ref={canvasRef}
        className="block rounded-xl shadow-md"
        style={{ width, height: Math.round(width * ratio) }}
      />
      <span
        role="presentation"
        onPointerDown={startResize}
        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-primary opacity-0 transition-opacity group-hover:opacity-100"
        style={{ cursor: CURSORS.resizeD }}
      />
    </ItemShell>
  );
}
