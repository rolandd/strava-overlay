<script lang="ts">
	import { Share2, Download, Loader2, Sparkles, Trash2 } from '@lucide/svelte';
	import type { ExportOptions } from '../types';

	let {
		isRendering = false,
		hasBothImages = false,
		exportOptions,
		onExport = () => {},
		onDownloadDirect = () => {},
		onClearAll = () => {}
	}: {
		isRendering?: boolean;
		hasBothImages?: boolean;
		exportOptions: ExportOptions;
		onExport?: () => void;
		onDownloadDirect?: () => void;
		onClearAll?: () => void;
	} = $props();

	const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;
</script>

<div class="w-full max-w-4xl mx-auto px-4 py-3 sticky bottom-0 z-30 bg-[#09090b]/90 backdrop-blur-lg border-t border-[#27272f]/80">
	<div class="flex items-center justify-between gap-3">
		<!-- Clear / Reset button -->
		<button
			onclick={onClearAll}
			disabled={!hasBothImages || isRendering}
			class="px-3 py-3 rounded-xl bg-[#181820] hover:bg-[#252530] disabled:opacity-30 disabled:pointer-events-none text-zinc-400 hover:text-zinc-200 border border-[#27272f] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
			title="Clear All & Start Over"
		>
			<Trash2 class="w-4 h-4" />
			<span class="text-xs font-medium hidden sm:inline">Clear</span>
		</button>

		<!-- Primary Action: Share or Download -->
		<div class="flex-1 flex items-center gap-2 max-w-md ml-auto">
			{#if canWebShare}
				<button
					onclick={onExport}
					disabled={!hasBothImages || isRendering}
					class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#fc4c02] to-[#ff5d1c] hover:from-[#e03e00] hover:to-[#fc4c02] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#fc4c02]/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
				>
					{#if isRendering}
						<Loader2 class="w-4 h-4 animate-spin" />
						<span>Rendering High-Res...</span>
					{:else}
						<Share2 class="w-4 h-4" />
						<span>Share Composite</span>
					{/if}
				</button>

				<!-- Direct Download Button beside Share -->
				<button
					onclick={onDownloadDirect}
					disabled={!hasBothImages || isRendering}
					class="p-3 rounded-xl bg-[#1c1c24] hover:bg-[#282834] disabled:opacity-40 disabled:pointer-events-none text-zinc-200 hover:text-white border border-[#2e2e3a] transition-all active:scale-95 cursor-pointer shrink-0"
					title="Save directly to file"
				>
					<Download class="w-4 h-4" />
				</button>
			{:else}
				<button
					onclick={onDownloadDirect}
					disabled={!hasBothImages || isRendering}
					class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#fc4c02] to-[#ff5d1c] hover:from-[#e03e00] hover:to-[#fc4c02] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#fc4c02]/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
				>
					{#if isRendering}
						<Loader2 class="w-4 h-4 animate-spin" />
						<span>Rendering High-Res...</span>
					{:else}
						<Download class="w-4 h-4" />
						<span>Download High-Res Composite</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>
</div>
