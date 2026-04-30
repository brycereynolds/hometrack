<!--
  ListingCard.svelte — Card used in pipeline board columns and list views
  Shows property photo, address, price, agent, phase badge, key stats.
-->
<script lang="ts">
  import PhaseBadge from './PhaseBadge.svelte';
  import type { Listing, Property } from '$lib/types';
  import { formatCurrency } from '$lib/utils';

  interface Props {
    listing: Listing & { property: Property; agent?: { name: string; initials: string } | null; priceFormatted?: string };
    variant?: 'pipeline' | 'list';
    /** Show a warning border for stale listings */
    stale?: boolean;
  }

  let { listing, variant = 'pipeline', stale = false }: Props = $props();

  const prop = $derived(listing.property);
  const photoUrl = $derived((prop?.photos as { url: string }[] | null)?.[0]?.url ?? null);
  const priceFormatted = $derived(listing.priceFormatted ?? (listing.price ? formatCurrency(listing.price) : null));
  const agentInitials = $derived(listing.agent?.initials ?? '??');
  const agentName = $derived(listing.agent?.name ?? 'Unassigned');
</script>

<a
  href="/listings/{listing.id}"
  class="group block rounded-lg border bg-background-secondary shadow-xs transition-shadow hover:shadow-md {stale ? 'border-warning' : 'border-border'}"
>
  {#if variant === 'pipeline'}
    <!-- Pipeline card: compact vertical layout -->
    <div class="p-3">
      <!-- Photo placeholder + phase badge -->
      <div class="relative mb-3 aspect-[16/10] overflow-hidden rounded-md bg-background-tertiary">
        {#if photoUrl}
          <img
            src={photoUrl}
            alt={prop?.address ?? ''}
            class="object-cover w-full h-full transition-transform group-hover:scale-105"
            loading="lazy"
          />
        {:else}
          <div class="absolute inset-0 flex items-center justify-center text-foreground-muted">
            <svg class="size-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
        {/if}
        <div class="absolute right-2 top-2">
          <PhaseBadge phase={listing.phase} size="sm" />
        </div>
        {#if listing.phase === 'active' && listing.underContract}
          <div class="absolute left-2 bottom-2">
            <span class="inline-flex items-center rounded-sm bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              UNDER CONTRACT
            </span>
          </div>
        {/if}
      </div>

      <!-- Address & price -->
      <p class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
        {prop?.address ?? ''}
      </p>
      <p class="text-xs text-foreground-secondary">{prop?.city ?? ''}, {prop?.state ?? ''}</p>
      {#if priceFormatted}
        <p class="mt-1 font-serif text-lg font-bold text-foreground">{priceFormatted}</p>
      {:else}
        <span class="mt-1 inline-block text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">No Price</span>
      {/if}

      <!-- Stats row -->
      <div class="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
        <span>{prop?.beds ?? 0}bd / {prop?.baths ?? 0}ba</span>
        <span class="text-border-strong">&middot;</span>
        <span>{(prop?.sqft ?? 0).toLocaleString()} sqft</span>
      </div>

      <!-- Bottom row: agent + days -->
      <div class="mt-3 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <div class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {agentInitials}
          </div>
          <span class="text-xs text-foreground-secondary">{agentName.split(' ')[0]}</span>
        </div>
        <span class="text-xs text-foreground-muted">{listing.daysInPhase}d in stage</span>
      </div>

      <!-- Task progress -->
      {#if (listing.tasksTotal ?? 0) > 0}
        <div class="mt-2.5">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-foreground-muted">{(listing.tasksDone ?? 0)}/{(listing.tasksTotal ?? 0)} tasks</span>
          </div>
          <div class="h-1.5 w-full rounded-full bg-background-tertiary overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all"
              style="width: {((listing.tasksDone ?? 0) / (listing.tasksTotal ?? 1)) * 100}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Overdue task badge -->
      {#if ((listing.tasksTotal ?? 0) - (listing.tasksDone ?? 0)) > 3}
        <div class="mt-2 flex items-center gap-1 text-xs text-warning">
          <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {((listing.tasksTotal ?? 0) - (listing.tasksDone ?? 0))} tasks remaining
        </div>
      {/if}
    </div>

  {:else}
    <!-- List card: horizontal layout -->
    <div class="flex items-center gap-4 p-4">
      <!-- Photo -->
      <div class="relative size-16 shrink-0 overflow-hidden rounded-md bg-background-tertiary">
        {#if photoUrl}
          <img
            src={photoUrl}
            alt={prop?.address ?? ''}
            class="object-cover w-full h-full"
            loading="lazy"
          />
        {:else}
          <div class="flex size-full items-center justify-center text-foreground-muted">
            <svg class="size-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
        {/if}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {prop?.address ?? ''}, {prop?.city ?? ''}
          </p>
          <PhaseBadge phase={listing.phase} size="sm" />
          {#if listing.phase === 'active' && listing.underContract}
            <span class="inline-flex items-center rounded-sm bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
              UNDER CONTRACT
            </span>
          {/if}
        </div>
        {#if priceFormatted}
        <p class="mt-0.5 font-serif text-lg font-bold text-foreground">{priceFormatted}</p>
      {:else}
        <span class="mt-0.5 inline-block text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">No Price</span>
      {/if}
        <div class="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
          <span>{prop?.beds ?? 0}bd / {prop?.baths ?? 0}ba / {(prop?.sqft ?? 0).toLocaleString()} sqft</span>
          <span class="text-border-strong">&middot;</span>
          <span>{agentName}</span>
          {#if (listing.daysOnMarket ?? 0) > 0}
            <span class="text-border-strong">&middot;</span>
            <span>{listing.daysOnMarket} DOM</span>
          {/if}
        </div>
      </div>

      <!-- Stats -->
      <div class="hidden shrink-0 items-center gap-6 text-xs text-foreground-secondary sm:flex">
        <div class="text-center">
          <p class="font-semibold text-foreground">{(listing.tasksDone ?? 0)}/{(listing.tasksTotal ?? 0)}</p>
          <p class="text-foreground-muted">Tasks</p>
        </div>
        <div class="text-center">
          <p class="font-semibold text-foreground">{listing.showingsCount}</p>
          <p class="text-foreground-muted">Showings</p>
        </div>
        {#if (listing.offersCount ?? 0) > 0}
          <div class="text-center">
            <p class="font-semibold text-primary">{listing.offersCount}</p>
            <p class="text-foreground-muted">Offers</p>
          </div>
        {/if}
      </div>

      <!-- Arrow -->
      <svg class="size-5 shrink-0 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <polyline points="9,18 15,12 9,6" />
      </svg>
    </div>
  {/if}
</a>
