<script lang="ts">
  import type { QrOptions } from '../core/types.js';
  import { getQrMatrix } from '../core/encoder.js';
  import { matrixToSvg } from '../core/svg.js';
  import { downloadQrPng } from '../core/download.js';

  interface Props extends QrOptions {
    data: string;
    /** Accessible label for screen readers */
    label?: string;
    /** Tap/click opens the code near-fullscreen — a 160px QR on a laptop is
     *  a coin flip for a phone camera; the same code at 80vmin is not. */
    enlargeable?: boolean;
    /** Show a "download PNG" action under the code. */
    downloadable?: boolean;
    /** Filename for the downloaded PNG (".png" appended if missing). */
    downloadName?: string;
    /** UI strings, overridable for i18n. */
    enlargeLabel?: string;
    downloadLabel?: string;
    closeLabel?: string;
  }

  let {
    data,
    label,
    enlargeable = false,
    downloadable = false,
    downloadName = 'qr-code',
    enlargeLabel = 'Enlarge QR code',
    downloadLabel = 'Download PNG',
    closeLabel = 'Close',
    ...options
  }: Props = $props();

  const svg = $derived(matrixToSvg(getQrMatrix(data, options), options));
  let dialog: HTMLDialogElement | undefined = $state();
</script>

{#if enlargeable}
  <button type="button" class="asini-qr-enlarge" aria-label={enlargeLabel} onclick={() => dialog?.showModal()}>
    <div class="asini-qr" role="img" aria-label={label ?? `QR code for: ${data}`}>
      {@html svg}
    </div>
  </button>
  <!-- Backdrop click closes: the dialog element itself is only hit outside the panel. -->
  <dialog
    class="asini-qr-dialog"
    bind:this={dialog}
    aria-label={label ?? `QR code for: ${data}`}
    onclick={(e) => e.target === dialog && dialog?.close()}
  >
    <div class="asini-qr-dialog-panel">
      <div class="asini-qr asini-qr--large" role="img" aria-label={label ?? `QR code for: ${data}`}>
        {@html svg}
      </div>
      <div class="asini-qr-actions">
        {#if downloadable}
          <button type="button" class="asini-qr-action" onclick={() => downloadQrPng(data, downloadName, options)}>
            {downloadLabel}
          </button>
        {/if}
        <button type="button" class="asini-qr-action" onclick={() => dialog?.close()}>{closeLabel}</button>
      </div>
    </div>
  </dialog>
{:else}
  <div class="asini-qr" role="img" aria-label={label ?? `QR code for: ${data}`}>
    {@html svg}
  </div>
{/if}

{#if downloadable}
  <button type="button" class="asini-qr-action asini-qr-download" onclick={() => downloadQrPng(data, downloadName, options)}>
    {downloadLabel}
  </button>
{/if}

<style>
  .asini-qr {
    display: inline-block;
    line-height: 0;
  }
  .asini-qr :global(svg) {
    display: block;
  }
  .asini-qr-enlarge {
    display: inline-block;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
    line-height: 0;
  }
  .asini-qr-dialog {
    padding: 0;
    border: 0;
    background: transparent;
    max-width: 100vw;
    max-height: 100vh;
  }
  .asini-qr-dialog::backdrop {
    background: rgb(0 0 0 / 0.6);
  }
  .asini-qr-dialog-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border-radius: 0.5rem;
  }
  /* viewBox does the scaling; the attrs' fixed px only cap the inline view. */
  .asini-qr--large :global(svg) {
    width: min(80vmin, 32rem);
    height: auto;
  }
  .asini-qr-actions {
    display: flex;
    gap: 0.5rem;
  }
  .asini-qr-action {
    font: inherit;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid currentcolor;
    border-radius: 0.375rem;
    background: none;
    cursor: pointer;
  }
  .asini-qr-download {
    margin-top: 0.5rem;
  }
</style>
