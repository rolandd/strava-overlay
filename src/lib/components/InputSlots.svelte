<script lang="ts">
  import { Image as ImageIcon, Layers, ArrowLeftRight, X, RefreshCw } from '@lucide/svelte';
  import type { ImageItem } from '../types';

  let {
    baseItem,
    overlayItem,
    variant = 'cards',
    onSelectBase,
    onSelectOverlay,
    onRemoveBase,
    onRemoveOverlay,
    onSwapSlots
  }: {
    baseItem: ImageItem | null;
    overlayItem: ImageItem | null;
    variant?: 'cards' | 'compact' | 'sidebar';
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

<!-- Hidden File Inputs -->
<input
  bind:this={baseInput}
  type="file"
  accept="image/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
  onchange={handleBaseChange}
  class="hidden"
  id="base-file-input"
/>
<input
  bind:this={overlayInput}
  type="file"
  accept="image/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
  onchange={handleOverlayChange}
  class="hidden"
  id="overlay-file-input"
/>

{#if variant === 'compact'}
  <!-- Compact Floating Pill (Mobile Immersive Mode) -->
  <div
    class="flex items-center gap-1.5 bg-[#121217]/90 backdrop-blur-md border border-[#27272f] rounded-full px-2 py-1 shadow-lg"
  >
    <!-- Base thumbnail trigger -->
    {#if baseItem}
      <button
        onclick={() => baseInput?.click()}
        class="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition cursor-pointer text-left group"
        title="Change Base Photo"
      >
        <img
          src={baseItem.url}
          alt="Base"
          class="w-5 h-5 rounded-full object-cover border border-white/20"
        />
        <span
          class="text-[11px] font-medium text-zinc-300 group-hover:text-white max-w-[80px] truncate"
          >Photo</span
        >
      </button>
    {:else}
      <button
        onclick={() => baseInput?.click()}
        class="flex items-center gap-1 px-2 py-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer text-xs"
      >
        <ImageIcon class="w-3.5 h-3.5 text-[#fc4c02]" />
        <span>+ Photo</span>
      </button>
    {/if}

    <!-- Swap button -->
    {#if baseItem && overlayItem}
      <button
        onclick={onSwapSlots}
        class="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        title="Swap Photo and Overlay"
      >
        <ArrowLeftRight class="w-3 h-3" />
      </button>
    {:else}
      <span class="text-zinc-600 text-xs">•</span>
    {/if}

    <!-- Overlay thumbnail trigger -->
    {#if overlayItem}
      <button
        onclick={() => overlayInput?.click()}
        class="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition cursor-pointer text-left group"
        title="Change Overlay Graphic"
      >
        <img
          src={overlayItem.url}
          alt="Overlay"
          class="w-5 h-5 rounded-full object-contain bg-black/50 border border-white/20"
        />
        <span
          class="text-[11px] font-medium text-zinc-300 group-hover:text-white max-w-[80px] truncate"
          >Overlay</span
        >
      </button>
    {:else}
      <button
        onclick={() => overlayInput?.click()}
        class="flex items-center gap-1 px-2 py-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer text-xs"
      >
        <Layers class="w-3.5 h-3.5 text-[#fc4c02]" />
        <span>+ Overlay</span>
      </button>
    {/if}
  </div>
{:else if variant === 'sidebar'}
  <!-- Sidebar Mode (Desktop Inspector) -->
  <div class="space-y-2.5">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-zinc-300">Image Layers</span>
      {#if baseItem && overlayItem}
        <button
          onclick={onSwapSlots}
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1a1a22] hover:bg-[#252530] text-zinc-400 hover:text-zinc-200 text-[11px] font-medium transition cursor-pointer border border-[#27272f]"
          title="Swap Layers"
        >
          <ArrowLeftRight class="w-3 h-3 text-[#fc4c02]" />
          <span>Swap</span>
        </button>
      {/if}
    </div>

    <!-- Base Slot -->
    <div
      class="p-2.5 rounded-xl border border-[#27272f] bg-[#16161d] flex items-center justify-between gap-2"
    >
      {#if baseItem}
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={baseItem.url}
            alt="Base"
            class="w-10 h-10 rounded-lg object-cover border border-[#27272f] shrink-0"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-zinc-200 truncate">{baseItem.name}</p>
            <p class="text-[10px] text-zinc-400 font-mono">
              {baseItem.width}×{baseItem.height} • Base
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            onclick={() => baseInput?.click()}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-[#2c2c3a] text-zinc-300 hover:text-white transition cursor-pointer"
            title="Replace Base Photo"
          >
            <RefreshCw class="w-3.5 h-3.5" />
          </button>
          <button
            onclick={onRemoveBase}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
            title="Remove Base Photo"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      {:else}
        <button
          onclick={() => baseInput?.click()}
          class="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
        >
          <ImageIcon class="w-4 h-4 text-[#fc4c02]" />
          <span>Select Base Photo</span>
        </button>
      {/if}
    </div>

    <!-- Overlay Slot -->
    <div
      class="p-2.5 rounded-xl border border-[#27272f] bg-[#16161d] flex items-center justify-between gap-2"
    >
      {#if overlayItem}
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            class="w-10 h-10 rounded-lg bg-black/60 border border-[#27272f] flex items-center justify-center p-1 shrink-0"
          >
            <img src={overlayItem.url} alt="Overlay" class="w-full h-full object-contain" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-zinc-200 truncate">{overlayItem.name}</p>
            <p class="text-[10px] text-zinc-400 font-mono">
              {overlayItem.width}×{overlayItem.height} • Overlay
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            onclick={() => overlayInput?.click()}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-[#2c2c3a] text-zinc-300 hover:text-white transition cursor-pointer"
            title="Replace Overlay Graphic"
          >
            <RefreshCw class="w-3.5 h-3.5" />
          </button>
          <button
            onclick={onRemoveOverlay}
            class="p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
            title="Remove Overlay"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      {:else}
        <button
          onclick={() => overlayInput?.click()}
          class="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
        >
          <Layers class="w-4 h-4 text-[#fc4c02]" />
          <span>Select Strava Overlay PNG</span>
        </button>
      {/if}
    </div>
  </div>
{:else}
  <!-- Default Cards Mode (Onboarding / Missing Images) -->
  <div class="w-full max-w-4xl mx-auto px-3 sm:px-4 py-1 sm:py-2">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 relative">
      <!-- Slot 1: Base Photo -->
      <div
        class="relative flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all {baseItem
          ? 'bg-[#15151c] border-[#27272f]'
          : 'bg-[#121216]/80 border-dashed border-[#2f2f3a] hover:border-[#fc4c02]/50 hover:bg-[#15151c]'}"
      >
        {#if baseItem}
          <div class="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
            <div
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-black overflow-hidden shrink-0 border border-[#27272f] flex items-center justify-center"
            >
              <img src={baseItem.url} alt="Base thumbnail" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-white truncate">{baseItem.name}</span>
                <span
                  class="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono shrink-0"
                >
                  {baseItem.width}×{baseItem.height}
                </span>
              </div>
              <p class="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-0.5">
                1. Base Photo
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1.5">
            <button
              onclick={() => baseInput?.click()}
              class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#20202a] hover:bg-[#2a2a38] text-[11px] sm:text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              onclick={onRemoveBase}
              class="p-1 sm:p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Remove Base Photo"
            >
              <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        {:else}
          <button
            onclick={() => baseInput?.click()}
            class="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2 sm:py-3 text-left cursor-pointer group"
          >
            <div
              class="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 group-hover:text-[#fc4c02] group-hover:border-[#fc4c02]/40 transition-colors shrink-0"
            >
              <ImageIcon class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div
                class="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors"
              >
                1. Select Base Photo
              </div>
              <p class="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                Scenic ride or activity photo
              </p>
            </div>
          </button>
        {/if}
      </div>

      <!-- Slot 2: Overlay Graphic -->
      <div
        class="relative flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all {overlayItem
          ? 'bg-[#15151c] border-[#27272f]'
          : 'bg-[#121216]/80 border-dashed border-[#2f2f3a] hover:border-[#fc4c02]/50 hover:bg-[#15151c]'}"
      >
        {#if overlayItem}
          <div class="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
            <div
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-black/60 overflow-hidden shrink-0 border border-[#27272f] flex items-center justify-center p-1 bg-[radial-gradient(#27272f_1px,transparent_1px)] [background-size:6px_6px]"
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
                <span
                  class="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono shrink-0"
                >
                  {overlayItem.width}×{overlayItem.height}
                </span>
              </div>
              <p class="text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-0.5">
                2. Strava Overlay PNG
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1.5">
            <button
              onclick={() => overlayInput?.click()}
              class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#20202a] hover:bg-[#2a2a38] text-[11px] sm:text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              onclick={onRemoveOverlay}
              class="p-1 sm:p-1.5 rounded-lg bg-[#20202a] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Remove Overlay Graphic"
            >
              <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        {:else}
          <button
            onclick={() => overlayInput?.click()}
            class="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2 sm:py-3 text-left cursor-pointer group"
          >
            <div
              class="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 group-hover:text-[#fc4c02] group-hover:border-[#fc4c02]/40 transition-colors shrink-0"
            >
              <Layers class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div
                class="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors"
              >
                2. Select Overlay Graphic
              </div>
              <p class="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                Transparent stats badge or map
              </p>
            </div>
          </button>
        {/if}
      </div>

      <!-- Swap Button in cards mode -->
      {#if baseItem && overlayItem}
        <div
          class="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
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
{/if}
