import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { hexToHsv, hsvToHex, type Hsv } from '@/lib/color';
import { DRAWING_COLORS } from '@/lib/annotations/palette';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  side?: 'bottom' | 'top';
}

function trackPointer(
  area: HTMLElement,
  event: ReactPointerEvent,
  onPoint: (ratioX: number, ratioY: number) => void,
): void {
  event.preventDefault();
  const apply = (clientX: number, clientY: number) => {
    const rect = area.getBoundingClientRect();
    onPoint(
      Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    );
  };
  apply(event.clientX, event.clientY);
  const onMove = (move: PointerEvent) => apply(move.clientX, move.clientY);
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

export function ColorPicker({ color, onChange, onClose, side = 'bottom' }: ColorPickerProps) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(color));
  const emitted = useRef(color);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (color !== emitted.current) setHsv(hexToHsv(color));
  }, [color]);

  const emit = (next: Hsv) => {
    setHsv(next);
    emitted.current = hsvToHex(next);
    onChange(emitted.current);
  };

  const select = (preset: string) => {
    emitted.current = preset;
    setHsv(hexToHsv(preset));
    onChange(preset);
  };

  const handleSaturation = (event: ReactPointerEvent) => {
    const area = saturationRef.current;
    if (area) trackPointer(area, event, (x, y) => emit({ ...hsv, s: x, v: 1 - y }));
  };

  const handleHue = (event: ReactPointerEvent) => {
    const area = hueRef.current;
    if (area) trackPointer(area, event, (x) => emit({ ...hsv, h: x * 360 }));
  };

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const current = hsvToHex(hsv);

  return (
    <>
      <div className="fixed inset-0 z-40" role="presentation" onPointerDown={onClose} />
      <div
        className={cn(
          'absolute left-0 z-50 flex w-56 flex-col gap-3 rounded-xl border bg-popover p-3 shadow-lg',
          side === 'top' ? 'bottom-8' : 'top-8',
        )}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div
          ref={saturationRef}
          role="slider"
          aria-label="saturation"
          aria-valuenow={Math.round(hsv.s * 100)}
          className="relative h-32 cursor-crosshair touch-none"
          onPointerDown={handleSaturation}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
          />
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              backgroundColor: current,
            }}
          />
        </div>
        <div
          ref={hueRef}
          role="slider"
          aria-label="hue"
          aria-valuenow={Math.round(hsv.h)}
          className="relative h-3 cursor-pointer touch-none"
          onPointerDown={handleHue}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
          />
          <span
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: hueColor }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {DRAWING_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              onClick={() => select(preset)}
              className={cn(
                'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                current === preset ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
          <span className="ml-auto font-mono text-xs uppercase text-muted-foreground">
            {current}
          </span>
        </div>
      </div>
    </>
  );
}
