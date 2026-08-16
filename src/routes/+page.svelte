<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import InputSlots from '$lib/components/InputSlots.svelte';
	import PresetsBar from '$lib/components/PresetsBar.svelte';
	import Workspace from '$lib/components/Workspace.svelte';
	import AdjustmentsPanel from '$lib/components/AdjustmentsPanel.svelte';
	import ExportBar from '$lib/components/ExportBar.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	import type {
		BaseImageAdjustments,
		ExportOptions,
		ImageItem,
		OverlayTransform,
		SnapPresetId,
		ToastMessage
	} from '$lib/types';
	import {
		extractImagesFromClipboard,
		fileToImageItem,
		isTransparentImage,
		revokeImageItem
	} from '$lib/utils/image-loader';
	import { computePresetTransform, type ViewportDimensions } from '$lib/utils/presets';
	import { renderHighResComposite } from '$lib/utils/canvas-compositor';
	import {
		checkAndRetrieveSharedFiles,
		downloadBlob,
		shareOrDownloadBlob
	} from '$lib/utils/share-target';

	// Reactive Application State
	let baseItem = $state<ImageItem | null>(null);
	let overlayItem = $state<ImageItem | null>(null);

	let transform = $state<OverlayTransform>({
		x: 0,
		y: 0,
		scale: 1.0,
		angle: 0
	});

	let adjustments = $state<BaseImageAdjustments>({
		brightness: 1.0,
		contrast: 1.0,
		saturation: 1.0,
		cropAspectRatio: 'original'
	});

	let exportOptions = $state<ExportOptions>({
		format: 'image/jpeg',
		quality: 0.95,
		maxDimension: 4096
	});

	let viewportDims = $state<ViewportDimensions>({
		containerWidth: 0,
		containerHeight: 0,
		overlayBaseWidth: 0,
		overlayBaseHeight: 0
	});

	let isRendering = $state<boolean>(false);
	let isOnline = $state<boolean>(true);
	let canInstall = $state<boolean>(false);
	let deferredInstallPrompt = $state<any>(null);
	let isHelpOpen = $state<boolean>(false);
	let toasts = $state<ToastMessage[]>([]);

	function showToast(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', durationMs = 3500) {
		const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		toasts = [...toasts, { id, text, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, durationMs);
	}

	function dismissToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	// Initialize PWA, Service Worker, and Ingestion on Mount
	onMount(async () => {
		if (typeof window !== 'undefined') {
			isOnline = navigator.onLine;
			window.addEventListener('online', () => {
				isOnline = true;
				showToast('App is online', 'info');
			});
			window.addEventListener('offline', () => {
				isOnline = false;
				showToast('App is running in offline mode', 'warning');
			});

			// PWA Install prompt listener
			window.addEventListener('beforeinstallprompt', (e: Event) => {
				e.preventDefault();
				deferredInstallPrompt = e;
				canInstall = true;
			});

			// Register service worker if available
			if ('serviceWorker' in navigator) {
				try {
					await navigator.serviceWorker.register('/service-worker.js');
				} catch (err) {
					console.warn('Service worker registration failed:', err);
				}
			}

			// Clipboard paste listener
			window.addEventListener('paste', handleWindowPaste);

			// Ingest Android Share Target files if redirected with query
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.has('incoming_share')) {
				try {
					const sharedResult = await checkAndRetrieveSharedFiles();
					if (sharedResult) {
						if (sharedResult.baseItem) {
							revokeImageItem(baseItem);
							baseItem = sharedResult.baseItem;
						}
						if (sharedResult.overlayItem) {
							revokeImageItem(overlayItem);
							overlayItem = sharedResult.overlayItem;
						}
						showToast('Imported photo from system share target!', 'success');
					}
				} catch (err) {
					console.error('Failed to ingest share:', err);
					showToast('Could not process shared image.', 'error');
				} finally {
					window.history.replaceState({}, '', '/');
				}
			}
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('paste', handleWindowPaste);
		}
		revokeImageItem(baseItem);
		revokeImageItem(overlayItem);
	});

	async function handleWindowPaste(e: ClipboardEvent) {
		if (!e.clipboardData) return;
		const files = extractImagesFromClipboard(e.clipboardData);
		if (files.length > 0) {
			await processFilesList(files);
			showToast(`Pasted ${files.length} image(s) from clipboard`, 'info');
		}
	}

	async function handleInstallPwa() {
		if (deferredInstallPrompt) {
			deferredInstallPrompt.prompt();
			const choiceResult = await deferredInstallPrompt.userChoice;
			if (choiceResult.outcome === 'accepted') {
				canInstall = false;
				showToast('Ride Overlay installed successfully!', 'success');
			}
			deferredInstallPrompt = null;
		}
	}

	async function processFilesList(files: File[]) {
		try {
			if (files.length === 1) {
				const f = files[0];
				if (isTransparentImage(f) && baseItem) {
					revokeImageItem(overlayItem);
					overlayItem = await fileToImageItem(f);
					resetOverlayTransform();
					showToast('Overlay graphic loaded', 'success');
				} else if (!baseItem) {
					revokeImageItem(baseItem);
					baseItem = await fileToImageItem(f);
					showToast('Base photo loaded', 'success');
				} else {
					revokeImageItem(overlayItem);
					overlayItem = await fileToImageItem(f);
					resetOverlayTransform();
					showToast('Overlay graphic loaded', 'success');
				}
			} else if (files.length >= 2) {
				const transparent = files.find((f) => isTransparentImage(f));
				const nonTransparent = files.find((f) => !isTransparentImage(f)) || files[0];
				const overlayFile = transparent || files[1];

				revokeImageItem(baseItem);
				revokeImageItem(overlayItem);

				baseItem = await fileToImageItem(nonTransparent);
				overlayItem = await fileToImageItem(overlayFile);
				resetOverlayTransform();
				showToast('Loaded base photo and overlay graphic', 'success');
			}
		} catch (err) {
			console.error('Error reading files:', err);
			showToast('Failed to load selected image file.', 'error');
		}
	}

	async function handleSelectBase(file: File) {
		try {
			revokeImageItem(baseItem);
			baseItem = await fileToImageItem(file);
			showToast(`Base photo loaded (${baseItem.width}×${baseItem.height})`, 'success');
		} catch (err) {
			console.error('Failed to load base photo:', err);
			showToast('Failed to load base photo.', 'error');
		}
	}

	async function handleSelectOverlay(file: File) {
		try {
			revokeImageItem(overlayItem);
			overlayItem = await fileToImageItem(file);
			resetOverlayTransform();
			showToast(`Overlay loaded (${overlayItem.width}×${overlayItem.height})`, 'success');
		} catch (err) {
			console.error('Failed to load overlay:', err);
			showToast('Failed to load overlay image.', 'error');
		}
	}

	function handleRemoveBase() {
		revokeImageItem(baseItem);
		baseItem = null;
	}

	function handleRemoveOverlay() {
		revokeImageItem(overlayItem);
		overlayItem = null;
		resetOverlayTransform();
	}

	function handleSwapSlots() {
		if (baseItem && overlayItem) {
			const temp = baseItem;
			baseItem = overlayItem;
			overlayItem = temp;
			resetOverlayTransform();
			showToast('Swapped base photo and overlay slots', 'info');
		}
	}

	function handleClearAll() {
		revokeImageItem(baseItem);
		revokeImageItem(overlayItem);
		baseItem = null;
		overlayItem = null;
		resetOverlayTransform();
		adjustments = {
			brightness: 1.0,
			contrast: 1.0,
			saturation: 1.0,
			cropAspectRatio: 'original'
		};
		showToast('Workspace cleared', 'info');
	}

	function resetOverlayTransform() {
		transform = {
			x: 0,
			y: 0,
			scale: 1.0,
			angle: 0
		};
	}

	function handleSelectPreset(presetId: SnapPresetId) {
		if (!overlayItem || !baseItem) return;
		transform = computePresetTransform(presetId, transform, viewportDims);
	}

	function updateTransform(newValues: Partial<OverlayTransform>) {
		transform = { ...transform, ...newValues };
	}

	function updateAdjustments(newValues: Partial<BaseImageAdjustments>) {
		adjustments = { ...adjustments, ...newValues };
	}

	function updateExportOptions(newValues: Partial<ExportOptions>) {
		exportOptions = { ...exportOptions, ...newValues };
	}

	async function handleExportComposite(directDownloadOnly: boolean = false) {
		if (!baseItem || !overlayItem || isRendering) return;

		isRendering = true;
		try {
			const { blob, width, height } = await renderHighResComposite({
				baseItem,
				overlayItem,
				transform,
				adjustments,
				viewportDims,
				exportOptions
			});

			const ext = exportOptions.format === 'image/png' ? 'png' : 'jpg';
			const filename = `ride-overlay-${Date.now()}.${ext}`;

			if (directDownloadOnly) {
				downloadBlob(blob, filename);
				showToast(`Downloaded ${width}×${height} composite!`, 'success');
			} else {
				const result = await shareOrDownloadBlob(blob, filename, 'Ride Stat Overlay Photo');
				if (result.method === 'shared') {
					showToast('Shared successfully!', 'success');
				} else {
					showToast(`Saved ${width}×${height} composite!`, 'success');
				}
			}
		} catch (err) {
			console.error('Export failed:', err);
			showToast('Failed to generate high-resolution composite.', 'error');
		} finally {
			isRendering = false;
		}
	}
