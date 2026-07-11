import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { itemBounds } from '@/lib/canvas/bounds';
import {
  centerOn,
  viewportWorldBounds,
  type Bounds,
  type Camera,
  type Size,
} from '@/lib/canvas/camera';
import type { CanvasItem } from '@/lib/annotations/types';

interface MinimapProps {
  items: CanvasItem[];
  camera: Camera;
  viewport: Size;
  board: Size;
  onCameraChange: (updater: (camera: Camera) => Camera) => void;
}

const MAP_WIDTH = 176;

export function Minimap({ items, camera, viewport, board, onCameraChange }: MinimapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  if (viewport.width === 0) return null;

  const mapScale = MAP_WIDTH / board.width;
  const mapHeight = Math.round(board.height * mapScale);

  const toMap = (bounds: Bounds) => ({
    x: bounds.x * mapScale,
    y: bounds.y * mapScale,
    width: Math.max(2, bounds.width * mapScale),
    height: Math.max(2, bounds.height * mapScale),
  });

  const view = toMap(viewportWorldBounds(camera, viewport));

  const navigate = (event: ReactPointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldPoint = {
      x: (event.clientX - rect.left) / mapScale,
      y: (event.clientY - rect.top) / mapScale,
    };
    onCameraChange((current) => centerOn(current, worldPoint, viewport));
  };

  const startNavigate = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    navigate(event);
  };

  return (
    <div className="absolute bottom-4 left-4 overflow-hidden rounded-lg border bg-background/90 shadow-md backdrop-blur-sm">
      <svg
        ref={svgRef}
        width={MAP_WIDTH}
        height={mapHeight}
        className="block cursor-pointer touch-none"
        onPointerDown={startNavigate}
        onPointerMove={(event) => {
          if (event.buttons === 1) navigate(event);
        }}
      >
        <rect x={0} y={0} width={MAP_WIDTH} height={mapHeight} fill="var(--sheet)" />
        {items.map((item) => {
          const rect = toMap(itemBounds(item));
          return (
            <rect
              key={item.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={1}
              fill={item.style.color}
              opacity={0.75}
            />
          );
        })}
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          rx={2}
          fill="var(--primary)"
          fillOpacity={0.08}
          stroke="var(--primary)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
