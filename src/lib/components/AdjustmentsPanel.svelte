<script lang="ts">
  import {
    Sliders,
    Sun,
    Maximize,
    RotateCw,
    Move,
    RefreshCw,
    Crop,
    Settings2
  } from '@lucide/svelte';
  import type {
    AspectRatioType,
    BaseImageAdjustments,
    ExportOptions,
    OverlayTransform
  } from '../types';

  let {
    transform,
    adjustments,
    exportOptions,
    hasOverlay = false,
    hasBase = false,
    onUpdateTransform = () => {},
    onUpdateAdjustments = () => {},
    onUpdateExportOptions = () => {}
  }: {
    transform: OverlayTransform;
    adjustments: BaseImageAdjustments;
    exportOptions: ExportOptions;
    hasOverlay?: boolean;
    hasBase?: boolean;
    onUpdateTransform?: (t: Partial<OverlayTransform>) => void;
    onUpdateAdjustments?: (a: Partial<BaseImageAdjustments>) => void;
    onUpdateExportOptions?: (o: Partial<ExportOptions>) => void;
  } = $props();

  let activeTab = $state<'transform' | 'base' | 'export'>('transform');
  let isCollapsed = $state<boolean>(false);

  function resetBaseAdjustments() {
    onUpdateAdjustments({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      cropAspectRatio: 'original'
    });
  }

  function nudgePosition(dx: number, dy: number) {
    onUpdateTransform({
      x: transform.x + dx,
      y: transform.y + dy
    });
  }

  function stepScale(delta: number) {
    const newScale = Math.max(
      0.1,
      Math.min(5.0, Math.round((transform.scale + delta) * 100) / 100)
    );
    onUpdateTransform({ scale: newScale });
  }

  function setRotation(angle: number) {
    onUpdateTransform({ angle });
  }

  const cropRatios: { id: AspectRatioType; label: string }[] = [
    { id: 'original', label: 'Original' },
    { id: '1:1', label: '1:1 Square' },
    { id: '4:5', label: '4:5 Portrait' },
    { id: '16:9', label: '16:9 Wide' }
  ];
</script>

