# @nomideusz/svelte-qr

[![npm](https://badgen.net/npm/v/@nomideusz/svelte-qr)](https://www.npmjs.com/package/@nomideusz/svelte-qr) [![license](https://badgen.net/badge/license/MIT/blue)](https://github.com/nomideusz/svelte-qr/blob/main/LICENSE)

Zero-dependency QR code generation for **Svelte 5**. A pure-TypeScript encoder (Reed-Solomon error correction, all 40 versions, byte-mode UTF-8) plus a drop-in `<QrCode />` component that emits a single SVG. No canvas, no image decoding, no runtime dependencies. Need pixels instead of vectors? `matrixToRaster()` returns a raw bitmap, and the optional server-side `/png` subpath turns one into a PNG `Buffer`.

**[Live demo → svelte-qr.vercel.app](https://svelte-qr.vercel.app/)**

## Install

```bash
pnpm add @nomideusz/svelte-qr
```

> Requires Svelte 5 (`^5.0.0`). Zero runtime dependencies — `sharp` is an **optional** peer needed only for the server-side `/png` subpath.

## Quick start

```svelte
<script>
  import { QrCode } from '@nomideusz/svelte-qr';
</script>

<QrCode data="https://example.com/verify/abc123" />
```

That's it — a 256×256 SVG with sensible defaults (error correction M, 4-module quiet zone, black modules on white).

## Customizing

All options are props on `<QrCode />`:

```svelte
<QrCode
  data="https://example.com"
  size={320}
  errorCorrection="Q"
  foreground="#18181b"
  background="#fafafa"
  padding={6}
  label="Scan to verify booking"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `string` | *required* | Payload to encode (URL, text, UTF-8 OK) |
| `size` | `number` | `256` | SVG width and height in px |
| `errorCorrection` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Reed-Solomon redundancy — L ≈ 7%, M ≈ 15%, Q ≈ 25%, H ≈ 30% |
| `padding` | `number` | `4` | Quiet zone in modules (spec requires ≥ 4) |
| `foreground` | `string` | `'#000000'` | Dark module color (any CSS color) |
| `background` | `string` | `'#ffffff'` | Light module / background color |
| `label` | `string` | `` `QR code for: ${data}` `` | Screen-reader label |

The rendered SVG inherits its size from the `size` prop and has `shape-rendering="crispEdges"` set, so it stays sharp at any DPR. The wrapper `<div>` has `display: inline-block` and `line-height: 0` so it sits cleanly next to text.

## Encoder-only (no component)

If you need the matrix or SVG string directly — server-side rendering, canvas output, custom styling — the underlying functions are exported:

```ts
import { getQrMatrix, matrixToSvg } from '@nomideusz/svelte-qr';

// Returns a 2D boolean matrix: true = dark module, false = light
const matrix = getQrMatrix('https://example.com', { errorCorrection: 'H' });

// Render to SVG with the same options
const svg = matrixToSvg(matrix, { size: 512, foreground: '#003366' });

// Or roll your own renderer over the matrix
for (let r = 0; r < matrix.length; r++) {
  for (let c = 0; c < matrix[r].length; c++) {
    if (matrix[r][c]) drawDarkModule(r, c);
  }
}
```

Types:

```ts
type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';
type QrMatrix = boolean[][];

interface QrOptions {
  errorCorrection?: ErrorCorrection;
  padding?: number;
  foreground?: string;
  background?: string;
  size?: number;
}
```

## Raster output

`matrixToRaster()` is the pixel-output sibling of `matrixToSvg()` — it rasterizes a matrix to a single-channel greyscale bitmap (`0` = dark module, `255` = light) with the quiet zone already applied:

```ts
import { getQrMatrix, matrixToRaster } from '@nomideusz/svelte-qr';

const raster = matrixToRaster(getQrMatrix('https://example.com'), {
  scale: 8,   // pixels per QR module (default 8)
  padding: 4, // quiet zone in modules (default 4; the spec requires 4)
});
// { data: Uint8Array, width: number, height: number, channels: 1 }
```

The return shape (`QrRaster`) is exactly what raw-image encoders take, so the package stays zero-dependency — hand it to whatever encoder you already have:

```ts
await sharp(raster.data, {
  raw: { width: raster.width, height: raster.height, channels: raster.channels },
}).png().toBuffer();
```

Types exported from the main entry: `RasterOptions`, `QrRaster`.

## PNG output (server-side)

> **Server-only.** Requires `sharp`, an **optional** peer dependency: `pnpm add sharp`. The main entry never imports it — installing sharp is only needed if you import from `/png`. Consumers who only render SVG or the component install nothing.

For the common case — a PNG `Buffer` for an email attachment or an API response — the `@nomideusz/svelte-qr/png` subpath wraps `matrixToRaster` + sharp:

```ts
import { qrPng } from '@nomideusz/svelte-qr/png';

const png = await qrPng('https://example.com/verify/abc123', {
  scale: 8,             // pixels per QR module (default 8)
  padding: 4,           // quiet zone in modules
  errorCorrection: 'M', // default 'M'
}); // Promise<Buffer> — white background, black modules
```

```ts
interface QrPngOptions {
  scale?: number;
  padding?: number;
  errorCorrection?: ErrorCorrection;
}
function qrPng(data: string, options?: QrPngOptions): Promise<Buffer>;
```

## Choosing an error correction level

| Level | Recovers | Use for |
|-------|----------|---------|
| `L` | ~7% damage | Clean, well-lit prints where space matters |
| `M` | ~15% damage | **Default.** General-purpose: email, links, tickets |
| `Q` | ~25% damage | Outdoor signage, business cards, physical printing |
| `H` | ~30% damage | Branded QRs with a logo overlay, damaged surfaces, hostile environments |

Higher levels mean a denser matrix (smaller modules) at the same pixel size — so for small rendered sizes, lower levels scan more reliably. For URLs with a logo overlay in the center, `H` is what you want.

## Capacity

Byte mode is always used, so any UTF-8 string works. The encoder auto-picks the smallest QR version (1–40) that fits your payload at the chosen EC level. Approximate byte limits:

| EC | Max bytes |
|----|-----------|
| L | 2953 |
| M | 2331 |
| Q | 1663 |
| H | 1273 |

Exceeding capacity throws — catch and surface a user-friendly error:

```ts
try {
  const svg = matrixToSvg(getQrMatrix(longPayload));
} catch (err) {
  // "Data exceeds maximum QR capacity for error correction level H"
}
```

## SSR

Everything is pure functions over strings — no DOM, no canvas, no timers. `<QrCode />` renders identically on server and client, so you can use it anywhere SvelteKit runs.

## Styling

The component wrapper has the class `asini-qr`. Target it directly or with a global selector:

```css
:global(.asini-qr) {
  padding: 12px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}
```

For full control, generate the SVG string with `matrixToSvg()` and drop it wherever you like with `{@html svg}`.

## Development

```bash
pnpm install
pnpm dev             # SvelteKit dev server (demo)
pnpm check           # Typecheck
pnpm test            # Vitest
pnpm run package     # Build the library
```

## License

MIT
