# Changelog

## 0.1.0 — 2026-04-23

Initial public release.

### Added
- **`<QrCode />`** — drop-in Svelte 5 component. Props: `data`, `size`, `errorCorrection`, `padding`, `foreground`, `background`, `label`. Renders a single inline SVG wrapped in a `role="img"` container with screen-reader label.
- **`getQrMatrix(data, options?)`** — pure-TS QR encoder. Returns a 2D boolean matrix, auto-picks the smallest QR version (1–40) that fits the payload at the chosen EC level, throws if data exceeds capacity.
- **`matrixToSvg(matrix, options?)`** — renders a matrix to an SVG string with `shape-rendering="crispEdges"`. Customizable size, colors, and quiet-zone padding.
- **Byte-mode UTF-8** — any string input works, including multibyte characters.
- **Four EC levels** — `L`, `M`, `Q`, `H` recovering ~7% / 15% / 25% / 30% damage respectively.
- **Reed-Solomon error correction** — full implementation with GF(256) arithmetic, EC codeword tables for all 40 versions.
- **Types** — `ErrorCorrection`, `QrMatrix`, `QrOptions`.
- **SSR-safe** — pure functions over strings, no DOM or canvas dependencies.
- 13 unit tests covering matrix shape, version sizing, determinism, empty-string handling, URLs, unicode (UTF-8 byte mode), capacity limits, and SVG output (valid structure, custom colors, sizing).
