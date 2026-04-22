import type { QrMatrix, QrOptions } from './types.js';

export function matrixToSvg(matrix: QrMatrix, options: QrOptions = {}): string {
  const {
    size       = 256,
    foreground = '#000000',
    background = '#ffffff',
    padding    = 4,
  } = options;

  const modules = matrix.length;
  const total   = modules + padding * 2;

  // Render all dark modules as a single <path> made of horizontal-run
  // subpaths. Emitting one rect per module and relying on crispEdges +
  // per-rect rounding leaves sub-pixel gaps between adjacent modules when
  // size/total isn't an integer (e.g. 256/37), which breaks scanning by
  // corrupting the finder patterns' solid outer rings. A single path draws
  // atomically and keeps modules flush at any size.
  let d = '';
  for (let r = 0; r < modules; r++) {
    let c = 0;
    while (c < modules) {
      if (!matrix[r][c]) { c++; continue; }
      let end = c + 1;
      while (end < modules && matrix[r][end]) end++;
      const width = end - c;
      d += `M${c + padding} ${r + padding}h${width}v1h-${width}z`;
      c = end;
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${background}"/>`,
    `<path d="${d}" fill="${foreground}"/>`,
    `</svg>`,
  ].join('\n');
}
