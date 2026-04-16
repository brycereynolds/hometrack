<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { PHASES } from '$lib/config';
	import { formatCurrency, formatNumber } from '$lib/utils';

	let { data } = $props();
	const pipelineValueTimeSeries = $derived(data.pipelineValueTimeSeries ?? { labels: [] as string[], values: [] as number[], closedDeals: [] as number[] });
	import {
		BarChart3,
		TrendingUp,
		Home,
		DollarSign,
		Clock,
		Eye,
		Activity,
		Target
	} from 'lucide-svelte';

	Chart.register(...registerables);

	// Listings come from the parent layout's load function
	const listings = $derived(data.listings ?? []);

	const tabs = [
		{ href: '/analytics', label: 'Overview', active: true },
		{ href: '/analytics/listings', label: 'Listing Performance', active: false },
		{ href: '/analytics/team', label: 'Team Performance', active: false },
		{ href: '/analytics/insights', label: 'Insights', active: false }
	];

	const activeListings = $derived(listings.filter((l: any) => (l.daysOnMarket ?? 0) > 0));
	const avgDOM = $derived(activeListings.length
		? Math.round(activeListings.reduce((s: number, l: any) => s + (l.daysOnMarket ?? 0), 0) / activeListings.length)
		: 0);
	const totalViews = $derived(listings.reduce((s: number, l: any) => s + (l.zillowViews ?? 0), 0));
	const totalSaves = $derived(listings.reduce((s: number, l: any) => s + (l.zillowSaves ?? 0), 0));
	const activeCount = $derived(listings.filter((l: any) => l.phase === 'active').length);
	const pipelineValue = $derived(formatCurrency(listings.reduce((s: number, l: any) => s + (l.price ?? 0), 0)));

	const deltas = $derived(data.analyticsDeltas ?? { listingsDelta: 0, pipelineValueDelta: 0, listToSaleRatio: null, closedDealsByMonth: [] });

	function formatDelta(value: number, suffix: string): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value} ${suffix}`;
	}

	function formatCurrencyDelta(value: number, suffix: string): string {
		const sign = value >= 0 ? '+' : '-';
		const abs = Math.abs(value);
		let formatted: string;
		if (abs >= 1_000_000) formatted = `$${(abs / 1_000_000).toFixed(1)}M`;
		else if (abs >= 1_000) formatted = `$${(abs / 1_000).toFixed(0)}K`;
		else formatted = `$${abs.toFixed(0)}`;
		return `${sign}${formatted} ${suffix}`;
	}

	const listToSaleRatio = $derived(deltas.listToSaleRatio ? `${deltas.listToSaleRatio}%` : '--');

	const marketStats = $derived([
		{ label: 'Active Listings', value: String(activeCount), icon: Home, change: formatDelta(deltas.listingsDelta, 'this month'), positive: deltas.listingsDelta >= 0 },
		{ label: 'Pipeline Value', value: pipelineValue, icon: DollarSign, change: formatCurrencyDelta(deltas.pipelineValueDelta, 'vs last month'), positive: deltas.pipelineValueDelta >= 0 },
		{ label: 'Avg DOM', value: `${avgDOM} days`, icon: Clock, change: `${avgDOM} day avg`, positive: true },
		{ label: 'List-to-Sale Ratio', value: listToSaleRatio, icon: Target, change: deltas.listToSaleRatio ? 'From closed deals' : 'No closed deals yet', positive: true },
		{ label: 'Total Online Views', value: formatNumber(totalViews), icon: Eye, change: `${totalViews} across platforms`, positive: true },
		{ label: 'Total Saves', value: formatNumber(totalSaves), icon: Activity, change: `${totalSaves} across platforms`, positive: true }
	]);

	// Closed deals from server data
	const closedDeals = $derived(
		(deltas.closedDealsByMonth ?? []).length > 0
			? deltas.closedDealsByMonth.map((d: any) => ({ month: d.month, count: d.count, volume: formatCurrency(d.volume) }))
			: []
	);

	let pipelineCanvas = $state<HTMLCanvasElement>(null!);
	let pipelineChart: Chart | undefined;

	onMount(() => {
		pipelineChart = new Chart(pipelineCanvas, {
			type: 'line',
			data: {
				labels: pipelineValueTimeSeries.labels,
				datasets: [
					{
						label: 'Pipeline Value',
						data: pipelineValueTimeSeries.values,
						borderColor: '#C4704B',
						backgroundColor: 'rgba(196, 112, 75, 0.1)',
						fill: true,
						tension: 0.4,
						pointBackgroundColor: '#C4704B',
						pointBorderColor: '#fff',
						pointBorderWidth: 2,
						pointRadius: 5
					},
					{
						label: 'Closed Deals',
						data: pipelineValueTimeSeries.closedDeals.map((v) => v * 3000000),
						borderColor: '#7B8B6F',
						backgroundColor: 'rgba(123, 139, 111, 0.1)',
						fill: false,
						tension: 0.4,
						pointBackgroundColor: '#7B8B6F',
						pointBorderColor: '#fff',
						pointBorderWidth: 2,
						pointRadius: 5,
						yAxisID: 'y1'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: {
					legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								if (ctx.datasetIndex === 0) {
									return `Pipeline: $${(ctx.parsed.y / 1000000).toFixed(1)}M`;
								}
								return `Closed: ${pipelineValueTimeSeries.closedDeals[ctx.dataIndex]} deals`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(0,0,0,0.05)' },
						ticks: { callback: (v) => `$${(Number(v) / 1000000).toFixed(0)}M` }
					},
					y1: {
						position: 'right',
						beginAtZero: true,
						grid: { display: false },
						ticks: { callback: (v) => `${Math.round(Number(v) / 3000000)} deals` }
					},
					x: { grid: { display: false } }
				}
			}
		});

		return () => {
			pipelineChart?.destroy();
		};
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Market Intelligence</h1>
			<p class="text-muted-foreground">Real-time analytics for {data.team?.name ?? 'your team'}</p>
		</div>
		<div class="flex items-center gap-2 text-xs text-muted-foreground">
			<span class="inline-block size-2 rounded-full bg-green-500 animate-pulse"></span>
			Live data &middot; Updated 2 min ago
		</div>
	</div>

	<!-- Sub-nav tabs -->
	<nav class="flex gap-1 border-b">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px {tab.active
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<!-- Market Snapshot Cards -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
		{#each marketStats as stat}
			<Card class="relative overflow-hidden">
				<CardContent class="p-4">
					<div class="flex items-center justify-between">
						<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
						<stat.icon class="size-4 text-muted-foreground/50" />
					</div>
					<p class="mt-2 text-xl font-bold font-mono">{stat.value}</p>
					<p class="mt-1 text-xs {stat.positive ? 'text-green-600' : 'text-red-500'}">{stat.change}</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Pipeline Value Trend Chart -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="font-serif">Pipeline Value Trend</CardTitle>
					<CardDescription>Total pipeline value and closed deal volume over time</CardDescription>
				</div>
				<Badge variant="outline" class="font-mono text-xs">Q1-Q2 2026</Badge>
			</div>
		</CardHeader>
		<CardContent>
			<div class="h-72">
				<canvas bind:this={pipelineCanvas}></canvas>
			</div>
		</CardContent>
	</Card>

	<div class="grid gap-4 lg:grid-cols-2">
		<!-- Active Listings Performance Summary -->
		<Card>
			<CardHeader>
				<CardTitle class="font-serif">Active Listings Performance</CardTitle>
				<CardDescription>Summary of all current listings with key metrics</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b bg-muted/50">
								<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Address</th>
								<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Phase</th>
								<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Price</th>
								<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">DOM</th>
								<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Views</th>
								<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Offers</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each listings as listing}
								<tr class="hover:bg-muted/30 transition-colors">
									<td class="px-4 py-2.5 font-medium">
										<a href="/listings/{listing.id}" class="hover:underline">{listing.property?.address ?? ''}</a>
									</td>
									<td class="px-4 py-2.5">
										<Badge
											variant="outline"
											class="text-xs"
											style="border-color: {PHASES[listing.phase].color}; color: {PHASES[listing.phase].color}"
										>
											{PHASES[listing.phase].label}
										</Badge>
									</td>
									<td class="px-4 py-2.5 text-right font-mono">{listing.price ? formatCurrency(listing.price) : 'No Price'}</td>
									<td class="px-4 py-2.5 text-right font-mono">{listing.daysOnMarket || '—'}</td>
									<td class="px-4 py-2.5 text-right font-mono">{listing.zillowViews ? formatNumber(listing.zillowViews) : '—'}</td>
									<td class="px-4 py-2.5 text-right font-mono">{listing.offersCount || '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>

		<!-- Monthly Closed Deals Tracker -->
		<Card>
			<CardHeader>
				<CardTitle class="font-serif">Monthly Closed Deals</CardTitle>
				<CardDescription>Closed transactions and total volume by month</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="divide-y">
					{#each closedDeals as deal}
						<div class="flex items-center justify-between py-3">
							<div>
								<p class="font-medium">{deal.month}</p>
								<p class="text-sm text-muted-foreground">{deal.count} {deal.count === 1 ? 'deal' : 'deals'} closed</p>
							</div>
							<div class="text-right">
								<p class="font-mono font-semibold">{deal.volume}</p>
								<div class="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
									<div
										class="h-full rounded-full bg-[#C4704B]"
										style="width: {deal.count ? (deal.count / 3) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 rounded-lg bg-muted/50 p-3">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium">YTD Total</p>
						<p class="font-mono font-bold">$14,475,000</p>
					</div>
					<p class="mt-1 text-xs text-muted-foreground">6 deals closed &middot; Avg $2.41M per deal</p>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
