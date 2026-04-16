<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		DollarSign,
		TrendingUp,
		MapPin,
		BarChart3,
		Loader2,
		CheckCircle2,
		AlertCircle,
		Play,
		RefreshCw,
		Clock,
		ChevronDown,
		ChevronUp,
		ArrowUpDown,
		Calendar,
		ToggleRight,
		ToggleLeft,
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const analyses = $derived(data.analyses ?? []);
	const comps = $derived(data.comps ?? []);
	const schedule = $derived(data.schedule);
	const latestAnalysis = $derived(analyses.length > 0 ? analyses[0] : null);

	// Price input state
	let priceInput = $state('');
	let radiusValue = $state(1);
	let analysisPrompt = $state('');

	// Analysis trigger state
	let analysisLoading = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let analysisStage = $state(0);

	// True when analysis is in progress (either locally triggered or server-side pending/processing)
	const isAnalyzing = $derived(
		analysisLoading ||
		(latestAnalysis?.status === 'pending' || latestAnalysis?.status === 'processing')
	);

	const analysisStages = [
		'Starting analysis...',
		'Searching for comparable sales...',
		'Searching active listings...',
		'Analyzing market data with AI...',
		'Saving results...',
	];

	const analysisStageLabel = $derived(analysisStages[analysisStage] ?? analysisStages[0]);

	// Comp table sort
	let sortField = $state<string>('distanceMiles');
	let sortDir = $state<'asc' | 'desc'>('asc');
	let expandedCompId = $state<string | null>(null);

	// Map
	let mapContainer = $state<HTMLDivElement>(null!);
	let map: any = null;
	let compMarkers: any[] = [];
	let radiusCircle: any = null;
	let L: any = null;

	const sortedComps = $derived(() => {
		const sorted = [...comps];
		sorted.sort((a: any, b: any) => {
			const aVal = a[sortField] ?? 0;
			const bVal = b[sortField] ?? 0;
			return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
		});
		return sorted;
	});

	function toggleSort(field: string) {
		if (sortField === field) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDir = 'asc';
		}
	}

	async function runAnalysis() {
		if (!listing || isAnalyzing) return;
		analysisLoading = true;
		analysisStage = 0;

		try {
			const res = await fetch('/api/market-analysis', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listingId: listing.id,
					searchParams: {
						radius: radiusValue,
						priceInput: priceInput || undefined,
					},
					prompt: analysisPrompt || undefined,
				}),
			});

			if (!res.ok) throw new Error('Failed to start analysis');

			const result = await res.json();
			if (result.alreadyRunning) {
				toast.success('Analysis already in progress');
			} else {
				toast.success('Market analysis started');
			}
			startPolling();
		} catch {
			toast.error('Failed to start market analysis');
			analysisLoading = false;
		}
	}

	function startPolling() {
		if (pollInterval) return;
		pollInterval = setInterval(async () => {
			await invalidateAll();
			// Advance the stage label to give a sense of progress
			if (analysisStage < analysisStages.length - 1) {
				analysisStage++;
			}
			if (latestAnalysis && (latestAnalysis.status === 'completed' || latestAnalysis.status === 'failed')) {
				stopPolling();
				analysisLoading = false;
				analysisStage = 0;
				if (latestAnalysis.status === 'completed') {
					toast.success('Market analysis complete');
				} else {
					toast.error('Market analysis failed');
				}
			}
		}, 3000);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatMapPrice(price: number): string {
		if (price >= 1_000_000) {
			return `$${(price / 1_000_000).toFixed(2)}M`;
		}
		return `$${Math.round(price / 1000)}K`;
	}

	function statusColor(status: string) {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'processing':
			case 'pending': return 'bg-amber-100 text-amber-800';
			case 'failed': return 'bg-red-100 text-red-800';
			default: return 'bg-muted text-muted-foreground';
		}
	}

	// Resume polling if there's already an in-progress analysis
	onMount(() => {
		if (latestAnalysis?.status === 'pending' || latestAnalysis?.status === 'processing') {
			startPolling();
		}
	});

	// Map initialization
	onMount(async () => {
		if (!listing?.lat || !listing?.lng) return;

		L = (await import('leaflet')).default;
		map = L.map(mapContainer).setView([listing.lat, listing.lng], 14);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18,
		}).addTo(map);

		// Property marker
		const propertyIcon = L.divIcon({
			className: 'property-marker',
			html: `<div style="background: #b45309; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">★</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});
		L.marker([listing.lat, listing.lng], { icon: propertyIcon }).addTo(map)
			.bindPopup(`<strong>${listing.address}</strong><br/>${listing.city}, ${listing.state}`);

		updateMapComps();
		updateRadiusCircle();
	});

	function updateMapComps() {
		if (!map || !L) return;

		// Clear existing comp markers
		compMarkers.forEach(m => map.removeLayer(m));
		compMarkers = [];

		comps.forEach((comp: any) => {
			if (!comp.lat || !comp.lng) return;

			const dotColor = comp.status === 'sold' ? '#16a34a' : comp.status === 'for_sale' ? '#2563eb' : '#f59e0b';
			const priceLabel = comp.price ? formatMapPrice(comp.price) : '?';
			const icon = L.divIcon({
				className: 'comp-marker',
				html: `<div style="display:flex;align-items:center;gap:3px;"><div style="width:8px;height:8px;border-radius:50%;background:${dotColor};border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.3);flex-shrink:0;"></div><div style="background:rgba(255,255,255,0.95);border:1px solid #d6d3d1;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;color:#292524;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.1);line-height:1.4;">${priceLabel}</div></div>`,
				iconSize: [70, 20],
				iconAnchor: [4, 10],
			});

			const marker = L.marker([comp.lat, comp.lng], { icon }).addTo(map);
			marker.bindPopup(`
				<strong>${comp.address ?? 'Unknown'}</strong><br/>
				${comp.city ?? ''}<br/>
				<strong>${comp.price ? '$' + comp.price.toLocaleString() : 'N/A'}</strong>
				${comp.beds ? ' · ' + comp.beds + ' bd' : ''}
				${comp.baths ? ' · ' + comp.baths + ' ba' : ''}
				${comp.sqft ? ' · ' + comp.sqft.toLocaleString() + ' sqft' : ''}<br/>
				${comp.soldDate ? 'Sold: ' + formatDate(comp.soldDate) : comp.status ?? ''}
				${comp.distanceMiles ? ' · ' + comp.distanceMiles.toFixed(2) + ' mi' : ''}
			`);
			compMarkers.push(marker);
		});
	}

	function updateRadiusCircle() {
		if (!map || !L || !listing?.lat || !listing?.lng) return;

		if (radiusCircle) map.removeLayer(radiusCircle);
		radiusCircle = L.circle([listing.lat, listing.lng], {
			radius: radiusValue * 1609.34,
			color: '#b45309',
			opacity: 0.6,
			fillColor: '#b45309',
			fillOpacity: 0.15,
			weight: 3,
		}).addTo(map);
	}

	$effect(() => {
		// React to comps changes
		if (comps) updateMapComps();
	});

	$effect(() => {
		// React to radius changes
		if (radiusValue) updateRadiusCircle();
	});

	onDestroy(() => {
		stopPolling();
		if (map) {
			map.remove();
			map = null;
		}
	});
</script>

{#if listing}
	<div class="space-y-6">
		<!-- Pricing Section -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 font-serif">
					<DollarSign class="size-5 text-amber-600" />
					Listing Price
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if listing.price}
					<div class="flex items-center justify-between">
						<div>
							<p class="text-3xl font-bold font-serif">{formatCurrency(listing.price)}</p>
							{#if listing.sqft}
								<p class="text-sm text-muted-foreground mt-1">
									{formatCurrency(Math.round(listing.price / listing.sqft))}/sqft
								</p>
							{/if}
						</div>
						{#if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
							{@const low = latestAnalysis.suggestedPriceLow}
							{@const high = latestAnalysis.suggestedPriceHigh}
							{@const inRange = listing.price >= low && listing.price <= high}
							<div class="text-right">
								<p class="text-sm text-muted-foreground">Suggested Range</p>
								<p class="text-lg font-semibold {inRange ? 'text-green-600' : 'text-amber-600'}">
									{formatCurrency(low)} – {formatCurrency(high)}
								</p>
								{#if latestAnalysis.confidence}
									<p class="text-xs text-muted-foreground">{Math.round(latestAnalysis.confidence * 100)}% confidence</p>
								{/if}
							</div>
						{/if}
					</div>

					{#if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
						<!-- Price position bar -->
						{@const low = latestAnalysis.suggestedPriceLow}
						{@const high = latestAnalysis.suggestedPriceHigh}
						{@const range = high - low}
						{@const padding = range * 0.2}
						{@const barMin = low - padding}
						{@const barMax = high + padding}
						{@const barRange = barMax - barMin}
						{@const pricePos = Math.min(100, Math.max(0, ((listing.price - barMin) / barRange) * 100))}
						{@const lowPos = ((low - barMin) / barRange) * 100}
						{@const highPos = ((high - barMin) / barRange) * 100}
						<div class="mt-4">
							<div class="relative h-3 rounded-full bg-muted">
								<div
									class="absolute top-0 h-3 rounded-full bg-green-200"
									style="left: {lowPos}%; width: {highPos - lowPos}%"
								></div>
								<div
									class="absolute top-[-2px] w-4 h-4 rounded-full bg-amber-600 border-2 border-white shadow"
									style="left: calc({pricePos}% - 8px)"
								></div>
							</div>
							<div class="flex justify-between mt-1 text-xs text-muted-foreground">
								<span>{formatCurrency(low)}</span>
								<span>{formatCurrency(high)}</span>
							</div>
						</div>
					{/if}
				{:else}
					<div class="text-center py-6">
						<DollarSign class="size-10 text-muted-foreground/40 mx-auto mb-3" />
						<p class="text-lg font-medium mb-1">No listing price set</p>
						<p class="text-sm text-muted-foreground">
							Run a market analysis below to get pricing suggestions.
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Market Analysis Section — single card with three states -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 font-serif">
					<TrendingUp class="size-5 text-amber-600" />
					Market Analysis
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if isAnalyzing}
					<!-- STATE: Processing -->
					<div class="flex flex-col items-center justify-center py-10 text-center">
						<div class="relative mb-6">
							<div class="size-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
							<TrendingUp class="size-6 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
						</div>
						<p class="text-lg font-semibold font-serif mb-1">Analyzing Market</p>
						<p class="text-sm text-muted-foreground mb-4">{analysisStageLabel}</p>
						<div class="flex gap-1.5">
							{#each analysisStages as _, i}
								<div
									class="h-1.5 w-8 rounded-full transition-colors duration-300 {i <= analysisStage ? 'bg-amber-500' : 'bg-muted'}"
								></div>
							{/each}
						</div>
					</div>
				{:else if latestAnalysis?.status === 'completed'}
					<!-- STATE: Completed -->
					<div class="space-y-4">
						{#if latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
							<div class="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
								<div>
									<p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Suggested Price Range</p>
									<p class="text-xl font-bold font-serif">
										{formatCurrency(latestAnalysis.suggestedPriceLow)} – {formatCurrency(latestAnalysis.suggestedPriceHigh)}
									</p>
								</div>
								{#if latestAnalysis.confidence}
									<div class="text-right">
										<p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Confidence</p>
										<p class="text-xl font-bold font-serif">{Math.round(latestAnalysis.confidence * 100)}%</p>
									</div>
								{/if}
							</div>
						{/if}
						{#if latestAnalysis.aiNarrative}
							<div class="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
								<p class="text-sm leading-relaxed">{latestAnalysis.aiNarrative}</p>
							</div>
						{/if}
						<div class="mt-2">
							<textarea
								bind:value={analysisPrompt}
								placeholder="Optional: Add context for re-analysis (e.g., 'Property has been recently renovated', 'Focus on single-family homes only')"
								class="w-full rounded-lg border p-3 text-sm"
								rows="2"
							></textarea>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4 text-sm text-muted-foreground">
								<span>{latestAnalysis.compCount ?? comps.length} comps analyzed</span>
								<span>|</span>
								<span>{formatDate(latestAnalysis.createdAt)}</span>
							</div>
							<Button size="sm" variant="outline" onclick={runAnalysis}>
								<RefreshCw class="mr-1.5 size-4" />
								Re-run Analysis
							</Button>
						</div>
					</div>
				{:else if latestAnalysis?.status === 'failed'}
					<!-- STATE: Failed -->
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<AlertCircle class="size-10 text-red-400 mb-3" />
						<p class="text-lg font-medium mb-1">Analysis Failed</p>
						<p class="text-sm text-muted-foreground mb-4">Something went wrong. Please try again.</p>
						<Button onclick={runAnalysis}>
							<RefreshCw class="mr-1.5 size-4" />
							Retry Analysis
						</Button>
					</div>
				{:else}
					<!-- STATE: No analysis yet -->
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<BarChart3 class="size-10 text-muted-foreground/40 mb-3" />
						<p class="text-lg font-medium mb-1">No market analysis yet</p>
						<p class="text-sm text-muted-foreground mb-4">
							Find comparable properties and get AI-powered pricing suggestions.
						</p>
						<div class="w-full max-w-lg text-left mb-4">
							<textarea
								bind:value={analysisPrompt}
								placeholder="Optional: Add context for the analysis (e.g., 'Property has been recently renovated', 'Focus on single-family homes only', 'Consider the school district premium')"
								class="w-full rounded-lg border p-3 text-sm"
								rows="2"
							></textarea>
						</div>
						<Button onclick={runAnalysis}>
							<Play class="mr-1.5 size-4" />
							Run Analysis
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Comp Map -->
		{#if listing.lat && listing.lng}
			<Card>
				<CardHeader class="flex-row items-center justify-between">
					<CardTitle class="flex items-center gap-2 font-serif">
						<MapPin class="size-5 text-amber-600" />
						Comparable Properties Map
					</CardTitle>
					<div class="flex items-center gap-3">
						<label for="radius-slider" class="text-xs text-muted-foreground whitespace-nowrap">
							Radius: <span class="w-12 inline-block text-right tabular-nums">{radiusValue.toFixed(1)} mi</span>
						</label>
						<div class="w-48">
							<input
								id="radius-slider"
								type="range"
								bind:value={radiusValue}
								min="0.25"
								max="5"
								step="0.25"
								class="w-full accent-amber-600"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div bind:this={mapContainer} class="h-80 rounded-lg overflow-hidden border"></div>
					{#if comps.length > 0}
						<div class="flex gap-4 mt-3 text-xs text-muted-foreground">
							<span class="flex items-center gap-1.5">
								<span class="inline-block w-3 h-3 rounded-sm bg-green-600"></span> Sold
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block w-3 h-3 rounded-sm bg-blue-600"></span> For Sale
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block w-3 h-3 rounded-sm bg-amber-500"></span> Pending
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block w-3 h-3 rounded-full bg-amber-700 border-2 border-white"></span> Subject Property
							</span>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Comp Table -->
		{#if comps.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="font-serif">Comparable Sales</CardTitle>
				</CardHeader>
				<CardContent class="p-0">
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-[180px]">Address</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('price')}>
										<span class="flex items-center gap-1">
											Price <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('pricePerSqft')}>
										<span class="flex items-center gap-1">
											$/sqft <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head>Beds</Table.Head>
									<Table.Head>Baths</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('sqft')}>
										<span class="flex items-center gap-1">
											Sqft <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head>Sold Date</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('daysOnMarket')}>
										<span class="flex items-center gap-1">
											DOM <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('distanceMiles')}>
										<span class="flex items-center gap-1">
											Distance <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head>Source</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each sortedComps() as comp (comp.id)}
									<Table.Row
										class="cursor-pointer hover:bg-muted/50"
										onclick={() => expandedCompId = expandedCompId === comp.id ? null : comp.id}
									>
										<Table.Cell class="font-medium">{comp.address ?? 'Unknown'}</Table.Cell>
										<Table.Cell>{comp.price ? formatCurrency(comp.price) : '—'}</Table.Cell>
										<Table.Cell>{comp.pricePerSqft ? '$' + Math.round(comp.pricePerSqft) : '—'}</Table.Cell>
										<Table.Cell>{comp.beds ?? '—'}</Table.Cell>
										<Table.Cell>{comp.baths ?? '—'}</Table.Cell>
										<Table.Cell>{comp.sqft?.toLocaleString() ?? '—'}</Table.Cell>
										<Table.Cell>{comp.soldDate ? formatDate(comp.soldDate) : '—'}</Table.Cell>
										<Table.Cell>{comp.daysOnMarket ?? '—'}</Table.Cell>
										<Table.Cell>{comp.distanceMiles ? comp.distanceMiles.toFixed(2) + ' mi' : '—'}</Table.Cell>
										<Table.Cell>
											<Badge variant="outline" class="text-[10px]">{comp.source}</Badge>
										</Table.Cell>
									</Table.Row>
									{#if expandedCompId === comp.id}
										<Table.Row>
											<Table.Cell colspan={10} class="bg-muted/30 p-4">
												<div class="flex gap-4">
													{#if comp.photoUrl}
														<img src={comp.photoUrl} alt={comp.address ?? ''} class="w-36 h-28 object-cover rounded-lg" />
													{/if}
													<div class="grid grid-cols-2 gap-x-8 gap-y-1 text-sm flex-1">
														<p><span class="text-muted-foreground">Full Address:</span> {comp.address ?? 'N/A'}, {comp.city ?? ''}, {comp.state ?? ''} {comp.zip ?? ''}</p>
														<p><span class="text-muted-foreground">Price:</span> {comp.price ? formatCurrency(comp.price) : 'N/A'} {comp.pricePerSqft ? `(${formatCurrency(Math.round(comp.pricePerSqft))}/sqft)` : ''}</p>
														<p><span class="text-muted-foreground">Beds/Baths:</span> {comp.beds ?? 'N/A'} bd / {comp.baths ?? 'N/A'} ba</p>
														<p><span class="text-muted-foreground">Sqft:</span> {comp.sqft?.toLocaleString() ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Lot Size:</span> {comp.lotSqft ? comp.lotSqft.toLocaleString() + ' sqft' : 'N/A'}</p>
														<p><span class="text-muted-foreground">Year Built:</span> {comp.yearBuilt ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Days on Market:</span> {comp.daysOnMarket ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Status:</span>
															<Badge variant="outline" class="text-[10px] ml-1">
																{comp.status === 'sold' ? 'Sold' : comp.status === 'for_sale' ? 'For Sale' : comp.status ?? 'N/A'}
															</Badge>
															{#if comp.soldDate}
																<span class="text-muted-foreground ml-1">({formatDate(comp.soldDate)})</span>
															{/if}
														</p>
														<p><span class="text-muted-foreground">Type:</span> {comp.propertyType ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Distance:</span> {comp.distanceMiles ? comp.distanceMiles.toFixed(2) + ' mi' : 'N/A'}</p>
														{#if comp.externalId && comp.source === 'zillow'}
															<p>
																<a
																	href="https://www.zillow.com/homedetails/{comp.externalId}_zpid/"
																	target="_blank"
																	rel="noopener noreferrer"
																	class="text-blue-600 hover:underline text-sm"
																>
																	View on Zillow &rarr;
																</a>
															</p>
														{/if}
													</div>
												</div>
											</Table.Cell>
										</Table.Row>
									{/if}
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Analysis History -->
		{#if analyses.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 font-serif">
						<Clock class="size-5 text-amber-600" />
						Analysis History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each analyses as analysis}
							<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<div class="flex items-center gap-3">
									{#if analysis.status === 'completed'}
										<CheckCircle2 class="size-4 text-green-500" />
									{:else if analysis.status === 'failed'}
										<AlertCircle class="size-4 text-red-500" />
									{:else}
										<Loader2 class="size-4 animate-spin text-amber-500" />
									{/if}
									<div>
										<p class="text-sm font-medium">{formatDate(analysis.createdAt)}</p>
										{#if analysis.suggestedPriceLow && analysis.suggestedPriceHigh}
											<p class="text-xs text-muted-foreground">
												{formatCurrency(analysis.suggestedPriceLow)} – {formatCurrency(analysis.suggestedPriceHigh)}
											</p>
										{/if}
									</div>
								</div>
								<Badge class={statusColor(analysis.status)}>{analysis.status}</Badge>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Schedule Section -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 font-serif">
					<Calendar class="size-5 text-amber-600" />
					Auto-Refresh Schedule
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Automatic market analysis</p>
						<p class="text-xs text-muted-foreground">
							{schedule?.enabled ? `Runs ${schedule.frequency} — next: ${schedule.nextRun ? formatDate(schedule.nextRun) : 'TBD'}` : 'Disabled — available on Professional plan'}
						</p>
					</div>
					<button
						class="text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50"
						disabled
						title="Available on Professional plan"
					>
						{#if schedule?.enabled}
							<ToggleRight class="size-8 text-green-500" />
						{:else}
							<ToggleLeft class="size-8" />
						{/if}
					</button>
				</div>
				{#if schedule?.lastRun}
					<p class="text-xs text-muted-foreground mt-2">
						Last run: {formatDate(schedule.lastRun)}
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>
{/if}
