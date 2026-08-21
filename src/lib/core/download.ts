import type { QrOptions } from './types.js';
import { getQrMatrix } from './encoder.js';
import { matrixToRaster, type QrRaster } from './raster.js';

/** '#rgb' or '#rrggbb' → [r, g, b]. Anything else falls back. */
export function parseHex(color: string, fallback: [number, number, number]): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return fallback;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Colorize a greyscale raster into RGBA pixels — the pure half of the
 * browser PNG path, kept separate so it can be tested without a canvas.
 */
export function rasterToRgba(
  raster: QrRaster,
  foreground = '#000000',
  background = '#ffffff',
): Uint8ClampedArray<ArrayBuffer> {
  const fg = parseHex(foreground, [0, 0, 0]);
  const bg = parseHex(background, [255, 255, 255]);
  const out = new Uint8ClampedArray(new ArrayBuffer(raster.width * raster.height * 4));
  for (let i = 0; i < raster.data.length; i++) {
    const [r, g, b] = raster.data[i] === 0 ? fg : bg;
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/**
 * Encode a QR as a PNG Blob **in the browser** — the client sibling of the
 * server-only `./png` subpath (which needs a Node Buffer). Rasterized at a
 * scale that lands near `targetPx` so the saved file scans from another
 * screen, whatever size the on-page QR was.
 */
export async function qrPngBlob(data: string, options: QrOptions = {}, targetPx = 1024): Promise<Blob> {
  const matrix = getQrMatrix(data, options);
  const padding = options.padding ?? 4;
  const scale = Math.max(8, Math.round(targetPx / (matrix.length + padding * 2)));
  const raster = matrixToRaster(matrix, { scale, padding });
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(
    new ImageData(rasterToRgba(raster, options.foreground, options.background), raster.width, raster.height),
    0,
    0,
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))), 'image/png'),
  );
}

/** Trigger a browser download of the QR as a PNG file. */
export async function downloadQrPng(data: string, filename = 'qr-code', options: QrOptions = {}): Promise<void> {
  const blob = await qrPngBlob(data, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
