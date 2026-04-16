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

	// Analysis trigger state
	let analysisLoading = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

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
		if (!listing) return;
		analysisLoading = true;

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
				}),
			});

			if (!res.ok) throw new Error('Failed to start analysis');

			toast.success('Market analysis started');
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
			if (latestAnalysis && (latestAnalysis.status === 'completed' || latestAnalysis.status === 'failed')) {
				stopPolling();
				analysisLoading = false;
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

	function statusColor(status: string) {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'processing':
			case 'pending': return 'bg-amber-100 text-amber-800';
			case 'failed': return 'bg-red-100 text-red-800';
			default: return 'bg-muted text-muted-foreground';
		}
	}

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

			const statusColor = comp.status === 'sold' ? '#16a34a' : comp.status === 'for_sale' ? '#2563eb' : '#f59e0b';
			const icon = L.divIcon({
				className: 'comp-marker',
				html: `<div style="background: ${statusColor}; color: white; border-radius: 6px; padding: 2px 6px; font-size: 11px; font-weight: 600; white-space: nowrap; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">$${comp.price ? (comp.price / 1000).toFixed(0) + 'K' : '?'}</div>`,
				iconSize: [60, 24],
				iconAnchor: [30, 12],
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
						<p class="text-sm text-muted-foreground mb-4">
							Set a price or run a market analysis to get pricing suggestions.
						</p>
						<div class="flex items-center justify-center gap-3 max-w-sm mx-auto">
							<div class="relative flex-1">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
								<input
									type="text"
									bind:value={priceInput}
									placeholder="Enter price"
									class="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
							</div>
							<Button onclick={runAnalysis} disabled={analysisLoading}>
								{#if analysisLoading}
									<Loader2 class="mr-1.5 size-4 animate-spin" />
								{:else}
									<BarChart3 class="mr-1.5 size-4" />
								{/if}
								Run Analysis
							</Button>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Market Analysis Section -->
		<Card>
			<CardHeader class="flex-row items-center justify-between">
				<CardTitle class="flex items-center gap-2 font-serif">
					<TrendingUp class="size-5 text-amber-600" />
					Market Analysis
				</CardTitle>
				{#if listing.price}
					<Button size="sm" onclick={runAnalysis} disabled={analysisLoading}>
						{#if analysisLoading}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
							Analyzing...
						{:else}
							<Play class="mr-1.5 size-4" />
							Run Analysis
						{/if}
					</Button>
				{/if}
			</CardHeader>
			<CardContent>
				{#if analysisLoading || (latestAnalysis && (latestAnalysis.status === 'pending' || latestAnalysis.status === 'processing'))}
					<div class="flex items-center gap-3 py-4">
						<Loader2 class="size-5 animate-spin text-primary" />
						<div>
							<p class="text-sm font-medium">Running market analysis...</p>
							<p class="text-xs text-muted-foreground">Searching for comparable properties and analyzing pricing data</p>
						</div>
					</div>
				{:else if latestAnalysis?.status === 'completed'}
					<div class="space-y-4">
						{#if latestAnalysis.aiNarrative}
							<div class="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
								<p class="text-sm leading-relaxed">{latestAnalysis.aiNarrative}</p>
							</div>
						{/if}
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<span>{latestAnalysis.compCount ?? comps.length} comps analyzed</span>
							<span>|</span>
							<span>{formatDate(latestAnalysis.createdAt)}</span>
						</div>
					</div>
				{:else if latestAnalysis?.status === 'failed'}
					<div class="flex items-center gap-2 py-4 text-red-600">
						<AlertCircle class="size-5" />
						<p class="text-sm">Analysis failed. Please try again.</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground py-4">
						No market analysis has been run yet. Click "Run Analysis" to find comparable properties and get pricing suggestions.
					</p>
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
														<img src={comp.photoUrl} alt={comp.address ?? ''} class="w-32 h-24 object-cover rounded-lg" />
													{/if}
													<div class="space-y-1 text-sm">
														<p><span class="text-muted-foreground">City:</span> {comp.city ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Lot:</span> {comp.lotSqft ? comp.lotSqft.toLocaleString() + ' sqft' : 'N/A'}</p>
														<p><span class="text-muted-foreground">Year Built:</span> {comp.yearBuilt ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Type:</span> {comp.propertyType ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Status:</span> {comp.status ?? 'N/A'}</p>
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
