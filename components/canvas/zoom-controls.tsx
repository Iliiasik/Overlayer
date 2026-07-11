import { Maximize, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tip } from '@/components/ui/tooltip';
import { fitBounds, zoomAt, zoomTo, ZOOM_STEP, type Camera, type Size } from '@/lib/canvas/camera';

interface ZoomControlsProps {
  camera: Camera;
  viewport: Size;
  board: Size;
  onCameraChange: (updater: (camera: Camera) => Camera) => void;
}

export function ZoomControls({ camera, viewport, board, onCameraChange }: ZoomControlsProps) {
  const { t } = useTranslation();
  const center = { x: viewport.width / 2, y: viewport.height / 2 };

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-0.5 rounded-lg border bg-background/90 p-1 shadow-md backdrop-blur-sm">
      <Tip label={t('canvas.zoomOut')} side="top">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('canvas.zoomOut')}
          onClick={() => onCameraChange((current) => zoomAt(current, center, 1 / ZOOM_STEP))}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </Tip>
      <Tip label={t('canvas.zoomReset')} side="top">
        <button
          type="button"
          aria-label={t('canvas.zoomReset')}
          onClick={() => onCameraChange((current) => zoomTo(current, center, 1))}
          className="h-8 w-13 rounded-md text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {Math.round(camera.scale * 100)}%
        </button>
      </Tip>
      <Tip label={t('canvas.zoomIn')} side="top">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('canvas.zoomIn')}
          onClick={() => onCameraChange((current) => zoomAt(current, center, ZOOM_STEP))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </Tip>
      <div className="mx-0.5 h-5 w-px bg-border" />
      <Tip label={t('canvas.zoomFit')} side="top">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('canvas.zoomFit')}
          onClick={() => onCameraChange(() => fitBounds({ x: 0, y: 0, ...board }, viewport, 24))}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </Tip>
    </div>
  );
}
