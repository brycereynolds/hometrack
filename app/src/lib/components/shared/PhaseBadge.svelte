<!--
  PhaseBadge.svelte — Listing phase badge with colored dot + label
-->
<script lang="ts">
  import { PHASES, type ListingPhase } from '$lib/config';

  interface Props {
    phase: ListingPhase;
    size?: 'sm' | 'md';
  }

  let { phase, size = 'md' }: Props = $props();

  const phaseConfig = $derived(PHASES[phase]);
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-full font-medium bg-muted/60 text-foreground"
  class:px-2={size === 'sm'}
  class:py-0.5={size === 'sm'}
  class:text-[10px]={size === 'sm'}
  class:px-2.5={size === 'md'}
  class:py-1={size === 'md'}
  class:text-xs={size === 'md'}
>
  <span class="size-2 rounded-full shrink-0" style="background-color: {phaseConfig.color}"></span>
  {phaseConfig.label}
</span>
