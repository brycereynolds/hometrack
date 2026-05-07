<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Chart, registerables } from 'chart.js';
	import { formatCurrency } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
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
		Plus,
		Pencil,
		Trash2,
		ChevronDown,
		ChevronRight,
		LinkIcon,
		CircleDot
	} from 'lucide-svelte';

	Chart.register(...registerables);

	type Cost = {
		id: string;
		title: string;
		category: string | null;
		amount: number | null;
		status: string;
		notes: string | null;
		task: { title: string } | null;
		quote: { scope: string | null } | null;
		vendor: { name: string; company: string | null } | null;
		action: { title: string } | null;
	};

	let { data } = $props();
	const listing = $derived(data.listing);
	const financial = $derived(data.financial);
	const costs: Cost[] = $derived((data as any).costs ?? []);

	// P&L config
	let commissionRate = $state(5);
	let closingCostRate = $state(1.5);

	// Computed P&L values from listing_costs
	const salePrice = $derived(listing?.price ?? 0);

	const costsByCategory = $derived(() => {
		const grouped: Record<string, Cost[]> = {};
		for (const cost of costs) {
			const cat = cost.category || 'Uncategorized';
			if (!grouped[cat]) grouped[cat] = [];
			grouped[cat].push(cost);
		}
		return grouped;
	});

	const totalCommitted = $derived(
		costs.filter((c: Cost) => c.status === 'committed' || c.status === 'paid').reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0)
	);
	const totalEstimated = $derived(
		costs.filter((c: Cost) => c.status === 'estimated').reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0)
	);
	const totalPaid = $derived(
		costs.filter((c: Cost) => c.status === 'paid').reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0)
	);
	const totalBudget = $derived(
		financial?.totalBudget ?? (financial?.categories ?? []).reduce((s: number, c: any) => s + (c.budgeted ?? 0), 0)
	);
	const totalCosts = $derived(costs.reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0));
	const commissionAmount = $derived(salePrice * (commissionRate / 100));
	const closingCostAmount = $derived(salePrice * (closingCostRate / 100));
	const netToSeller = $derived(salePrice - totalCosts - commissionAmount - closingCostAmount);

	// Expanded categories in P&L
	let expandedCategories = $state<Set<string>>(new Set());

	function toggleCategory(cat: string) {
		const next = new Set(expandedCategories);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		expandedCategories = next;
	}

	// Cost detail panel
	let selectedCost = $state<(typeof costs)[0] | null>(null);

	// Track Cost modal
	let showAddCost = $state(false);
	let newCostTitle = $state('');
	let newCostCategory = $state('');
	let newCostAmount = $state('');
	let newCostStatus = $state('estimated');
	let newCostNotes = $state('');

	// Edit Cost modal
	let showEditCost = $state(false);
	let editCost = $state<(typeof costs)[0] | null>(null);
	let editCostTitle = $state('');
	let editCostCategory = $state('');
	let editCostAmount = $state('');
	let editCostStatus = $state('estimated');
	let editCostNotes = $state('');

	// Delete confirmation
	let deletingCostId = $state<string | null>(null);

	// Create Budget modal
	let showCreateBudget = $state(false);
	let newBudgetTotal = $state('');

	function openEditCost(cost: (typeof costs)[0]) {
		editCost = cost;
		editCostTitle = cost.title;
		editCostCategory = cost.category || '';
		editCostAmount = String(cost.amount ?? 0);
		editCostStatus = cost.status;
		editCostNotes = cost.notes || '';
		showEditCost = true;
		selectedCost = null;
	}

	function statusDot(status: string) {
		switch (status) {
			case 'paid': return 'bg-green-500';
			case 'committed': return 'bg-blue-500';
			case 'quoted': return 'bg-amber-500';
			default: return 'bg-gray-400';
		}
	}

	function statusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function statusTextColor(status: string) {
		switch (status) {
			case 'paid': return 'text-green-700';
			case 'committed': return 'text-blue-700';
			case 'quoted': return 'text-amber-700';
			default: return 'text-gray-500';
		}
	}

	// Charts
	let budgetCanvas = $state<HTMLCanvasElement>(null!);
	let breakdownCanvas = $state<HTMLCanvasElement>(null!);
	let budgetChart: Chart | null = null;
	let breakdownChart: Chart | null = null;

	onMount(() => {
		const grouped = costsByCategory();
		const categoryNames = Object.keys(grouped);

		if (categoryNames.length > 0) {
			const catTotals = categoryNames.map((cat) =>
				grouped[cat].reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0)
			);

			breakdownChart = new Chart(breakdownCanvas, {
				type: 'doughnut',
				data: {
					labels: categoryNames,
					datasets: [{
						data: catTotals,
						backgroundColor: ['#C4704B', '#7B8BAF', '#D4956B', '#5B8BA5', '#C49A3C', '#8B6E99', '#4E937A'],
						borderWidth: 0,
						hoverOffset: 8,
					}],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '65%',
					plugins: {
						legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } },
						tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
					},
				},
			});

			// Budget vs Actual bar chart — use financial categories if available
			const categories = financial?.categories ?? [];
			if (categories.length > 0) {
				budgetChart = new Chart(budgetCanvas, {
					type: 'bar',
					data: {
						labels: categories.map((c: any) => c.name),
						datasets: [
							{ label: 'Budgeted', data: categories.map((c: any) => c.budgeted), backgroundColor: '#C4704B40', borderColor: '#C4704B', borderWidth: 1, borderRadius: 4 },
							{ label: 'Actual', data: categoryNames.map((cat) => grouped[cat]?.reduce((s: number, c: Cost) => s + (c.amount ?? 0), 0) ?? 0), backgroundColor: '#C4704B', borderWidth: 0, borderRadius: 4 },
						],
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(Number(value)), font: { size: 10 } }, grid: { color: '#f1f1f1' } },
							x: { ticks: { font: { size: 10 } }, grid: { display: false } },
						},
						plugins: {
							legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } },
							tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}` } },
						},
					},
				});
			}
		}

		return () => {
			budgetChart?.destroy();
			breakdownChart?.destroy();
		};
	});

	// Get unique category names for the add/edit form dropdowns
	const existingCategories = $derived(() => {
		const cats = new Set<string>();
		for (const cost of costs) {
			if (cost.category) cats.add(cost.category);
		}
		return Array.from(cats).sort();
	});
</script>

{#if listing}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<h2 class="font-serif text-lg font-semibold">Financials</h2>
			<Button size="sm" onclick={() => { newCostTitle = ''; newCostCategory = ''; newCostAmount = ''; newCostStatus = 'estimated'; newCostNotes = ''; showAddCost = true; }}>
				<Plus class="mr-1.5 size-4" />Track Cost
			</Button>
		</div>

		<!-- Summary Cards -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-blue-50 p-2"><Wallet class="size-4 text-blue-600" /></div>
						<div>
							<p class="text-xs text-muted-foreground">Total Budget</p>
							<p class="text-lg font-bold">{formatCurrency(totalBudget)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-blue-50 p-2"><DollarSign class="size-4 text-blue-600" /></div>
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
						<div class="rounded-lg bg-gray-50 p-2"><Clock class="size-4 text-gray-600" /></div>
						<div>
							<p class="text-xs text-muted-foreground">Estimated</p>
							<p class="text-lg font-bold">{formatCurrency(totalEstimated)}</p>
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
		</div>

		<!-- P&L Statement -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle class="font-serif text-base">Profit & Loss</CardTitle>
					<div class="flex items-center gap-4 text-xs">
						<label class="flex items-center gap-1.5 text-muted-foreground">
							Commission %
							<input
								type="number"
								step="0.1"
								min="0"
								max="100"
								bind:value={commissionRate}
								class="h-7 w-16 rounded-md border border-input bg-background px-2 text-right text-xs outline-none ring-ring focus:ring-2"
							/>
						</label>
						<label class="flex items-center gap-1.5 text-muted-foreground">
							Closing %
							<input
								type="number"
								step="0.1"
								min="0"
								max="100"
								bind:value={closingCostRate}
								class="h-7 w-16 rounded-md border border-input bg-background px-2 text-right text-xs outline-none ring-ring focus:ring-2"
							/>
						</label>
					</div>
				</div>
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
									{#each categoryCosts as cost, i}
										<button
											type="button"
											class="flex w-full items-center justify-between py-1.5 pr-0 text-xs hover:bg-muted/50 rounded transition-colors"
											onclick={() => selectedCost = selectedCost?.id === cost.id ? null : cost}
										>
											<span class="flex items-center gap-2">
												<span class="relative flex size-2">
													<span class="inline-flex size-2 rounded-full {statusDot(cost.status)}"></span>
												</span>
												<span class="text-muted-foreground">{cost.title}</span>
											</span>
											<span class="flex items-center gap-2">
												<span class="font-medium">{formatCurrency(cost.amount ?? 0)}</span>
												<span class="{statusTextColor(cost.status)} text-[10px]">{statusLabel(cost.status)}</span>
											</span>
										</button>

										{#if selectedCost?.id === cost.id}
											<div class="my-1 rounded-md bg-muted/50 p-3 text-xs space-y-2">
												{#if cost.task}
													<div class="flex items-center gap-1.5 text-muted-foreground">
														<LinkIcon class="size-3" />
														<span>Task: {cost.task.title}</span>
													</div>
												{/if}
												{#if cost.quote}
													<div class="flex items-center gap-1.5 text-muted-foreground">
														<Receipt class="size-3" />
														<span>Quote: {cost.quote.scope ?? 'Vendor quote'}</span>
													</div>
												{/if}
												{#if cost.action}
													<div class="flex items-center gap-1.5 text-muted-foreground">
														<CircleDot class="size-3" />
														<span>Action: {cost.action.title}</span>
													</div>
												{/if}
												{#if cost.vendor}
													<div class="flex items-center gap-1.5 text-muted-foreground">
														<span>Vendor: {cost.vendor.name}{cost.vendor.company ? ` - ${cost.vendor.company}` : ''}</span>
													</div>
												{/if}
												{#if cost.notes}
													<p class="text-muted-foreground italic">"{cost.notes}"</p>
												{/if}
												<div class="flex gap-2 pt-1">
													<Button size="sm" variant="outline" class="h-6 text-[10px] px-2" onclick={() => openEditCost(cost)}>
														<Pencil class="mr-1 size-3" />Edit
													</Button>
													{#if deletingCostId === cost.id}
														<form
															method="POST"
															action="?/deleteCost"
															use:enhance={() => {
																return async ({ result, update }) => {
																	if (result.type === 'success') {
																		toast.success('Cost deleted');
																		deletingCostId = null;
																		selectedCost = null;
																		await update();
																	} else {
																		toast.error('Failed to delete cost');
																	}
																};
															}}
															class="inline-flex gap-1"
														>
															<input type="hidden" name="costId" value={cost.id} />
															<Button type="submit" size="sm" variant="destructive" class="h-6 text-[10px] px-2">Confirm</Button>
															<Button type="button" size="sm" variant="ghost" class="h-6 text-[10px] px-2" onclick={() => deletingCostId = null}>Cancel</Button>
														</form>
													{:else}
														<Button size="sm" variant="ghost" class="h-6 text-[10px] px-2 text-red-600" onclick={() => deletingCostId = cost.id}>
															<Trash2 class="mr-1 size-3" />Delete
														</Button>
													{/if}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					{/each}

					{#if costs.length === 0}
						<div class="py-4 pl-4 text-xs text-muted-foreground italic">No costs tracked yet</div>
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

		<!-- Charts Row -->
		{#if costs.length > 0}
			<div class="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader><CardTitle class="font-serif text-base">Spending Breakdown</CardTitle></CardHeader>
					<CardContent><div class="h-64"><canvas bind:this={breakdownCanvas}></canvas></div></CardContent>
				</Card>
				<Card>
					<CardHeader><CardTitle class="font-serif text-base">Budget vs. Actual</CardTitle></CardHeader>
					<CardContent>
						{#if (financial?.categories ?? []).length > 0}
							<div class="h-64"><canvas bind:this={budgetCanvas}></canvas></div>
						{:else}
							<div class="flex h-64 items-center justify-center text-sm text-muted-foreground">
								Create budget categories to compare budget vs. actual
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- No costs empty state -->
		{#if costs.length === 0 && !financial}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<DollarSign class="size-10 text-muted-foreground/30 mb-3" />
					<p class="text-sm text-muted-foreground mb-4">No financial data available for this listing yet.</p>
					<div class="flex gap-2">
						<Button size="sm" onclick={() => { newBudgetTotal = ''; showCreateBudget = true; }}>
							<Plus class="mr-1.5 size-4" />Create Budget
						</Button>
						<Button size="sm" variant="outline" onclick={() => { newCostTitle = ''; newCostCategory = ''; newCostAmount = ''; newCostStatus = 'estimated'; newCostNotes = ''; showAddCost = true; }}>
							<Plus class="mr-1.5 size-4" />Track Cost
						</Button>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
{/if}

<!-- Track Cost Modal -->
<Dialog.Root bind:open={showAddCost}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Track Cost</Dialog.Title>
			<Dialog.Description>Add a cost entry for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/addCost"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Cost tracked');
						showAddCost = false;
						await update();
					} else {
						toast.error('Failed to add cost');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div>
					<label for="cost-title" class="text-sm font-medium">Title</label>
					<input
						id="cost-title"
						name="title"
						type="text"
						bind:value={newCostTitle}
						required
						placeholder="e.g. Landscaping cleanup"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="cost-category" class="text-sm font-medium">Category</label>
					<input
						id="cost-category"
						name="category"
						type="text"
						bind:value={newCostCategory}
						placeholder="e.g. Improvements"
						list="category-options"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
					<datalist id="category-options">
						{#each existingCategories() as cat}
							<option value={cat}></option>
						{/each}
					</datalist>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="cost-amount" class="text-sm font-medium">Amount</label>
						<input
							id="cost-amount"
							name="amount"
							type="number"
							step="0.01"
							min="0"
							bind:value={newCostAmount}
							required
							placeholder="0.00"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="cost-status" class="text-sm font-medium">Status</label>
						<select
							id="cost-status"
							name="status"
							bind:value={newCostStatus}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="estimated">Estimated</option>
							<option value="quoted">Quoted</option>
							<option value="committed">Committed</option>
							<option value="paid">Paid</option>
						</select>
					</div>
				</div>
				<div>
					<label for="cost-notes" class="text-sm font-medium">Notes</label>
					<textarea
						id="cost-notes"
						name="notes"
						bind:value={newCostNotes}
						rows="2"
						placeholder="Optional notes..."
						class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
					></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showAddCost = false}>Cancel</Button>
				<Button type="submit">Track Cost</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Cost Modal -->
<Dialog.Root bind:open={showEditCost}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Cost</Dialog.Title>
			<Dialog.Description>Update this cost entry.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/updateCost"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Cost updated');
						showEditCost = false;
						editCost = null;
						await update();
					} else {
						toast.error('Failed to update cost');
					}
				};
			}}
		>
			<input type="hidden" name="costId" value={editCost?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="edit-cost-title" class="text-sm font-medium">Title</label>
					<input
						id="edit-cost-title"
						name="title"
						type="text"
						bind:value={editCostTitle}
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="edit-cost-category" class="text-sm font-medium">Category</label>
					<input
						id="edit-cost-category"
						name="category"
						type="text"
						bind:value={editCostCategory}
						placeholder="e.g. Improvements"
						list="edit-category-options"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
					<datalist id="edit-category-options">
						{#each existingCategories() as cat}
							<option value={cat}></option>
						{/each}
					</datalist>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="edit-cost-amount" class="text-sm font-medium">Amount</label>
						<input
							id="edit-cost-amount"
							name="amount"
							type="number"
							step="0.01"
							min="0"
							bind:value={editCostAmount}
							required
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="edit-cost-status" class="text-sm font-medium">Status</label>
						<select
							id="edit-cost-status"
							name="status"
							bind:value={editCostStatus}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="estimated">Estimated</option>
							<option value="quoted">Quoted</option>
							<option value="committed">Committed</option>
							<option value="paid">Paid</option>
						</select>
					</div>
				</div>
				<div>
					<label for="edit-cost-notes" class="text-sm font-medium">Notes</label>
					<textarea
						id="edit-cost-notes"
						name="notes"
						bind:value={editCostNotes}
						rows="2"
						class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
					></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditCost = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Create Budget Modal -->
<Dialog.Root bind:open={showCreateBudget}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Create Budget</Dialog.Title>
			<Dialog.Description>Set the total budget for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createBudget"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Budget created');
						showCreateBudget = false;
						await update();
					} else {
						toast.error('Failed to create budget');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div>
					<label for="budget-total" class="text-sm font-medium">Total Budget</label>
					<input
						id="budget-total"
						name="totalBudget"
						type="number"
						step="0.01"
						min="0"
						bind:value={newBudgetTotal}
						required
						placeholder="e.g. 15000"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showCreateBudget = false}>Cancel</Button>
				<Button type="submit">Create Budget</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
