/**
 * PNG output — `@nomideusz/svelte-qr/png`.
 *
 * The sharp wrapper both source apps had pasted verbatim from `matrixToRaster`'s
 * doc comment. Server-only: `sharp` is an OPTIONAL peer dependency imported only
 * by this subpath, so the main entry keeps its zero-dependency, browser-safe
 * identity.
 */
import sharp from 'sharp';
import { getQrMatrix } from '../core/encoder.js';
import { matrixToRaster } from '../core/raster.js';
import type { ErrorCorrection } from '../core/types.js';

export interface QrPngOptions {
  /** Pixels per QR module (default 8). */
  scale?: number;
  /** Quiet-zone width in modules. The spec requires 4; going lower breaks scanning. */
  padding?: number;
  /** Default 'M'. */
  errorCorrection?: ErrorCorrection;
}

/**
 * Render QR data as a PNG buffer (white background, black modules,
 * spec-compliant quiet zone).
 */
export async function qrPng(data: string, options: QrPngOptions = {}): Promise<Buffer> {
  const { scale = 8, padding, errorCorrection = 'M' } = options;
  const raster = matrixToRaster(getQrMatrix(data, { errorCorrection }), { scale, padding });
  return sharp(raster.data, {
    raw: { width: raster.width, height: raster.height, channels: raster.channels },
  })
    .png()
    .toBuffer();
}
