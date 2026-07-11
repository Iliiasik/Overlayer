import { useEffect, useRef } from 'react';
import { appIconUrl } from '@/lib/assets';

interface AppIconProps {
  className?: string;
}

export function AppIcon({ className }: AppIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(appIconUrl())
      .then((response) => response.blob())
      .then(createImageBitmap)
      .then((bitmap) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) {
          bitmap.close();
          return;
        }
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
        bitmap.close();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
