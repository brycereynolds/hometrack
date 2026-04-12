<!--
  ActivityFeedItem.svelte — Single item in an activity feed
  Supports: message, email, note, voice_memo, system, ai_insight, phase_change, task_complete
-->
<script lang="ts">
  import type { ActivityItem } from '$lib/types';

  interface Props {
    item: ActivityItem & { author?: string; timeAgo?: string; listingAddress?: string };
    /** Show listing context (for cross-listing feeds like dashboard) */
    showListing?: boolean;
  }

  let { item, showListing = false }: Props = $props();

  const authorDisplay = $derived(item.author ?? item.authorName ?? '');
  const timeDisplay = $derived(item.timeAgo ?? '');
  const listingAddr = $derived(item.listingAddress ?? '');

  const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    message: { label: 'Message', color: 'text-primary', bgColor: 'bg-primary-subtle' },
    email: { label: 'Email', color: 'text-info', bgColor: 'bg-info-subtle' },
    note: { label: 'Note', color: 'text-secondary', bgColor: 'bg-secondary-subtle' },
    voice_memo: { label: 'Voice Memo', color: 'text-accent', bgColor: 'bg-accent-subtle' },
    system: { label: 'System', color: 'text-foreground-muted', bgColor: 'bg-background-tertiary' },
    ai_insight: { label: 'Insight', color: 'text-accent', bgColor: 'bg-accent-subtle' },
    phase_change: { label: 'Phase Change', color: 'text-info', bgColor: 'bg-info-subtle' },
    task_complete: { label: 'Task Complete', color: 'text-success', bgColor: 'bg-success-subtle' },
  };

  const config = $derived(typeConfig[item.type] ?? typeConfig.system);
</script>

<div class="group flex gap-3 py-3">
  <!-- Avatar / Icon -->
  <div class="flex size-8 shrink-0 items-center justify-center rounded-full {config.bgColor} {config.color} text-xs font-semibold">
    {#if item.type === 'ai_insight'}
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
      </svg>
    {:else if item.type === 'system' || item.type === 'phase_change'}
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    {:else if item.type === 'task_complete'}
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    {:else if item.type === 'voice_memo'}
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" />
      </svg>
    {:else}
      {item.authorInitials}
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-foreground">{authorDisplay}</span>
      <span class="text-xs text-foreground-muted">{timeDisplay}</span>
      {#if showListing && listingAddr}
        <span class="text-xs text-foreground-muted">
          &middot; <a href="/listings/{item.listingId}" class="text-primary hover:underline">{listingAddr}</a>
        </span>
      {/if}
    </div>

    <!-- Email subject line -->
    {#if item.type === 'email' && (item.metadata as any)?.subject}
      <p class="mt-0.5 text-xs font-medium text-foreground-secondary">{(item.metadata as any)?.subject}</p>
    {/if}

    <!-- Content text -->
    <p class="mt-1 text-sm text-foreground-secondary leading-relaxed">{item.content}</p>

    <!-- Voice memo duration -->
    {#if item.type === 'voice_memo' && (item.metadata as any)?.duration}
      <div class="mt-2 flex items-center gap-2">
        <button class="flex items-center gap-2 rounded-md bg-accent-subtle px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-subtle/80">
          <svg class="size-3.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21 5,3" />
          </svg>
          Play ({(item.metadata as any)?.duration})
        </button>
      </div>
    {/if}

    <!-- AI insight action -->
    {#if item.type === 'ai_insight'}
      <div class="mt-2 flex items-center gap-2">
        <button class="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90">
          Take action
        </button>
        <button class="rounded-md px-3 py-1 text-xs text-foreground-muted hover:bg-background-tertiary">
          Dismiss
        </button>
      </div>
    {/if}
  </div>
</div>
