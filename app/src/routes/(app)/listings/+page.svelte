<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { PHASES, PHASE_LIST, type ListingPhase } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
	import type { ListingWithRelations } from '$lib/types.js';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import {
		Plus,
		LayoutGrid,
		List,
		Map,
		Search,
		Filter,
		Clock,
		AlertCircle,
	} from 'lucide-svelte';

	let { data } = $props();

	const initialByPhase = (() => {
		const grouped: Record<string, ListingWithRelations[]> = {};
		for (const listing of data.listings) {
			const phase = listing.phase;
			if (!grouped[phase]) grouped[phase] = [];
			grouped[phase].push(listing);
		}
		return grouped;
	})();

	// Mutable column data for drag-and-drop reordering
	let columns = $state<Record<ListingPhase, ListingWithRelations[]>>(
		Object.fromEntries(
			PHASE_LIST.map((p) => [p.key, [...(initialByPhase[p.key] || [])]])
		) as Record<ListingPhase, ListingWithRelations[]>
	);

	// Filter state
	let searchQuery = $state('');
	let selectedAgent = $state('all');
	let showFilters = $state(false);

	// Mobile tab state
	let activeTab = $state<ListingPhase>('pre_market');

	// Track which column is being dragged over
	let dragOverPhase = $state<ListingPhase | null>(null);

	const agents = $derived([...new Set(data.listings.map((l) => l.agent?.name).filter(Boolean))]);

	// Filtering: when filters are active, show filtered view (non-draggable).
	// When no filters, show the draggable columns directly.
	let hasFilters = $derived(searchQuery !== '' || selectedAgent !== 'all');

	let filteredListingsByPhase = $derived(
		(() => {
			if (!hasFilters) return columns;
			const result = {} as Record<ListingPhase, ListingWithRelations[]>;
			for (const phase of PHASE_LIST) {
				let phaseListings = columns[phase.key] || [];
				if (searchQuery) {
					const q = searchQuery.toLowerCase();
					phaseListings = phaseListings.filter(
						(l) =>
							l.address.toLowerCase().includes(q) ||
							l.city.toLowerCase().includes(q) ||
							l.client?.name?.toLowerCase().includes(q)
					);
				}
				if (selectedAgent !== 'all') {
					phaseListings = phaseListings.filter((l) => l.agent?.name === selectedAgent);
				}
				result[phase.key] = phaseListings;
			}
			return result;
		})()
	);

	let totalListings = $derived(
		PHASE_LIST.reduce((sum, phase) => sum + (filteredListingsByPhase[phase.key]?.length || 0), 0)
	);

	const flipDurationMs = 200;

	function handleConsider(phase: ListingPhase, e: CustomEvent<{ items: ListingWithRelations[] }>) {
		columns[phase] = e.detail.items;
		dragOverPhase = phase;
	}

	function handleFinalize(phase: ListingPhase, e: CustomEvent<{ items: ListingWithRelations[] }>) {
		// Update the phase property on any listing that moved into this column
		columns[phase] = e.detail.items.map((item) => {
			if (item.phase !== phase) {
				// Persist phase change to the server
				fetch(`/api/listings/${item.id}/phase`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phase }),
				}).then((res) => {
					if (res.ok) {
						toast.success(`Moved to ${PHASES[phase].label}`);
					} else {
						toast.error('Failed to save phase change');
					}
				}).catch(() => {
					toast.error('Failed to save phase change');
				});

				return {
					...item,
					phase,
					daysInPhase: 0,
				};
			}
			return item;
		});
		dragOverPhase = null;
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Listings Pipeline</h1>
			<p class="text-muted-foreground">{totalListings} properties across 4 stages</p>
		</div>
		<a href="/listings/new">
			<Button size="sm">
				<Plus class="mr-1.5 size-4" />
				New Listing
			</Button>
		</a>
	</div>

	<!-- View Toggle + Filters -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<!-- View Toggle Tabs -->
		<div class="flex items-center rounded-lg border bg-muted/50 p-1">
			<a href="/listings" class="inline-flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
				<LayoutGrid class="size-4" />
				Board
			</a>
			<a href="/listings/list" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<List class="size-4" />
				List
			</a>
			<a href="/listings/map" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<Map class="size-4" />
				Map
			</a>
		</div>

		<!-- Filter Bar -->
		<div class="flex items-center gap-2">
			<div class="relative">
				<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="search"
					placeholder="Search listings..."
					bind:value={searchQuery}
					class="h-8 w-48 rounded-md border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				/>
			</div>
			<select
				bind:value={selectedAgent}
				class="h-8 rounded-md border bg-transparent px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
			>
				<option value="all">All Agents</option>
				{#each agents as agent}
					<option value={agent}>{agent}</option>
				{/each}
			</select>
			<Button variant="outline" size="sm" class="h-8" onclick={() => showFilters = !showFilters}>
				<Filter class="mr-1.5 size-3.5" />
				Filters
			</Button>
		</div>
	</div>

	<!-- Mobile: Segmented Tab Control (visible < 640px) -->
	<div class="flex sm:hidden rounded-lg border bg-muted/50 p-1">
		{#each PHASE_LIST as phase}
			{@const count = filteredListingsByPhase[phase.key]?.length || 0}
			<button
				class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors {activeTab === phase.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
				onclick={() => activeTab = phase.key}
			>
				<span class="inline-flex size-2 rounded-full mr-1" style="background-color: {phase.color}"></span>
				{phase.label}
				<span class="ml-1 tabular-nums text-muted-foreground">({count})</span>
			</button>
		{/each}
	</div>

	<!-- Mobile: Single column for active tab (visible < 640px) -->
	<div class="block sm:hidden">
		{#if PHASE_LIST.find(p => p.key === activeTab)}
		{@const phase = PHASE_LIST.find(p => p.key === activeTab)!}
		{@const phaseListings = filteredListingsByPhase[phase.key] || []}
		<div class="space-y-3">
			{#each phaseListings as listing}
				<a href="/listings/{listing.id}" class="group block">
					<Card class="overflow-hidden transition-all hover:shadow-md hover:border-border/80">
						<!-- Photo -->
						<div class="aspect-[16/10] relative overflow-hidden bg-muted">
							<img
								src={listing.photoUrl}
								alt={listing.address}
								class="object-cover w-full h-full transition-transform group-hover:scale-105"
								loading="lazy"
							/>
							<div class="absolute top-2 left-2 flex items-center gap-1.5">
								{#if listing.price}
									<Badge class="text-xs font-semibold shadow-sm bg-background/90 text-foreground backdrop-blur-sm">
										{formatCurrency(listing.price)}
									</Badge>
								{:else}
									<Badge class="text-xs font-medium shadow-sm bg-muted/90 text-muted-foreground backdrop-blur-sm">Unset</Badge>
								{/if}
								{#if listing.phase === 'active' && listing.underContract}
									<Badge class="text-xs font-semibold shadow-sm bg-amber-500/90 text-white backdrop-blur-sm">
										UNDER CONTRACT
									</Badge>
								{/if}
							</div>
							<div class="absolute top-2 right-2">
								<span class="inline-flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
									<Clock class="size-3" />
									{listing.daysInPhase ?? 0}d
								</span>
							</div>
						</div>
						<CardContent class="p-3">
							<!-- Address -->
							<h3 class="text-sm font-medium truncate group-hover:text-primary transition-colors">{listing.address}</h3>
							<p class="text-xs text-muted-foreground">{listing.city}, {listing.state}</p>

							<!-- Agent + Task Progress -->
							<div class="mt-2.5 flex items-center justify-between">
								<div class="flex items-center gap-1.5">
									<Avatar class="size-5">
										<AvatarFallback class="bg-primary/10 text-primary text-[10px] font-medium">{listing.agent?.initials ?? '?'}</AvatarFallback>
									</Avatar>
									<span class="text-xs text-muted-foreground">{listing.agent?.name ?? 'Unassigned'}</span>
								</div>
							</div>

							<!-- Task Progress -->
							<div class="mt-2.5">
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs text-muted-foreground">{listing.tasksDone ?? 0}/{listing.tasksTotal ?? 0} tasks</span>
								</div>
								<div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
									<div
										class="h-full rounded-full transition-all"
										style="width: {(listing.tasksTotal ?? 0) > 0 ? ((listing.tasksDone ?? 0) / (listing.tasksTotal ?? 1)) * 100 : 0}%; background-color: {phase.color}"
									></div>
								</div>
							</div>
						</CardContent>
					</Card>
				</a>
			{:else}
				<div class="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
					<p class="text-xs text-muted-foreground">No listings in this stage</p>
				</div>
			{/each}
		</div>
		{/if}
	</div>

	<!-- Desktop/Tablet: Grid layout with drag-and-drop (hidden < 640px) -->
	<div class="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each PHASE_LIST as phase}
			<div class="min-w-0">
				<!-- Column Header -->
				<div class="mb-3 flex items-center justify-between rounded-lg px-3 py-2" style="background-color: {phase.color}12">
					<div class="flex items-center gap-2">
						<span class="size-2.5 rounded-full" style="background-color: {phase.color}"></span>
						<span class="text-sm font-semibold">{phase.label}</span>
					</div>
					<Badge variant="secondary" class="text-xs tabular-nums">{(filteredListingsByPhase[phase.key] || []).length}</Badge>
				</div>

				{#if hasFilters}
					<!-- Filtered view (no drag-and-drop) -->
					<div class="space-y-3">
						{#each filteredListingsByPhase[phase.key] || [] as listing}
							<a href="/listings/{listing.id}" class="group block">
								{@render listingCard(listing, phase)}
							</a>
						{:else}
							<div class="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
								<p class="text-xs text-muted-foreground">No listings in this stage</p>
							</div>
						{/each}
					</div>
				{:else}
					<!-- DnD drop zone -->
					<div
						class="dnd-column space-y-3 min-h-[80px] rounded-lg p-1 transition-colors {dragOverPhase === phase.key ? 'dnd-column-active' : ''}"
						use:dndzone={{
							items: columns[phase.key],
							flipDurationMs,
							type: 'listing-card',
							dropTargetStyle: {},
							dropTargetClasses: [],
						}}
						onfinalize={(e) => handleFinalize(phase.key, e)}
						onconsider={(e) => handleConsider(phase.key, e)}
					>
						{#each columns[phase.key] as listing (listing.id)}
							<a
								href="/listings/{listing.id}"
								class="group block dnd-card"
								class:dnd-shadow={(listing as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							>
								{@render listingCard(listing, phase)}
							</a>
						{/each}
						{#if columns[phase.key].length === 0}
							<div class="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
								<p class="text-xs text-muted-foreground">Drop listings here</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

{#snippet listingCard(listing: ListingWithRelations, phase: { key: ListingPhase; label: string; color: string })}
	<Card class="overflow-hidden transition-all hover:shadow-md hover:border-border/80">
		<!-- Photo -->
		<div class="aspect-[16/10] relative overflow-hidden bg-muted">
			<img
				src={listing.photoUrl}
				alt={listing.address}
				class="object-cover w-full h-full transition-transform group-hover:scale-105"
				loading="lazy"
			/>
			<div class="absolute top-2 left-2 flex items-center gap-1.5">
				{#if listing.price}
					<Badge class="text-xs font-semibold shadow-sm bg-background/90 text-foreground backdrop-blur-sm">
						{formatCurrency(listing.price)}
					</Badge>
				{:else}
					<Badge class="text-xs font-medium shadow-sm bg-muted/90 text-muted-foreground backdrop-blur-sm">Unset</Badge>
				{/if}
			</div>
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
					<Clock class="size-3" />
					{listing.daysInPhase ?? 0}d
				</span>
			</div>
			{#if listing.phase === 'active' && listing.underContract}
				<div class="absolute bottom-2 left-2">
					<Badge class="text-xs font-bold shadow-sm bg-amber-500/90 text-white backdrop-blur-sm">
						UNDER CONTRACT
					</Badge>
				</div>
			{/if}
		</div>
		<CardContent class="p-3">
			<!-- Address -->
			<h3 class="text-sm font-medium truncate group-hover:text-primary transition-colors">{listing.address}</h3>
			<p class="text-xs text-muted-foreground">{listing.city}, {listing.state}</p>

			<!-- Agent + Days in Phase -->
			<div class="mt-2.5 flex items-center justify-between">
				<div class="flex items-center gap-1.5">
					<Avatar class="size-5">
						<AvatarFallback class="bg-primary/10 text-primary text-[10px] font-medium">{listing.agent?.initials ?? '?'}</AvatarFallback>
					</Avatar>
					<span class="text-xs text-muted-foreground">{listing.agent?.name?.split(' ')[0] ?? 'Unassigned'}</span>
				</div>
			</div>

			<!-- Task Progress -->
			<div class="mt-2.5">
				<div class="flex items-center justify-between mb-1">
					<span class="text-xs text-muted-foreground">{listing.tasksDone ?? 0}/{listing.tasksTotal ?? 0} tasks</span>
				</div>
				<div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
					<div
						class="h-full rounded-full transition-all"
						style="width: {(listing.tasksTotal ?? 0) > 0 ? ((listing.tasksDone ?? 0) / (listing.tasksTotal ?? 1)) * 100 : 0}%; background-color: {phase.color}"
					></div>
				</div>
			</div>
		</CardContent>
	</Card>
{/snippet}

<style>
	/* Drop zone highlight when dragging over */
	.dnd-column-active {
		background-color: hsl(var(--muted) / 0.5);
		outline: 2px dashed hsl(var(--border));
		outline-offset: -2px;
	}

	/* Shadow placeholder left behind in the source column */
	.dnd-shadow {
		opacity: 0.4;
		pointer-events: none;
	}

	/* The item being dragged gets this from the library */
	:global([aria-grabbed="true"]) {
		opacity: 0.9;
		box-shadow: 0 10px 25px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.1);
		transform: rotate(1.5deg);
		cursor: grabbing;
	}

	/* Cards in the drop zone are grabbable */
	.dnd-column > .dnd-card {
		cursor: grab;
	}

	.dnd-column > .dnd-card:active {
		cursor: grabbing;
	}
</style>
