import type { QrMatrix } from './types.js';

export interface RasterOptions {
  /** Pixels per QR module (default: 8). */
  scale?: number;
  /** Quiet-zone width in modules. The spec requires 4; going lower breaks scanning. */
  padding?: number;
}

export interface QrRaster {
  /** Single-channel greyscale pixels, row-major. 0 = dark module, 255 = light. */
  data: Uint8Array;
  width: number;
  height: number;
  /** Always 1 — greyscale. Named to match the shape image encoders expect. */
  channels: 1;
}

/**
 * Rasterize a QR matrix to a single-channel greyscale bitmap.
 *
 * The sibling of `matrixToSvg` for pixel output. This package stays
 * dependency-free, so it stops at the raw raster rather than encoding a PNG —
 * hand the result to whatever encoder you already have:
 *
 * ```ts
 * const { data, width, height, channels } = matrixToRaster(getQrMatrix(url));
 * await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
 * ```
 */
export function matrixToRaster(matrix: QrMatrix, options: RasterOptions = {}): QrRaster {
  const { scale = 8, padding = 4 } = options;

  const modules = matrix.length;
  const size = (modules + padding * 2) * scale;
  const data = new Uint8Array(size * size).fill(255);

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!matrix[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) {
        const start = ((r + padding) * scale + dy) * size + (c + padding) * scale;
        data.fill(0, start, start + scale);
      }
    }
  }

  return { data, width: size, height: size, channels: 1 };
}
