import { useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';
import type { ThemeSetting } from '@/lib/storage/settings-repository';

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

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(width: number, height: number, seed: number): (x: number, y: number) => number {
  const random = mulberry32(SEED ^ seed);
  const cols = NOISE_CELLS + 1;
  const rows = Math.ceil((NOISE_CELLS * height) / width) + 1;
  const lattice = Array.from({ length: rows }, () => Array.from({ length: cols }, () => random()));
  const cell = width / NOISE_CELLS;
  return (x, y) => {
    const gx = Math.min(x / cell, cols - 1.001);
    const gy = Math.min(y / cell, rows - 1.001);
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const top = lattice[y0][x0] * (1 - fx) + lattice[y0][x0 + 1] * fx;
    const bottom = lattice[y0 + 1][x0] * (1 - fx) + lattice[y0 + 1][x0 + 1] * fx;
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

function paint(canvas: HTMLCanvasElement, palette: Palette): void {
  const width = GRID_WIDTH;
  const height = Math.max(72, Math.round((width * window.innerHeight) / window.innerWidth));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = palette.paper;
  context.fillRect(0, 0, width, height);

  const aspect = width / height;
  const noises = LAYERS.map((layer, index) =>
    valueNoise(width, height, layer.kind === 'mottle' ? layer.seed : index * 101),
  );

  LAYERS.forEach((layer, index) => {
    const noise = noises[index];
    context.fillStyle = palette[layer.color];
    context.globalAlpha = layer.alpha;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x / width;
        const py = y / height;
        if (layer.kind === 'mottle') {
          const value = noise(x, y);
          const edge = (layer.threshold - value) / 0.08 + 1;
          if (shouldPaint(edge, 0.6, x, y)) context.fillRect(x, y, 1, 1);
          continue;
        }
        let edge: number;
        if (layer.kind === 'blob') {
          const dx = px - layer.cx;
          const dy = (py - layer.cy) / aspect;
          edge = Math.hypot(dx, dy) / layer.r;
        } else {
          edge = bandEdge(layer, px, py, aspect);
        }
        edge += (noise(x, y) - 0.5) * layer.edgeNoise;
        if (shouldPaint(edge, layer.dither, x, y)) context.fillRect(x, y, 1, 1);
      }
    }
  });

  const random = mulberry32(SEED ^ 0x5f356495);
  context.globalAlpha = 0.07;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (random() < 0.14) {
        context.fillStyle = random() < 0.5 ? palette.grainDark : palette.grainLight;
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  context.globalAlpha = 1;
}

export function RisoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const repaint = () => paint(canvas, PALETTES[settings.theme]);
    repaint();
    window.addEventListener('resize', repaint);
    return () => window.removeEventListener('resize', repaint);
  }, [settings.theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
