<!--
  MetricCard.svelte — Dashboard KPI metric card
  Big number (DM Serif Display) + label + trend indicator
-->
<script lang="ts">
  interface Props {
    label: string;
    value: string;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    /** Optional subtitle below the value */
    detail?: string;
  }

  let { label, value, trend, trendDirection = 'neutral', detail }: Props = $props();
</script>

<div class="rounded-lg border border-border bg-background-secondary p-6 shadow-xs">
  <p class="text-sm font-medium text-foreground-secondary">{label}</p>
  <p class="mt-1 font-serif text-4xl font-bold text-foreground">{value}</p>

  {#if trend || detail}
    <div class="mt-2 flex items-center gap-2">
      {#if trend}
        <div
          class="flex items-center gap-1 text-sm"
          class:text-success={trendDirection === 'up'}
          class:text-error={trendDirection === 'down'}
          class:text-foreground-muted={trendDirection === 'neutral'}
        >
          {#if trendDirection === 'up'}
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" />
            </svg>
          {:else if trendDirection === 'down'}
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" /><polyline points="17,18 23,18 23,12" />
            </svg>
          {/if}
          <span>{trend}</span>
        </div>
      {/if}
      {#if detail}
        <span class="text-sm text-foreground-muted">{detail}</span>
      {/if}
    </div>
  {/if}
</div>
