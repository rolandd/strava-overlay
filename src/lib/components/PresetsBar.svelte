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
	import type { SnapPresetId } from '../types';

	let {
		disabled = false,
		onSelectPreset = () => {}
	}: {
		disabled?: boolean;
		onSelectPreset?: (preset: SnapPresetId) => void;
	} = $props();

	const presets: { id: SnapPresetId; label: string; icon: any }[] = [
		{ id: 'bottom-left', label: 'Bottom Left', icon: CornerDownLeft },
		{ id: 'bottom-right', label: 'Bottom Right', icon: CornerDownRight },
		{ id: 'top-left', label: 'Top Left', icon: CornerUpLeft },
		{ id: 'top-right', label: 'Top Right', icon: CornerUpRight },
		{ id: 'center', label: 'Center', icon: Scan },
		{ id: 'fit-width', label: 'Fit Width', icon: Maximize2 },
		{ id: 'reset', label: 'Reset', icon: RotateCcw }
	];
</script>

<div class="w-full max-w-4xl mx-auto px-4 py-1.5">
	<div class="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
		<span class="text-[11px] font-medium text-zinc-400 shrink-0 mr-1 hidden sm:inline">
			Quick Snap:
		</span>

		<div class="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
			{#each presets as preset}
				{@const IconComponent = preset.icon}
				<button
					onclick={() => onSelectPreset(preset.id)}
					{disabled}
					class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#16161d] hover:bg-[#22222c] disabled:opacity-40 disabled:pointer-events-none text-zinc-300 hover:text-white border border-[#27272f] transition-all active:scale-95 cursor-pointer shrink-0"
					title={preset.label}
				>
					<IconComponent class="w-3.5 h-3.5 text-[#fc4c02]" />
					<span class="text-[11px] font-medium hidden md:inline">{preset.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
