import { renderArtPixels } from '@/lib/impression-art';
import type { ThemeSetting } from '@/lib/storage/settings-repository';

export interface ArtRequest {
  id: number;
  width: number;
  height: number;
  surfaceWidth: number;
  theme: ThemeSetting;
}

export interface ArtResponse {
  id: number;
  width: number;
  height: number;
  pixels: Uint8ClampedArray<ArrayBuffer>;
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<ArtRequest>) => void) | null;
  postMessage(message: ArtResponse, transfer: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const { id, width, height, surfaceWidth, theme } = event.data;
  const pixels = renderArtPixels(width, height, surfaceWidth, theme);
  scope.postMessage({ id, width, height, pixels }, [pixels.buffer]);
};
