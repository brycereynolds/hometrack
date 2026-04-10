<!--
  PhaseBadge.svelte — Listing phase badge with phase-specific color
-->
<script lang="ts">
  import { PHASES, type ListingPhase } from '$lib/data/mock-data';

  interface Props {
    phase: ListingPhase;
    size?: 'sm' | 'md';
  }

  let { phase, size = 'md' }: Props = $props();

  const phaseConfig = $derived(PHASES[phase]);
</script>

<span
  class="inline-flex items-center rounded-sm font-medium text-white"
  class:px-1.5={size === 'sm'}
  class:py-0.5={size === 'sm'}
  class:text-[10px]={size === 'sm'}
  class:px-2={size === 'md'}
  class:py-1={size === 'md'}
  class:text-xs={size === 'md'}
  style="background-color: {phaseConfig.color}"
>
  {phaseConfig.label}
</span>
