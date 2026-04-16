<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Markdown from '$lib/components/shared/Markdown.svelte';
	import PropertyLink from '$lib/components/shared/PropertyLink.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
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
		Pencil,
		Settings,
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

	// Modal state
	let showAnalysisModal = $state(false);
	let showPriceModal = $state(false);
	let analysisSummaryOpen = $state(true);

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

	// Compact price display
	function formatCompactCurrency(value: number): string {
		if (value >= 1_000_000) {
			const m = value / 1_000_000;
			return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
		}
		if (value >= 1_000) {
			return `$${Math.round(value / 1000)}K`;
		}
		return formatCurrency(value);
	}

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
			showAnalysisModal = false;
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
	<div class="space-y-4">
		<!-- Compact Top Bar -->
		<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
			<div class="flex flex-wrap items-center divide-x divide-border">
				<!-- Section 1: Price -->
				<div class="flex items-center gap-3 px-5 py-3 min-w-0">
					<DollarSign class="size-4 text-amber-600 flex-shrink-0" />
					{#if listing.price}
						<div class="flex items-center gap-2">
							<span class="text-sm font-semibold font-serif">{formatCurrency(listing.price)}</span>
							{#if prop?.sqft}
								<span class="text-xs text-muted-foreground">({formatCurrency(Math.round(listing.price / prop.sqft))}/sqft)</span>
							{/if}
							<Button variant="ghost" size="sm" class="h-6 px-2 text-xs" onclick={() => showPriceModal = true}>
								<Pencil class="size-3 mr-1" />
								Edit
							</Button>
						</div>
					{:else}
						<span class="text-sm text-muted-foreground">No listing price</span>
						<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => showPriceModal = true}>
							Set Price
						</Button>
					{/if}
				</div>

				<!-- Section 2: Market Analysis -->
				<div class="flex items-center gap-3 px-5 py-3 min-w-0">
					<TrendingUp class="size-4 text-amber-600 flex-shrink-0" />
					{#if isAnalyzing}
						<div class="flex items-center gap-2">
							<Loader2 class="size-3.5 animate-spin text-amber-600" />
							<span class="text-sm text-muted-foreground">{analysisStageLabel}</span>
						</div>
					{:else if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">
								Suggested: {formatCompactCurrency(latestAnalysis.suggestedPriceLow)} &ndash; {formatCompactCurrency(latestAnalysis.suggestedPriceHigh)}
							</span>
							{#if latestAnalysis.confidence}
								<Badge variant="secondary" class="text-[10px] h-5">
									{Math.round(latestAnalysis.confidence * 100)}%
								</Badge>
							{/if}
							<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => showAnalysisModal = true} title="Re-run analysis">
								<RefreshCw class="size-3.5" />
							</Button>
						</div>
					{:else if latestAnalysis?.status === 'failed'}
						<div class="flex items-center gap-2">
							<AlertCircle class="size-3.5 text-red-500" />
							<span class="text-sm text-muted-foreground">Analysis failed</span>
							<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => showAnalysisModal = true}>
								Retry
							</Button>
						</div>
					{:else}
						<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => showAnalysisModal = true}>
							<Play class="size-3 mr-1" />
							Run Analysis
						</Button>
					{/if}
				</div>

				<!-- Section 3: Schedule -->
				<div class="flex items-center gap-3 px-5 py-3 min-w-0">
					<Calendar class="size-4 text-amber-600 flex-shrink-0" />
					{#if schedule?.enabled}
						<span class="text-sm font-medium">
							{schedule.frequency}
						</span>
						<button
							class="text-muted-foreground hover:text-foreground transition-colors cursor-not-allowed opacity-50"
							disabled
							title="Available on Professional plan"
						>
							<Settings class="size-3.5" />
						</button>
					{:else}
						<span class="text-sm text-muted-foreground">Schedule: Off</span>
					{/if}
				</div>
			</div>

			<!-- Analysis progress bar (when analyzing) -->
			{#if isAnalyzing}
				<div class="px-5 pb-3">
					<div class="flex gap-1">
						{#each analysisStages as _, i}
							<div
								class="h-1 flex-1 rounded-full transition-colors duration-300 {i <= analysisStage ? 'bg-amber-500' : 'bg-muted'}"
							></div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Map — hero of the page -->
		{#if prop?.lat && prop?.lng}
			<div class="relative z-0 rounded-lg border bg-card shadow-sm overflow-hidden">
				<div bind:this={mapContainer} class="h-[60vh] min-h-[500px]"></div>

				<!-- Radius control overlay -->
				<div class="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg border shadow-md px-3 py-2">
					<label for="radius-slider" class="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-2">
						<MapPin class="size-3" />
						Radius: <span class="w-10 inline-block text-right tabular-nums font-medium text-foreground">{radiusValue.toFixed(1)} mi</span>
					</label>
					<input
						id="radius-slider"
						type="range"
						bind:value={radiusValue}
						min="0.25"
						max="5"
						step="0.25"
						class="w-32 accent-amber-600 mt-1"
					/>
				</div>

				<!-- Map legend -->
				{#if comps.length > 0}
					<div class="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg border shadow-md px-3 py-2 flex gap-3 text-xs text-muted-foreground">
						<span class="flex items-center gap-1.5">
							<span class="inline-block w-2.5 h-2.5 rounded-full bg-green-600"></span> Sold
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span> For Sale
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block w-3 h-3 rounded-full bg-amber-700 border-2 border-white"></span> Subject
						</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Analysis Summary (collapsible, between map and comps table) -->
		{#if latestAnalysis?.status === 'completed' && latestAnalysis.aiNarrative}
			<div class="rounded-lg border bg-card shadow-sm">
				<button
					class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
					onclick={() => analysisSummaryOpen = !analysisSummaryOpen}
				>
					<div class="flex items-center gap-2">
						<BarChart3 class="size-4 text-amber-600" />
						<span class="text-sm font-semibold font-serif">Analysis Summary</span>
						<span class="text-xs text-muted-foreground ml-2">
							{latestAnalysis.compCount ?? comps.length} comps &middot; {formatDate(latestAnalysis.createdAt)}
						</span>
					</div>
					{#if analysisSummaryOpen}
						<ChevronUp class="size-4 text-muted-foreground" />
					{:else}
						<ChevronDown class="size-4 text-muted-foreground" />
					{/if}
				</button>
				{#if analysisSummaryOpen}
					<div class="px-4 pb-4">
						<div class="rounded-lg border border-amber-200 bg-amber-50/30 p-6">
							<Markdown content={latestAnalysis.aiNarrative ?? ''} class="text-base leading-7 text-stone-700" />
						</div>
					</div>
				{/if}
			</div>
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
											<PropertyLink
												propertyId={comp.propertyId}
												class="text-sm font-medium leading-tight"
											>
												{cp?.address ?? 'Unknown'}, {cp?.city ?? ''}
											</PropertyLink>
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
	</div>

	<!-- Run Analysis Modal -->
	<Dialog.Root bind:open={showAnalysisModal}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="font-serif">Run Market Analysis</Dialog.Title>
				<Dialog.Description>
					Search for comparable properties and get AI-powered pricing suggestions based on recent sales and active listings.
				</Dialog.Description>
			</Dialog.Header>

			{#if isAnalyzing}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<div class="relative mb-4">
						<div class="size-14 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
						<TrendingUp class="size-5 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
					</div>
					<p class="text-sm font-semibold mb-1">Analyzing Market</p>
					<p class="text-xs text-muted-foreground mb-3">{analysisStageLabel}</p>
					<div class="flex gap-1">
						{#each analysisStages as _, i}
							<div
								class="h-1 w-6 rounded-full transition-colors duration-300 {i <= analysisStage ? 'bg-amber-500' : 'bg-muted'}"
							></div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div>
						<label for="modal-radius" class="text-sm font-medium mb-1.5 block">
							Search Radius: {radiusValue.toFixed(1)} miles
						</label>
						<input
							id="modal-radius"
							type="range"
							bind:value={radiusValue}
							min="0.25"
							max="5"
							step="0.25"
							class="w-full accent-amber-600"
						/>
						<div class="flex justify-between text-xs text-muted-foreground mt-1">
							<span>0.25 mi</span>
							<span>5 mi</span>
						</div>
					</div>
					<div>
						<label for="modal-prompt" class="text-sm font-medium mb-1.5 block">
							Additional context <span class="text-muted-foreground font-normal">(optional)</span>
						</label>
						<textarea
							id="modal-prompt"
							bind:value={analysisPrompt}
							placeholder="e.g., 'Property has been recently renovated', 'Focus on single-family homes only'"
							class="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							rows="3"
						></textarea>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => showAnalysisModal = false}>Cancel</Button>
					<Button onclick={runAnalysis}>
						<Play class="size-3.5 mr-1.5" />
						Start Analysis
					</Button>
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Root>

	<!-- Set Price Modal -->
	<Dialog.Root bind:open={showPriceModal}>
		<Dialog.Content class="sm:max-w-sm">
			<Dialog.Header>
				<Dialog.Title class="font-serif">
					{listing.price ? 'Update Listing Price' : 'Set Listing Price'}
				</Dialog.Title>
				<Dialog.Description>
					{#if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
						Based on market analysis, the suggested range is {formatCurrency(latestAnalysis.suggestedPriceLow)} &ndash; {formatCurrency(latestAnalysis.suggestedPriceHigh)}.
					{:else}
						Enter the listing price for this property.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			{#if latestAnalysis?.status === 'completed' && latestAnalysis.suggestedPriceLow && latestAnalysis.suggestedPriceHigh}
				{@const low = latestAnalysis.suggestedPriceLow}
				{@const high = latestAnalysis.suggestedPriceHigh}
				{@const mid = Math.round((low + high) / 2)}
				<div class="flex gap-2">
					<button
						type="button"
						class="flex-1 rounded-lg border px-3 py-2 text-center hover:bg-muted/50 transition-colors {setPriceInput === String(low) ? 'border-amber-500 bg-amber-50' : ''}"
						onclick={() => setPriceInput = String(low)}
					>
						<p class="text-xs text-muted-foreground">Low</p>
						<p class="text-sm font-semibold">{formatCompactCurrency(low)}</p>
					</button>
					<button
						type="button"
						class="flex-1 rounded-lg border px-3 py-2 text-center hover:bg-muted/50 transition-colors {setPriceInput === String(mid) ? 'border-amber-500 bg-amber-50' : ''}"
						onclick={() => setPriceInput = String(mid)}
					>
						<p class="text-xs text-muted-foreground">Mid</p>
						<p class="text-sm font-semibold">{formatCompactCurrency(mid)}</p>
					</button>
					<button
						type="button"
						class="flex-1 rounded-lg border px-3 py-2 text-center hover:bg-muted/50 transition-colors {setPriceInput === String(high) ? 'border-amber-500 bg-amber-50' : ''}"
						onclick={() => setPriceInput = String(high)}
					>
						<p class="text-xs text-muted-foreground">High</p>
						<p class="text-sm font-semibold">{formatCompactCurrency(high)}</p>
					</button>
				</div>
			{/if}

			<form
				method="POST"
				action="?/setPrice"
				use:enhance={() => {
					setPriceSubmitting = true;
					return async ({ result, update }) => {
						setPriceSubmitting = false;
						if (result.type === 'success') {
							toast.success(listing.price ? 'Listing price updated' : 'Listing price set');
							showPriceModal = false;
							await update();
						} else {
							toast.error('Failed to update price');
						}
					};
				}}
			>
				<div class="space-y-3">
					<div>
						<label for="price-input" class="text-sm font-medium mb-1.5 block">Price</label>
						<input
							id="price-input"
							name="price"
							type="text"
							bind:value={setPriceInput}
							placeholder={listing.price ? formatCurrency(listing.price) : 'Enter price'}
							class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-lg text-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					</div>
					<Dialog.Footer>
						<Button variant="outline" type="button" onclick={() => showPriceModal = false}>Cancel</Button>
						<Button type="submit" disabled={setPriceSubmitting}>
							{#if setPriceSubmitting}
								<Loader2 class="size-4 animate-spin mr-1.5" />
								Saving...
							{:else}
								Set Listing Price
							{/if}
						</Button>
					</Dialog.Footer>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}