</script>

<div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between">
	<ToastContainer {toasts} onDismiss={dismissToast} />
	<HelpModal isOpen={isHelpOpen} onClose={() => (isHelpOpen = false)} />

	<!-- Top App Header -->
	<Header
		{isOnline}
		{canInstall}
		onInstall={handleInstallPwa}
		onOpenHelp={() => (isHelpOpen = true)}
	/>

	<!-- Main Interactive Studio Area -->
	<main class="flex-1 flex flex-col justify-center py-2">
		<!-- Image Slot Ingestion Bar -->
		<InputSlots
			{baseItem}
			{overlayItem}
			onSelectBase={handleSelectBase}
			onSelectOverlay={handleSelectOverlay}
			onRemoveBase={handleRemoveBase}
			onRemoveOverlay={handleRemoveOverlay}
			onSwapSlots={handleSwapSlots}
		/>

		<!-- Quick Snap Presets (Active when both loaded) -->
		{#if baseItem && overlayItem}
			<PresetsBar
				disabled={!overlayItem}
				onSelectPreset={handleSelectPreset}
			/>
		{/if}

		<!-- Interactive Viewport Workspace -->
		<Workspace
			{baseItem}
			{overlayItem}
			{transform}
			{adjustments}
			onUpdateTransform={updateTransform}
			onDropFiles={processFilesList}
			onDimensionsChange={(dims) => (viewportDims = dims)}
		/>

		<!-- Fine-Tuning Adjustments Drawer -->
		{#if baseItem || overlayItem}
			<AdjustmentsPanel
				{transform}
				{adjustments}
				{exportOptions}
				hasBase={!!baseItem}
				hasOverlay={!!overlayItem}
				onUpdateTransform={updateTransform}
				onUpdateAdjustments={updateAdjustments}
				onUpdateExportOptions={updateExportOptions}
			/>
		{/if}
	</main>

	<!-- Bottom Action / Export Bar -->
	<ExportBar
		{isRendering}
		hasBothImages={!!baseItem && !!overlayItem}
		{exportOptions}
		onExport={() => handleExportComposite(false)}
		onDownloadDirect={() => handleExportComposite(true)}
		onClearAll={handleClearAll}
	/>
</div>
