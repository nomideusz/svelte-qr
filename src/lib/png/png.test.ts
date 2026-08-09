import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { qrPng } from './index.js';
import { getQrMatrix } from '../core/encoder.js';

describe('qrPng', () => {
  it('returns a real PNG sized from modules, scale and quiet zone', async () => {
    const url = 'https://example.com/verify/abc123';
    const png = await qrPng(url, { scale: 4 });

    // PNG magic bytes
    expect([...png.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);

    const meta = await sharp(png).metadata();
    const expected = (getQrMatrix(url, { errorCorrection: 'M' }).length + 8) * 4;
    expect(meta.width).toBe(expected);
    expect(meta.height).toBe(expected);
  });

  it('round-trips: the encoded PNG scans back to the input', async () => {
    const url = 'https://szkolyjogi.pl/verify/xyz';
    const png = await qrPng(url);

    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    expect(decoded?.data).toBe(url);
  });

  it('honors scale and errorCorrection options', async () => {
    const png8 = await qrPng('hello', { scale: 8 });
    const png24 = await qrPng('hello', { scale: 24 });
    const m8 = await sharp(png8).metadata();
    const m24 = await sharp(png24).metadata();
    expect(m24.width).toBe(m8.width! * 3);

    // Higher EC level → denser matrix (more modules) for the same payload
    const mM = await sharp(await qrPng('hello world payload', { errorCorrection: 'M' })).metadata();
    const mH = await sharp(await qrPng('hello world payload', { errorCorrection: 'H' })).metadata();
    expect(mH.width!).toBeGreaterThanOrEqual(mM.width!);
  });
});
