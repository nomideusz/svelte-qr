import { describe, expect, it } from 'vitest';
import { parseHex, rasterToRgba } from './download.js';
import type { QrRaster } from './raster.js';

describe('parseHex', () => {
  it('reads #rrggbb and #rgb', () => {
    expect(parseHex('#1a2b3c', [0, 0, 0])).toEqual([26, 43, 60]);
    expect(parseHex('#f00', [0, 0, 0])).toEqual([255, 0, 0]);
  });
  it('falls back on anything else', () => {
    expect(parseHex('rebeccapurple', [1, 2, 3])).toEqual([1, 2, 3]);
    expect(parseHex('', [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('rasterToRgba', () => {
  const raster: QrRaster = { data: new Uint8Array([0, 255]), width: 2, height: 1, channels: 1 };

  it('maps dark to foreground, light to background, opaque alpha', () => {
    const px = rasterToRgba(raster, '#102030', '#405060');
    expect([...px.slice(0, 4)]).toEqual([16, 32, 48, 255]);
    expect([...px.slice(4, 8)]).toEqual([64, 80, 96, 255]);
  });

  it('defaults to black on white', () => {
    const px = rasterToRgba(raster);
    expect([...px.slice(0, 4)]).toEqual([0, 0, 0, 255]);
    expect([...px.slice(4, 8)]).toEqual([255, 255, 255, 255]);
  });
});
