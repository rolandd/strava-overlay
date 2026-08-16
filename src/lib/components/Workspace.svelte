<script lang="ts">
  import { ImagePlus, Hand, RotateCw } from '@lucide/svelte';
  import type { BaseImageAdjustments, ImageItem, OverlayTransform } from '../types';
  import { gestureHandler } from '../utils/gestures';
  import type { ViewportDimensions } from '../utils/presets';

  let {
    baseItem,
    overlayItem,
    transform,
    adjustments,
    isRotatedView = false,
    onToggleRotatedView = () => {},
    onUpdateTransform = () => {},
    onDropFiles = () => {},
    onDimensionsChange = () => {}
  }: {
    baseItem: ImageItem | null;
    overlayItem: ImageItem | null;
    transform: OverlayTransform;
    adjustments: BaseImageAdjustments;
    isRotatedView?: boolean;
    onToggleRotatedView?: () => void;
    onUpdateTransform?: (t: Partial<OverlayTransform>) => void;
    onDropFiles?: (files: File[]) => void;
    onDimensionsChange?: (dims: ViewportDimensions) => void;
  } = $props();

  let containerEl = $state<HTMLElement>();
  let containerWidth = $state<number>(0);
  let containerHeight = $state<number>(0);
  let isDragOver = $state<boolean>(false);
  let isInteracting = $state<boolean>(false);

  // Overlay default base size in viewport
  let overlayBaseWidth = $derived(containerWidth > 0 ? containerWidth * 0.85 : 300);

  let overlayBaseHeight = $derived(
    overlayItem && overlayItem.aspectRatio > 0
      ? overlayBaseWidth / overlayItem.aspectRatio
      : overlayBaseWidth
  );

  // Container display aspect ratio based on base photo and crop setting
  let displayAspectRatio = $derived.by(() => {
    if (adjustments.cropAspectRatio === '1:1') return '1 / 1';
    if (adjustments.cropAspectRatio === '4:5') return '4 / 5';
    if (adjustments.cropAspectRatio === '16:9') return '16 / 9';
    if (baseItem && baseItem.aspectRatio > 0) return `${baseItem.aspectRatio}`;
    return '4 / 3';
  });

  // CSS filter string for base photo preview
  let baseImageFilter = $derived(
    `brightness(${adjustments.brightness}) contrast(${adjustments.contrast}) saturate(${adjustments.saturation})`
  );

  let isLandscapePhoto = $derived(baseItem ? baseItem.aspectRatio > 1.15 : false);

  // Notify parent whenever container or overlay dimensions change
  $effect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      onDimensionsChange({
        containerWidth,
        containerHeight,
        overlayBaseWidth,
        overlayBaseHeight
      });
    }
  });

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;

    if (e.dataTransfer) {
      const files: File[] = [];
      if (e.dataTransfer.files) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const f = e.dataTransfer.files[i];
          if (f.type.startsWith('image/')) files.push(f);
        }
      }
      if (files.length > 0) {
        onDropFiles(files);
      }
    }
  }

  function handleOverlayKeyDown(e: KeyboardEvent) {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onUpdateTransform({ x: transform.x - step });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onUpdateTransform({ x: transform.x + step });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onUpdateTransform({ y: transform.y - step });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onUpdateTransform({ y: transform.y + step });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      onUpdateTransform({ scale: Math.min(5.0, transform.scale + 0.05) });
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      onUpdateTransform({ scale: Math.max(0.1, transform.scale - 0.05) });
    }
  }
</script>

<div
  class="w-full h-full flex flex-col items-center justify-center p-1 sm:p-4 select-none min-h-0 relative overflow-hidden"
