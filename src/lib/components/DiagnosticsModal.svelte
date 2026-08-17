<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Activity,
    CheckCircle2,
    Copy,
    FileImage,
    Layers,
    Play,
    RefreshCw,
    Share2,
    Trash2,
    X
  } from '@lucide/svelte';
  import { logger, type LogEntry } from '$lib/utils/logger';
  import {
    createMockOverlayFile,
    createMockPhotoFile,
    simulateIncomingShare
  } from '$lib/utils/share-target';
  import { inspectStoredSession, type PersistedSessionRecord } from '$lib/utils/session-store';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSimulateAction?: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let logs = $state<LogEntry[]>([]);
  let filterLevel = $state<'all' | 'error' | 'idb' | 'share'>('all');
  let copied = $state<boolean>(false);
  let storedSession = $state<PersistedSessionRecord | null>(null);
  let activeTab = $state<'logs' | 'simulator' | 'storage'>('logs');

  let unsubscribeLogs: (() => void) | null = null;

  onMount(() => {
    unsubscribeLogs = logger.subscribe((newLogs) => {
      logs = newLogs;
    });
    refreshStoredSession();
  });

  onDestroy(() => {
    if (unsubscribeLogs) unsubscribeLogs();
  });

  $effect(() => {
    if (isOpen) {
      refreshStoredSession();
    }
  });

  async function refreshStoredSession() {
    storedSession = await inspectStoredSession();
  }

  let filteredLogs = $derived(
    logs.filter((l) => {
      if (filterLevel === 'error') return l.level === 'error' || l.level === 'warn';
      if (filterLevel === 'idb') return l.tag.startsWith('IDB');
      if (filterLevel === 'share') return l.tag.startsWith('SHARE') || l.tag === 'SIMULATION';
      return true;
    })
  );

  async function handleCopyLogs() {
    const text = logger.exportText();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  async function handleSimulateShareSinglePhoto() {
    const photo = createMockPhotoFile(`trail_${Date.now().toString().slice(-4)}.jpg`);
    await simulateIncomingShare([photo]);
    await refreshStoredSession();
  }

  async function handleSimulateShareSingleOverlay() {
    const overlay = createMockOverlayFile(`strava_${Date.now().toString().slice(-4)}.png`);
    await simulateIncomingShare([overlay]);
    await refreshStoredSession();
  }

  async function handleSimulateShareBoth() {
    const photo = createMockPhotoFile(`scenic_${Date.now().toString().slice(-4)}.jpg`);
    const overlay = createMockOverlayFile(`stats_${Date.now().toString().slice(-4)}.png`);
    await simulateIncomingShare([photo, overlay]);
    await refreshStoredSession();
  }

  function handleSimulateAppResume() {
    logger.info('SIMULATION', 'Simulating visibilitychange / pageshow resume event');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('focus'));
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div
      class="bg-[#121217] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0 bg-[#181820]"
      >
        <div class="flex items-center space-x-2">
          <div class="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
            <Activity class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-zinc-100">Diagnostics & PWA Simulator</h2>
            <p class="text-xs text-zinc-400">
              Real-time state verification & automated share target testing
            </p>
          </div>
        </div>

        <button
          onclick={onClose}
          aria-label="Close modal"
          class="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-zinc-800/80 bg-[#15151c] px-4 pt-2 gap-2 shrink-0">
        <button
          onclick={() => (activeTab = 'logs')}
          class="px-3.5 py-2 text-xs font-medium rounded-t-lg transition border-b-2 {activeTab ===
          'logs'
            ? 'border-orange-500 text-orange-400 bg-zinc-800/40'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
        >
          Event Stream ({logs.length})
        </button>
        <button
          onclick={() => (activeTab = 'simulator')}
          class="px-3.5 py-2 text-xs font-medium rounded-t-lg transition border-b-2 {activeTab ===
          'simulator'
            ? 'border-orange-500 text-orange-400 bg-zinc-800/40'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
        >
          Share Target Simulator
        </button>
        <button
          onclick={() => {
            activeTab = 'storage';
            refreshStoredSession();
          }}
          class="px-3.5 py-2 text-xs font-medium rounded-t-lg transition border-b-2 {activeTab ===
          'storage'
            ? 'border-orange-500 text-orange-400 bg-zinc-800/40'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
        >
          IndexedDB State
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {#if activeTab === 'logs'}
          <!-- Logs Filter & Action Bar -->
          <div class="flex items-center justify-between pb-2 border-b border-zinc-800/60 text-xs">
            <div class="flex gap-1.5">
              <button
                onclick={() => (filterLevel = 'all')}
                class="px-2.5 py-1 rounded-md transition {filterLevel === 'all'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}"
              >
                All
              </button>
              <button
                onclick={() => (filterLevel = 'share')}
                class="px-2.5 py-1 rounded-md transition {filterLevel === 'share'
                  ? 'bg-orange-600/40 text-orange-300'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}"
              >
                Shares
              </button>
              <button
                onclick={() => (filterLevel = 'idb')}
                class="px-2.5 py-1 rounded-md transition {filterLevel === 'idb'
                  ? 'bg-blue-600/40 text-blue-300'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}"
              >
                Storage
              </button>
              <button
                onclick={() => (filterLevel = 'error')}
                class="px-2.5 py-1 rounded-md transition {filterLevel === 'error'
                  ? 'bg-red-600/40 text-red-300'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}"
              >
                Errors/Warns
              </button>
            </div>

            <div class="flex gap-2">
              <button
                onclick={handleCopyLogs}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                {#if copied}
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
                  <span class="text-emerald-400">Copied!</span>
                {:else}
                  <Copy class="w-3.5 h-3.5" />
                  <span>Copy Log</span>
                {/if}
              </button>
              <button
                onclick={() => logger.clear()}
                class="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-red-950/40 hover:text-red-300 text-zinc-400 transition"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <!-- Log List -->
          {#if filteredLogs.length === 0}
            <div class="py-12 text-center text-zinc-500 text-sm">No events logged yet.</div>
          {:else}
            <div class="space-y-1.5 font-mono text-[11px] leading-relaxed select-text">
              {#each filteredLogs as entry (entry.id)}
                <div
                  class="p-2 rounded-lg border {entry.level === 'error'
                    ? 'bg-red-950/20 border-red-800/40 text-red-300'
                    : entry.level === 'warn'
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      : entry.tag.startsWith('IDB')
                        ? 'bg-blue-950/15 border-blue-800/30 text-blue-200'
                        : entry.tag.startsWith('SHARE')
                          ? 'bg-orange-950/15 border-orange-800/30 text-orange-200'
                          : 'bg-zinc-900/60 border-zinc-800/50 text-zinc-300'}"
                >
                  <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                    <span class="font-semibold text-zinc-400">[{entry.tag}]</span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <div class="break-words">{entry.message}</div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'simulator'}
          <!-- Simulator Tools -->
          <div class="space-y-4">
            <div class="p-3.5 rounded-xl bg-orange-950/20 border border-orange-800/40 space-y-2">
              <h3 class="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                Simulate Android OS Share Target (Desktop / Local)
              </h3>
              <p class="text-xs text-zinc-300 leading-normal">
                Test the exact share flow without deploying to mobile. These actions store files
                into Service Worker CacheStorage and trigger the OS share ingestion lifecycle.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onclick={handleSimulateShareSinglePhoto}
                class="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div
                  class="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition"
                >
                  <FileImage class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-xs font-medium text-zinc-200">1. Share Base Photo</div>
                  <div class="text-[10px] text-zinc-400">
                    Simulate incoming JPEG scenic ride photo
                  </div>
                </div>
              </button>

              <button
                onclick={handleSimulateShareSingleOverlay}
                class="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div
                  class="p-2 rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-105 transition"
                >
                  <Share2 class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-xs font-medium text-zinc-200">
                    2. Share 2nd Image (Strava Overlay)
                  </div>
                  <div class="text-[10px] text-zinc-400">
                    Simulate sharing transparent telemetry graphic
                  </div>
                </div>
              </button>

              <button
                onclick={handleSimulateShareBoth}
                class="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div
                  class="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-105 transition"
                >
                  <Layers class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-xs font-medium text-zinc-200">Share Both Simultaneously</div>
                  <div class="text-[10px] text-zinc-400">Simulate sharing 2 files at once</div>
                </div>
              </button>

              <button
                onclick={handleSimulateAppResume}
                class="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition group"
              >
                <div
                  class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition"
                >
                  <Play class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-xs font-medium text-zinc-200">Trigger App Resume Event</div>
                  <div class="text-[10px] text-zinc-400">Dispatch visibilitychange & pageshow</div>
                </div>
              </button>
            </div>
          </div>
        {:else if activeTab === 'storage'}
          <!-- Live Storage Inspector -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-zinc-300"
                >IndexedDB Record ('active_session')</span
              >
              <button
                onclick={refreshStoredSession}
                class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <RefreshCw class="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {#if storedSession}
              <div
                class="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs font-mono"
              >
                <div class="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span class="text-zinc-500">Updated:</span>
                  <span class="text-zinc-300"
                    >{new Date(storedSession.updatedAt).toLocaleTimeString()}</span
                  >
                </div>
                <div class="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span class="text-zinc-500">Base Photo:</span>
                  <span class={storedSession.baseImage ? 'text-emerald-400' : 'text-zinc-500'}>
                    {storedSession.baseImage
                      ? `${storedSession.baseImage.name} (${storedSession.baseImage.type || 'blob'}, ${(storedSession.baseImage.blob.size / 1024).toFixed(1)} KB)`
                      : 'None'}
                  </span>
                </div>
                <div class="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span class="text-zinc-500">Overlay Graphic:</span>
                  <span class={storedSession.overlayImage ? 'text-emerald-400' : 'text-zinc-500'}>
                    {storedSession.overlayImage
                      ? `${storedSession.overlayImage.name} (${storedSession.overlayImage.type || 'blob'}, ${(storedSession.overlayImage.blob.size / 1024).toFixed(1)} KB)`
                      : 'None'}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Transform:</span>
                  <span class="text-zinc-400">
                    scale={storedSession.transform?.scale.toFixed(2)}, x={storedSession.transform?.x.toFixed(
                      0
                    )}, y={storedSession.transform?.y.toFixed(0)}
                  </span>
                </div>
              </div>
            {:else}
              <div class="py-8 text-center text-zinc-500 text-xs">
                No active session record found in IndexedDB.
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-zinc-800 flex justify-end shrink-0 bg-[#15151c]">
        <button
          onclick={onClose}
          class="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
