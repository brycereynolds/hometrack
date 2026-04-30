<svelte:head>
	<title>{property?.address ?? 'Property'} | HomeTrack</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { formatCurrency, formatNumber } from '$lib/utils.js';
	import {
		ArrowLeft,
		Bed,
		Bath,
		Ruler,
		MapPin,
		Home,
		DollarSign,
		Calendar,
		Building2,
		Layers,
		Droplets,
		Trees,
		Car,
		GraduationCap,
		ExternalLink,
		ChevronLeft,
		ChevronRight,
		BarChart3,
	} from 'lucide-svelte';

	let { data } = $props();
	const property = $derived(data.property);
	const compAppearances = $derived(data.compAppearances ?? []);
	const linkedListings = $derived(data.linkedListings ?? []);

	// Photo carousel
	const photos = $derived<{url: string; source?: string; caption?: string}[]>(
		Array.isArray(property?.photos) && property.photos.length > 0
			? property.photos as any[]
			: []
	);
	let currentPhotoIndex = $state(0);

	function nextPhoto() {
		if (photos.length > 0) {
			currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
		}
	}
	function prevPhoto() {
		if (photos.length > 0) {
			currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
		}
	}

	// Features rendering
	const features = $derived(property?.features as Record<string, any> | null);

	function formatFeatureValue(val: any): string {
		if (Array.isArray(val)) return val.join(', ');
		if (typeof val === 'boolean') return val ? 'Yes' : 'No';
		if (val === null || val === undefined) return '';
		return String(val);
	}

	function formatFeatureLabel(key: string): string {
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (s) => s.toUpperCase())
			.trim();
	}

	// Map
	let mapContainer = $state<HTMLDivElement>(null!);
	let map: any = null;

	onMount(async () => {
		if (!property?.lat || !property?.lng || !mapContainer) return;

		const L = (await import('leaflet')).default;
		map = L.map(mapContainer).setView([property.lat, property.lng], 15);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18,
		}).addTo(map);

		const icon = L.divIcon({
			className: 'property-pin',
			html: `<div style="background: #b45309; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">&#9733;</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		L.marker([property.lat, property.lng], { icon }).addTo(map);
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
	});

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="space-y-6">
	<!-- Back Navigation -->
	<div>
		<Button variant="ghost" size="sm" onclick={() => history.back()}>
			<ArrowLeft class="mr-1.5 size-4" />
			Back
		</Button>
	</div>

	{#if property}
		<!-- Hero Section -->
		<div class="relative -mx-4 md:-mx-6 lg:-mx-8">
			<div class="relative h-64 overflow-hidden sm:h-80 md:h-96">
				{#if photos.length > 0}
					<img
						src={photos[currentPhotoIndex].url}
						alt={property.address}
						class="h-full w-full object-cover transition-opacity duration-300"
					/>
					{#if photos.length > 1}
						<button
							onclick={prevPhoto}
							class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
						>
							<ChevronLeft class="size-5" />
						</button>
						<button
							onclick={nextPhoto}
							class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
						>
							<ChevronRight class="size-5" />
						</button>
						<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
							{#each photos as _, i}
								<button
									onclick={() => currentPhotoIndex = i}
									aria-label="View photo {i + 1}"
									class="size-2.5 rounded-full transition-all {i === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/50'}"
								></button>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
						<Home class="size-20 text-stone-400" />
					</div>
				{/if}
				<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
				<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
					<h1 class="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
						{property.address}
					</h1>
					<p class="mt-1 text-sm text-white/80 sm:text-base">
						{property.city}, {property.state} {property.zip}
						{#if property.county}
							<span class="text-white/60">({property.county} County)</span>
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Linked Listing Banner -->
		{#if linkedListings.length > 0}
			<div class="rounded-lg border border-amber-200 bg-amber-50/50 p-4 flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-amber-900">This property is one of your listings</p>
					<p class="text-xs text-amber-700 mt-0.5">{linkedListings[0].address} - {linkedListings[0].phase}</p>
				</div>
				<Button variant="outline" size="sm" href="/listings/{linkedListings[0].id}">
					View Listing
					<ExternalLink class="ml-1.5 size-3.5" />
				</Button>
			</div>
		{/if}

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main Content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Property Details Card -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 font-serif">
							<Home class="size-5 text-amber-600" />
							Property Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Bed class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{property.beds ?? '—'}</p><p class="text-xs text-muted-foreground">Beds</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Bath class="size-4 text-muted-foreground" /></div>
								<div>
									<p class="text-sm font-semibold">{property.baths ?? '—'}</p>
									<p class="text-xs text-muted-foreground">Baths
										{#if property.bathsFull || property.bathsHalf}
											({property.bathsFull ?? 0}F / {property.bathsHalf ?? 0}H)
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Ruler class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{property.sqft ? formatNumber(property.sqft) : '—'}</p><p class="text-xs text-muted-foreground">Sq Ft</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><MapPin class="size-4 text-muted-foreground" /></div>
								<div>
									<p class="text-sm font-semibold">
										{#if property.lotSizeAcres}
											{property.lotSizeAcres.toFixed(2)} ac
										{:else if property.lotSqft}
											{formatNumber(property.lotSqft)} sqft
										{:else}
											—
										{/if}
									</p>
									<p class="text-xs text-muted-foreground">Lot Size</p>
								</div>
							</div>
						</div>

						<Separator class="my-4" />

						<div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
							<div>
								<p class="text-muted-foreground">Property Type</p>
								<p class="font-medium">{property.propertyType ?? 'N/A'}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Year Built</p>
								<p class="font-medium">{property.yearBuilt ?? 'N/A'}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Stories</p>
								<p class="font-medium">{property.stories ?? 'N/A'}</p>
							</div>
							{#if property.architecturalStyle}
								<div>
									<p class="text-muted-foreground">Style</p>
									<p class="font-medium">{property.architecturalStyle}</p>
								</div>
							{/if}
							{#if property.basement}
								<div>
									<p class="text-muted-foreground">Basement</p>
									<p class="font-medium">{property.basement}</p>
								</div>
							{/if}
							{#if property.roof}
								<div>
									<p class="text-muted-foreground">Roof</p>
									<p class="font-medium">{property.roof}</p>
								</div>
							{/if}
							{#if property.garageSpaces}
								<div>
									<p class="text-muted-foreground">Garage</p>
									<p class="font-medium">{property.garageSpaces} car</p>
								</div>
							{/if}
							{#if property.parkingSpaces}
								<div>
									<p class="text-muted-foreground">Parking</p>
									<p class="font-medium">{property.parkingSpaces} spaces</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Financial Card -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 font-serif">
							<DollarSign class="size-5 text-amber-600" />
							Financial
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
							{#if property.zestimate}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">Zestimate</p>
									<p class="text-lg font-bold font-serif mt-1">{formatCurrency(property.zestimate)}</p>
								</div>
							{/if}
							{#if property.rentZestimate}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">Rent Zestimate</p>
									<p class="text-lg font-bold font-serif mt-1">{formatCurrency(property.rentZestimate)}/mo</p>
								</div>
							{/if}
							{#if property.lastSoldPrice}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">Last Sold</p>
									<p class="text-lg font-bold font-serif mt-1">{formatCurrency(property.lastSoldPrice)}</p>
									{#if property.lastSoldDate}
										<p class="text-xs text-muted-foreground mt-0.5">{formatDate(property.lastSoldDate)}</p>
									{/if}
								</div>
							{/if}
							{#if property.taxAssessedValue}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">Tax Assessed</p>
									<p class="text-lg font-bold font-serif mt-1">{formatCurrency(property.taxAssessedValue)}</p>
									{#if property.taxYear}
										<p class="text-xs text-muted-foreground mt-0.5">{property.taxYear}</p>
									{/if}
								</div>
							{/if}
							{#if property.taxAnnualAmount}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">Annual Taxes</p>
									<p class="text-lg font-bold font-serif mt-1">{formatCurrency(property.taxAnnualAmount)}</p>
								</div>
							{/if}
							{#if property.hoaFee}
								<div class="rounded-lg border bg-muted/30 p-3">
									<p class="text-xs text-muted-foreground uppercase tracking-wide">HOA Fee</p>
									<p class="text-lg font-bold font-serif mt-1">
										{formatCurrency(property.hoaFee)}/{property.hoaFeeFrequency ?? 'mo'}
									</p>
								</div>
							{/if}
						</div>

						{#if !property.zestimate && !property.lastSoldPrice && !property.taxAssessedValue}
							<p class="text-sm text-muted-foreground text-center py-4">No financial data available</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Features Card -->
				{#if features && Object.keys(features).length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2 font-serif">
								<Layers class="size-5 text-amber-600" />
								Features
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{#each Object.entries(features) as [key, val]}
									{@const formatted = formatFeatureValue(val)}
									{#if formatted && formatted !== 'false' && formatted !== 'No'}
										<div class="flex items-start gap-2 text-sm">
											<span class="text-muted-foreground min-w-[120px] shrink-0">{formatFeatureLabel(key)}:</span>
											{#if typeof val === 'boolean' && val}
												<Badge variant="secondary" class="text-xs">Yes</Badge>
											{:else}
												<span class="font-medium">{formatted}</span>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Schools -->
				{#if property.nearbySchools && Array.isArray(property.nearbySchools) && property.nearbySchools.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2 font-serif">
								<GraduationCap class="size-5 text-amber-600" />
								Nearby Schools
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="divide-y">
								{#each property.nearbySchools as school}
									{@const s = school as Record<string, any>}
									<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
										<div>
											<p class="text-sm font-medium">{s.name}</p>
											<p class="text-xs text-muted-foreground">
												{s.level ?? s.type ?? ''} {s.grades ? `(${s.grades})` : ''}
												{s.distance ? ` - ${s.distance}` : ''}
											</p>
										</div>
										{#if s.rating}
											<Badge variant={s.rating >= 7 ? 'default' : s.rating >= 5 ? 'secondary' : 'outline'} class="text-xs">
												{s.rating}/10
											</Badge>
										{/if}
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Comp Appearances -->
				{#if compAppearances.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2 font-serif">
								<BarChart3 class="size-5 text-amber-600" />
								Comp Appearances
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-sm text-muted-foreground mb-3">
								This property appeared as a comp in {compAppearances.length} {compAppearances.length === 1 ? 'analysis' : 'analyses'}.
							</p>
							<div class="divide-y">
								{#each compAppearances as comp}
									<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
										<div>
											<a href="/listings/{comp.listingId}" class="text-sm font-medium hover:underline text-amber-700">
												{comp.listingAddress}, {comp.listingCity}, {comp.listingState}
											</a>
											<p class="text-xs text-muted-foreground mt-0.5">
												{formatDate(comp.createdAt)}
												{#if comp.distanceMiles}
													<span class="ml-2">{comp.distanceMiles.toFixed(2)} mi away</span>
												{/if}
												{#if comp.price}
													<span class="ml-2">at {formatCurrency(comp.price)}</span>
												{/if}
											</p>
										</div>
										<Badge variant="outline" class="text-xs">{comp.analysisStatus}</Badge>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Location Map -->
				{#if property.lat && property.lng}
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="font-serif text-base flex items-center gap-2">
								<MapPin class="size-4 text-amber-600" />
								Location
							</CardTitle>
						</CardHeader>
						<CardContent class="p-3 pt-0">
							<div bind:this={mapContainer} class="h-48 rounded-lg overflow-hidden border"></div>
							<p class="text-xs text-muted-foreground mt-2">
								{property.lat.toFixed(6)}, {property.lng.toFixed(6)}
							</p>
						</CardContent>
					</Card>
				{/if}

				<!-- Walkability Scores -->
				{#if property.walkabilityScore || property.transitScore || property.bikeScore}
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="font-serif text-base">Walkability</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#if property.walkabilityScore}
									<div>
										<div class="flex justify-between text-sm mb-1">
											<span>Walk Score</span>
											<span class="font-semibold">{property.walkabilityScore}</span>
										</div>
										<div class="h-2 rounded-full bg-muted">
											<div class="h-2 rounded-full bg-amber-500" style="width: {property.walkabilityScore}%"></div>
										</div>
									</div>
								{/if}
								{#if property.transitScore}
									<div>
										<div class="flex justify-between text-sm mb-1">
											<span>Transit Score</span>
											<span class="font-semibold">{property.transitScore}</span>
										</div>
										<div class="h-2 rounded-full bg-muted">
											<div class="h-2 rounded-full bg-blue-500" style="width: {property.transitScore}%"></div>
										</div>
									</div>
								{/if}
								{#if property.bikeScore}
									<div>
										<div class="flex justify-between text-sm mb-1">
											<span>Bike Score</span>
											<span class="font-semibold">{property.bikeScore}</span>
										</div>
										<div class="h-2 rounded-full bg-muted">
											<div class="h-2 rounded-full bg-green-500" style="width: {property.bikeScore}%"></div>
										</div>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- External Links -->
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="font-serif text-base">External Links</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#if property.zillowUrl}
								<a
									href={property.zillowUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-2 text-sm text-blue-600 hover:underline"
								>
									<ExternalLink class="size-3.5" />
									View on Zillow
								</a>
							{:else if property.zillowId}
								<a
									href="https://www.zillow.com/homedetails/{property.zillowId}_zpid/"
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-2 text-sm text-blue-600 hover:underline"
								>
									<ExternalLink class="size-3.5" />
									View on Zillow
								</a>
							{/if}
							{#if property.redfinUrl}
								<a
									href={property.redfinUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-2 text-sm text-blue-600 hover:underline"
								>
									<ExternalLink class="size-3.5" />
									View on Redfin
								</a>
							{/if}
							{#if property.parcelNumber}
								<p class="text-sm text-muted-foreground">
									Parcel: {property.parcelNumber}
								</p>
							{/if}
							{#if property.mlsId}
								<p class="text-sm text-muted-foreground">
									MLS: {property.mlsId}
								</p>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Property Metadata -->
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="font-serif text-base">Metadata</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-2 text-sm">
							{#if property.neighborhood}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Neighborhood</span>
									<span class="font-medium">{property.neighborhood}</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Last Synced</span>
								<span class="font-medium">{property.lastSynced ? formatDate(property.lastSynced) : 'Never'}</span>
							</div>
							{#if property.dataCompletenessScore}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Data Completeness</span>
									<span class="font-medium">{Math.round(property.dataCompletenessScore * 100)}%</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Created</span>
								<span class="font-medium">{formatDate(property.createdAt)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-12">
			<p class="text-lg font-medium">Property not found</p>
			<Button variant="outline" onclick={() => history.back()} class="mt-4">Go Back</Button>
		</div>
	{/if}
</div>
