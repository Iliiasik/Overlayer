import { MessageType, sendToBackground } from '@/lib/messaging';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 0.85;

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export type ImageLoadError = 'notImage' | 'tooLarge' | 'loadFailed';

export type ImageLoadResult =
  { ok: true; image: LoadedImage } | { ok: false; reason: ImageLoadError };

export interface ImageDropPayload {
  url: string | null;
  file: File | null;
}

export function imageUrlFromStrings(uriList: string, plain: string): string | null {
  const candidate =
    uriList
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#')) ?? plain.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function hasImagePayload(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes('Files') || dataTransfer.types.includes('text/uri-list');
}

export function payloadFromDataTransfer(dataTransfer: DataTransfer): ImageDropPayload {
  return {
    url: imageUrlFromStrings(
      dataTransfer.getData('text/uri-list'),
      dataTransfer.getData('text/plain'),
    ),
    file: dataTransfer.files[0] ?? null,
  };
}

function downscale(bitmap: ImageBitmap): LoadedImage {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL('image/webp', WEBP_QUALITY), width, height };
}

async function fromBitmapSource(source: Blob): Promise<LoadedImage | null> {
  try {
    const bitmap = await createImageBitmap(source);
    const image = downscale(bitmap);
    bitmap.close();
    return image;
  } catch {
    return null;
  }
}

export async function loadImageFile(file: File | null): Promise<ImageLoadResult> {
  if (!file || !file.type.startsWith('image/')) return { ok: false, reason: 'notImage' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: 'tooLarge' };
  const image = await fromBitmapSource(file);
  return image ? { ok: true, image } : { ok: false, reason: 'loadFailed' };
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const [meta, base64] = dataUrl.split(',');
  const mime = /data:(.*?)(;|$)/.exec(meta)?.[1];
  if (!mime || !base64) return null;
  try {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export async function loadDroppedImage(payload: ImageDropPayload): Promise<ImageLoadResult> {
  if (payload.url) {
    const fetched = await sendToBackground<string | null>({
      type: MessageType.FetchImage,
      url: payload.url,
    });
    if (fetched) {
      const blob = dataUrlToBlob(fetched);
      if (blob) {
        const image = await fromBitmapSource(blob);
        if (image) return { ok: true, image };
      }
    }
    if (!payload.file) return { ok: false, reason: 'loadFailed' };
  }
  return loadImageFile(payload.file);
}
