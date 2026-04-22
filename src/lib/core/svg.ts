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

  // Render in module-space: each rect is a 1×1 unit at integer coords, and
  // the viewBox spans `total` units. SVG scales the whole thing to `size` px.
  // Integer coordinates guarantee modules stay pixel-aligned at any render
  // size so scanners never see sub-pixel gaps between adjacent dark modules.
  const rects: string[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (matrix[r][c]) {
        rects.push(`<rect x="${c + padding}" y="${r + padding}" width="1" height="1"/>`);
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${background}"/>`,
    `<g fill="${foreground}">`,
    ...rects,
    `</g>`,
    `</svg>`,
  ].join('\n');
}
