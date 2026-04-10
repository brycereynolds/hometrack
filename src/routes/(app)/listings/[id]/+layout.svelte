<script lang="ts">
	import { page } from '$app/stores';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { listings, PHASES, PHASE_LIST } from '$lib/data/mock-data.js';
	import {
		ArrowLeft,
		Edit,
		Share2,
		RefreshCw,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	let { children } = $props();

	const listing = $derived(listings.find((l) => l.id === $page.params.id));
	const currentPhaseOrder = $derived(listing ? PHASES[listing.phase].order : 0);

	const tabs = [
		{ href: '', label: 'Overview' },
		{ href: '/activity', label: 'Activity' },
		{ href: '/tasks', label: 'Tasks' },
		{ href: '/documents', label: 'Documents' },
		{ href: '/financials', label: 'Financials' },
		{ href: '/marketing', label: 'Marketing' },
		{ href: '/showings', label: 'Showings' },
		{ href: '/offers', label: 'Offers' },
		{ href: '/analytics', label: 'Analytics' },
		{ href: '/portal-settings', label: 'Portal' }
	];

	let tabsContainer: HTMLDivElement;

	function scrollTabs(direction: 'left' | 'right') {
		if (tabsContainer) {
			tabsContainer.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
		}
	}

	function isActiveTab(tabHref: string): boolean {
		const basePath = `/listings/${$page.params.id}`;
		const currentPath = $page.url.pathname;
		if (tabHref === '') {
			return currentPath === basePath || currentPath === basePath + '/';
		}
		return currentPath === basePath + tabHref;
	}
</script>

{#if listing}
	<div class="space-y-0">
		<!-- Hero Header -->
		<div class="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
			<div class="relative h-56 overflow-hidden sm:h-64 md:h-72">
				<img
					src={listing.photoUrl}
					alt={listing.address}
					class="h-full w-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

				<!-- Back button -->
				<div class="absolute left-4 top-4">
					<Button variant="secondary" size="sm" href="/listings" class="bg-white/90 backdrop-blur-sm hover:bg-white">
						<ArrowLeft class="mr-1.5 size-4" />
						Listings
					</Button>
				</div>

				<!-- Action buttons -->
				<div class="absolute right-4 top-4 flex gap-2">
					<Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
						<Edit class="mr-1.5 size-4" />
						Edit
					</Button>
					<Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
						<RefreshCw class="mr-1.5 size-4" />
						Change Phase
					</Button>
					<Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
						<Share2 class="mr-1.5 size-4" />
						Share
					</Button>
				</div>

				<!-- Hero content -->
				<div class="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h1 class="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
								{listing.address}
							</h1>
							<p class="mt-1 text-sm text-white/80 sm:text-base">
								{listing.city}, {listing.state} {listing.zip}
							</p>
						</div>
						<div class="flex items-center gap-3 sm:gap-4">
							<Badge
								variant="outline"
								class="border-white/40 bg-white/10 text-white backdrop-blur-sm text-xs sm:text-sm"
								style="border-color: {PHASES[listing.phase].color}; background-color: {PHASES[listing.phase].color}20"
							>
								{listing.phaseLabel}
							</Badge>
							<span class="font-serif text-2xl font-bold sm:text-3xl">{listing.priceFormatted}</span>
						</div>
					</div>
					<div class="mt-2 flex items-center gap-4 text-xs text-white/70 sm:text-sm">
						<span>MLS {listing.mlsNumber}</span>
						<span>|</span>
						{#if listing.daysOnMarket > 0}
							<span>{listing.daysOnMarket} DOM</span>
						{:else}
							<span>Pre-market</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Phase Progress Bar -->
		<div class="border-b bg-muted/30 px-4 py-3 -mx-4 md:-mx-6 lg:-mx-8 md:px-6 lg:px-8">
			<div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
				{#each PHASE_LIST as phase, i}
					{@const isComplete = phase.order < currentPhaseOrder}
					{@const isCurrent = phase.order === currentPhaseOrder}
					<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
						<div class="flex items-center gap-1.5">
							<div
								class="size-2.5 rounded-full transition-all {isCurrent ? 'ring-2 ring-offset-1 scale-125' : ''}"
								style="background-color: {isComplete || isCurrent ? phase.color : '#d1d5db'};
									   {isCurrent ? `ring-color: ${phase.color}40` : ''}"
							></div>
							<span
								class="text-[10px] sm:text-xs whitespace-nowrap {isCurrent ? 'font-semibold' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'}"
								style={isCurrent ? `color: ${phase.color}` : ''}
							>
								{phase.label}
							</span>
						</div>
						{#if i < PHASE_LIST.length - 1}
							<div
								class="h-px w-4 sm:w-6"
								style="background-color: {isComplete ? phase.color : '#e5e7eb'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="border-b -mx-4 md:-mx-6 lg:-mx-8 relative">
			<button
				onclick={() => scrollTabs('left')}
				class="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-r from-background via-background to-transparent sm:hidden"
			>
				<ChevronLeft class="size-4 text-muted-foreground" />
			</button>
			<div
				bind:this={tabsContainer}
				class="flex overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8"
			>
				{#each tabs as tab}
					{@const active = isActiveTab(tab.href)}
					<a
						href="/listings/{$page.params.id}{tab.href}"
						class="shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 {active
							? 'border-primary text-primary'
							: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}"
					>
						{tab.label}
					</a>
				{/each}
			</div>
			<button
				onclick={() => scrollTabs('right')}
				class="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-l from-background via-background to-transparent sm:hidden"
			>
				<ChevronRight class="size-4 text-muted-foreground" />
			</button>
		</div>

		<!-- Tab Content -->
		<div class="pt-6 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-12">
		<p class="text-lg font-medium">Listing not found</p>
		<Button variant="outline" href="/listings" class="mt-4">Back to Listings</Button>
	</div>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