>
  <!-- Virtual 90° Rotatable Stage Container -->
  <div
    class="relative flex items-center justify-center transition-transform duration-300 ease-out {isRotatedView
      ? 'rotate-90 scale-[0.95]'
      : ''}"
    style="width: 100%; height: 100%; max-width: 100%; max-height: 100%;"
  >
    <div
      bind:this={containerEl}
      bind:clientWidth={containerWidth}
      bind:clientHeight={containerHeight}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      role="region"
      aria-label="Image compositing workspace"
      style="aspect-ratio: {displayAspectRatio}; max-height: calc(100% - 0.5rem);"
      class="relative w-auto h-auto max-w-full max-h-full mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl border transition-all flex items-center justify-center {isDragOver
        ? 'border-[#fc4c02] ring-4 ring-[#fc4c02]/30 scale-[1.01]'
        : 'border-[#27272f]'}"
    >
      <!-- 1. Drop Zone Overlay (when dragging files over) -->
      {#if isDragOver}
        <div
          class="absolute inset-0 z-40 bg-[#09090b]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#fc4c02]"
        >
          <ImagePlus class="w-12 h-12 text-[#fc4c02] animate-bounce mb-3" />
          <p class="text-sm font-bold text-white">Drop Photo or Overlay Here</p>
          <p class="text-xs text-zinc-400 mt-1">Automatic format assignment</p>
        </div>
      {/if}

      <!-- 2. Base Image Layer -->
      {#if baseItem}
        <img
          src={baseItem.url}
          alt="Base photograph"
          style="filter: {baseImageFilter};"
          class="w-full h-full object-cover pointer-events-none transition-[filter] duration-75"
        />
      {:else}
        <!-- Empty State -->
        <div
          class="w-full h-full min-h-[260px] sm:min-h-[340px] flex flex-col items-center justify-center p-8 text-center bg-[#101014]"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 mb-4 shadow-inner"
          >
            <ImagePlus class="w-8 h-8 text-[#fc4c02]" />
          </div>
          <h3 class="text-sm font-semibold text-zinc-200">No Photo Loaded</h3>
          <p class="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
            Select a photo, drop an image here, or share directly from Strava / Google Photos.
          </p>
        </div>
      {/if}

      <!-- 3. Overlay Layer -->
      {#if overlayItem && baseItem}
        <div
          use:gestureHandler={{
            getTransform: () => transform,
            onUpdate: (t) => onUpdateTransform(t),
            viewRotationAngle: isRotatedView ? 90 : 0
          }}
          onpointerdown={() => (isInteracting = true)}
          onpointerup={() => (isInteracting = false)}
          onpointercancel={() => (isInteracting = false)}
          onkeydown={handleOverlayKeyDown}
          tabindex="0"
          role="button"
          aria-label="Interactive Strava overlay graphic"
          style="
            width: {overlayBaseWidth}px;
            height: {overlayBaseHeight}px;
            transform: translate3d({transform.x}px, {transform.y}px, 0px) rotate({transform.angle}deg) scale({transform.scale});
          "
          class="absolute touch-none cursor-grab active:cursor-grabbing origin-center will-change-transform z-20 outline-none"
        >
          <!-- Bounding outline during interaction -->
          <div
            class="w-full h-full relative transition-all rounded-lg {isInteracting
              ? 'ring-2 ring-[#fc4c02] shadow-[0_0_20px_rgba(252,76,2,0.4)]'
              : 'hover:ring-1 hover:ring-white/40'}"
          >
            <img
              src={overlayItem.url}
              alt="Overlay graphic"
              class="w-full h-full object-contain pointer-events-none drop-shadow-md"
            />

            {#if isInteracting}
              <div
                class="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-700 whitespace-nowrap pointer-events-none shadow-md"
              >
                {Math.round(transform.scale * 100)}% • {Math.round(transform.angle)}°
              </div>
            {/if}
          </div>
        </div>
      {:else if baseItem && !overlayItem}
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            class="bg-black/80 backdrop-blur-xs border border-zinc-700/60 px-4 py-2.5 rounded-xl text-center shadow-lg"
          >
            <p class="text-xs font-medium text-zinc-200">Base photo ready</p>
            <p class="text-[11px] text-[#fc4c02] font-semibold mt-0.5">Select an overlay graphic</p>
          </div>
        </div>
      {/if}

      <!-- Gesture Hint Badge -->
      {#if baseItem && overlayItem}
        <div
          class="absolute bottom-2 left-2 pointer-events-none z-30 opacity-60 hover:opacity-100 transition-opacity"
        >
          <div
            class="bg-black/70 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] text-zinc-300 border border-white/10 flex items-center gap-1.5"
          >
            <Hand class="w-3 h-3 text-[#fc4c02]" />
            <span>Touch or Drag</span>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Floating Quick Rotate View Button for Landscape Photos on Mobile -->
  {#if baseItem && isLandscapePhoto}
    <div class="absolute top-16 right-3 sm:top-4 sm:right-4 z-30">
      <button
        onclick={onToggleRotatedView}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121217]/90 hover:bg-[#1a1a22] text-zinc-200 hover:text-white border border-[#27272f] shadow-lg transition-all active:scale-95 cursor-pointer text-xs font-medium backdrop-blur-xs"
        title="Toggle 90° Rotated View to fill portrait screen"
      >
        <RotateCw
          class="w-3.5 h-3.5 text-[#fc4c02] transition-transform {isRotatedView ? 'rotate-90' : ''}"
        />
        <span class="text-[11px] font-semibold">{isRotatedView ? 'Standard' : 'Rotate View'}</span>
      </button>
    </div>
  {/if}
</div>
