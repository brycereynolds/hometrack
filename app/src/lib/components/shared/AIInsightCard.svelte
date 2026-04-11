<!--
  AIInsightCard.svelte — How AI suggestions/alerts appear throughout the app
  Distinct visual treatment: warm accent background, sparkle icon, action button.
-->
<script lang="ts">
  import type { AIInsight } from '$lib/data/mock-data';

  interface Props {
    insight: AIInsight;
    compact?: boolean;
    onDismiss?: (id: string) => void;
    onAction?: (id: string) => void;
  }

  let { insight, compact = false, onDismiss, onAction }: Props = $props();

  const typeConfig: Record<string, { icon: string; borderColor: string; bgColor: string }> = {
    connection: { icon: 'network', borderColor: 'border-primary/30', bgColor: 'bg-primary-subtle' },
    anomaly: { icon: 'alert', borderColor: 'border-warning/30', bgColor: 'bg-warning-subtle' },
    recommendation: { icon: 'sparkles', borderColor: 'border-accent/30', bgColor: 'bg-accent-subtle' },
    warning: { icon: 'alert-triangle', borderColor: 'border-error/30', bgColor: 'bg-error-subtle' },
  };

  const config = $derived(typeConfig[insight.type] ?? typeConfig.recommendation);
</script>

<div class="rounded-lg border {config.borderColor} {config.bgColor} p-4 relative group">
  {#if !compact}
    <!-- Dismiss button -->
    {#if onDismiss}
      <button
        class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-foreground-muted opacity-0 hover:bg-background-tertiary group-hover:opacity-100 transition-opacity"
        onclick={() => onDismiss?.(insight.id)}
        aria-label="Dismiss"
      >
        <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    {/if}
  {/if}

  <div class="flex gap-3">
    <!-- Icon -->
    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/60 text-accent">
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        {#if config.icon === 'network'}
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        {:else if config.icon === 'alert'}
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        {:else if config.icon === 'alert-triangle'}
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        {:else}
          <!-- sparkles -->
          <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
        {/if}
      </svg>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-foreground">{insight.title}</p>

      {#if !compact}
        <p class="mt-1 text-sm text-foreground-secondary leading-relaxed">{insight.description}</p>
      {/if}

      {#if insight.listingAddress}
        <p class="mt-1 text-xs text-foreground-muted">
          <a href="/listings/{insight.listingId}" class="text-primary hover:underline">{insight.listingAddress}</a>
        </p>
      {/if}

      <!-- Actions -->
      {#if insight.actionLabel || !compact}
        <div class="mt-3 flex items-center gap-2">
          {#if insight.actionLabel}
            <button
              class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              onclick={() => onAction?.(insight.id)}
            >
              {insight.actionLabel}
            </button>
          {/if}
          {#if onDismiss && !compact}
            <button
              class="rounded-md px-3 py-1.5 text-xs text-foreground-muted hover:bg-background-tertiary transition-colors"
              onclick={() => onDismiss?.(insight.id)}
            >
              Dismiss
            </button>
          {/if}
        </div>
      {/if}

      {#if compact}
        <p class="mt-1 text-xs text-foreground-muted">{insight.timeAgo}</p>
      {/if}
    </div>
  </div>
</div>
