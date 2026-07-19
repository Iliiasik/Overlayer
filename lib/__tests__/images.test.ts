// @vitest-environment jsdom
import { fakeBrowser } from 'wxt/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_IMAGE_BYTES,
  hasImagePayload,
  imageUrlFromStrings,
  loadDroppedImage,
  loadImageFile,
  payloadFromDataTransfer,
} from '../images';

type RuntimeSendMessage = typeof fakeBrowser.runtime.sendMessage;

function fakeTransfer(entries: Record<string, string>, files: File[] = []): DataTransfer {
  return {
    types: [...Object.keys(entries), ...(files.length > 0 ? ['Files'] : [])],
    getData: (type: string) => entries[type] ?? '',
    files,
  } as unknown as DataTransfer;
}

function pngFile(name = 'pic.png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });
}

function stubBitmapPipeline(): void {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 1600, height: 1200, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as ReturnType<HTMLCanvasElement['getContext']>);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,QQ==');
}

describe('imageUrlFromStrings', () => {
  it('prefers the first uri-list entry', () => {
    expect(imageUrlFromStrings('# comment\nhttps://a.com/x.png\nhttps://b.com/y.png', '')).toBe(
      'https://a.com/x.png',
    );
  });

  it('falls back to plain text', () => {
    expect(imageUrlFromStrings('', ' https://a.com/pic.jpg ')).toBe('https://a.com/pic.jpg');
  });

  it('rejects non-http urls and garbage', () => {
    expect(imageUrlFromStrings('data:image/png;base64,AAA', '')).toBeNull();
    expect(imageUrlFromStrings('javascript:alert(1)', '')).toBeNull();
    expect(imageUrlFromStrings('', 'not a url')).toBeNull();
    expect(imageUrlFromStrings('', '')).toBeNull();
  });
});

describe('drop payload', () => {
  it('detects files and uri lists', () => {
    expect(hasImagePayload(fakeTransfer({ 'text/uri-list': 'https://a.com/x.png' }))).toBe(true);
    expect(hasImagePayload(fakeTransfer({}, [pngFile()]))).toBe(true);
    expect(hasImagePayload(fakeTransfer({ 'text/plain': 'hello' }))).toBe(false);
  });

  it('extracts url and first file', () => {
    const file = pngFile();
    const payload = payloadFromDataTransfer(
      fakeTransfer({ 'text/uri-list': 'https://a.com/x.png', 'text/plain': '' }, [file]),
    );
    expect(payload.url).toBe('https://a.com/x.png');
    expect(payload.file).toBe(file);
    expect(payloadFromDataTransfer(fakeTransfer({}))).toEqual({ url: null, file: null });
  });
});

describe('loadImageFile', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects missing and non-image files', async () => {
    expect(await loadImageFile(null)).toEqual({ ok: false, reason: 'notImage' });
    const text = new File(['hi'], 'a.txt', { type: 'text/plain' });
    expect(await loadImageFile(text)).toEqual({ ok: false, reason: 'notImage' });
  });

  it('rejects oversized files', async () => {
    const file = pngFile();
    Object.defineProperty(file, 'size', { value: MAX_IMAGE_BYTES + 1 });
    expect(await loadImageFile(file)).toEqual({ ok: false, reason: 'tooLarge' });
  });

  it('downscales large bitmaps to webp', async () => {
    stubBitmapPipeline();
    const result = await loadImageFile(pngFile());
    expect(result).toEqual({
      ok: true,
      image: { dataUrl: 'data:image/webp;base64,QQ==', width: 800, height: 600 },
    });
  });

  it('reports decode failures', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('broken');
      }),
    );
    expect(await loadImageFile(pngFile())).toEqual({ ok: false, reason: 'loadFailed' });
  });
});

describe('loadDroppedImage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the original through the background and decodes it', async () => {
    stubBitmapPipeline();
    const send = vi.fn(async () => 'data:image/png;base64,QUJD');
    fakeBrowser.runtime.sendMessage = send as unknown as RuntimeSendMessage;
    const result = await loadDroppedImage({ url: 'https://a.com/x.png', file: null });
    expect(send).toHaveBeenCalledWith({ type: 'image/fetch', url: 'https://a.com/x.png' });
    expect(result.ok).toBe(true);
  });

  it('fails when the fetch is empty and no file fallback exists', async () => {
    fakeBrowser.runtime.sendMessage = vi.fn(async () => null) as unknown as RuntimeSendMessage;
    expect(await loadDroppedImage({ url: 'https://a.com/x.png', file: null })).toEqual({
      ok: false,
      reason: 'loadFailed',
    });
  });

  it('ignores malformed data urls from the background', async () => {
    fakeBrowser.runtime.sendMessage = vi.fn(async () => 'garbage') as unknown as RuntimeSendMessage;
    expect(await loadDroppedImage({ url: 'https://a.com/x.png', file: null })).toEqual({
      ok: false,
      reason: 'loadFailed',
    });
    fakeBrowser.runtime.sendMessage = vi.fn(
      async () => 'data:image/png;base64,%%%',
    ) as unknown as RuntimeSendMessage;
    expect(await loadDroppedImage({ url: 'https://a.com/x.png', file: null })).toEqual({
      ok: false,
      reason: 'loadFailed',
    });
  });

  it('falls back to the dropped file without a url', async () => {
    stubBitmapPipeline();
    const result = await loadDroppedImage({ url: null, file: pngFile() });
    expect(result.ok).toBe(true);
  });
});
