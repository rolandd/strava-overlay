<script lang="ts">
  import { Share2, Download, Loader2, Trash2, Sliders } from '@lucide/svelte';

  let {
    isRendering = false,
    hasBothImages = false,
    mode = 'floating',
    isFineTuningOpen = false,
    onToggleFineTuning = () => {},
    onExport = () => {},
    onDownloadDirect = () => {},
    onClearAll = () => {}
  }: {
    isRendering?: boolean;
    hasBothImages?: boolean;
    mode?: 'floating' | 'sidebar' | 'inline';
    isFineTuningOpen?: boolean;
    onToggleFineTuning?: () => void;
    onExport?: () => void;
    onDownloadDirect?: () => void;
    onClearAll?: () => void;
  } = $props();

  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;
</script>

{#if mode === 'sidebar'}
  <!-- Desktop Inspector Sidebar Dock -->
  <div class="space-y-2 pt-2 border-t border-[#27272f]">
    <div class="flex items-center gap-2">
      {#if canWebShare}
        <button
          onclick={onExport}
          disabled={!hasBothImages || isRendering}
          class="flex-1 py-3 px-4 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {#if isRendering}
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Rendering...</span>
          {:else}
            <Share2 class="w-4 h-4" />
            <span>Share Composite</span>
          {/if}
        </button>

        <button
          onclick={onDownloadDirect}
          disabled={!hasBothImages || isRendering}
          class="p-3 rounded-xl bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 disabled:pointer-events-none text-zinc-200 hover:text-white border border-[#2e2e3a] transition-all active:scale-95 cursor-pointer shrink-0"
          title="Save file directly"
        >
          <Download class="w-4 h-4" />
        </button>
      {:else}
        <button
          onclick={onDownloadDirect}
          disabled={!hasBothImages || isRendering}
          class="flex-1 py-3 px-4 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {#if isRendering}
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          {:else}
            <Download class="w-4 h-4" />
            <span>Download Composite</span>
          {/if}
        </button>
      {/if}

      <button
        onclick={onClearAll}
        disabled={!hasBothImages || isRendering}
        class="p-3 rounded-xl bg-[#181820] hover:bg-[#252530] disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-zinc-200 border border-[#27272f] transition-all cursor-pointer shrink-0"
        title="Reset & Clear workspace"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
{:else if mode === 'floating'}
  <!-- Mobile Immersive Floating Dock -->
  <div
    class="fixed bottom-safe left-1/2 -translate-x-1/2 z-40 max-w-sm w-[calc(100%-2rem)] bg-[#121217]/95 backdrop-blur-md border border-[#27272f] rounded-2xl p-2 shadow-2xl flex items-center gap-2"
  >
    <!-- Fine Tune Drawer Trigger Button -->
    <button
      onclick={onToggleFineTuning}
      disabled={!hasBothImages}
      class="px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 {isFineTuningOpen
        ? 'bg-[#fc4c02]/20 border-[#fc4c02] text-[#fc4c02]'
        : 'bg-[#181820] hover:bg-[#252530] border-[#27272f] text-zinc-300'}"
      title="Fine-tune adjustments"
      aria-label="Fine tuning adjustments"
    >
      <Sliders class="w-4 h-4" />
      <span class="text-xs font-semibold">Tune</span>
    </button>

    <!-- 1-Click Primary Action -->
    <div class="flex-1 flex items-center gap-1.5 min-w-0">
      {#if canWebShare}
        <button
          onclick={onExport}
          disabled={!hasBothImages || isRendering}
          class="flex-1 py-2.5 px-3 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 truncate"
        >
          {#if isRendering}
            <Loader2 class="w-3.5 h-3.5 animate-spin shrink-0" />
            <span class="truncate">Rendering...</span>
          {:else}
            <Share2 class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">Share</span>
          {/if}
        </button>

        <button
          onclick={onDownloadDirect}
          disabled={!hasBothImages || isRendering}
          class="p-2.5 rounded-xl bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-300 hover:text-white border border-[#2e2e3a] transition cursor-pointer shrink-0"
          title="Save file directly"
        >
          <Download class="w-3.5 h-3.5" />
        </button>
      {:else}
        <button
          onclick={onDownloadDirect}
          disabled={!hasBothImages || isRendering}
          class="flex-1 py-2.5 px-3 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 truncate"
        >
          {#if isRendering}
            <Loader2 class="w-3.5 h-3.5 animate-spin shrink-0" />
            <span class="truncate">Rendering...</span>
          {:else}
            <Download class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">Download</span>
          {/if}
        </button>
      {/if}
    </div>

    <!-- Reset / Clear Button -->
    <button
      onclick={onClearAll}
      disabled={!hasBothImages || isRendering}
      class="p-2.5 rounded-xl bg-[#181820] hover:bg-[#252530] disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-zinc-200 border border-[#27272f] transition-all cursor-pointer shrink-0"
      title="Clear Workspace"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
{:else}
  <!-- Inline / Default Bar -->
  <div class="w-full max-w-4xl mx-auto px-4 py-3 bg-[#121216] border-t border-[#27272f]">
    <div class="flex items-center justify-between gap-3">
      <button
        onclick={onClearAll}
        disabled={!hasBothImages || isRendering}
        class="px-3 py-2.5 rounded-xl bg-[#181820] hover:bg-[#252530] disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-zinc-200 border border-[#27272f] transition cursor-pointer flex items-center gap-1.5 shrink-0"
      >
        <Trash2 class="w-4 h-4" />
        <span class="text-xs font-medium">Clear</span>
      </button>

      <div class="flex-1 flex items-center gap-2 max-w-md ml-auto">
        {#if canWebShare}
          <button
            onclick={onExport}
            disabled={!hasBothImages || isRendering}
            class="flex-1 py-2.5 px-4 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {#if isRendering}
              <Loader2 class="w-4 h-4 animate-spin" />
              <span>Rendering...</span>
            {:else}
              <Share2 class="w-4 h-4" />
              <span>Share Composite</span>
            {/if}
          </button>

          <button
            onclick={onDownloadDirect}
            disabled={!hasBothImages || isRendering}
            class="p-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#282834] disabled:opacity-40 text-zinc-200 hover:text-white border border-[#2e2e3a] transition cursor-pointer shrink-0"
            title="Download directly"
          >
            <Download class="w-4 h-4" />
          </button>
        {:else}
          <button
            onclick={onDownloadDirect}
            disabled={!hasBothImages || isRendering}
            class="flex-1 py-2.5 px-4 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#fc4c02]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {#if isRendering}
              <Loader2 class="w-4 h-4 animate-spin" />
              <span>Rendering...</span>
            {:else}
              <Download class="w-4 h-4" />
              <span>Download Composite</span>
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
