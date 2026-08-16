<script lang="ts">
  import { Flame, Download, HelpCircle, Wifi, WifiOff } from '@lucide/svelte';

  let {
    isOnline = true,
    canInstall = false,
    isCompact = false,
    onInstall = () => {},
    onOpenHelp = () => {}
  }: {
    isOnline?: boolean;
    canInstall?: boolean;
    isCompact?: boolean;
    onInstall?: () => void;
    onOpenHelp?: () => void;
  } = $props();
</script>

{#if isCompact}
  <!-- Compact Floating Header (Mobile Immersive Mode) -->
  <header
    class="flex items-center justify-between gap-2 px-3 py-2 bg-[#121217]/90 backdrop-blur-md border border-[#27272f] rounded-2xl shadow-lg"
  >
    <div class="flex items-center gap-2">
      <div
        class="w-7 h-7 rounded-lg bg-[#fc4c02] flex items-center justify-center text-white shrink-0 shadow-sm"
      >
        <Flame class="w-4 h-4 fill-white stroke-none" />
      </div>
      <span class="text-xs font-bold text-white tracking-tight">Ride Overlay</span>
    </div>

    <div class="flex items-center gap-1.5">
      {#if canInstall}
        <button
          onclick={onInstall}
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fc4c02] hover:bg-[#e03e00] text-white text-[11px] font-semibold transition cursor-pointer"
        >
          <Download class="w-3 h-3" />
          <span>Install</span>
        </button>
      {/if}

      <button
        onclick={onOpenHelp}
        class="p-1.5 rounded-lg bg-[#1a1a22] hover:bg-[#252530] text-zinc-300 hover:text-white border border-[#27272f] transition cursor-pointer"
        title="Help & Guide"
        aria-label="Help"
      >
        <HelpCircle class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>
{:else}
  <!-- Standard Header -->
  <header
    class="w-full flex items-center justify-between px-4 py-3 bg-[#121216] border-b border-[#27272f] shrink-0"
  >
    <!-- Logo & App Title -->
    <div class="flex items-center gap-2.5">
      <div
        class="w-8 h-8 rounded-xl bg-[#fc4c02] flex items-center justify-center shadow-md shadow-[#fc4c02]/20 text-white"
      >
        <Flame class="w-4.5 h-4.5 fill-white stroke-none" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold tracking-tight text-white leading-none">
            Ride Overlay
          </h1>
          <span
            class="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-[#fc4c02]/15 text-[#fc4c02] border border-[#fc4c02]/30"
          >
            PWA
          </span>
        </div>
        <p class="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">
          Strava Photo Compositor
        </p>
      </div>
    </div>

    <!-- Actions: Status, Install, Help -->
    <div class="flex items-center gap-2">
      <!-- Offline / Online Indicator -->
      <div
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors {isOnline
          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
          : 'bg-amber-950/40 text-amber-400 border-amber-800/40'}"
        title={isOnline ? 'Online mode active' : 'Offline mode active (cached)'}
      >
        {#if isOnline}
          <Wifi class="w-3.5 h-3.5" />
          <span>Ready</span>
        {:else}
          <WifiOff class="w-3.5 h-3.5 text-amber-400" />
          <span>Offline</span>
        {/if}
      </div>

      <!-- Install PWA Button -->
      {#if canInstall}
        <button
          onclick={onInstall}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fc4c02] hover:bg-[#e03e00] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      {/if}

      <!-- Help / Guide Button -->
      <button
        onclick={onOpenHelp}
        class="p-2 rounded-lg bg-[#1a1a22] hover:bg-[#252530] text-zinc-300 hover:text-white border border-[#27272f] transition cursor-pointer"
        title="How to use with Strava"
        aria-label="Help and guide"
      >
        <HelpCircle class="w-4 h-4" />
      </button>
    </div>
  </header>
{/if}
