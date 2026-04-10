<!--
  PageHeader.svelte — Page title, subtitle, and action buttons area
  Used on every page. DM Serif Display for title.
-->
<script lang="ts">
  import { type Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    /** Slot for action buttons on the right side */
    actions?: Snippet;
  }

  let { title, subtitle, actions }: Props = $props();
</script>

<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 class="font-serif text-3xl font-bold text-foreground">{title}</h1>
    {#if subtitle}
      <p class="mt-1 text-sm text-foreground-secondary">{subtitle}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</div>
