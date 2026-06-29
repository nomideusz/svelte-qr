# Changelog

## 0.2.2 — 2026-06-29

### Security
- Bump vulnerable devDependencies to clear npm High CVE alerts: `vite` ^7.3.1 → ^7.3.5, `vitest` ^4.0.18 → ^4.1.0, `@sveltejs/kit` ^2.50.2 → ^2.60.1. No runtime deps affected.

## 0.2.1 — 2026-06-17

### Changed
- Add `homepage` field pointing to the live demo (now shown as Homepage on npm).
- Add a live-demo link to the README.
- Ship the MIT `LICENSE` file in the published tarball (previously absent).

## 0.2.0 — 2026-06-14

### Added
- **`getQrCapacity(errorCorrection?, version?)`** — returns the maximum number of UTF-8 bytes encodable at an EC level, for a specific version (1–40) or the absolute maximum (version 40). Handy for validating input length or driving a capacity meter before encoding.

### Fixed
- **Many common payloads now scan** — several encoder bugs each made whole classes of input unreadable:
  - **Version selection ignored the byte-mode header** (4-bit mode indicator + 8/16-bit character count), so any payload within ~2 bytes of a version's capacity — e.g. a 15-character string at the default `M` level — overflowed into a too-small version and was silently truncated. The smallest version is now chosen against the real bit budget.
  - **Every version ≥ 7 was unscannable.** Two causes: the 18-bit **version-information block** (required for v7+) was never drawn, and the **alignment-pattern** placement skipped any pattern whose centre landed on the timing row/column — dropping real patterns like v7's at (6,22)/(22,6). Scanners need both to read larger codes (longer URLs/text). Version info is now emitted, and only the three finder-overlapping alignment positions are skipped.
  - **`NUM_EC_BLOCKS` was wrong for 40 entries** (almost the entire `Q` column plus some `H`, versions 7–40) — e.g. v7-Q used 2 blocks instead of 6 — so data and error-correction codewords were split and interleaved incorrectly. Replaced with the ISO/IEC 18004 Table 9 values.
  - **Even block splits were mis-sized** — when `numDataBytes` divided evenly by the block count, all blocks were made one codeword too long, corrupting multi-block versions like v3-Q. Fixed the split formula.
- Output is now **bit-for-bit identical to a reference encoder** across 572 payloads spanning all 40 versions and four EC levels. Added an exhaustive `jsqr` decode regression test over versions 1–40 × `L/M/Q/H` (72 cases) so it can't regress.
- Removed an unused internal helper (`fillRect`).

> **Upgrade strongly recommended.** Earlier versions produced unscannable codes for many short payloads near capacity boundaries and for *all* payloads needing version 7 or higher.

## 0.1.4 — 2026-04-23

### Fixed
- **QR codes now encode valid payloads again** — the generator still produced unreadable symbols because the Reed-Solomon divisor polynomial was built in the wrong coefficient order and format bits were written to incorrect matrix coordinates. The package now emits decodable QR matrices again for short text, URLs, and UTF-8 payloads.
- Added a decode-based regression test using `jsqr`, so future releases verify that generated codes actually scan instead of only checking matrix shape.

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
