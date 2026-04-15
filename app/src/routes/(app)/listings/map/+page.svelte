<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PHASES } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
	import type { ListingWithRelations } from '$lib/types.js';
	import {
		Plus,
		LayoutGrid,
		List,
		Map as MapIcon,
		Search,
		X,
		Bed,
		Bath,
		Ruler,
		Clock,
		ChevronRight,
	} from 'lucide-svelte';

	let { data } = $props();
	const listings = $derived(data.listings);

	let mapContainer: HTMLDivElement;
	let map: any;
	let searchQuery = $state('');
	let selectedListing = $state<ListingWithRelations | null>(null);

	let filteredListings = $derived(
		searchQuery
			? listings.filter(
					(l: ListingWithRelations) =>
						l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
						l.city.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: listings
	);

	onMount(async () => {
		const L = (await import('leaflet')).default;

		map = L.map(mapContainer).setView([37.36, -122.05], 10);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18,
		}).addTo(map);

		// Add markers for each listing
		const markersWithCoords = listings.filter((l: ListingWithRelations) => l.lat && l.lng);
		markersWithCoords.forEach((listing: ListingWithRelations) => {
			const phaseConfig = PHASES[listing.phase];

			const marker = L.circleMarker([listing.lat!, listing.lng!], {
				radius: 10,
				fillColor: phaseConfig.color,
				color: '#fff',
				weight: 2,
				opacity: 1,
				fillOpacity: 0.85,
			}).addTo(map);

			// Popup content
			const popupContent = `
				<div style="min-width: 220px; font-family: inherit;">
					<img src="${listing.photoUrl}" alt="${listing.address}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px 6px 0 0; margin: -12px -1px 8px -1px; width: calc(100% + 2px);" />
					<div style="padding: 0 4px 4px;">
						<div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${listing.address}</div>
						<div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">${listing.city}, ${listing.state} ${listing.zip}</div>
						<div style="display: flex; align-items: center; justify-content: space-between;">
							<span style="font-weight: 700; font-size: 15px;">${listing.price ? formatCurrency(listing.price) : 'No Price'}</span>
							<span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; color: white; background-color: ${phaseConfig.color};">${phaseConfig.label}</span>
						</div>
						<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${listing.beds ?? 0} bd &middot; ${listing.baths ?? 0} ba &middot; ${(listing.sqft ?? 0).toLocaleString()} sqft</div>
						<a href="/listings/${listing.id}" style="display: inline-block; margin-top: 8px; font-size: 12px; color: #C4704B; text-decoration: none; font-weight: 500;">View details &rarr;</a>
					</div>
				</div>
			`;

			marker.bindPopup(popupContent, { maxWidth: 260, className: 'hometrack-popup' });

			marker.on('click', () => {
				selectedListing = listing;
			});
		});

		// Fit bounds to markers
		if (markersWithCoords.length > 0) {
			const group = L.featureGroup(
				markersWithCoords.map((l: ListingWithRelations) => L.circleMarker([l.lat!, l.lng!]))
			);
			map.fitBounds(group.getBounds().pad(0.15));
		}

		return () => {
			map.remove();
		};
	});

	function panToListing(listing: ListingWithRelations) {
		if (map && listing.lat && listing.lng) {
			map.setView([listing.lat, listing.lng], 14);
			selectedListing = listing;
		}
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Listings Map</h1>
			<p class="text-muted-foreground">{listings.length} properties across the Bay Area</p>
		</div>
		<a href="/listings/new">
			<Button size="sm">
				<Plus class="mr-1.5 size-4" />
				New Listing
			</Button>
		</a>
	</div>

	<!-- View Toggle -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center rounded-lg border bg-muted/50 p-1">
			<a href="/listings" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<LayoutGrid class="size-4" />
				Board
			</a>
			<a href="/listings/list" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
				<List class="size-4" />
				List
			</a>
			<a href="/listings/map" class="inline-flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
				<MapIcon class="size-4" />
				Map
			</a>
		</div>

		<div class="relative">
			<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<input
				type="search"
				placeholder="Search listings..."
				bind:value={searchQuery}
				class="h-8 w-48 rounded-md border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
			/>
		</div>
	</div>

	<!-- Map + Side Panel Layout -->
	<div class="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
		<!-- Listing Panel (Desktop) -->
		<div class="hidden lg:flex w-80 shrink-0 flex-col rounded-lg border bg-background overflow-hidden">
			<div class="border-b px-4 py-3">
				<h2 class="text-sm font-semibold">Listings ({filteredListings.length})</h2>
			</div>
			<div class="flex-1 overflow-y-auto divide-y">
				{#each filteredListings as listing}
					{@const phaseConfig = PHASES[listing.phase]}
					<button
						onclick={() => panToListing(listing)}
						class="w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 {selectedListing?.id === listing.id ? 'bg-muted/70 border-l-2' : ''}"
						style={selectedListing?.id === listing.id ? `border-left-color: ${phaseConfig.color}` : ''}
					>
						<div class="flex gap-3">
							<div class="size-14 shrink-0 rounded-md overflow-hidden bg-muted">
								<img src={listing.photoUrl} alt={listing.address} class="object-cover w-full h-full" loading="lazy" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium truncate">{listing.address}</p>
								<p class="text-xs text-muted-foreground">{listing.city}</p>
								<div class="mt-1 flex items-center justify-between">
									{#if listing.price}<span class="text-sm font-semibold">{formatCurrency(listing.price)}</span>{:else}<span class="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">No Price</span>{/if}
									<Badge
										variant="outline"
										class="text-[10px]"
										style="border-color: {phaseConfig.color}; color: {phaseConfig.color}"
									>
										{phaseConfig.label}
									</Badge>
								</div>
								<p class="text-xs text-muted-foreground mt-1">
									{listing.beds ?? 0} bd &middot; {listing.baths ?? 0} ba &middot; {(listing.sqft ?? 0).toLocaleString()} sqft
								</p>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Map Container -->
		<div class="flex-1 rounded-lg border overflow-hidden relative">
			<div bind:this={mapContainer} class="w-full h-full"></div>

			<!-- Phase Legend -->
			<div class="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border px-3 py-2 shadow-sm z-[1000]">
				<p class="text-xs font-medium mb-1.5">Phase Legend</p>
				<div class="grid grid-cols-2 gap-x-4 gap-y-1">
					{#each Object.entries(PHASES).filter(([key]) => listings.some((l: ListingWithRelations) => l.phase === key)) as [key, phase]}
						<div class="flex items-center gap-1.5">
							<span class="size-2.5 rounded-full shrink-0" style="background-color: {phase.color}"></span>
							<span class="text-[10px] text-muted-foreground whitespace-nowrap">{phase.label}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.hometrack-popup .leaflet-popup-content-wrapper) {
		padding: 0;
		border-radius: 8px;
		overflow: hidden;
	}
	:global(.hometrack-popup .leaflet-popup-content) {
		margin: 12px 1px;
	}
</style>
