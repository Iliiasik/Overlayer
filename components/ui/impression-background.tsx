import { useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';
import type { ThemeSetting } from '@/lib/storage/settings-repository';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Palette {
  paper: string;
  mottleLight: string;
  mottleDeep: string;
  tail: string;
  tailDeep: string;
  fin: string;
  speckle: string;
  patch: string;
  dot: string;
  grainDark: string;
  grainLight: string;
}

interface BlobLayer {
  kind: 'blob';
  color: keyof Palette;
  alpha: number;
  cx: number;
  cy: number;
  r: number;
  edgeNoise: number;
  dither: number;
}

interface BandLayer {
  kind: 'band';
  color: keyof Palette;
  alpha: number;
  spine: Point[];
  widthFrom: number;
  widthTo: number;
  edgeNoise: number;
  dither: number;
}

interface MottleLayer {
  kind: 'mottle';
  color: keyof Palette;
  alpha: number;
  threshold: number;
  seed: number;
}

type Layer = BlobLayer | BandLayer | MottleLayer;

const GRID_WIDTH = 192;
const NOISE_CELLS = 16;
const SEED = 0x9e3779b9;

const PALETTES: Record<ThemeSetting, Palette> = {
  space: {
    paper: '#3b98a0',
    mottleLight: '#7cc4c2',
    mottleDeep: '#26737e',
    tail: '#d95b28',
    tailDeep: '#c2451c',
    fin: '#e8c33f',
    speckle: '#8a7ba0',
    patch: '#d3d9d0',
    dot: '#cc3c14',
    grainDark: '#0a2b30',
    grainLight: '#eef3ea',
  },
  green: {
    paper: '#e9e2d0',
    mottleLight: '#f4efdf',
    mottleDeep: '#d5d9bc',
    tail: '#7a9a72',
    tailDeep: '#5c7d57',
    fin: '#d9b64a',
    speckle: '#9a8a72',
    patch: '#faf7f0',
    dot: '#a84a3d',
    grainDark: '#3a3527',
    grainLight: '#fffdf5',
  },
  blue: {
    paper: '#dfe8ee',
    mottleLight: '#eef3f6',
    mottleDeep: '#c4d6e0',
    tail: '#1687a7',
    tailDeep: '#116d88',
    fin: '#e0bf55',
    speckle: '#8a7ba0',
    patch: '#ffffff',
    dot: '#c94f30',
    grainDark: '#243642',
    grainLight: '#ffffff',
  },
};

const LAYERS: Layer[] = [
  { kind: 'mottle', color: 'mottleLight', alpha: 0.45, threshold: 0.62, seed: 11 },
  { kind: 'mottle', color: 'mottleDeep', alpha: 0.4, threshold: 0.66, seed: 29 },
  {
    kind: 'blob',
    color: 'speckle',
    alpha: 0.4,
    cx: 0.64,
    cy: 0.36,
    r: 0.16,
    edgeNoise: 0.9,
    dither: 0.8,
  },
  {
    kind: 'band',
    color: 'fin',
    alpha: 0.85,
    spine: [
      { x: 0.3, y: 0.02 },
      { x: 0.16, y: 0.16 },
      { x: 0.05, y: 0.38 },
      { x: 0.02, y: 0.52 },
    ],
    widthFrom: 0.05,
    widthTo: 0.14,
    edgeNoise: 0.5,
    dither: 0.45,
  },
  {
    kind: 'band',
    color: 'tail',
    alpha: 0.92,
    spine: [
      { x: 0.08, y: 0.12 },
      { x: 0.24, y: 0.22 },
      { x: 0.38, y: 0.38 },
      { x: 0.45, y: 0.56 },
      { x: 0.56, y: 0.72 },
      { x: 0.72, y: 0.85 },
      { x: 0.9, y: 0.98 },
    ],
    widthFrom: 0.07,
    widthTo: 0.24,
    edgeNoise: 0.55,
    dither: 0.4,
  },
  {
    kind: 'band',
    color: 'tailDeep',
    alpha: 0.5,
    spine: [
      { x: 0.2, y: 0.3 },
      { x: 0.36, y: 0.46 },
      { x: 0.46, y: 0.64 },
      { x: 0.6, y: 0.8 },
    ],
    widthFrom: 0.04,
    widthTo: 0.1,
    edgeNoise: 0.7,
    dither: 0.5,
  },
  {
    kind: 'band',
    color: 'tail',
    alpha: 0.8,
    spine: [
      { x: 0.02, y: 0.58 },
      { x: 0.14, y: 0.68 },
      { x: 0.18, y: 0.82 },
      { x: 0.1, y: 0.96 },
    ],
    widthFrom: 0.04,
    widthTo: 0.09,
    edgeNoise: 0.6,
    dither: 0.5,
  },
  {
    kind: 'blob',
    color: 'fin',
    alpha: 0.85,
    cx: 0.88,
    cy: 0.56,
    r: 0.13,
    edgeNoise: 0.5,
    dither: 0.45,
  },
  {
    kind: 'blob',
    color: 'fin',
    alpha: 0.7,
    cx: 0.66,
    cy: 0.93,
    r: 0.09,
    edgeNoise: 0.6,
    dither: 0.5,
  },
  {
    kind: 'blob',
    color: 'patch',
    alpha: 0.8,
    cx: 0.47,
    cy: 0.9,
    r: 0.07,
    edgeNoise: 0.7,
    dither: 0.6,
  },
  {
    kind: 'blob',
    color: 'dot',
    alpha: 0.9,
    cx: 0.62,
    cy: 0.05,
    r: 0.02,
    edgeNoise: 0.3,
    dither: 0.3,
  },
];

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function hashCell(seed: number, cellX: number, cellY: number): number {
  let h = SEED ^ seed ^ Math.imul(cellX + 1, 0x9e3779b1) ^ Math.imul(cellY + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(seed: number): (x: number, y: number) => number {
  const cell = GRID_WIDTH / NOISE_CELLS;
  return (x, y) => {
    const gx = x / cell;
    const gy = y / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const top = hashCell(seed, x0, y0) * (1 - fx) + hashCell(seed, x0 + 1, y0) * fx;
    const bottom = hashCell(seed, x0, y0 + 1) * (1 - fx) + hashCell(seed, x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
}

function bandEdge(layer: BandLayer, px: number, py: number, aspect: number): number {
  let best = Infinity;
  let bestT = 0;
  const count = layer.spine.length - 1;
  const y = py / aspect;
  for (let i = 0; i < count; i++) {
    const a = layer.spine[i];
    const b = layer.spine[i + 1];
    const ay = a.y / aspect;
    const by = b.y / aspect;
    const abx = b.x - a.x;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby || 1;
    const t = Math.min(1, Math.max(0, ((px - a.x) * abx + (y - ay) * aby) / lengthSq));
    const dx = px - (a.x + abx * t);
    const dy = y - (ay + aby * t);
    const distance = Math.hypot(dx, dy);
    if (distance < best) {
      best = distance;
      bestT = (i + t) / count;
    }
  }
  const width = layer.widthFrom + (layer.widthTo - layer.widthFrom) * bestT;
  return best / width;
}

function shouldPaint(edge: number, dither: number, x: number, y: number): boolean {
  if (edge < 1) return true;
  if (edge >= 1 + dither) return false;
  const keep = 1 - (edge - 1) / dither;
  return keep > BAYER[y % 4][x % 4] / 16;
}

const ARCH_TARGET_DEPTH_PX = 84;
const ARCH_MIN_DEPTH_CELLS = 5;
const ARCH_MAX_DEPTH_CELLS = 12;
const ARCH_SHOULDER = 0.16;
const ARCH_DOME = 0.15;

function smoothstep(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function paintBlob(canvas: HTMLCanvasElement, palette: Palette): void {
  const surfaceWidth = canvas.offsetWidth || window.innerWidth;
  const surfaceHeight = canvas.offsetHeight || window.innerHeight;
  const width = GRID_WIDTH;
  const height = Math.max(72, Math.round((width * surfaceHeight) / surfaceWidth));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  const image = context.createImageData(width, height);
  const data = image.data;
  const paper = hexToRgb(palette.paper);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = paper[0];
    data[i + 1] = paper[1];
    data[i + 2] = paper[2];
    data[i + 3] = 255;
  }

  const blend = (offset: number, rgb: [number, number, number], alpha: number): void => {
    const inv = 1 - alpha;
    data[offset] = rgb[0] * alpha + data[offset] * inv;
    data[offset + 1] = rgb[1] * alpha + data[offset + 1] * inv;
    data[offset + 2] = rgb[2] * alpha + data[offset + 2] * inv;
  };

  const aspect = width / height;
  const noises = LAYERS.map((layer, index) =>
    valueNoise(layer.kind === 'mottle' ? layer.seed : index * 101),
  );

  LAYERS.forEach((layer, index) => {
    const noise = noises[index];
    const rgb = hexToRgb(palette[layer.color]);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let paint: boolean;
        if (layer.kind === 'mottle') {
          const value = noise(x, y);
          const edge = (layer.threshold - value) / 0.08 + 1;
          paint = shouldPaint(edge, 0.6, x, y);
        } else {
          const px = x / width;
          const py = y / height;
          let edge: number;
          if (layer.kind === 'blob') {
            const dx = px - layer.cx;
            const dy = (py - layer.cy) / aspect;
            edge = Math.hypot(dx, dy) / layer.r;
          } else {
            edge = bandEdge(layer, px, py, aspect);
          }
          edge += (noise(x, y) - 0.5) * layer.edgeNoise;
          paint = shouldPaint(edge, layer.dither, x, y);
        }
        if (paint) blend((y * width + x) * 4, rgb, layer.alpha);
      }
    }
  });

  const grainDark = hexToRgb(palette.grainDark);
  const grainLight = hexToRgb(palette.grainLight);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const roll = hashCell(0x5f356495, x, y);
      if (roll < 0.14) blend((y * width + x) * 4, roll < 0.07 ? grainDark : grainLight, 0.07);
    }
  }

  const unit = surfaceWidth / width;
  const depth = Math.min(
    ARCH_MAX_DEPTH_CELLS,
    Math.max(ARCH_MIN_DEPTH_CELLS, ARCH_TARGET_DEPTH_PX / unit),
  );
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1);
    const profile = smoothstep(t / ARCH_SHOULDER) * smoothstep((1 - t) / ARCH_SHOULDER);
    const lift = depth * profile * (1 - ARCH_DOME + ARCH_DOME * Math.sin(Math.PI * t));
    const cut = Math.max(0, Math.round(height - lift));
    for (let y = cut; y < height; y++) data[(y * width + x) * 4 + 3] = 0;
  }

  context.putImageData(image, 0, 0);
}

export function impressionPaper(theme: ThemeSetting): string {
  return PALETTES[theme].paper;
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
      scheduled = window.requestAnimationFrame(() => paintBlob(canvas, PALETTES[settings.theme]));
    };
    paintBlob(canvas, PALETTES[settings.theme]);
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
