<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Chart, registerables } from 'chart.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		DollarSign,
		TrendingUp,
		TrendingDown,
		Wallet,
		Receipt,
		Clock,
		CheckCircle2,
		XCircle,
		AlertCircle,
		ArrowUpRight,
		ArrowDownRight,
		Minus
	} from 'lucide-svelte';

	Chart.register(...registerables);

	let { data } = $props();
	const listing = $derived(data.listing);
	const financial = $derived(data.financial);
	const listingQuotes = $derived(data.quotes ?? []);

	let budgetCanvas = $state<HTMLCanvasElement>(null!);
	let breakdownCanvas = $state<HTMLCanvasElement>(null!);
	let budgetChart: Chart | null = null;
	let breakdownChart: Chart | null = null;

	onMount(() => {
		if (financial) {
			const categories = financial.categories ?? [];

			breakdownChart = new Chart(breakdownCanvas, {
				type: 'doughnut',
				data: {
					labels: categories.map((c: any) => c.name),
					datasets: [{ data: categories.map((c: any) => c.actual), backgroundColor: ['#C4704B', '#7B8B6F', '#D4956B', '#5B8BA5', '#C49A3C'], borderWidth: 0, hoverOffset: 8 }]
				},
				options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } } } }
			});

			budgetChart = new Chart(budgetCanvas, {
				type: 'bar',
				data: {
					labels: categories.map((c: any) => c.name),
					datasets: [
						{ label: 'Budgeted', data: categories.map((c: any) => c.budgeted), backgroundColor: '#C4704B40', borderColor: '#C4704B', borderWidth: 1, borderRadius: 4 },
						{ label: 'Actual', data: categories.map((c: any) => c.actual), backgroundColor: '#C4704B', borderColor: '#C4704B', borderWidth: 0, borderRadius: 4 }
					]
				},
				options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(Number(value)), font: { size: 10 } }, grid: { color: '#f1f1f1' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } } }
			});
		}

		return () => {
			budgetChart?.destroy();
			breakdownChart?.destroy();
		};
	});

	function getQuoteStatusBadge(status: string) {
		switch (status) {
			case 'approved': return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
			case 'received': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
			case 'requested': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle };
			case 'declined': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
			default: return { color: 'bg-gray-100 text-gray-600', icon: Clock };
		}
	}
</script>

