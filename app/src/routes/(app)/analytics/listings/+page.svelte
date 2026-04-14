<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { PHASES } from '$lib/config';
	import { formatNumber, formatCurrency } from '$lib/utils';

	let { data } = $props();

	// Listings come from the parent layout's load function
	const listings = $derived(data.listings ?? []);
	const viewsTimeSeries = $derived(data.viewsTimeSeries ?? { labels: [] as string[], zillow: [] as number[], redfin: [] as number[], realtor: [] as number[], website: [] as number[], social: [] as number[] });
	const showingsTimeSeries = $derived(data.showingsTimeSeries ?? { labels: [] as string[], showings: [] as number[], openHouseAttendees: [] as number[] });
	import { Eye, Heart, Users, TrendingUp, ArrowRight } from 'lucide-svelte';

	Chart.register(...registerables);

	const tabs = [
		{ href: '/analytics', label: 'Overview', active: false },
		{ href: '/analytics/listings', label: 'Listing Performance', active: true },
		{ href: '/analytics/team', label: 'Team Performance', active: false },
		{ href: '/analytics/insights', label: 'Insights', active: false }
	];

	const activeListings = $derived(listings.filter((l: any) => (l.zillowViews ?? 0) > 0));
	const totalViews = $derived(listings.reduce((s: number, l: any) => s + (l.zillowViews ?? 0), 0));
	const totalSaves = $derived(listings.reduce((s: number, l: any) => s + (l.zillowSaves ?? 0), 0));
	const totalShowings = $derived(listings.reduce((s: number, l: any) => s + (l.showingsCount ?? 0), 0));

	// Top performers
	const topByViews = $derived([...listings].sort((a: any, b: any) => (b.zillowViews ?? 0) - (a.zillowViews ?? 0)).slice(0, 5));
	const topBySaves = $derived([...listings].sort((a: any, b: any) => (b.zillowSaves ?? 0) - (a.zillowSaves ?? 0)).slice(0, 5));
	const topByShowings = $derived([...listings].sort((a: any, b: any) => (b.showingsCount ?? 0) - (a.showingsCount ?? 0)).slice(0, 5));

	// Showing conversion funnel
	const funnelData = $derived({
		totalShowings: totalShowings,
		feedbackReceived: 4,
		interested: 3,
		offers: listings.reduce((s: number, l: any) => s + (l.offersCount ?? 0), 0)
	});

	const funnelSteps = $derived([
		{ label: 'Total Showings', value: funnelData.totalShowings, color: '#C4704B' },
		{ label: 'Feedback Received', value: funnelData.feedbackReceived, color: '#D4956B' },
		{ label: 'Interested', value: funnelData.interested, color: '#C49A3C' },
		{ label: 'Offers', value: funnelData.offers, color: '#7B8B6F' }
	]);

	let viewsCanvas = $state<HTMLCanvasElement>(null!);
	let platformCanvas = $state<HTMLCanvasElement>(null!);
	let viewsChart: Chart | undefined;
	let platformChart: Chart | undefined;

	onMount(() => {
		viewsChart = new Chart(viewsCanvas, {
			type: 'line',
			data: {
				labels: viewsTimeSeries.labels,
				datasets: [
					{
						label: 'Zillow',
						data: viewsTimeSeries.zillow,
						borderColor: '#C4704B',
						backgroundColor: 'rgba(196, 112, 75, 0.08)',
						fill: true,
						tension: 0.4,
						pointRadius: 3
					},
					{
						label: 'Redfin',
						data: viewsTimeSeries.redfin,
						borderColor: '#7B8B6F',
						backgroundColor: 'rgba(123, 139, 111, 0.08)',
						fill: true,
						tension: 0.4,
						pointRadius: 3
					},
					{
						label: 'Realtor.com',
						data: viewsTimeSeries.realtor,
						borderColor: '#5B8BA5',
						backgroundColor: 'rgba(91, 139, 165, 0.08)',
						fill: true,
						tension: 0.4,
						pointRadius: 3
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: {
					legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
				},
				scales: {
					y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
					x: { grid: { display: false } }
				}
			}
		});

		platformChart = new Chart(platformCanvas, {
			type: 'bar',
			data: {
				labels: ['Zillow', 'Redfin', 'Realtor.com'],
				datasets: [
					{
						label: 'Views',
						data: [
							viewsTimeSeries.zillow.reduce((s, v) => s + v, 0),
							viewsTimeSeries.redfin.reduce((s, v) => s + v, 0),
							viewsTimeSeries.realtor.reduce((s, v) => s + v, 0)
						],
						backgroundColor: ['rgba(196, 112, 75, 0.8)', 'rgba(123, 139, 111, 0.8)', 'rgba(91, 139, 165, 0.8)'],
						borderColor: ['#C4704B', '#7B8B6F', '#5B8BA5'],
						borderWidth: 1,
						borderRadius: 4
					},
					{
						label: 'Saves',
						data: [67 + 142 + 198, 35 + 80 + 110, 20 + 42 + 55],
						backgroundColor: ['rgba(196, 112, 75, 0.3)', 'rgba(123, 139, 111, 0.3)', 'rgba(91, 139, 165, 0.3)'],
						borderColor: ['#C4704B', '#7B8B6F', '#5B8BA5'],
						borderWidth: 1,
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
				},
				scales: {
					y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
					x: { grid: { display: false } }
				}
			}
		});

		return () => {
			viewsChart?.destroy();
			platformChart?.destroy();
		};
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Listing Performance</h1>
		<p class="text-muted-foreground">Engagement analytics across all active listings</p>
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

	<!-- Summary stats -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-[#C4704B]/10 p-2.5">
						<Eye class="size-5 text-[#C4704B]" />
					</div>
					<div>
						<p class="text-2xl font-bold font-mono">{formatNumber(totalViews)}</p>
						<p class="text-xs text-muted-foreground">Total Views</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-[#7B8B6F]/10 p-2.5">
						<Heart class="size-5 text-[#7B8B6F]" />
					</div>
					<div>
						<p class="text-2xl font-bold font-mono">{formatNumber(totalSaves)}</p>
						<p class="text-xs text-muted-foreground">Total Saves</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-[#5B8BA5]/10 p-2.5">
						<Users class="size-5 text-[#5B8BA5]" />
					</div>
					<div>
						<p class="text-2xl font-bold font-mono">{totalShowings}</p>
						<p class="text-xs text-muted-foreground">Total Showings</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-[#C49A3C]/10 p-2.5">
						<TrendingUp class="size-5 text-[#C49A3C]" />
					</div>
					<div>
						<p class="text-2xl font-bold font-mono">{((totalSaves / (totalViews || 1)) * 100).toFixed(1)}%</p>
						<p class="text-xs text-muted-foreground">Save Rate</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Charts row -->
	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="font-serif">Views Over Time</CardTitle>
				<CardDescription>Aggregate views across all active listings by platform</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="h-64">
					<canvas bind:this={viewsCanvas}></canvas>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="font-serif">Platform Comparison</CardTitle>
				<CardDescription>Total views and saves by platform</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="h-64">
					<canvas bind:this={platformCanvas}></canvas>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Top Performers -->
	<div class="grid gap-4 lg:grid-cols-3">
		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-medium flex items-center gap-2">
					<Eye class="size-4 text-[#C4704B]" />
					Top by Views
				</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each topByViews as listing, i}
						<div class="flex items-center justify-between px-4 py-2.5">
							<div class="flex items-center gap-2.5">
								<span class="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
								<a href="/listings/{listing.id}" class="text-sm hover:underline">{listing.address}</a>
							</div>
							<span class="font-mono text-sm font-medium">{listing.zillowViews ? formatNumber(listing.zillowViews) : '—'}</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-medium flex items-center gap-2">
					<Heart class="size-4 text-[#7B8B6F]" />
					Top by Saves
				</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each topBySaves as listing, i}
						<div class="flex items-center justify-between px-4 py-2.5">
							<div class="flex items-center gap-2.5">
								<span class="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
								<a href="/listings/{listing.id}" class="text-sm hover:underline">{listing.address}</a>
							</div>
							<span class="font-mono text-sm font-medium">{listing.zillowSaves || '—'}</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-medium flex items-center gap-2">
					<Users class="size-4 text-[#5B8BA5]" />
					Top by Showings
				</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each topByShowings as listing, i}
						<div class="flex items-center justify-between px-4 py-2.5">
							<div class="flex items-center gap-2.5">
								<span class="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
								<a href="/listings/{listing.id}" class="text-sm hover:underline">{listing.address}</a>
							</div>
							<span class="font-mono text-sm font-medium">{listing.showingsCount || '—'}</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Listing Performance Table -->
	<Card>
		<CardHeader>
			<CardTitle class="font-serif">Listing-by-Listing Performance</CardTitle>
			<CardDescription>Detailed metrics for every listing in the portfolio</CardDescription>
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
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Saves</th>
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Showings</th>
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Offers</th>
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Trend</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each listings as listing}
							{@const viewRate = listing.zillowViews > 500 ? 'up' : listing.zillowViews > 0 ? 'flat' : 'na'}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="px-4 py-2.5 font-medium">
									<a href="/listings/{listing.id}" class="hover:underline">{listing.address}</a>
									<p class="text-xs text-muted-foreground">{listing.city}</p>
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
								<td class="px-4 py-2.5 text-right font-mono">{formatCurrency(listing.price ?? 0)}</td>
								<td class="px-4 py-2.5 text-right font-mono">{listing.daysOnMarket || '—'}</td>
								<td class="px-4 py-2.5 text-right font-mono">{listing.zillowViews ? formatNumber(listing.zillowViews) : '—'}</td>
								<td class="px-4 py-2.5 text-right font-mono">{listing.zillowSaves || '—'}</td>
								<td class="px-4 py-2.5 text-right font-mono">{listing.showingsCount || '—'}</td>
								<td class="px-4 py-2.5 text-right font-mono">{listing.offersCount || '—'}</td>
								<td class="px-4 py-2.5 text-right">
									{#if viewRate === 'up'}
										<span class="inline-block h-4 w-12">
											<svg viewBox="0 0 48 16" class="text-green-500">
												<polyline points="0,14 12,10 24,6 36,8 48,2" fill="none" stroke="currentColor" stroke-width="2" />
											</svg>
										</span>
									{:else if viewRate === 'flat'}
										<span class="inline-block h-4 w-12">
											<svg viewBox="0 0 48 16" class="text-amber-500">
												<polyline points="0,8 12,9 24,7 36,8 48,8" fill="none" stroke="currentColor" stroke-width="2" />
											</svg>
										</span>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>

	<!-- Showing Conversion Funnel -->
	<Card>
		<CardHeader>
			<CardTitle class="font-serif">Showing Conversion Funnel</CardTitle>
			<CardDescription>From total showings to offers received across all listings</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex items-center justify-center gap-2 py-4">
				{#each funnelSteps as step, i}
					<div class="flex-1 text-center">
						<div
							class="mx-auto rounded-xl flex items-center justify-center font-bold text-white text-xl"
							style="background-color: {step.color}; height: {64 - i * 8}px; width: {100 - i * 10}%"
						>
							{step.value}
						</div>
						<p class="mt-2 text-xs font-medium text-muted-foreground">{step.label}</p>
						{#if i < funnelSteps.length - 1}
							<p class="mt-1 text-xs text-muted-foreground/60">
								{((funnelSteps[i + 1].value / (step.value || 1)) * 100).toFixed(0)}% conv.
							</p>
						{/if}
					</div>
					{#if i < funnelSteps.length - 1}
						<ArrowRight class="size-4 text-muted-foreground/40 flex-shrink-0" />
					{/if}
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
