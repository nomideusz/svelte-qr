<script lang="ts">
	import { QrCode, getQrMatrix, matrixToSvg, type ErrorCorrection } from '$lib/index.js';

	// ── Playground state ────────────────────────────────
	let data = $state('https://github.com/nomideusz/svelte-qr');
	let size = $state(256);
	let errorCorrection = $state<ErrorCorrection>('M');
	let padding = $state(4);
	let foreground = $state('#18181b');
	let background = $state('#ffffff');

	const EC_LEVELS: Array<{ value: ErrorCorrection; label: string; recovery: string }> = [
		{ value: 'L', label: 'L', recovery: '~7%' },
		{ value: 'M', label: 'M', recovery: '~15%' },
		{ value: 'Q', label: 'Q', recovery: '~25%' },
		{ value: 'H', label: 'H', recovery: '~30%' },
	];

	const PAYLOAD_PRESETS = [
		{ label: 'URL', value: 'https://github.com/nomideusz/svelte-qr' },
		{ label: 'Email', value: 'mailto:hi@example.com' },
		{ label: 'Tel', value: 'tel:+48501234567' },
		{ label: 'WiFi', value: 'WIFI:T:WPA;S:MyNetwork;P:secret123;;' },
		{ label: 'SMS', value: 'SMSTO:+48501234567:Hello!' },
		{ label: 'Text', value: 'Hello from svelte-qr' },
		{ label: 'Unicode', value: 'Zażółć gęślą jaźń 🎉' },
	];

	const COLOR_PRESETS = [
		{ fg: '#18181b', bg: '#ffffff', label: 'Classic' },
		{ fg: '#0891b2', bg: '#ecfeff', label: 'Cyan' },
		{ fg: '#7c3aed', bg: '#faf5ff', label: 'Violet' },
		{ fg: '#dc2626', bg: '#fef2f2', label: 'Red' },
		{ fg: '#16a34a', bg: '#f0fdf4', label: 'Green' },
		{ fg: '#ffffff', bg: '#0f172a', label: 'Inverted' },
	];

	// ── Computed stats ──────────────────────────────────
	const matrix = $derived.by(() => {
		try {
			return getQrMatrix(data, { errorCorrection });
		} catch {
			return null;
		}
	});
	const modules = $derived(matrix?.length ?? 0);
	const version = $derived(modules === 0 ? 0 : (modules - 21) / 4 + 1);
	const byteLength = $derived.by(() => {
		if (typeof TextEncoder === 'undefined') return data.length;
		return new TextEncoder().encode(data).length;
	});
	const error = $derived(matrix === null);

	// Inline SVG string preview (truncated)
	const svgString = $derived.by(() => {
		if (!matrix) return '';
		try {
			return matrixToSvg(matrix, { size: 128, foreground, background, padding });
		} catch {
			return '';
		}
	});
	const svgPreview = $derived(
		svgString.length > 240 ? svgString.slice(0, 240) + '…' : svgString,
	);

	const CAPACITY: Record<ErrorCorrection, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };
	const capacityUsage = $derived((byteLength / CAPACITY[errorCorrection]) * 100);

	const SCRIPT_OPEN = '<' + 'script>';
	const SCRIPT_CLOSE = '</' + 'script>';
	const usageSnippet = $derived(
		`${SCRIPT_OPEN}
  import { QrCode } from '@nomideusz/svelte-qr';
${SCRIPT_CLOSE}

<QrCode
  data=${JSON.stringify(data.length > 60 ? data.slice(0, 57) + '…' : data)}
  size={${size}}
  errorCorrection="${errorCorrection}"
  padding={${padding}}
  foreground="${foreground}"
  background="${background}"
/>`,
	);
</script>

<svelte:head>
	<title>svelte-qr — Demo</title>
</svelte:head>

