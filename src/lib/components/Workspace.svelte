<script lang="ts">
  import { ImagePlus, Hand } from '@lucide/svelte';
  import type { BaseImageAdjustments, ImageItem, OverlayTransform } from '../types';
  import { gestureHandler } from '../utils/gestures';
  import type { ViewportDimensions } from '../utils/presets';

  let {
    baseItem,
    overlayItem,
    transform,
    adjustments,
    onUpdateTransform = () => {},
    onDropFiles = () => {},
    onDimensionsChange = () => {}
  }: {
    baseItem: ImageItem | null;
    overlayItem: ImageItem | null;
    transform: OverlayTransform;
    adjustments: BaseImageAdjustments;
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

<div class="w-full max-w-4xl mx-auto px-4 py-2 flex flex-col items-center select-none">
  <div
    bind:this={containerEl}
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
    aria-label="Image compositing workspace"
    style="aspect-ratio: {displayAspectRatio};"
    class="relative w-full max-w-lg mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl border transition-all flex items-center justify-center {isDragOver
      ? 'border-[#fc4c02] ring-4 ring-[#fc4c02]/30 scale-[1.01]'
      : 'border-[#27272f]'}"
  >
    <!-- 1. Drop Zone Overlay (when dragging files over) -->
    {#if isDragOver}
      <div
        class="absolute inset-0 z-40 bg-[#09090b]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#fc4c02]"
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
        class="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#101014]"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-[#1a1a22] border border-[#27272f] flex items-center justify-center text-zinc-400 mb-4 shadow-inner"
        >
          <ImagePlus class="w-8 h-8 text-[#fc4c02]" />
        </div>
        <h3 class="text-sm font-semibold text-zinc-200">No Photo Loaded</h3>
        <p class="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
          Select a photo below, drop an image here, or share directly from Strava / Google Photos.
        </p>
      </div>
    {/if}

    <!-- 3. Overlay Layer -->
    {#if overlayItem && baseItem}
      <div
        use:gestureHandler={{
          getTransform: () => transform,
          onUpdate: (t) => onUpdateTransform(t)
        }}
        onpointerdown={() => (isInteracting = true)}
        onpointerup={() => (isInteracting = false)}
        onpointercancel={() => (isInteracting = false)}
        onkeydown={handleOverlayKeyDown}
        tabindex="0"
        role="button"
        aria-label="Interactive Strava overlay graphic (use arrow keys to move, +/- to zoom, or touch to drag/pinch/rotate)"
        style="
					width: {overlayBaseWidth}px;
					height: {overlayBaseHeight}px;
					transform: translate3d({transform.x}px, {transform.y}px, 0px) rotate({transform.angle}deg) scale({transform.scale});
				"
        class="absolute touch-none cursor-grab active:cursor-grabbing origin-center will-change-transform z-20 outline-none"
      >
        <!-- Subtle bounding outline during interaction -->
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
              class="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-700 whitespace-nowrap pointer-events-none"
            >
              {Math.round(transform.scale * 100)}% • {Math.round(transform.angle)}°
            </div>
          {/if}
        </div>
      </div>
    {:else if baseItem && !overlayItem}
      <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          class="bg-black/70 backdrop-blur-sm border border-zinc-700/60 px-4 py-2 rounded-xl text-center shadow-lg"
        >
          <p class="text-xs font-medium text-zinc-200">Base photo ready</p>
          <p class="text-[11px] text-[#fc4c02]">Now select an overlay graphic below</p>
        </div>
      </div>
    {/if}

    <!-- Touch gesture hint badge -->
    {#if baseItem && overlayItem}
      <div
        class="absolute bottom-2 left-2 pointer-events-none z-30 opacity-70 hover:opacity-100 transition-opacity"
      >
        <div
          class="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-zinc-300 border border-white/10 flex items-center gap-1.5"
        >
          <Hand class="w-3 h-3 text-[#fc4c02]" />
          <span>Drag • Pinch to Zoom • Twist • Arrow keys</span>
        </div>
      </div>
    {/if}
  </div>
</div>