{#if listing}
	<div class="space-y-6">
		<h2 class="font-serif text-lg font-semibold">Financials</h2>

		{#if financial}
			<!-- Summary Cards -->
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-blue-50 p-2"><Wallet class="size-4 text-blue-600" /></div><div><p class="text-xs text-muted-foreground">Total Budget</p><p class="text-lg font-bold">{formatCurrency(financial.totalBudget ?? 0)}</p></div></div></CardContent></Card>
				<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-emerald-50 p-2"><DollarSign class="size-4 text-emerald-600" /></div><div><p class="text-xs text-muted-foreground">Spent</p><p class="text-lg font-bold">{formatCurrency(financial.spent ?? 0)}</p></div></div></CardContent></Card>
				<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-amber-50 p-2"><TrendingDown class="size-4 text-amber-600" /></div><div><p class="text-xs text-muted-foreground">Remaining</p><p class="text-lg font-bold">{formatCurrency(financial.remaining ?? 0)}</p></div></div></CardContent></Card>
				<Card><CardContent class="p-4"><div class="flex items-center gap-2"><div class="rounded-lg bg-violet-50 p-2"><Receipt class="size-4 text-violet-600" /></div><div><p class="text-xs text-muted-foreground">Pending Quotes</p><p class="text-lg font-bold">{financial.pendingQuotes ?? 0}</p></div></div></CardContent></Card>
			</div>

			<!-- Charts Row -->
			<div class="grid gap-6 lg:grid-cols-2">
				<Card><CardHeader><CardTitle class="font-serif text-base">Spending Breakdown</CardTitle></CardHeader><CardContent><div class="h-64"><canvas bind:this={breakdownCanvas}></canvas></div></CardContent></Card>
				<Card><CardHeader><CardTitle class="font-serif text-base">Budget vs. Actual</CardTitle></CardHeader><CardContent><div class="h-64"><canvas bind:this={budgetCanvas}></canvas></div></CardContent></Card>
			</div>

			<!-- Budget Table -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Budget Detail</CardTitle></CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead><tr class="border-b text-left"><th class="pb-3 font-medium text-muted-foreground">Category</th><th class="pb-3 text-right font-medium text-muted-foreground">Budgeted</th><th class="pb-3 text-right font-medium text-muted-foreground">Actual</th><th class="pb-3 text-right font-medium text-muted-foreground">Variance</th><th class="pb-3 text-right font-medium text-muted-foreground">Utilization</th></tr></thead>
							<tbody class="divide-y">
								{#each financial.categories ?? [] as cat}
									{@const utilization = (cat.budgeted ?? 0) > 0 ? ((cat.actual ?? 0) / (cat.budgeted ?? 1)) * 100 : 0}
									{@const isOver = (cat.variance ?? 0) < 0}
									<tr>
										<td class="py-3 font-medium">{cat.name}</td>
										<td class="py-3 text-right text-muted-foreground">{formatCurrency(cat.budgeted ?? 0)}</td>
										<td class="py-3 text-right font-medium">{formatCurrency(cat.actual ?? 0)}</td>
										<td class="py-3 text-right">
											<span class="inline-flex items-center gap-1 {isOver ? 'text-red-600' : 'text-green-600'}">
												{#if isOver}<ArrowUpRight class="size-3" />{:else if (cat.variance ?? 0) > 0}<ArrowDownRight class="size-3" />{:else}<Minus class="size-3" />{/if}
												{formatCurrency(Math.abs(cat.variance ?? 0))}
											</span>
										</td>
										<td class="py-3 text-right">
											<div class="flex items-center justify-end gap-2">
												<div class="h-1.5 w-16 rounded-full bg-muted"><div class="h-1.5 rounded-full transition-all {utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-amber-500' : 'bg-green-500'}" style="width: {Math.min(utilization, 100)}%"></div></div>
												<span class="text-xs text-muted-foreground w-10 text-right">{Math.round(utilization)}%</span>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="border-t-2">
									<td class="pt-3 font-semibold">Total</td>
									<td class="pt-3 text-right font-semibold">{formatCurrency(financial.totalBudget ?? 0)}</td>
									<td class="pt-3 text-right font-semibold">{formatCurrency(financial.spent ?? 0)}</td>
									<td class="pt-3 text-right font-semibold text-green-600">{formatCurrency(financial.remaining ?? 0)}</td>
									<td class="pt-3 text-right text-sm text-muted-foreground">{(financial.totalBudget ?? 0) > 0 ? Math.round(((financial.spent ?? 0) / (financial.totalBudget ?? 1)) * 100) : 0}%</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</CardContent>
			</Card>

			<!-- P&L Summary -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Estimated P&L</CardTitle><CardDescription>Projected returns based on current spending</CardDescription></CardHeader>
				<CardContent>
					<div class="divide-y">
						<div class="flex justify-between py-2.5"><span class="text-sm text-muted-foreground">List Price</span><span class="text-sm font-medium">{listing.price ? formatCurrency(listing.price) : 'Unset'}</span></div>
						<div class="flex justify-between py-2.5"><span class="text-sm text-muted-foreground">Est. Commission (5%)</span><span class="text-sm font-medium text-red-600">-{formatCurrency((listing.price ?? 0) * 0.05)}</span></div>
						<div class="flex justify-between py-2.5"><span class="text-sm text-muted-foreground">Prep & Marketing Costs</span><span class="text-sm font-medium text-red-600">-{formatCurrency(financial.spent ?? 0)}</span></div>
						<div class="flex justify-between py-2.5"><span class="text-sm text-muted-foreground">Est. Closing Costs (1.5%)</span><span class="text-sm font-medium text-red-600">-{formatCurrency((listing.price ?? 0) * 0.015)}</span></div>
						<div class="flex justify-between py-3 border-t-2"><span class="text-sm font-semibold">Est. Net to Seller</span><span class="text-base font-bold text-green-700">{formatCurrency((listing.price ?? 0) - (listing.price ?? 0) * 0.05 - (financial.spent ?? 0) - (listing.price ?? 0) * 0.015)}</span></div>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card><CardContent class="flex flex-col items-center justify-center py-12"><DollarSign class="size-10 text-muted-foreground/30 mb-3" /><p class="text-sm text-muted-foreground">No financial data available for this listing yet.</p><Button variant="outline" size="sm" class="mt-3">Set Up Budget</Button></CardContent></Card>
		{/if}

		<!-- Quotes Section -->
		{#if listingQuotes.length > 0}
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Vendor Quotes</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each listingQuotes as quote}
							{@const statusInfo = getQuoteStatusBadge(quote.status)}
							{@const StatusIcon = statusInfo.icon}
							<div class="py-4 first:pt-0 last:pb-0">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-medium">{quote.scope}</p>
										<p class="text-xs text-muted-foreground mt-0.5">{quote.vendor?.name ?? 'Unknown'} -- {quote.vendor?.company ?? ''}</p>
									</div>
									<div class="text-right shrink-0">
										<p class="text-sm font-bold">{formatCurrency(quote.amount ?? 0)}</p>
										<Badge variant="outline" class="mt-1 text-[10px] {statusInfo.color}">
											<StatusIcon class="mr-1 size-3" />
											{quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
										</Badge>
									</div>
								</div>
								{#if (quote.lineItems ?? []).length > 0}
									<div class="mt-3 rounded-md bg-muted/50 p-3">
										<div class="space-y-1">
											{#each quote.lineItems ?? [] as item}
												<div class="flex justify-between text-xs">
													<span class="text-muted-foreground">{item.description}</span>
													<span class="font-medium">{formatCurrency(item.amount ?? 0)}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
								{#if quote.notes}
									<p class="mt-2 text-xs text-muted-foreground italic">"{quote.notes}"</p>
								{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
{/if}
