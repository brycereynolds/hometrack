<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Chart, registerables } from 'chart.js';
	import { formatCurrency, formatNumber } from '$lib/utils.js';
	import {
		Eye,
		TrendingUp,
		TrendingDown,
		BarChart3,
		Clock,
		Sparkles,
		ExternalLink,
		MapPin,
		Home,
		ArrowUpRight,
		ArrowDownRight,
		Minus,
		Target,
		Activity
	} from 'lucide-svelte';

	Chart.register(...registerables);

	let { data } = $props();
	const listing = $derived(data.listing);
	const listingInsights = $derived((data.aiInsights ?? []).filter((a: any) => !a.dismissed));
	const compSales = $derived(data.compSales ?? []);
	const viewsTimeSeries = $derived(data.viewsTimeSeries ?? { labels: [] as string[], zillow: [] as number[], redfin: [] as number[], realtor: [] as number[], website: [] as number[], social: [] as number[] });
	const showingsTimeSeries = $derived(data.showingsTimeSeries ?? { labels: [] as string[], showings: [] as number[], openHouseAttendees: [] as number[] });

	let viewsCanvas = $state<HTMLCanvasElement>(null!);
	let trafficCanvas = $state<HTMLCanvasElement>(null!);
	let showingsCanvas = $state<HTMLCanvasElement>(null!);
	let viewsChart: Chart | null = null;
	let trafficChart: Chart | null = null;
	let showingsChart: Chart | null = null;

	const avgDOM = 14;
	const marketAvgDOM = 18;

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	onMount(() => {
		viewsChart = new Chart(viewsCanvas, {
			type: 'line',
			data: {
				labels: viewsTimeSeries.labels,
				datasets: [
					{ label: 'Zillow', data: viewsTimeSeries.zillow, borderColor: '#C4704B', backgroundColor: '#C4704B20', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 },
					{ label: 'Redfin', data: viewsTimeSeries.redfin, borderColor: '#7B8B6F', backgroundColor: '#7B8B6F20', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 },
					{ label: 'Realtor.com', data: viewsTimeSeries.realtor, borderColor: '#5B8BA5', backgroundColor: '#5B8BA520', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 },
				]
			},
			options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8 } } }
		});

		trafficChart = new Chart(trafficCanvas, {
			type: 'doughnut',
			data: {
				labels: ['Zillow', 'Redfin', 'Realtor.com', 'Direct', 'Social Media', 'Other'],
				datasets: [{ data: [42, 25, 15, 8, 7, 3], backgroundColor: ['#C4704B', '#7B8B6F', '#5B8BA5', '#C49A3C', '#D4956B', '#9B8EB5'], borderWidth: 0, hoverOffset: 8 }]
			},
			options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 10 }, padding: 12, generateLabels: (chart) => { const data = chart.data; return (data.labels || []).map((label, i) => ({ text: `${label} (${data.datasets[0].data[i]}%)`, fillStyle: (data.datasets[0].backgroundColor as string[])[i], strokeStyle: 'transparent', pointStyle: 'circle' as const, hidden: false, index: i })); } } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` } } } }
		});

		showingsChart = new Chart(showingsCanvas, {
			type: 'bar',
			data: {
				labels: showingsTimeSeries.labels,
				datasets: [
					{ label: 'Private Showings', data: showingsTimeSeries.showings, backgroundColor: '#C4704B', borderRadius: 6, barPercentage: 0.6 },
					{ label: 'Open House', data: showingsTimeSeries.openHouseAttendees, backgroundColor: '#D4956B80', borderRadius: 6, barPercentage: 0.6 }
				]
			},
			options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } }, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } } } }
		});

		return () => { viewsChart?.destroy(); trafficChart?.destroy(); showingsChart?.destroy(); };
	});
</script>

{#if listing}
	<div class="space-y-6">
		<h2 class="font-serif text-lg font-semibold">Analytics</h2>

		<!-- KPI Summary Row -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-primary/10 p-2"><Eye class="size-4 text-primary" /></div><div><p class="text-xs text-muted-foreground">Total Views</p><p class="text-lg font-bold">{formatNumber(listing.zillowViews ?? 0)}</p></div></div><div class="mt-2 text-xs text-muted-foreground">{formatNumber(listing.zillowViews ?? 0)} total</div></CardContent></Card>
			<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-rose-50 p-2"><Target class="size-4 text-rose-600" /></div><div><p class="text-xs text-muted-foreground">Saves</p><p class="text-lg font-bold">{formatNumber(listing.zillowSaves ?? 0)}</p></div></div><div class="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Minus class="size-3" /><span>Steady</span></div></CardContent></Card>
			<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-amber-50 p-2"><Activity class="size-4 text-amber-600" /></div><div><p class="text-xs text-muted-foreground">Save Rate</p><p class="text-lg font-bold">{(listing.zillowViews ?? 0) > 0 ? (((listing.zillowSaves ?? 0) / (listing.zillowViews ?? 1)) * 100).toFixed(1) : 0}%</p></div></div><div class="mt-2 text-xs text-muted-foreground">Avg: 3.2%</div></CardContent></Card>
			<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-blue-50 p-2"><Clock class="size-4 text-blue-600" /></div><div><p class="text-xs text-muted-foreground">Days on Market</p><p class="text-lg font-bold">{(listing.daysOnMarket ?? 0) > 0 ? listing.daysOnMarket : 'Pre-market'}</p></div></div>
				{#if (listing.daysOnMarket ?? 0) > 0}
					<div class="mt-2"><div class="flex justify-between text-[10px] text-muted-foreground mb-1"><span>0</span><span>Market Avg ({marketAvgDOM}d)</span><span>30+</span></div><div class="h-2 rounded-full bg-muted relative"><div class="h-2 rounded-full transition-all {(listing.daysOnMarket ?? 0) <= marketAvgDOM ? 'bg-green-500' : (listing.daysOnMarket ?? 0) <= 25 ? 'bg-amber-500' : 'bg-red-500'}" style="width: {Math.min(((listing.daysOnMarket ?? 0) / 30) * 100, 100)}%"></div><div class="absolute top-0 h-2 w-0.5 bg-gray-400" style="left: {(marketAvgDOM / 30) * 100}%"></div></div></div>
				{/if}
			</CardContent></Card>
		</div>

		<!-- Views & Saves Chart -->
		<Card><CardHeader><CardTitle class="font-serif text-base">Views & Saves by Platform</CardTitle><CardDescription>Daily view trends across listing portals</CardDescription></CardHeader><CardContent><div class="h-72"><canvas bind:this={viewsCanvas}></canvas></div></CardContent></Card>

		<!-- Traffic Sources + Showing Volume -->
		<div class="grid gap-6 lg:grid-cols-2">
			<Card><CardHeader><CardTitle class="font-serif text-base">Traffic Sources</CardTitle><CardDescription>Where buyers are finding this listing</CardDescription></CardHeader><CardContent><div class="h-56"><canvas bind:this={trafficCanvas}></canvas></div></CardContent></Card>
			<Card><CardHeader><CardTitle class="font-serif text-base">Showing Volume</CardTitle><CardDescription>Weekly showing and open house activity</CardDescription></CardHeader><CardContent><div class="h-56"><canvas bind:this={showingsCanvas}></canvas></div></CardContent></Card>
		</div>

		<!-- Comp Analysis Table -->
		{#if compSales.length > 0}
			<Card>
				<CardHeader><div class="flex items-center gap-2"><MapPin class="size-4 text-muted-foreground" /><CardTitle class="font-serif text-base">Comparable Sales Analysis</CardTitle></div><CardDescription>Recent sales within 0.6 miles used for pricing analysis</CardDescription></CardHeader>
				<CardContent>
					<div class="overflow-x-auto -mx-6 px-6">
						<table class="w-full min-w-[800px] text-sm">
							<thead><tr class="border-b-2"><th class="pb-3 text-left font-semibold text-muted-foreground">Address</th><th class="pb-3 text-right font-semibold text-muted-foreground">Sale Price</th><th class="pb-3 text-center font-semibold text-muted-foreground">Beds/Baths</th><th class="pb-3 text-right font-semibold text-muted-foreground">Sq Ft</th><th class="pb-3 text-right font-semibold text-muted-foreground">$/SqFt</th><th class="pb-3 text-center font-semibold text-muted-foreground">DOM</th><th class="pb-3 text-center font-semibold text-muted-foreground">Distance</th><th class="pb-3 text-right font-semibold text-muted-foreground">Adjustments</th><th class="pb-3 text-right font-semibold text-muted-foreground">Adjusted Value</th></tr></thead>
							<tbody class="divide-y">
								{#each compSales as comp}
									<tr class="hover:bg-muted/30 transition-colors">
										<td class="py-3"><div class="flex items-center gap-2"><img src={(comp.property?.photos as any)?.[0]?.url ?? ''} alt="" class="size-8 rounded object-cover shrink-0" /><div><p class="font-medium">{comp.property?.address ?? ''}</p><p class="text-xs text-muted-foreground">{comp.property?.city ?? ''} -- Sold {formatDate(comp.saleDate)}</p></div></div></td>
										<td class="py-3 text-right font-medium">{formatCurrency(comp.price ?? 0)}</td>
										<td class="py-3 text-center">{comp.property?.beds ?? 0}/{comp.property?.baths ?? 0}</td>
										<td class="py-3 text-right">{formatNumber(comp.property?.sqft ?? 0)}</td>
										<td class="py-3 text-right">${comp.pricePerSqft ?? 0}</td>
										<td class="py-3 text-center"><Badge variant="secondary" class="text-[10px]">{comp.daysOnMarket ?? 0}d</Badge></td>
										<td class="py-3 text-center text-muted-foreground">{comp.distance}</td>
										<td class="py-3 text-right">
											<div class="space-y-0.5">
												{#each (comp.adjustments ?? []) as adj}
													<div class="text-[10px] {(adj as any).amount >= 0 ? 'text-green-600' : 'text-red-600'}">{(adj as any).label}: {(adj as any).amount >= 0 ? '+' : ''}{formatCurrency((adj as any).amount)}</div>
												{/each}
											</div>
										</td>
										<td class="py-3 text-right font-bold">{formatCurrency(comp.adjustedValue ?? 0)}</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="border-t-2 bg-muted/30">
									<td colspan="8" class="py-3 text-right font-semibold">Average Adjusted Value</td>
									<td class="py-3 text-right font-bold text-primary">{formatCurrency(compSales.length > 0 ? Math.round(compSales.reduce((sum: number, c: any) => sum + (c.adjustedValue ?? 0), 0) / compSales.length) : 0)}</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- AI Insights -->
		{#if listingInsights.length > 0}
			<Card class="border-amber-200 bg-amber-50/30">
				<CardHeader><div class="flex items-center gap-2"><Sparkles class="size-4 text-amber-500" /><CardTitle class="font-serif text-base">Market Insights</CardTitle></div></CardHeader>
				<CardContent>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each listingInsights as insight}
							{@const typeColor = insight.type === 'anomaly' ? 'border-red-200 bg-red-50/50' : insight.type === 'warning' ? 'border-amber-200 bg-amber-50/50' : insight.type === 'connection' ? 'border-blue-200 bg-blue-50/50' : 'border-green-200 bg-green-50/50'}
							<div class="rounded-lg border p-4 {typeColor}">
								<Badge variant="outline" class="mb-2 text-[10px]">{insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</Badge>
								<p class="text-sm font-medium">{insight.title}</p>
								<p class="mt-1 text-xs text-muted-foreground">{insight.description}</p>
								{#if insight.actionLabel}<Button variant="ghost" size="sm" class="mt-2 h-7 text-xs" href={insight.actionUrl}>{insight.actionLabel}<ExternalLink class="ml-1 size-3" /></Button>{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
{/if}
