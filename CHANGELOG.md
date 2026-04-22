# Changelog

## 0.1.3 — 2026-04-23

### Fixed
- **QR codes now render without sub-pixel gaps** — even with integer SVG coords and a module-space viewBox, emitting one `<rect>` per dark module plus `shape-rendering="crispEdges"` left hairline gaps between adjacent modules when the size wasn't an integer multiple of `modules + 2 × padding` (e.g. 256/37). The gaps broke the finder patterns' solid outer rings, which QR scanners use to anchor on the code, so scans failed visually.
- **Fix**: emit all dark modules as a single `<path>` built from horizontal-run subpaths. Adjacent cells in the same row merge into one wider rectangle at the path level, and the whole foreground renders atomically. Modules stay flush at any render size.
- Also smaller output: the generated SVG is typically 30–40% smaller since horizontal runs in the finder patterns, timing bars, and data blocks collapse into single subpaths.

## 0.1.2 — 2026-04-23

### Fixed
- **QR codes now actually encode correctly** — the timing-pattern loop iterated across the full width of the matrix, overwriting the finder patterns' row 6 and column 6. The corrupted finders meant scanners couldn't anchor on the code at all, so generated QRs failed to decode even at high render quality. The loop now runs from index 8 to `size - 9` as the spec requires, leaving the three 7×7 finder patterns untouched.
- Added three regression tests that assert the full 7×7 structure of all three finder patterns and that the timing pattern stays in the between-finders region.

> **Upgrade from 0.1.0 / 0.1.1.** Both earlier versions produced corrupt QR matrices and should not be used.

## 0.1.1 — 2026-04-23

### Fixed
- **QR codes now scan reliably** — `matrixToSvg()` previously rendered modules at fractional pixel coordinates (e.g. `x="27.68" width="6.92"`) in a pixel-space viewBox. Combined with `shape-rendering="crispEdges"`, adjacent modules could snap to non-adjacent pixels, leaving sub-pixel gaps that caused many scanners (phone cameras, especially) to fail to read the code.
- **Fix**: render in module-space. The viewBox now spans `modules + 2 × padding` units and each rect is a 1×1 square at integer coordinates. The SVG's `width`/`height` attributes scale the whole thing to the requested pixel size. Modules stay flush at any render size, any DPR.
- Added two tests enforcing integer coordinates and the module-space viewBox so this can't regress.

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
