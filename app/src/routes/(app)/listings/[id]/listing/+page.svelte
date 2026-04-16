<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { enhance } from '$app/forms';
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
		ExternalLink,
		Home,
		Star,
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const prop = $derived(listing?.property);
	const analyses = $derived(data.analyses ?? []);
	const comps = $derived(data.comps ?? []);
	const schedule = $derived(data.schedule);
	const latestAnalysis = $derived(analyses.length > 0 ? analyses[0] : null);

	// Price input state
	let priceInput = $state('');
	let radiusValue = $state(1);
	let analysisPrompt = $state('');
	let setPriceInput = $state('');
	let setPriceSubmitting = $state(false);

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

	// Suggested midpoint for price setting
	const suggestedMidpoint = $derived(
		latestAnalysis?.suggestedPriceLow && latestAnalysis?.suggestedPriceHigh
			? Math.round((latestAnalysis.suggestedPriceLow + latestAnalysis.suggestedPriceHigh) / 2)
			: null
	);

	// Auto-fill price input from suggestion
	$effect(() => {
		if (suggestedMidpoint && !listing?.price && !setPriceInput) {
			setPriceInput = suggestedMidpoint.toString();
		}
	});

	// Confirmed comps count
	const confirmedCount = $derived(comps.filter((c: any) => c.isConfirmedComp).length);

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

	// Fields that live on the property join rather than comp_listings
	const propertyFields = new Set(['beds', 'baths', 'sqft', 'lotSqft']);

	const sortedComps = $derived(() => {
		const sorted = [...comps];
		sorted.sort((a: any, b: any) => {
			let aVal: any, bVal: any;
			if (sortField === 'soldDate') {
				aVal = a.soldDate ? new Date(a.soldDate).getTime() : 0;
				bVal = b.soldDate ? new Date(b.soldDate).getTime() : 0;
			} else if (propertyFields.has(sortField)) {
				aVal = a.property?.[sortField] ?? 0;
				bVal = b.property?.[sortField] ?? 0;
			} else {
				aVal = a[sortField] ?? 0;
				bVal = b[sortField] ?? 0;
			}
			return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
		});
		return sorted;
	});

	function toggleSort(field: string) {
		if (sortField === field) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDir = field === 'soldDate' ? 'desc' : 'asc';
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

	function daysAgo(d: any): number {
		if (!d) return Infinity;
		const date = d instanceof Date ? d : new Date(d);
		return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
	}

	function recencyLabel(d: any): string {
		const days = daysAgo(d);
		if (days === Infinity) return '';
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 30) return `${days}d ago`;
		if (days < 90) return `${Math.floor(days / 30)}mo ago`;
		return `${Math.floor(days / 30)}mo ago`;
	}

	function recencyColor(d: any): string {
		const days = daysAgo(d);
		if (days < 30) return 'bg-green-100 text-green-800 border-green-200';
		if (days < 90) return 'bg-amber-100 text-amber-800 border-amber-200';
		return 'bg-stone-100 text-stone-600 border-stone-200';
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'sold': return 'bg-green-100 text-green-800 border-green-200';
			case 'for_sale': return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
			default: return 'bg-stone-100 text-stone-600 border-stone-200';
		}
	}

	function statusLabel(comp: any): string {
		if (comp.status === 'sold') return `Sold ${recencyLabel(comp.soldDate)}`;
		if (comp.status === 'for_sale') return `Active${comp.daysOnMarket ? ' - ' + comp.daysOnMarket + ' DOM' : ''}`;
		if (comp.status === 'pending') return 'Pending';
		return comp.status ?? 'Unknown';
	}

	function matchClass(compValue: number | null, subjectValue: number | null, exactRange: number, closeRange: number): string {
		if (!compValue || !subjectValue) return '';
		const diff = Math.abs(compValue - subjectValue);
		if (diff <= exactRange) return 'bg-green-100';
		if (diff <= closeRange) return 'bg-amber-50';
		return '';
	}

	function formatLot(lotSqft: number | null | undefined): string {
		if (!lotSqft) return '?';
		if (lotSqft > 43560) return (lotSqft / 43560).toFixed(1) + ' ac';
		return lotSqft.toLocaleString() + ' sqft';
	}

	function priceDeltaPerSqft(comp: any): number | null {
		if (!comp.pricePerSqft || !listing?.price || !prop?.sqft) return null;
		const subjectPpSqft = listing.price / prop.sqft;
		return Math.round(comp.pricePerSqft - subjectPpSqft);
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
		if (!prop?.lat || !prop?.lng) return;

		L = (await import('leaflet')).default;
		map = L.map(mapContainer).setView([prop.lat, prop.lng], 14);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18,
		}).addTo(map);

		// Property marker
		const propertyIcon = L.divIcon({
			className: 'property-marker',
			html: `<div style="background: #b45309; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">&#9733;</div>`,
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});
		L.marker([prop.lat, prop.lng], { icon: propertyIcon }).addTo(map)
			.bindPopup(`<strong>${prop.address}</strong><br/>${prop.city}, ${prop.state}`);

		updateMapComps();
		updateRadiusCircle();
	});

	function updateMapComps() {
		if (!map || !L) return;

		compMarkers.forEach(m => map.removeLayer(m));
		compMarkers = [];

		comps.forEach((comp: any) => {
			const cp = comp.property;
			if (!cp?.lat || !cp?.lng) return;

			const dotColor = comp.status === 'sold' ? '#16a34a' : comp.status === 'for_sale' ? '#2563eb' : '#f59e0b';
			const priceLabel = comp.price ? formatMapPrice(comp.price) : '?';
			const icon = L.divIcon({
				className: 'comp-marker',
				html: `<div style="display:flex;align-items:center;gap:3px;"><div style="width:8px;height:8px;border-radius:50%;background:${dotColor};border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.3);flex-shrink:0;"></div><div style="background:rgba(255,255,255,0.95);border:1px solid #d6d3d1;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;color:#292524;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.1);line-height:1.4;">${priceLabel}</div></div>`,
				iconSize: [70, 20],
				iconAnchor: [4, 10],
			});

			const marker = L.marker([cp.lat, cp.lng], { icon }).addTo(map);

			// Popup with photo
			const photos = cp.photos as { url: string }[] | null;
			const photoUrl = photos?.[0]?.url ?? null;
			const photoHtml = photoUrl
				? `<img src="${photoUrl}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
				: '';

			marker.bindPopup(`
				<div style="min-width:180px;max-width:220px;">
					${photoHtml}
					<strong style="font-size:12px;">${cp.address ?? 'Unknown'}</strong><br/>
					<span style="font-size:11px;color:#78716c;">${cp.city ?? ''}, ${cp.state ?? ''}</span><br/>
					<strong style="font-size:13px;">${comp.price ? '$' + comp.price.toLocaleString() : 'N/A'}</strong>
					<span style="font-size:11px;color:#78716c;">
						${cp.beds ? ' · ' + cp.beds + ' bd' : ''}
						${cp.baths ? ' · ' + cp.baths + ' ba' : ''}
						${cp.sqft ? ' · ' + cp.sqft.toLocaleString() + ' sqft' : ''}
					</span><br/>
					<span style="font-size:10px;color:#a8a29e;">
						${comp.soldDate ? 'Sold: ' + formatDate(comp.soldDate) : comp.status ?? ''}
						${comp.distanceMiles ? ' · ' + comp.distanceMiles.toFixed(2) + ' mi' : ''}
					</span>
				</div>
			`, { maxWidth: 240 });
			compMarkers.push(marker);
		});
	}

	function updateRadiusCircle() {
		if (!map || !L || !prop?.lat || !prop?.lng) return;

		if (radiusCircle) map.removeLayer(radiusCircle);
		radiusCircle = L.circle([prop.lat, prop.lng], {
			radius: radiusValue * 1609.34,
			color: '#b45309',
			opacity: 0.6,
			fillColor: '#b45309',
			fillOpacity: 0.15,
			weight: 3,
		}).addTo(map);
	}

	$effect(() => {
		if (comps) updateMapComps();
	});

	$effect(() => {
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
							{#if prop?.sqft}
								<p class="text-sm text-muted-foreground mt-1">
									{formatCurrency(Math.round(listing.price / prop.sqft))}/sqft
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
									{formatCurrency(low)} - {formatCurrency(high)}
								</p>
								{#if latestAnalysis.confidence}
									<p class="text-xs text-muted-foreground">{Math.round(latestAnalysis.confidence * 100)}% confidence</p>
								{/if}
							</div>
						{/if}
					</div>

					{#if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
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

						<!-- Update Price -->
						<Separator class="my-4" />
						<form
							method="POST"
							action="?/setPrice"
							use:enhance={() => {
								setPriceSubmitting = true;
								return async ({ result, update }) => {
									setPriceSubmitting = false;
									if (result.type === 'success') {
										toast.success('Listing price updated');
										await update();
									} else {
										toast.error('Failed to update price');
									}
								};
							}}
						>
							<p class="text-xs text-muted-foreground mb-2">Update listing price</p>
							<div class="flex gap-2">
								<input
									name="price"
									type="text"
									bind:value={setPriceInput}
									placeholder="Enter price"
									class="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
								<Button type="submit" size="sm" disabled={setPriceSubmitting}>
									{#if setPriceSubmitting}
										<Loader2 class="size-4 animate-spin" />
									{:else}
										Update Price
									{/if}
								</Button>
							</div>
							<div class="flex gap-2 mt-2">
								<button type="button" onclick={() => setPriceInput = String(low)} class="text-xs text-amber-700 hover:underline">{formatCurrency(low)}</button>
								<button type="button" onclick={() => setPriceInput = String(Math.round((low + high) / 2))} class="text-xs text-amber-700 hover:underline">{formatCurrency(Math.round((low + high) / 2))}</button>
								<button type="button" onclick={() => setPriceInput = String(high)} class="text-xs text-amber-700 hover:underline">{formatCurrency(high)}</button>
							</div>
						</form>
					{/if}
				{:else if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
					{@const low = latestAnalysis.suggestedPriceLow}
					{@const high = latestAnalysis.suggestedPriceHigh}
					{@const mid = Math.round((low + high) / 2)}
					<!-- No price set, but analysis has suggestions -->
					<div class="text-center py-4">
						<p class="text-sm text-muted-foreground mb-2">Suggested Price Range</p>
						<p class="text-2xl font-bold font-serif">{formatCurrency(low)} - {formatCurrency(high)}</p>
						{#if latestAnalysis.confidence}
							<p class="text-xs text-muted-foreground mt-1">{Math.round(latestAnalysis.confidence * 100)}% confidence</p>
						{/if}
					</div>
					<Separator class="my-4" />
					<form
						method="POST"
						action="?/setPrice"
						use:enhance={() => {
							setPriceSubmitting = true;
							return async ({ result, update }) => {
								setPriceSubmitting = false;
								if (result.type === 'success') {
									toast.success('Listing price set');
									await update();
								} else {
									toast.error('Failed to set price');
								}
							};
						}}
					>
						<div class="max-w-sm mx-auto">
							<input
								name="price"
								type="text"
								bind:value={setPriceInput}
								placeholder={formatCurrency(mid)}
								class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-lg text-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
							<Button type="submit" class="w-full mt-3" disabled={setPriceSubmitting}>
								{#if setPriceSubmitting}
									<Loader2 class="mr-1.5 size-4 animate-spin" />
									Setting...
								{:else}
									Set as Listing Price
								{/if}
							</Button>
							<div class="flex justify-center gap-3 mt-3">
								<span class="text-xs text-muted-foreground">Quick set:</span>
								<button type="button" onclick={() => setPriceInput = String(low)} class="text-xs font-medium text-amber-700 hover:underline">{formatCurrency(low)}</button>
								<button type="button" onclick={() => setPriceInput = String(mid)} class="text-xs font-medium text-amber-700 hover:underline">{formatCurrency(mid)}</button>
								<button type="button" onclick={() => setPriceInput = String(high)} class="text-xs font-medium text-amber-700 hover:underline">{formatCurrency(high)}</button>
							</div>
						</div>
					</form>
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

		<!-- Market Analysis Section -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 font-serif">
					<TrendingUp class="size-5 text-amber-600" />
					Market Analysis
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if isAnalyzing}
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
					<div class="space-y-4">
						{#if latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
							<div class="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
								<div>
									<p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Suggested Price Range</p>
									<p class="text-xl font-bold font-serif">
										{formatCurrency(latestAnalysis.suggestedPriceLow)} - {formatCurrency(latestAnalysis.suggestedPriceHigh)}
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
								placeholder="Optional: Add context for re-analysis (e.g., 'Property has been recently renovated')"
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
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<BarChart3 class="size-10 text-muted-foreground/40 mb-3" />
						<p class="text-lg font-medium mb-1">No market analysis yet</p>
						<p class="text-sm text-muted-foreground mb-4">
							Find comparable properties and get AI-powered pricing suggestions.
						</p>
						<div class="w-full max-w-lg text-left mb-4">
							<textarea
								bind:value={analysisPrompt}
								placeholder="Optional: Add context for the analysis (e.g., 'Property has been recently renovated', 'Focus on single-family homes only')"
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
		{#if prop?.lat && prop?.lng}
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

		<!-- Comp Table (CMA) -->
		{#if comps.length > 0}
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<div>
							<CardTitle class="font-serif">Comparable Sales</CardTitle>
							<p class="text-sm text-muted-foreground mt-1">
								{comps.length} comparable {comps.length === 1 ? 'property' : 'properties'} found
								{#if listing.price && prop?.sqft}
									<span class="ml-1">| Subject: {formatCurrency(Math.round(listing.price / prop.sqft))}/sqft</span>
								{/if}
								{#if prop?.beds || prop?.baths || prop?.sqft || prop?.lotSqft}
									<span class="ml-1">| {prop?.beds ?? '?'} bd / {prop?.baths ?? '?'} ba / {prop?.sqft?.toLocaleString() ?? '?'} sqft / {formatLot(prop?.lotSqft)} lot</span>
								{/if}
							</p>
						</div>
						{#if confirmedCount > 0}
							<Badge variant="secondary" class="text-xs gap-1">
								<Star class="size-3 fill-amber-500 text-amber-500" />
								{confirmedCount} of {comps.length} confirmed
							</Badge>
						{/if}
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row class="bg-muted/30">
									<Table.Head class="w-[36px] px-1"></Table.Head>
									<Table.Head class="w-[60px]"></Table.Head>
									<Table.Head class="min-w-[160px]">Property</Table.Head>
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
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('beds')}>
										<span class="flex items-center gap-1">
											Beds <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('baths')}>
										<span class="flex items-center gap-1">
											Baths <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('sqft')}>
										<span class="flex items-center gap-1">
											Sqft <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('lotSqft')}>
										<span class="flex items-center gap-1">
											Lot <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('soldDate')}>
										<span class="flex items-center gap-1">
											Status <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
									<Table.Head class="cursor-pointer" onclick={() => toggleSort('distanceMiles')}>
										<span class="flex items-center gap-1">
											Distance <ArrowUpDown class="size-3" />
										</span>
									</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each sortedComps() as comp (comp.id)}
									{@const delta = priceDeltaPerSqft(comp)}
									<Table.Row
										class="cursor-pointer hover:bg-muted/50 group {comp.isConfirmedComp ? 'border-l-2 border-l-amber-400 bg-amber-50/20' : ''}"
										onclick={() => expandedCompId = expandedCompId === comp.id ? null : comp.id}
									>
										<!-- Confirm star -->
										<Table.Cell class="px-1 py-2">
											<form
												method="POST"
												action="?/toggleConfirmedComp"
												use:enhance={() => {
													return async ({ update }) => {
														await update({ reset: false });
													};
												}}
											>
												<input type="hidden" name="compId" value={comp.id} />
												<button
													type="submit"
													class="p-1 rounded hover:bg-muted transition-colors"
													onclick={(e) => e.stopPropagation()}
													title={comp.isConfirmedComp ? 'Remove from confirmed comps' : 'Mark as confirmed comp'}
												>
													<Star class="size-4 {comp.isConfirmedComp ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'}" />
												</button>
											</form>
										</Table.Cell>
										{@const cp = comp.property}
									{@const cpPhotos = cp?.photos as { url: string }[] | null}
									{@const cpPhotoUrl = cpPhotos?.[0]?.url ?? null}
									<!-- Photo thumbnail -->
										<Table.Cell class="p-2">
											{#if cpPhotoUrl}
												<img
													src={cpPhotoUrl}
													alt=""
													class="w-14 h-10 object-cover rounded"
												/>
											{:else}
												<div class="w-14 h-10 rounded bg-muted flex items-center justify-center">
													<Home class="size-4 text-muted-foreground/40" />
												</div>
											{/if}
										</Table.Cell>
										<!-- Address -->
										<Table.Cell>
											<a
												href="/properties/{comp.propertyId}"
												class="text-sm font-medium leading-tight text-amber-800 hover:underline"
												onclick={(e) => e.stopPropagation()}
											>
												{cp?.address ?? 'Unknown'}
											</a>
											<p class="text-xs text-muted-foreground">{cp?.city ?? ''}, {cp?.state ?? ''}</p>
										</Table.Cell>
										<!-- Price -->
										<Table.Cell>
											<p class="text-sm font-semibold">{comp.price ? formatCurrency(comp.price) : '--'}</p>
										</Table.Cell>
										<!-- $/sqft with delta -->
										<Table.Cell>
											{@const ppsf = comp.price && cp?.sqft && cp.sqft > 0 ? Math.round(comp.price / cp.sqft) : (comp.pricePerSqft ? Math.round(comp.pricePerSqft) : null)}
										<p class="text-sm">{ppsf ? '$' + ppsf : '--'}</p>
											{#if delta !== null}
												<p class="text-[10px] font-medium {delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-muted-foreground'}">
													{delta > 0 ? '+' : ''}{delta === 0 ? '--' : '$' + Math.abs(delta)}
													{delta !== 0 ? (delta > 0 ? ' above' : ' below') : ''}
												</p>
											{/if}
										</Table.Cell>
										<!-- Beds -->
										<Table.Cell class={matchClass(cp?.beds ?? null, prop?.beds ?? null, 0, 1)}>
											<p class="text-sm">{cp?.beds ?? '?'}</p>
										</Table.Cell>
										<!-- Baths -->
										<Table.Cell class={matchClass(cp?.baths ?? null, prop?.baths ?? null, 0, 0.5)}>
											<p class="text-sm">{cp?.baths ?? '?'}</p>
										</Table.Cell>
										<!-- Sqft -->
										<Table.Cell class={matchClass(cp?.sqft ?? null, prop?.sqft ?? null, 100, 300)}>
											<p class="text-sm">{cp?.sqft?.toLocaleString() ?? '?'}</p>
										</Table.Cell>
										<!-- Lot -->
										<Table.Cell class={matchClass(cp?.lotSqft ?? null, prop?.lotSqft ?? null, 500, 2000)}>
											<p class="text-sm">{formatLot(cp?.lotSqft)}</p>
										</Table.Cell>
										<!-- Status badge with recency -->
										<Table.Cell>
											<Badge variant="outline" class="text-[10px] {statusBadgeClass(comp.status ?? '')}">
												{statusLabel(comp)}
											</Badge>
											{#if comp.soldDate}
												<div class="mt-1">
													<span class="text-[10px] px-1.5 py-0.5 rounded {recencyColor(comp.soldDate)}">
														{recencyLabel(comp.soldDate)}
													</span>
												</div>
											{/if}
										</Table.Cell>
										<!-- Distance -->
										<Table.Cell>
											{#if comp.distanceMiles}
												<Badge variant="outline" class="text-[10px]">
													{comp.distanceMiles.toFixed(2)} mi
												</Badge>
											{:else}
												<span class="text-muted-foreground">--</span>
											{/if}
										</Table.Cell>
									</Table.Row>
									{#if expandedCompId === comp.id}
										<Table.Row>
											<Table.Cell colspan={11} class="bg-muted/30 p-4">
												{@const xcp = comp.property}
												{@const xcpPhotos = xcp?.photos as { url: string }[] | null}
												{@const xcpPhotoUrl = xcpPhotos?.[0]?.url ?? null}
												<div class="flex gap-4">
													{#if xcpPhotoUrl}
														<img src={xcpPhotoUrl} alt={xcp?.address ?? ''} class="w-40 h-32 object-cover rounded-lg shadow-sm" />
													{:else}
														<div class="w-40 h-32 rounded-lg bg-muted flex items-center justify-center">
															<Home class="size-8 text-muted-foreground/30" />
														</div>
													{/if}
													<div class="grid grid-cols-2 gap-x-8 gap-y-1 text-sm flex-1">
														<p><span class="text-muted-foreground">Full Address:</span> {xcp?.address ?? 'N/A'}, {xcp?.city ?? ''}, {xcp?.state ?? ''} {xcp?.zip ?? ''}</p>
														<p><span class="text-muted-foreground">Price:</span> {comp.price ? formatCurrency(comp.price) : 'N/A'} {comp.pricePerSqft ? `(${formatCurrency(Math.round(comp.pricePerSqft))}/sqft)` : ''}</p>
														<p><span class="text-muted-foreground">Beds/Baths:</span> {xcp?.beds ?? 'N/A'} bd / {xcp?.baths ?? 'N/A'} ba</p>
														<p><span class="text-muted-foreground">Sqft:</span> {xcp?.sqft?.toLocaleString() ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Lot Size:</span> {xcp?.lotSqft ? xcp.lotSqft.toLocaleString() + ' sqft' : 'N/A'}</p>
														<p><span class="text-muted-foreground">Year Built:</span> {xcp?.yearBuilt ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Days on Market:</span> {comp.daysOnMarket ?? 'N/A'}</p>
														<p><span class="text-muted-foreground">Type:</span> {xcp?.propertyType ?? 'N/A'}</p>
													</div>
												</div>
												<div class="flex items-center gap-3 mt-3 pt-3 border-t">
													{#if comp.propertyId}
														<Button variant="outline" size="sm" href="/properties/{comp.propertyId}">
															<Home class="mr-1.5 size-3.5" />
															View Property
														</Button>
													{/if}
													{#if comp.externalId && comp.source === 'zillow'}
														<a
															href="https://www.zillow.com/homedetails/{comp.externalId}_zpid/"
															target="_blank"
															rel="noopener noreferrer"
															class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
														>
															<ExternalLink class="size-3.5" />
															View on Zillow
														</a>
													{/if}
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
												{formatCurrency(analysis.suggestedPriceLow)} - {formatCurrency(analysis.suggestedPriceHigh)}
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
							{schedule?.enabled ? `Runs ${schedule.frequency} -- next: ${schedule.nextRun ? formatDate(schedule.nextRun) : 'TBD'}` : 'Disabled -- available on Professional plan'}
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
