<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatCurrency } from '$lib/utils';
	import {
		DollarSign,
		TrendingUp,
		CheckCircle2,
		ChevronDown,
		ChevronRight,
		Wallet
	} from 'lucide-svelte';

	let { data } = $props();

	const listing = $derived(data.listing);
	const costs: any[] = $derived((data as any).costs ?? []);

	const salePrice = $derived(listing?.price ?? 0);

	const costsByCategory = $derived(() => {
		const grouped: Record<string, any[]> = {};
		for (const cost of costs) {
			const cat = cost.category || 'Uncategorized';
			if (!grouped[cat]) grouped[cat] = [];
			grouped[cat].push(cost);
		}
		return grouped;
	});

	const totalCosts = $derived(costs.reduce((s: number, c: any) => s + (c.amount ?? 0), 0));
	const totalPaid = $derived(
		costs.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + (c.amount ?? 0), 0)
	);
	const totalCommitted = $derived(
		costs.filter((c: any) => c.status === 'committed').reduce((s: number, c: any) => s + (c.amount ?? 0), 0)
	);

	// Default commission/closing rates (read-only for clients)
	const commissionRate = 5;
	const closingCostRate = 1.5;
	const commissionAmount = $derived(salePrice * (commissionRate / 100));
	const closingCostAmount = $derived(salePrice * (closingCostRate / 100));
	const netToSeller = $derived(salePrice - totalCosts - commissionAmount - closingCostAmount);

	let expandedCategories = $state<Set<string>>(new Set());

	function toggleCategory(cat: string) {
		const next = new Set(expandedCategories);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		expandedCategories = next;
	}

	function statusDot(status: string) {
		return status === 'paid' ? 'bg-green-500' : 'bg-blue-500';
	}

	function statusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="space-y-8">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Financials</h1>
		<p class="text-muted-foreground">Budget overview for your property.</p>
	</div>

	{#if !listing}
		<Card>
			<CardContent class="py-12 text-center text-muted-foreground">
				<DollarSign class="mx-auto mb-2 size-8 text-muted-foreground/30" />
				<p>No financial data available yet.</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Summary Cards -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-blue-50 p-2"><Wallet class="size-4 text-blue-600" /></div>
						<div>
							<p class="text-xs text-muted-foreground">Committed</p>
							<p class="text-lg font-bold">{formatCurrency(totalCommitted)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-emerald-50 p-2"><CheckCircle2 class="size-4 text-emerald-600" /></div>
						<div>
							<p class="text-xs text-muted-foreground">Paid</p>
							<p class="text-lg font-bold">{formatCurrency(totalPaid)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-primary/10 p-2"><TrendingUp class="size-4 text-primary" /></div>
						<div>
							<p class="text-xs text-muted-foreground">Net to Seller</p>
							<p class="text-lg font-bold {netToSeller >= 0 ? 'text-green-700' : 'text-red-700'}">{formatCurrency(netToSeller)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- P&L Statement -->
		<Card>
			<CardHeader>
				<CardTitle class="font-serif text-base">Profit & Loss</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-sm">
					<!-- Revenue -->
					<div class="flex justify-between py-2.5 font-semibold border-b">
						<span>Revenue</span>
						<span></span>
					</div>
					<div class="flex justify-between py-2 pl-4">
						<span class="text-muted-foreground">Sale Price</span>
						<span class="font-medium">{salePrice > 0 ? formatCurrency(salePrice) : 'Not set'}</span>
					</div>

					<!-- Costs by category -->
					<div class="flex justify-between py-2.5 font-semibold border-b border-t mt-2">
						<span>Costs</span>
						<span class="text-red-600">{totalCosts > 0 ? `(${formatCurrency(totalCosts)})` : '$0'}</span>
					</div>

					{#each Object.entries(costsByCategory()) as [category, categoryCosts]}
						{@const catTotal = categoryCosts.reduce((s: number, c: any) => s + (c.amount ?? 0), 0)}
						{@const isExpanded = expandedCategories.has(category)}
						<div>
							<button
								type="button"
								class="flex w-full items-center justify-between py-2 pl-4 pr-0 hover:bg-muted/50 rounded transition-colors"
								onclick={() => toggleCategory(category)}
							>
								<span class="flex items-center gap-1.5">
									{#if isExpanded}
										<ChevronDown class="size-3.5 text-muted-foreground" />
									{:else}
										<ChevronRight class="size-3.5 text-muted-foreground" />
									{/if}
									<span class="font-medium">{category}</span>
									<span class="text-xs text-muted-foreground">({categoryCosts.length})</span>
								</span>
								<span class="font-medium text-red-600">({formatCurrency(catTotal)})</span>
							</button>

							{#if isExpanded}
								<div class="ml-8 border-l border-muted pl-3">
									{#each categoryCosts as cost}
										<div class="flex items-center justify-between py-1.5 text-xs">
											<span class="flex items-center gap-2">
												<span class="inline-flex size-2 rounded-full {statusDot(cost.status)}"></span>
												<span class="text-muted-foreground">{cost.title}</span>
												{#if cost.vendor}
													<span class="text-muted-foreground/60">- {cost.vendor.name}</span>
												{/if}
											</span>
											<span class="flex items-center gap-2">
												<span class="font-medium">{formatCurrency(cost.amount ?? 0)}</span>
												<Badge variant="outline" class="text-[10px] px-1.5 py-0 {cost.status === 'paid' ? 'border-emerald-200 text-emerald-600' : 'border-blue-200 text-blue-600'}">
													{statusLabel(cost.status)}
												</Badge>
											</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}

					{#if costs.length === 0}
						<div class="py-4 pl-4 text-xs text-muted-foreground italic">No costs to display yet</div>
					{/if}

					<!-- Commissions -->
					<div class="flex justify-between py-2 pl-4 border-t mt-2">
						<span class="text-muted-foreground">Commissions ({commissionRate}%)</span>
						<span class="font-medium text-red-600">({formatCurrency(commissionAmount)})</span>
					</div>

					<!-- Closing Costs -->
					<div class="flex justify-between py-2 pl-4">
						<span class="text-muted-foreground">Closing Costs ({closingCostRate}%)</span>
						<span class="font-medium text-red-600">({formatCurrency(closingCostAmount)})</span>
					</div>

					<!-- Net to Seller -->
					<div class="flex justify-between py-3 border-t-2 mt-2">
						<span class="font-semibold">Net to Seller</span>
						<span class="text-base font-bold {netToSeller >= 0 ? 'text-green-700' : 'text-red-700'}">
							{formatCurrency(netToSeller)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
