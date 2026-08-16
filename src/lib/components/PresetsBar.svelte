<script lang="ts">
  import {
    CornerDownLeft,
    CornerDownRight,
    CornerUpLeft,
    CornerUpRight,
    Scan,
    Maximize2,
    RotateCcw
  } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { SnapPresetId } from '../types';

  let {
    disabled = false,
    layout = 'strip',
    onSelectPreset = () => {}
  }: {
    disabled?: boolean;
    layout?: 'strip' | 'grid';
    onSelectPreset?: (preset: SnapPresetId) => void;
  } = $props();

  const presets: { id: SnapPresetId; label: string; icon: Component }[] = [
    { id: 'bottom-left', label: 'Bottom Left', icon: CornerDownLeft },
    { id: 'bottom-right', label: 'Bottom Right', icon: CornerDownRight },
    { id: 'top-left', label: 'Top Left', icon: CornerUpLeft },
    { id: 'top-right', label: 'Top Right', icon: CornerUpRight },
    { id: 'center', label: 'Center', icon: Scan },
    { id: 'fit-width', label: 'Fit Width', icon: Maximize2 },
    { id: 'reset', label: 'Reset', icon: RotateCcw }
  ];
</script>

{#if layout === 'grid'}
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {#each presets as preset (preset.id)}
      {@const IconComponent = preset.icon}
      <button
        onclick={() => onSelectPreset(preset.id)}
        {disabled}
        class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#181820] hover:bg-[#22222c] disabled:opacity-40 disabled:pointer-events-none text-zinc-300 hover:text-white border border-[#27272f] transition-all active:scale-95 cursor-pointer text-xs font-medium"
        title={preset.label}
      >
        <IconComponent class="w-3.5 h-3.5 text-[#fc4c02] shrink-0" />
        <span class="truncate">{preset.label}</span>
      </button>
    {/each}
  </div>
{:else}
  <div
    class="w-full flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs no-scrollbar"
  >
    <div class="flex items-center gap-1.5 w-full justify-between sm:justify-start">
      {#each presets as preset (preset.id)}
        {@const IconComponent = preset.icon}
        <button
          onclick={() => onSelectPreset(preset.id)}
          {disabled}
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#16161d] hover:bg-[#22222c] disabled:opacity-40 disabled:pointer-events-none text-zinc-300 hover:text-white border border-[#27272f] transition-all active:scale-95 cursor-pointer shrink-0 text-xs"
          title={preset.label}
        >
          <IconComponent class="w-3.5 h-3.5 text-[#fc4c02]" />
          <span class="text-[11px] font-medium hidden md:inline">{preset.label}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}
