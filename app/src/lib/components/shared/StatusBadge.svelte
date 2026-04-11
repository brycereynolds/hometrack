<!--
  StatusBadge.svelte — Generic status badge for tasks, offers, documents, etc.
-->
<script lang="ts">
  interface Props {
    status: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
    size?: 'sm' | 'md';
    /** Show a dot indicator before the label */
    dot?: boolean;
  }

  let { status, variant = 'neutral', size = 'md', dot = false }: Props = $props();

  const variantClasses: Record<string, string> = {
    success: 'bg-success-subtle text-success',
    warning: 'bg-warning-subtle text-warning',
    error: 'bg-error-subtle text-error',
    info: 'bg-info-subtle text-info',
    neutral: 'bg-background-tertiary text-foreground-secondary',
    primary: 'bg-primary-subtle text-primary',
  };

  const dotColorClasses: Record<string, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-foreground-muted',
    primary: 'bg-primary',
  };
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-sm font-medium {variantClasses[variant]}"
  class:px-1.5={size === 'sm'}
  class:py-0.5={size === 'sm'}
  class:text-[10px]={size === 'sm'}
  class:px-2={size === 'md'}
  class:py-1={size === 'md'}
  class:text-xs={size === 'md'}
>
  {#if dot}
    <span class="size-1.5 rounded-full {dotColorClasses[variant]}"></span>
  {/if}
  {status}
</span>
