<script lang="ts">
  import { Image as ImageIcon, Layers, ArrowLeftRight, X } from '@lucide/svelte';
  import type { ImageItem } from '../types';

  let {
    baseItem,
    overlayItem,
    onSelectBase,
    onSelectOverlay,
    onRemoveBase,
    onRemoveOverlay,
    onSwapSlots
  }: {
    baseItem: ImageItem | null;
    overlayItem: ImageItem | null;
    onSelectBase: (file: File) => void;
    onSelectOverlay: (file: File) => void;
    onRemoveBase: () => void;
    onRemoveOverlay: () => void;
    onSwapSlots: () => void;
  } = $props();

  let baseInput: HTMLInputElement;
  let overlayInput: HTMLInputElement;

  function handleBaseChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      onSelectBase(target.files[0]);
      target.value = '';
    }
  }

  function handleOverlayChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      onSelectOverlay(target.files[0]);
      target.value = '';
    }
  }
</script>

<div class="w-full max-w-4xl mx-auto px-4 py-2">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
    <!-- Hidden File Inputs -->
    <input
      bind:this={baseInput}
      type="file"
      accept="image/*"
      onchange={handleBaseChange}
      class="hidden"
      id="base-file-input"
    />
    <input
      bind:this={overlayInput}
      type="file"
      accept="image/*"
      onchange={handleOverlayChange}
      class="hidden"
      id="overlay-file-input"
    />

    <!-- Slot 1: Base Photo -->
    <div
      class="relative flex items-center justify-between p-3 rounded-xl border transition-all {baseItem
        ? 'bg-[#15151c] border-[#27272f]'
        : 'bg-[#121216]/60 border-dashed border-[#2f2f3a] hover:border-[#fc4c02]/50 hover:bg-[#15151c]'}"
    >
      {#if baseItem}
        <div class="flex items-center gap-3 overflow-hidden">
          <div
            class="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-[#27272f] flex items-center justify-center"
          >
            <img src={baseItem.url} alt="Base thumbnail" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-white truncate">{baseItem.name}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                {baseItem.width}×{baseItem.height}
              </span>
            </div>
            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">1. Base Photo</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onclick={() => baseInput?.click()}
            class="px-2.5 py-1.5 rounded-lg bg-[#20202a] hover:bg-[#2a2a38] text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
          >
            Replace
          </button>
          <button
            onclick={onRemoveBase}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Remove Base Photo"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      {:else}
        <button
          onclick={() => baseInput?.click()}
          class="w-full flex items-center justify-center gap-3 py-2 text-left cursor-pointer group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 group-hover:text-[#fc4c02] group-hover:border-[#fc4c02]/40 transition-colors"
          >
            <ImageIcon class="w-5 h-5" />
          </div>
          <div>
            <div
              class="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors"
            >
              1. Select Base Photo
            </div>
            <p class="text-[11px] text-zinc-400">Scenic ride or activity photo</p>
          </div>
        </button>
      {/if}
    </div>

    <!-- Slot 2: Overlay Graphic -->
    <div
      class="relative flex items-center justify-between p-3 rounded-xl border transition-all {overlayItem
        ? 'bg-[#15151c] border-[#27272f]'
        : 'bg-[#121216]/60 border-dashed border-[#2f2f3a] hover:border-[#fc4c02]/50 hover:bg-[#15151c]'}"
    >
      {#if overlayItem}
        <div class="flex items-center gap-3 overflow-hidden">
          <div
            class="w-12 h-12 rounded-lg bg-black/60 overflow-hidden shrink-0 border border-[#27272f] flex items-center justify-center p-1 bg-[radial-gradient(#27272f_1px,transparent_1px)] [background-size:6px_6px]"
          >
            <img
              src={overlayItem.url}
              alt="Overlay thumbnail"
              class="w-full h-full object-contain"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-white truncate">{overlayItem.name}</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                {overlayItem.width}×{overlayItem.height}
              </span>
            </div>
            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">2. Strava Overlay PNG</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onclick={() => overlayInput?.click()}
            class="px-2.5 py-1.5 rounded-lg bg-[#20202a] hover:bg-[#2a2a38] text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
          >
            Replace
          </button>
          <button
            onclick={onRemoveOverlay}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Remove Overlay Graphic"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      {:else}
        <button
          onclick={() => overlayInput?.click()}
          class="w-full flex items-center justify-center gap-3 py-2 text-left cursor-pointer group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 group-hover:text-[#fc4c02] group-hover:border-[#fc4c02]/40 transition-colors"
          >
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <div
              class="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors"
            >
              2. Select Overlay Graphic
            </div>
            <p class="text-[11px] text-zinc-400">Transparent stats badge or elevation map</p>
          </div>
        </button>
      {/if}
    </div>

    <!-- Swap Button (Visible when both loaded or on desktop) -->
    {#if baseItem && overlayItem}
      <div class="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <button
          onclick={onSwapSlots}
          class="w-8 h-8 rounded-full bg-[#1e1e28] hover:bg-[#fc4c02] text-zinc-300 hover:text-white border border-[#2f2f3a] shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Swap base photo and overlay"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
        </button>
      </div>
    {/if}
  </div>
</div>
