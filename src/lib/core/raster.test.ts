import { describe, it, expect } from 'vitest';
import { matrixToRaster } from './raster.js';
import { getQrMatrix } from './encoder.js';

describe('matrixToRaster', () => {
  it('sizes the bitmap from modules, scale and quiet zone', () => {
    const matrix = getQrMatrix('https://example.com');
    const r = matrixToRaster(matrix, { scale: 4, padding: 4 });
    const expected = (matrix.length + 8) * 4;
    expect(r.width).toBe(expected);
    expect(r.height).toBe(expected);
    expect(r.data.length).toBe(expected * expected);
    expect(r.channels).toBe(1);
  });

  it('keeps the quiet zone light on every edge', () => {
    const r = matrixToRaster(getQrMatrix('hello'), { scale: 2, padding: 4 });
    const quietPx = 4 * 2;
    for (let x = 0; x < r.width; x++) {
      expect(r.data[x]).toBe(255);                                   // top row
      expect(r.data[(r.height - 1) * r.width + x]).toBe(255);        // bottom row
    }
    for (let y = 0; y < r.height; y++) {
      expect(r.data[y * r.width]).toBe(255);                         // left col
      expect(r.data[y * r.width + r.width - 1]).toBe(255);           // right col
    }
    // The finder pattern's top-left module is dark, just inside the quiet zone
    expect(r.data[quietPx * r.width + quietPx]).toBe(0);
  });

  it('scales each module into a solid block', () => {
    const scale = 3;
    const r = matrixToRaster(getQrMatrix('hello'), { scale, padding: 4 });
    const o = 4 * scale;
    // The whole scale×scale block for the dark top-left finder module is dark
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        expect(r.data[(o + dy) * r.width + o + dx]).toBe(0);
      }
    }
  });

  it('produces both dark and light pixels', () => {
    const r = matrixToRaster(getQrMatrix('https://szkolyjogi.pl'));
    expect(r.data.some((p) => p === 0)).toBe(true);
    expect(r.data.some((p) => p === 255)).toBe(true);
  });
});