<main>
	<section class="hero">
		<h1>QR codes for Svelte 5</h1>
		<p class="lead">
			Zero-dependency. Pure-TypeScript encoder. SVG output. One component, one API, works everywhere SvelteKit does.
		</p>
		<div class="install">
			<code>pnpm add @nomideusz/svelte-qr</code>
		</div>
	</section>

	<!-- ═══ Main playground ════════════════════════════════ -->
	<section class="card">
		<header class="card-hd">
			<h2>Playground</h2>
			<span class="hd-meta">edit anything → regenerates instantly</span>
		</header>

		<div class="playground">
			<div class="controls">
				<div class="input-box">
					<label for="p-data">Data</label>
					<textarea id="p-data" bind:value={data} rows="3"></textarea>
					<div class="presets-inline">
						{#each PAYLOAD_PRESETS as p}
							<button class="preset" onclick={() => (data = p.value)}>{p.label}</button>
						{/each}
					</div>
				</div>

				<div class="row two-col">
					<div class="input-box" role="group" aria-label="Error correction level">
						<span class="faux-label">Error correction</span>
						<div class="seg">
							{#each EC_LEVELS as ec}
								<button
									class="seg-btn"
									class:seg-btn--active={errorCorrection === ec.value}
									onclick={() => (errorCorrection = ec.value)}
									title="{ec.label} — recovers {ec.recovery}"
								>
									{ec.label}
								</button>
							{/each}
						</div>
						<span class="hint">
							{EC_LEVELS.find((e) => e.value === errorCorrection)?.recovery} recovery
						</span>
					</div>

					<div class="input-box">
						<label for="p-size">Size: <code>{size}px</code></label>
						<input id="p-size" type="range" min="128" max="512" step="16" bind:value={size} />
					</div>
				</div>

				<div class="row two-col">
					<div class="input-box">
						<label for="p-padding">Quiet zone: <code>{padding} modules</code></label>
						<input id="p-padding" type="range" min="0" max="10" step="1" bind:value={padding} />
						{#if padding < 4}
							<span class="hint hint-warn">Spec recommends ≥ 4</span>
						{/if}
					</div>

					<div class="row two-col">
						<div class="input-box">
							<label for="p-fg">Foreground</label>
							<div class="color-row">
								<input id="p-fg" type="color" bind:value={foreground} />
								<input type="text" bind:value={foreground} class="color-text" />
							</div>
						</div>
						<div class="input-box">
							<label for="p-bg">Background</label>
							<div class="color-row">
								<input id="p-bg" type="color" bind:value={background} />
								<input type="text" bind:value={background} class="color-text" />
							</div>
						</div>
					</div>
				</div>

				<div class="presets-inline">
					{#each COLOR_PRESETS as p}
						<button
							class="color-preset"
							onclick={() => {
								foreground = p.fg;
								background = p.bg;
							}}
							style:--fg={p.fg}
							style:--bg={p.bg}
							title={p.label}
						>
							<span class="color-preset-swatch"></span>
							<span>{p.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="preview">
				<div class="preview-frame" style:background={background}>
					{#if error}
						<div class="preview-error">
							<strong>Cannot encode</strong>
							<span>Payload exceeds the max QR capacity at EC level {errorCorrection}. Lower the EC level or shorten the data.</span>
						</div>
					{:else}
						<QrCode {data} {size} {errorCorrection} {padding} {foreground} {background} />
					{/if}
				</div>

				<div class="stats">
					<div class="stat">
						<span class="stat-label">Version</span>
						<code class="stat-val">{error ? '—' : version}</code>
					</div>
					<div class="stat">
						<span class="stat-label">Modules</span>
						<code class="stat-val">{error ? '—' : `${modules}×${modules}`}</code>
					</div>
					<div class="stat">
						<span class="stat-label">Bytes</span>
						<code class="stat-val">{byteLength}</code>
					</div>
					<div class="stat">
						<span class="stat-label">Capacity</span>
						<code class="stat-val">{capacityUsage.toFixed(0)}%</code>
						<div class="bar">
							<div
								class="bar-fill"
								class:bar-fill--warn={capacityUsage > 80 && capacityUsage <= 100}
								class:bar-fill--err={capacityUsage > 100}
								style:width="{Math.min(capacityUsage, 100)}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ SVG string output ══════════════════════════════ -->
	<section class="card">
		<header class="card-hd">
			<h2><code>matrixToSvg()</code> output</h2>
			<span class="hd-meta">use directly with <code>{'{@html svg}'}</code> — no component needed</span>
		</header>

		<pre class="snippet">{svgPreview || '(empty)'}</pre>

		<p class="note">
			Total length: <code>{svgString.length}</code> bytes. Each dark module is a single <code>&lt;rect&gt;</code>;
			the outer <code>&lt;svg&gt;</code> has <code>shape-rendering="crispEdges"</code> so it stays sharp at any DPR.
		</p>
	</section>

	<!-- ═══ Code snippet ═══════════════════════════════════ -->
	<section class="card">
		<header class="card-hd">
			<h2>Use it</h2>
			<span class="hd-meta">matches the current playground settings</span>
		</header>

		<pre class="snippet">{usageSnippet}</pre>
	</section>

	<section class="cta">
		<p>Full API and SSR notes in the <a href="/docs">docs</a>.</p>
	</section>
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 24px 24px 80px;
	}
	@media (max-width: 600px) {
		main {
			padding: 16px 16px 48px;
		}
	}

	.hero {
		text-align: center;
		padding: 32px 0 40px;
	}
	.hero h1 {
		font: 700 34px/1.15 'Outfit', system-ui, sans-serif;
		margin: 0 0 14px;
		letter-spacing: -0.02em;
		color: var(--text);
	}
	.hero .lead {
		font: 400 15px/1.6 'Outfit', system-ui, sans-serif;
		color: var(--text-2);
		max-width: 640px;
		margin: 0 auto 24px;
	}
	.install {
		display: inline-block;
		padding: 10px 18px;
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		background: var(--surface);
	}
	.install code {
		font-family: ui-monospace, 'Cascadia Code', monospace;
		font-size: 13px;
		color: var(--text);
	}
	@media (max-width: 600px) {
		.hero {
			padding: 16px 0 24px;
		}
		.hero h1 {
			font-size: 24px;
		}
	}

	/* ─── Card ─────────────────────────────────────────── */
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
	}
	.card-hd {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px 14px;
		margin-bottom: 18px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--border);
	}
	.card-hd h2 {
		font: 600 16px/1.3 'Outfit', system-ui, sans-serif;
		margin: 0;
		color: var(--text);
	}
	.card-hd h2 code {
		font: 500 15px/1.3 ui-monospace, 'Cascadia Code', monospace;
		color: var(--accent);
		background: none;
		padding: 0;
	}
	.hd-meta {
		font: 400 11px/1.3 ui-monospace, 'Cascadia Code', monospace;
		color: var(--text-3);
	}
	.hd-meta code {
		font: 500 11px/1.3 ui-monospace, 'Cascadia Code', monospace;
		color: var(--text-2);
		background: var(--surface-2);
		padding: 1px 5px;
		border-radius: 3px;
	}

	/* ─── Playground layout ────────────────────────────── */
	.playground {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 24px;
	}
	@media (max-width: 800px) {
		.playground {
			grid-template-columns: 1fr;
		}
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
	}
	.row.two-col > .input-box,
	.row.two-col > .row {
		flex: 1;
		min-width: 140px;
	}
	.input-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.input-box label,
	.input-box .faux-label {
		font: 600 10px/1 'Outfit', system-ui, sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-3);
	}
	.input-box label code {
		font: 500 11px/1 ui-monospace, 'Cascadia Code', monospace;
		background: none;
		padding: 0;
		color: var(--text-2);
		text-transform: none;
		letter-spacing: 0;
	}
	.input-box input[type='text'],
	.input-box textarea {
		padding: 8px 11px;
		border: 1px solid var(--border-strong);
		background: var(--surface-2);
		color: var(--text);
		border-radius: 6px;
		font: 400 13px/1.4 ui-monospace, 'Cascadia Code', monospace;
		outline: none;
		transition: border-color 120ms, background 120ms;
		resize: vertical;
	}
	.input-box input:focus,
	.input-box textarea:focus {
		border-color: var(--accent);
		background: var(--bg);
	}
	.input-box input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}
	.hint {
		font: 400 11px/1.2 'Outfit', system-ui, sans-serif;
		color: var(--text-3);
	}
	.hint-warn {
		color: #fbbf24;
	}

	/* ─── Color inputs ─────────────────────────────────── */
	.color-row {
		display: flex;
		gap: 6px;
		align-items: stretch;
	}
	.color-row input[type='color'] {
		width: 38px;
		height: 32px;
		padding: 0;
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		background: var(--surface-2);
		cursor: pointer;
	}
	.color-text {
		flex: 1;
		min-width: 0;
		font-size: 12px !important;
	}

	/* ─── Segment control ──────────────────────────────── */
	.seg {
		display: flex;
		gap: 0;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		overflow: hidden;
		width: max-content;
	}
	.seg-btn {
		padding: 7px 14px;
		background: transparent;
		border: none;
		color: var(--text-2);
		font: 600 12px/1 'Outfit', system-ui, sans-serif;
		cursor: pointer;
		transition: color 120ms, background 120ms;
	}
	.seg-btn:hover {
		color: var(--text);
	}
	.seg-btn--active {
		background: var(--accent-dim);
		color: var(--accent);
	}

	/* ─── Presets ──────────────────────────────────────── */
	.presets-inline {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 4px;
	}
	.preset {
		padding: 4px 9px;
		background: transparent;
		border: 1px solid var(--border-strong);
		border-radius: 5px;
		font: 500 11px/1.2 'Outfit', system-ui, sans-serif;
		color: var(--text-2);
		cursor: pointer;
		transition: all 120ms;
	}
	.preset:hover {
		color: var(--text);
		border-color: var(--accent);
		background: var(--accent-dim);
	}

	.color-preset {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px 4px 5px;
		background: transparent;
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		font: 500 11px/1 'Outfit', system-ui, sans-serif;
		color: var(--text-2);
		cursor: pointer;
		transition: all 120ms;
	}
	.color-preset:hover {
		color: var(--text);
		border-color: var(--accent);
	}
	.color-preset-swatch {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: linear-gradient(135deg, var(--bg) 50%, var(--fg) 50%);
	}

	/* ─── Preview ──────────────────────────────────────── */
	.preview {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.preview-frame {
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 280px;
		transition: background 180ms;
	}
	.preview-error {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 20px;
		text-align: center;
		color: #7f1d1d;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 8px;
		max-width: 260px;
	}
	.preview-error strong {
		font: 600 13px/1.2 'Outfit', system-ui, sans-serif;
		color: #b91c1c;
	}
	.preview-error span {
		font: 400 12px/1.5 'Outfit', system-ui, sans-serif;
	}

	/* ─── Stats ────────────────────────────────────────── */
	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	.stat {
		padding: 8px 10px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 7px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.stat-label {
		font: 600 9.5px/1 'Outfit', system-ui, sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-3);
	}
	.stat-val {
		font: 500 13px/1.2 ui-monospace, 'Cascadia Code', monospace;
		color: var(--text);
	}
	.bar {
		height: 3px;
		background: var(--surface);
		border-radius: 2px;
		overflow: hidden;
		margin-top: 2px;
	}
	.bar-fill {
		height: 100%;
		background: var(--accent);
		transition: width 180ms ease;
	}
	.bar-fill--warn {
		background: #fbbf24;
	}
	.bar-fill--err {
		background: #ef4444;
	}

	/* ─── Snippet ──────────────────────────────────────── */
	.snippet {
		margin: 0;
		padding: 12px 14px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 7px;
		font: 400 12px/1.55 ui-monospace, 'Cascadia Code', monospace;
		color: var(--text-2);
		overflow-x: auto;
		white-space: pre;
	}
	.note {
		font: 400 12.5px/1.5 'Outfit', system-ui, sans-serif;
		color: var(--text-2);
		margin: 10px 0 0;
	}
	.note code {
		font: 500 11.5px/1 ui-monospace, 'Cascadia Code', monospace;
		background: var(--surface-2);
		padding: 1px 5px;
		border-radius: 3px;
		color: var(--text);
	}

	/* ─── CTA ──────────────────────────────────────────── */
	.cta {
		text-align: center;
		padding: 24px 0 0;
		font: 400 14px/1.5 'Outfit', system-ui, sans-serif;
		color: var(--text-2);
	}
	.cta a {
		color: var(--accent);
		border-bottom: 1px solid var(--accent-glow);
	}
	.cta a:hover {
		border-bottom-color: var(--accent);
	}
</style>
