<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import {
		listings,
		tasks,
		PHASES,
		PHASE_LIST,
		getListingsByPhase,
		type ListingPhase,
	} from '$lib/data/mock-data.js';
	import {
		Plus,
		LayoutGrid,
		List,
		Map,
		Search,
		Filter,
		Clock,
		AlertCircle,
		ChevronRight,
	} from 'lucide-svelte';

	const listingsByPhase = getListingsByPhase();

	// Filter state
	let searchQuery = $state('');
	let selectedAgent = $state('all');
	let showFilters = $state(false);

	const agents = [...new Set(listings.map((l) => l.agent.name))];

	let filteredListingsByPhase = $derived(
		(() => {
			const result = {} as Record<ListingPhase, typeof listings>;
			for (const phase of PHASE_LIST) {
				let phaseListings = listingsByPhase[phase.key] || [];
				if (searchQuery) {
					const q = searchQuery.toLowerCase();
					phaseListings = phaseListings.filter(
						(l) =>
							l.address.toLowerCase().includes(q) ||
							l.city.toLowerCase().includes(q) ||
							l.client.name.toLowerCase().includes(q)
					);
				}
				if (selectedAgent !== 'all') {
					phaseListings = phaseListings.filter((l) => l.agent.name === selectedAgent);
				}
				result[phase.key] = phaseListings;
			}
			return result;
		})()
	);

	function getTaskProgressForListing(listingId: string) {
		const listingTasks = tasks.filter((t) => t.listingId === listingId);
		const overdue = listingTasks.filter((t) => t.isOverdue).length;
		return { overdue };
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Listings Pipeline</h1>
			<p class="text-muted-foreground">{listings.length} properties across {PHASE_LIST.filter((p) => (listingsByPhase[p.key]?.length || 0) > 0).length} phases</p>
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

	<!-- Kanban Board -->
	<div class="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
		<div class="flex gap-4" style="min-width: max-content;">
			{#each PHASE_LIST as phase}
				{@const phaseListings = filteredListingsByPhase[phase.key] || []}
				<div class="w-72 shrink-0">
					<!-- Column Header -->
					<div class="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
						<div class="flex items-center gap-2">
							<span class="size-2.5 rounded-full" style="background-color: {phase.color}"></span>
							<span class="text-sm font-semibold">{phase.label}</span>
						</div>
						<Badge variant="secondary" class="text-xs tabular-nums">{phaseListings.length}</Badge>
					</div>

					<!-- Cards -->
					<div class="space-y-3">
						{#each phaseListings as listing}
							{@const taskInfo = getTaskProgressForListing(listing.id)}
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
										<div class="absolute top-2 right-2">
											<Badge class="text-xs font-semibold shadow-sm bg-background/90 text-foreground backdrop-blur-sm">
												{listing.priceFormatted}
											</Badge>
										</div>
									</div>
									<CardContent class="p-3">
										<!-- Address -->
										<h3 class="text-sm font-medium truncate group-hover:text-primary transition-colors">{listing.address}</h3>
										<p class="text-xs text-muted-foreground">{listing.city}, {listing.state}</p>

										<!-- Agent + Days in Phase -->
										<div class="mt-2.5 flex items-center justify-between">
											<div class="flex items-center gap-1.5">
												<Avatar class="size-5">
													<AvatarFallback class="bg-primary/10 text-primary text-[10px] font-medium">{listing.agent.initials}</AvatarFallback>
												</Avatar>
												<span class="text-xs text-muted-foreground">{listing.agent.name.split(' ')[0]}</span>
											</div>
											<div class="flex items-center gap-1 text-xs text-muted-foreground">
												<Clock class="size-3" />
												{listing.daysInPhase}d
											</div>
										</div>

										<!-- Task Progress -->
										<div class="mt-2.5">
											<div class="flex items-center justify-between mb-1">
												<span class="text-xs text-muted-foreground">{listing.tasksDone}/{listing.tasksTotal} tasks</span>
												{#if taskInfo.overdue > 0}
													<div class="flex items-center gap-1 text-xs text-destructive">
														<AlertCircle class="size-3" />
														{taskInfo.overdue} overdue
													</div>
												{/if}
											</div>
											<div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
												<div
													class="h-full rounded-full bg-primary transition-all"
													style="width: {(listing.tasksDone / listing.tasksTotal) * 100}%"
												></div>
											</div>
										</div>
									</CardContent>
								</Card>
							</a>
						{:else}
							<!-- Empty state -->
							<div class="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
								<p class="text-xs text-muted-foreground">No listings in this phase</p>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
