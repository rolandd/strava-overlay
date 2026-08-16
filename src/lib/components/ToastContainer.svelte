<script lang="ts">
  import { CheckCircle2, AlertCircle, Info, XCircle, X } from '@lucide/svelte';
  import type { ToastMessage } from '../types';

  let {
    toasts = [],
    onDismiss = () => {}
  }: {
    toasts: ToastMessage[];
    onDismiss?: (id: string) => void;
  } = $props();
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
  {#each toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all animate-in slide-in-from-top-2 duration-200 {toast.type ===
      'success'
        ? 'bg-emerald-950/90 border-emerald-800/60 text-emerald-100'
        : toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-800/60 text-rose-100'
          : toast.type === 'warning'
            ? 'bg-amber-950/90 border-amber-800/60 text-amber-100'
            : 'bg-[#181822]/90 border-[#27272f] text-zinc-100'}"
    >
      <div class="flex items-center gap-2 text-xs font-medium">
        {#if toast.type === 'success'}
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        {:else if toast.type === 'error'}
          <XCircle class="w-4 h-4 text-rose-400 shrink-0" />
        {:else if toast.type === 'warning'}
          <AlertCircle class="w-4 h-4 text-amber-400 shrink-0" />
        {:else}
          <Info class="w-4 h-4 text-sky-400 shrink-0" />
        {/if}
        <span>{toast.text}</span>
      </div>

      <button
        onclick={() => onDismiss(toast.id)}
        class="p-1 rounded-md opacity-60 hover:opacity-100 transition cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  {/each}
</div>
