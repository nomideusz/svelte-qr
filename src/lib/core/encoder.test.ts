import { describe, it, expect } from 'vitest';
import { getQrMatrix } from './encoder.js';
import { matrixToSvg } from './svg.js';

describe('getQrMatrix', () => {
  it('returns a square matrix', () => {
    const matrix = getQrMatrix('Hello');
    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
  });

  it('version 1 with L error correction is 21x21', () => {
    const matrix = getQrMatrix('Hi', { errorCorrection: 'L' });
    expect(matrix.length).toBe(21);
  });

  it('produces consistent output for same input', () => {
    const a = getQrMatrix('test');
    const b = getQrMatrix('test');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces different output for different input', () => {
    const a = getQrMatrix('hello');
    const b = getQrMatrix('world');
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('handles empty string', () => {
    expect(() => getQrMatrix('')).not.toThrow();
  });

  it('handles URL data', () => {
    expect(() => getQrMatrix('https://thebest.travel/verify/BK-ABCD1234')).not.toThrow();
  });

  it('handles unicode (UTF-8 byte mode)', () => {
    expect(() => getQrMatrix('Zażółć gęślą jaźń')).not.toThrow();
  });

  it('throws for data exceeding max capacity', () => {
    const tooLong = 'x'.repeat(3000);
    expect(() => getQrMatrix(tooLong)).toThrow();
  });

  it('matrix contains only boolean values', () => {
    const matrix = getQrMatrix('test');
    const allBool = matrix.every((row) => row.every((v) => typeof v === 'boolean'));
    expect(allBool).toBe(true);
  });

  it('top-left finder pattern is intact (7×7, outer ring + center square)', () => {
    // A valid QR must have 3 undisturbed finder patterns; scanners anchor on
    // them. Timing and format bits must not overwrite any of the 7×7 region.
    const m = getQrMatrix('https://example.com/verify/abc');
    const expected = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        expect(m[r][c]).toBe(expected[r][c] === 1);
      }
    }
  });

  it('top-right and bottom-left finder patterns are intact', () => {
    const m = getQrMatrix('https://example.com/verify/abc');
    const n = m.length;
    const expected = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        expect(m[r][n - 7 + c]).toBe(expected[r][c] === 1);
        expect(m[n - 7 + r][c]).toBe(expected[r][c] === 1);
      }
    }
  });

  it('timing pattern occupies row 6 / col 6 only between finders', () => {
    const m = getQrMatrix('https://example.com/verify/abc');
    const n = m.length;
    // Between-finders region [8, n-8)
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
  });
});

describe('matrixToSvg', () => {
  it('returns a valid SVG string', () => {
    const matrix = getQrMatrix('test');
    const svg = matrixToSvg(matrix);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('applies custom foreground color', () => {
    const matrix = getQrMatrix('test');
    const svg = matrixToSvg(matrix, { foreground: '#ff0000' });
    expect(svg).toContain('fill="#ff0000"');
  });

  it('applies custom background color', () => {
    const matrix = getQrMatrix('test');
    const svg = matrixToSvg(matrix, { background: '#f5f5f5' });
    expect(svg).toContain('fill="#f5f5f5"');
  });

  it('respects size option', () => {
    const matrix = getQrMatrix('test');
    const svg = matrixToSvg(matrix, { size: 128 });
    expect(svg).toContain('width="128"');
    expect(svg).toContain('height="128"');
  });

  it('renders modules at integer coords (no sub-pixel gaps)', () => {
    // Every rect's x, y, width, height must be integers so adjacent modules
    // stay flush under shape-rendering="crispEdges" at any SVG size. This is
    // what lets scanners read the QR reliably.
    const matrix = getQrMatrix('test');
    const svg = matrixToSvg(matrix, { size: 256, padding: 4 });
    const rectRe = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"\/>/g;
    let m: RegExpExecArray | null;
    let checked = 0;
    while ((m = rectRe.exec(svg)) !== null) {
      for (let i = 1; i <= 4; i++) {
        expect(Number.isInteger(Number(m[i]))).toBe(true);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('viewBox spans module units, not pixels', () => {
    const matrix = getQrMatrix('hi', { errorCorrection: 'L' }); // v1 → 21 modules
    const svg = matrixToSvg(matrix, { size: 256, padding: 4 });
    // 21 modules + 2*4 padding = 29 units
    expect(svg).toContain('viewBox="0 0 29 29"');
  });
});
