<script lang="ts">
  import { X, Smartphone, Layers, Move, Sparkles, ShieldCheck } from '@lucide/svelte';

  let {
    isOpen = false,
    onClose = () => {}
  }: {
    isOpen?: boolean;
    onClose?: () => void;
  } = $props();
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
  >
    <div
      class="bg-[#14141a] border border-[#27272f] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
    >
      <!-- Close button -->
      <button
        onclick={onClose}
        class="absolute top-4 right-4 p-2 rounded-lg bg-[#1e1e28] hover:bg-[#282836] text-zinc-400 hover:text-white transition cursor-pointer"
        aria-label="Close modal"
      >
        <X class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 mb-4">
        <div
          class="w-8 h-8 rounded-lg bg-[#fc4c02]/20 border border-[#fc4c02]/40 flex items-center justify-center text-[#fc4c02]"
        >
          <Sparkles class="w-4 h-4" />
        </div>
        <h2 class="text-base font-bold text-white">How to Use Ride Overlay</h2>
      </div>

      <div class="space-y-4 text-xs text-zinc-300">
        <!-- Step 1 -->
        <div class="p-3 rounded-xl bg-[#1a1a24] border border-[#27272f] space-y-1">
          <div class="flex items-center gap-2 font-semibold text-zinc-100">
            <Smartphone class="w-4 h-4 text-[#fc4c02]" />
            <span>1. Get your Strava Overlay Graphic</span>
          </div>
          <p class="text-zinc-400 leading-relaxed pl-6">
            In the Strava mobile app, open your activity, tap <strong>Share</strong>, choose the
            telemetry/stat overlay, and save the transparent graphic to your gallery.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="p-3 rounded-xl bg-[#1a1a24] border border-[#27272f] space-y-1">
          <div class="flex items-center gap-2 font-semibold text-zinc-100">
            <Layers class="w-4 h-4 text-[#fc4c02]" />
            <span>2. Load Base Photo & Overlay</span>
          </div>
          <p class="text-zinc-400 leading-relaxed pl-6">
            Select your background ride photo in slot 1 and the transparent Strava PNG in slot 2, or
            drag & drop / share directly into this app.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="p-3 rounded-xl bg-[#1a1a24] border border-[#27272f] space-y-1">
          <div class="flex items-center gap-2 font-semibold text-zinc-100">
            <Move class="w-4 h-4 text-[#fc4c02]" />
            <span>3. Position, Pinch & Snap</span>
          </div>
          <p class="text-zinc-400 leading-relaxed pl-6">
            Drag with one finger to move, pinch with two fingers to zoom, and twist to rotate. Use <strong
              >Quick Snap</strong
            > buttons to lock to bottom-left, bottom-right, or fit-width instantly.
          </p>
        </div>

        <!-- Privacy & Offline -->
        <div
          class="p-3 rounded-xl bg-[#101015] border border-emerald-950/60 flex items-start gap-2.5 text-emerald-400"
        >
          <ShieldCheck class="w-4 h-4 shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed text-zinc-400">
            <strong class="text-emerald-400">100% Private & Offline:</strong> All compositing is executed
            locally on your device via HTML5 Canvas. Your photos never leave your browser.
          </p>
        </div>
      </div>

      <div class="mt-6">
        <button
          onclick={onClose}
          class="w-full py-2.5 rounded-xl bg-[#fc4c02] hover:bg-[#e03e00] text-white font-semibold text-xs shadow-lg transition cursor-pointer"
        >
          Got It, Let's Ride!
        </button>
      </div>
    </div>
  </div>
{/if}