<div class="w-full max-w-4xl mx-auto px-4 py-2">
  <div class="bg-[#121217] rounded-2xl border border-[#27272f] overflow-hidden shadow-xl">
    <!-- Tabs Header -->
    <div class="flex items-center justify-between border-b border-[#22222a] px-3 pt-2">
      <div class="flex items-center gap-1">
        <button
          onclick={() => {
            activeTab = 'transform';
            isCollapsed = false;
          }}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer {activeTab ===
            'transform' && !isCollapsed
            ? 'text-[#fc4c02] border-[#fc4c02] bg-[#1a1a22]/60'
            : 'text-zinc-400 border-transparent hover:text-zinc-200'}"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>Overlay Transform</span>
        </button>

        <button
          onclick={() => {
            activeTab = 'base';
            isCollapsed = false;
          }}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer {activeTab ===
            'base' && !isCollapsed
            ? 'text-[#fc4c02] border-[#fc4c02] bg-[#1a1a22]/60'
            : 'text-zinc-400 border-transparent hover:text-zinc-200'}"
        >
          <Sun class="w-3.5 h-3.5" />
          <span>Base Photo Edit</span>
        </button>

        <button
          onclick={() => {
            activeTab = 'export';
            isCollapsed = false;
          }}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer {activeTab ===
            'export' && !isCollapsed
            ? 'text-[#fc4c02] border-[#fc4c02] bg-[#1a1a22]/60'
            : 'text-zinc-400 border-transparent hover:text-zinc-200'}"
        >
          <Settings2 class="w-3.5 h-3.5" />
          <span>Export Settings</span>
        </button>
      </div>

      <button
        onclick={() => (isCollapsed = !isCollapsed)}
        class="text-[11px] font-medium text-zinc-400 hover:text-white px-2 py-1 rounded bg-[#1a1a22] border border-[#27272f] transition cursor-pointer"
      >
        {isCollapsed ? 'Expand' : 'Collapse'}
      </button>
    </div>

    <!-- Panel Content -->
    {#if !isCollapsed}
      <div class="p-4">
        <!-- Tab 1: Overlay Transform Controls -->
        {#if activeTab === 'transform'}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Scale Slider -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-zinc-300 flex items-center gap-1.5">
                  <Maximize class="w-3.5 h-3.5 text-[#fc4c02]" /> Scale
                </span>
                <span class="font-mono text-zinc-400 text-[11px]">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  onclick={() => stepScale(-0.05)}
                  disabled={!hasOverlay}
                  class="w-7 h-7 rounded-lg bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-xs font-bold text-zinc-200 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.01"
                  value={transform.scale}
                  disabled={!hasOverlay}
                  oninput={(e) => onUpdateTransform({ scale: parseFloat(e.currentTarget.value) })}
                  class="w-full cursor-pointer disabled:opacity-40"
                />
                <button
                  onclick={() => stepScale(0.05)}
                  disabled={!hasOverlay}
                  class="w-7 h-7 rounded-lg bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-xs font-bold text-zinc-200 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Rotation Slider & Snap -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-zinc-300 flex items-center gap-1.5">
                  <RotateCw class="w-3.5 h-3.5 text-[#fc4c02]" /> Rotation
                </span>
                <span class="font-mono text-zinc-400 text-[11px]">
                  {Math.round(transform.angle)}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={transform.angle}
                disabled={!hasOverlay}
                oninput={(e) => onUpdateTransform({ angle: parseFloat(e.currentTarget.value) })}
                class="w-full cursor-pointer disabled:opacity-40"
              />
              <div class="flex items-center justify-between gap-1 text-[10px]">
                <button
                  onclick={() => setRotation(-90)}
                  disabled={!hasOverlay}
                  class="px-2 py-0.5 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-300 cursor-pointer"
                >
                  -90°
                </button>
                <button
                  onclick={() => setRotation(0)}
                  disabled={!hasOverlay}
                  class="px-2 py-0.5 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-300 cursor-pointer"
                >
                  0° Level
                </button>
                <button
                  onclick={() => setRotation(90)}
                  disabled={!hasOverlay}
                  class="px-2 py-0.5 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-300 cursor-pointer"
                >
                  +90°
                </button>
              </div>
            </div>

            <!-- Position Nudge D-Pad -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-zinc-300 flex items-center gap-1.5">
                  <Move class="w-3.5 h-3.5 text-[#fc4c02]" /> Fine Nudge
                </span>
                <span class="font-mono text-zinc-400 text-[11px]">
                  X: {Math.round(transform.x)}px, Y: {Math.round(transform.y)}px
                </span>
              </div>
              <div class="grid grid-cols-3 gap-1.5 max-w-[140px] mx-auto">
                <div></div>
                <button
                  onclick={() => nudgePosition(0, -10)}
                  disabled={!hasOverlay}
                  class="h-7 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Nudge Up"
                >
                  ▲
                </button>
                <div></div>
                <button
                  onclick={() => nudgePosition(-10, 0)}
                  disabled={!hasOverlay}
                  class="h-7 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Nudge Left"
                >
                  ◀
                </button>
                <button
                  onclick={() => onUpdateTransform({ x: 0, y: 0 })}
                  disabled={!hasOverlay}
                  class="h-7 rounded bg-[#1a1a22] hover:bg-[#242430] disabled:opacity-40 text-zinc-400 hover:text-white text-[10px] flex items-center justify-center cursor-pointer"
                  title="Center Offset"
                >
                  •
                </button>
                <button
                  onclick={() => nudgePosition(10, 0)}
                  disabled={!hasOverlay}
                  class="h-7 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Nudge Right"
                >
                  ▶
                </button>
                <div></div>
                <button
                  onclick={() => nudgePosition(0, 10)}
                  disabled={!hasOverlay}
                  class="h-7 rounded bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-40 text-zinc-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Nudge Down"
                >
                  ▼
                </button>
                <div></div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Tab 2: Base Photo Edit -->
        {#if activeTab === 'base'}
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Brightness -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-zinc-300">Brightness</span>
                  <span class="font-mono text-zinc-400 text-[11px]">
                    {Math.round(adjustments.brightness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.02"
                  value={adjustments.brightness}
                  disabled={!hasBase}
                  oninput={(e) =>
                    onUpdateAdjustments({ brightness: parseFloat(e.currentTarget.value) })}
                  class="w-full cursor-pointer disabled:opacity-40"
                />
              </div>

              <!-- Contrast -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-zinc-300">Contrast</span>
                  <span class="font-mono text-zinc-400 text-[11px]">
                    {Math.round(adjustments.contrast * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.02"
                  value={adjustments.contrast}
                  disabled={!hasBase}
                  oninput={(e) =>
                    onUpdateAdjustments({ contrast: parseFloat(e.currentTarget.value) })}
                  class="w-full cursor-pointer disabled:opacity-40"
                />
              </div>

              <!-- Saturation -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-zinc-300">Saturation</span>
                  <span class="font-mono text-zinc-400 text-[11px]">
                    {Math.round(adjustments.saturation * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={adjustments.saturation}
                  disabled={!hasBase}
                  oninput={(e) =>
                    onUpdateAdjustments({ saturation: parseFloat(e.currentTarget.value) })}
                  class="w-full cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            <!-- Crop Framing & Reset -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#22222a]"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-zinc-400 mr-1 flex items-center gap-1">
                  <Crop class="w-3.5 h-3.5" /> Aspect Crop:
                </span>
                {#each cropRatios as ratio (ratio.id)}
                  <button
                    onclick={() => onUpdateAdjustments({ cropAspectRatio: ratio.id })}
                    disabled={!hasBase}
                    class="px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer {adjustments.cropAspectRatio ===
                    ratio.id
                      ? 'bg-[#fc4c02] text-white'
                      : 'bg-[#1a1a22] text-zinc-300 hover:bg-[#252530] border border-[#27272f]'}"
                  >
                    {ratio.label}
                  </button>
                {/each}
              </div>

              <button
                onclick={resetBaseAdjustments}
                disabled={!hasBase}
                class="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1a1a22] hover:bg-[#252530] disabled:opacity-40 text-xs font-medium text-zinc-300 border border-[#27272f] transition cursor-pointer"
              >
                <RefreshCw class="w-3 h-3" />
                <span>Reset Photo Adjustments</span>
              </button>
            </div>
          </div>
        {/if}

        <!-- Tab 3: Export Settings -->
        {#if activeTab === 'export'}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Format -->
            <div class="space-y-2">
              <span class="block text-xs font-medium text-zinc-300">Export Format</span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  onclick={() => onUpdateExportOptions({ format: 'image/jpeg' })}
                  class="py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer {exportOptions.format ===
                  'image/jpeg'
                    ? 'bg-[#fc4c02] text-white'
                    : 'bg-[#1a1a22] text-zinc-300 border border-[#27272f]'}"
                >
                  JPEG
                </button>
                <button
                  onclick={() => onUpdateExportOptions({ format: 'image/png' })}
                  class="py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer {exportOptions.format ===
                  'image/png'
                    ? 'bg-[#fc4c02] text-white'
                    : 'bg-[#1a1a22] text-zinc-300 border border-[#27272f]'}"
                >
                  PNG (Lossless)
                </button>
              </div>
            </div>

            <!-- JPEG Quality (Only when JPEG selected) -->
            <div
              class="space-y-2 {exportOptions.format === 'image/png'
                ? 'opacity-40 pointer-events-none'
                : ''}"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-zinc-300">Quality</span>
                <span class="font-mono text-zinc-400 text-[11px]">
                  {Math.round(exportOptions.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.0"
                step="0.01"
                value={exportOptions.quality}
                oninput={(e) =>
                  onUpdateExportOptions({ quality: parseFloat(e.currentTarget.value) })}
                class="w-full cursor-pointer"
              />
            </div>

            <!-- Max Resolution Ceiling -->
            <div class="space-y-2">
              <span class="block text-xs font-medium text-zinc-300">Max Dimension Ceiling</span>
              <div class="grid grid-cols-3 gap-1">
                <button
                  onclick={() => onUpdateExportOptions({ maxDimension: 4096 })}
                  class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer {exportOptions.maxDimension ===
                  4096
                    ? 'bg-[#fc4c02] text-white'
                    : 'bg-[#1a1a22] text-zinc-300 border border-[#27272f]'}"
                >
                  Full (4K+)
                </button>
                <button
                  onclick={() => onUpdateExportOptions({ maxDimension: 2560 })}
                  class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer {exportOptions.maxDimension ===
                  2560
                    ? 'bg-[#fc4c02] text-white'
                    : 'bg-[#1a1a22] text-zinc-300 border border-[#27272f]'}"
                >
                  2.5K
                </button>
                <button
                  onclick={() => onUpdateExportOptions({ maxDimension: 1080 })}
                  class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer {exportOptions.maxDimension ===
                  1080
                    ? 'bg-[#fc4c02] text-white'
                    : 'bg-[#1a1a22] text-zinc-300 border border-[#27272f]'}"
                >
                  1080p
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
