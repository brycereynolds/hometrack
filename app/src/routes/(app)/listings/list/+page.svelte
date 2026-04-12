<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { PHASES, type ListingPhase } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		Plus,
		LayoutGrid,
		List,
		Map,
		Search,
		Filter,
		ArrowUpDown,
		ChevronUp,
		ChevronDown,
	} from 'lucide-svelte';

	let { data } = $props();
	const listings = $derived(data.listings);

	// Filter state
	let searchQuery = $state('');
	let selectedPhase = $state<string>('all');
	let selectedAgent = $state('all');

	// Sort state
	type SortKey = 'address' | 'price' | 'phase' | 'agent' | 'dom' | 'tasks';
	let sortKey = $state<SortKey>('address');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const agents = $derived([...new Set(listings.map((l) => l.agent?.name).filter(Boolean))]);
	const phases = Object.entries(PHASES).map(([key, val]) => ({ key, label: val.label }));

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	let filteredListings = $derived(
		(() => {
			let result = [...listings];
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				result = result.filter(
					(l) =>
						l.address.toLowerCase().includes(q) ||
						l.city.toLowerCase().includes(q) ||
						l.client?.name?.toLowerCase().includes(q) ||
						l.mlsNumber?.toLowerCase().includes(q)
				);
			}
			if (selectedPhase !== 'all') {
				result = result.filter((l) => l.phase === selectedPhase);
			}
			if (selectedAgent !== 'all') {
				result = result.filter((l) => l.agent?.name === selectedAgent);
			}
			// Sort
			result.sort((a, b) => {
				let cmp = 0;
				switch (sortKey) {
					case 'address': cmp = a.address.localeCompare(b.address); break;
					case 'price': cmp = (a.price ?? 0) - (b.price ?? 0); break;
					case 'phase': cmp = PHASES[a.phase].order - PHASES[b.phase].order; break;
					case 'agent': cmp = (a.agent?.name ?? '').localeCompare(b.agent?.name ?? ''); break;
					case 'dom': cmp = (a.daysOnMarket ?? 0) - (b.daysOnMarket ?? 0); break;
					case 'tasks': cmp = ((a.tasksDone ?? 0) / (a.tasksTotal ?? 1)) - ((b.tasksDone ?? 0) / (b.tasksTotal ?? 1)); break;
				}
				return sortDir === 'desc' ? -cmp : cmp;
			});
			return result;
		})()
	);
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Listings</h1>
			<p class="text-muted-foreground">{listings.length} properties in your pipeline</p>
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
		<div class="flex items-center rounded-lg border bg-muted/50 p-1">
			<a href="/listings" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<LayoutGrid class="size-4" />
				Board
			</a>
			<a href="/listings/list" class="inline-flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
				<List class="size-4" />
				List
			</a>
			<a href="/listings/map" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<Map class="size-4" />
				Map
			</a>
		</div>

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
				bind:value={selectedPhase}
				class="h-8 rounded-md border bg-transparent px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
			>
				<option value="all">All Phases</option>
				{#each phases as phase}
					<option value={phase.key}>{phase.label}</option>
				{/each}
			</select>
			<select
				bind:value={selectedAgent}
				class="h-8 rounded-md border bg-transparent px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
			>
				<option value="all">All Agents</option>
				{#each agents as agent}
					<option value={agent}>{agent}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Data Table -->
	<Card>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b bg-muted/30">
							<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12"></th>
							{#each [
								{ key: 'address' as SortKey, label: 'Property' },
								{ key: 'price' as SortKey, label: 'Price' },
								{ key: 'phase' as SortKey, label: 'Phase' },
								{ key: 'agent' as SortKey, label: 'Agent' },
								{ key: 'dom' as SortKey, label: 'DOM' },
							] as col}
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									<button
										onclick={() => toggleSort(col.key)}
										class="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										{col.label}
										{#if sortKey === col.key}
											{#if sortDir === 'asc'}
												<ChevronUp class="size-3" />
											{:else}
												<ChevronDown class="size-3" />
											{/if}
										{:else}
											<ArrowUpDown class="size-3 opacity-40" />
										{/if}
									</button>
								</th>
							{/each}
							<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each filteredListings as listing}
							{@const phaseConfig = PHASES[listing.phase]}
							<tr class="group transition-colors hover:bg-muted/30">
								<!-- Photo -->
								<td class="px-4 py-3">
									<div class="size-10 rounded-md overflow-hidden bg-muted shrink-0">
										<img
											src={listing.photoUrl}
											alt={listing.address}
											class="object-cover w-full h-full"
											loading="lazy"
										/>
									</div>
								</td>
								<!-- Address -->
								<td class="px-4 py-3">
									<a href="/listings/{listing.id}" class="block group-hover:text-primary transition-colors">
										<p class="text-sm font-medium">{listing.address}</p>
										<p class="text-xs text-muted-foreground">{listing.city}, {listing.state} {listing.zip}</p>
									</a>
								</td>
								<!-- Price -->
								<td class="px-4 py-3">
									<span class="text-sm font-semibold tabular-nums">{formatCurrency(listing.price ?? 0)}</span>
								</td>
								<!-- Phase -->
								<td class="px-4 py-3">
									<Badge
										variant="outline"
										class="text-xs whitespace-nowrap"
										style="border-color: {phaseConfig.color}; color: {phaseConfig.color}"
									>
										{phaseConfig.label}
									</Badge>
								</td>
								<!-- Agent -->
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<Avatar class="size-6">
											<AvatarFallback class="bg-primary/10 text-primary text-[10px] font-medium">{listing.agent?.initials ?? '?'}</AvatarFallback>
										</Avatar>
										<span class="text-sm">{listing.agent?.name ?? 'Unassigned'}</span>
									</div>
								</td>
								<!-- DOM -->
								<td class="px-4 py-3">
									<span class="text-sm tabular-nums">
										{(listing.daysOnMarket ?? 0) > 0 ? `${listing.daysOnMarket}d` : '--'}
									</span>
								</td>
								<!-- Progress -->
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<div class="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
											<div
												class="h-full rounded-full bg-primary"
												style="width: {(listing.tasksTotal ?? 0) > 0 ? ((listing.tasksDone ?? 0) / (listing.tasksTotal ?? 1)) * 100 : 0}%"
											></div>
										</div>
										<span class="text-xs text-muted-foreground tabular-nums">{listing.tasksDone ?? 0}/{listing.tasksTotal ?? 0}</span>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if filteredListings.length === 0}
				<div class="py-12 text-center">
					<p class="text-sm text-muted-foreground">No listings match your filters</p>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
