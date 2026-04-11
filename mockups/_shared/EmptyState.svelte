<!--
  EmptyState.svelte — Empty state component
  Configurable icon, title, description, and CTA button.
-->
<script lang="ts">
  interface Props {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  let { icon = 'inbox', title, description, actionLabel, onAction }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
  <!-- Icon -->
  <div class="mb-4 flex size-16 items-center justify-center rounded-2xl bg-background-tertiary text-foreground-muted">
    <svg class="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
      {#if icon === 'inbox'}
        <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      {:else if icon === 'home'}
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
      {:else if icon === 'users'}
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      {:else if icon === 'folder'}
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      {:else if icon === 'bar-chart'}
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
      {:else if icon === 'message'}
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      {:else if icon === 'file-text'}
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      {:else if icon === 'search'}
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      {:else}
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      {/if}
    </svg>
  </div>

  <h3 class="text-lg font-semibold text-foreground">{title}</h3>

  {#if description}
    <p class="mt-2 max-w-sm text-sm text-foreground-secondary">{description}</p>
  {/if}

  {#if actionLabel && onAction}
    <button
      class="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary-hover transition-colors"
      onclick={onAction}
    >
      <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {actionLabel}
    </button>
  {/if}
</div>
