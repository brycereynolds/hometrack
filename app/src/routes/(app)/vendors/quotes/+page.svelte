<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		ArrowLeft,
		DollarSign,
		FileText,
		Check,
		X,
		ChevronDown,
		ChevronUp,
		Home,
		Clock,
		User,
		Scale,
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const quotes = $derived(data.quotes);

	type StatusFilter = 'all' | 'requested' | 'received' | 'approved' | 'declined';

	let activeStatus = $state<StatusFilter>('all');
	let expandedQuotes = $state<Set<string>>(new Set());
	let compareMode = $state(false);

	const statusTabs = $derived([
		{ label: 'All', value: 'all' as StatusFilter, count: quotes.length },
		{ label: 'Requested', value: 'requested' as StatusFilter, count: quotes.filter((q) => q.status === 'requested').length },
		{ label: 'Received', value: 'received' as StatusFilter, count: quotes.filter((q) => q.status === 'received').length },
		{ label: 'Approved', value: 'approved' as StatusFilter, count: quotes.filter((q) => q.status === 'approved').length },
		{ label: 'Declined', value: 'declined' as StatusFilter, count: quotes.filter((q) => q.status === 'declined').length },
	]);

	const statusColors: Record<string, string> = {
		requested: 'bg-blue-100 text-blue-700',
		received: 'bg-amber-100 text-amber-700',
		approved: 'bg-emerald-100 text-emerald-700',
		declined: 'bg-red-100 text-red-700',
	};

	const statusDotColors: Record<string, string> = {
		requested: 'bg-blue-500',
		received: 'bg-amber-500',
		approved: 'bg-emerald-500',
		declined: 'bg-red-500',
	};

	const filtered = $derived(() => {
		if (activeStatus === 'all') return quotes;
		return quotes.filter((q) => q.status === activeStatus);
	});

	function toggleExpand(id: string) {
		const next = new Set(expandedQuotes);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedQuotes = next;
	}

	// For comparison view: group quotes by listing + scope
	const comparableGroups = $derived(() => {
		const groups = new Map<string, typeof quotes>();
		for (const q of quotes) {
			const key = q.listingId;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(q);
		}
		// Only return groups with 2+ quotes
		return [...groups.entries()].filter(([, qs]) => qs.length >= 2);
	});

	const totalValue = $derived(quotes.reduce((s, q) => s + (q.amount ?? 0), 0));
	const pendingCount = $derived(quotes.filter((q) => q.status === 'received').length);
	const approvedTotal = $derived(quotes.filter((q) => q.status === 'approved').reduce((s, q) => s + (q.amount ?? 0), 0));
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/vendors">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="font-serif text-3xl font-bold">Quote Management</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{quotes.length} quotes | {pendingCount} awaiting review
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant={compareMode ? 'default' : 'outline'}
				size="sm"
				onclick={() => (compareMode = !compareMode)}
			>
				<Scale class="mr-1.5 size-4" />
				{compareMode ? 'Exit Compare' : 'Compare Quotes'}
			</Button>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Total Quoted</p>
			<p class="mt-1 font-serif text-2xl font-bold">${totalValue.toLocaleString()}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Approved</p>
			<p class="mt-1 font-serif text-2xl font-bold text-emerald-600">${approvedTotal.toLocaleString()}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Pending Review</p>
			<p class="mt-1 font-serif text-2xl font-bold text-amber-600">{pendingCount}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Awaiting Response</p>
			<p class="mt-1 font-serif text-2xl font-bold text-blue-600">
				{quotes.filter((q: typeof quotes[number]) => q.status === 'requested').length}
			</p>
		</div>
	</div>

	<!-- Status Filter Tabs -->
	{#if !compareMode}
		<div class="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1">
			{#each statusTabs as tab}
				<button
					onclick={() => (activeStatus = tab.value)}
					class="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeStatus ===
					tab.value
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
					<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] {activeStatus === tab.value ? 'bg-primary/10 text-primary' : ''}">
						{tab.count}
					</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Quote List View -->
	{#if !compareMode}
		<div class="space-y-3">
			{#each filtered() as quote (quote.id)}
				<Card class="overflow-hidden">
					<CardContent class="p-0">
						<!-- Quote Header -->
						<button
							onclick={() => toggleExpand(quote.id)}
							class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex size-2 shrink-0 rounded-full {statusDotColors[quote.status]}"></div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{quote.vendor?.name ?? 'Unknown'}</span>
									<span class="text-xs text-muted-foreground">({quote.vendor?.company ?? ''})</span>
								</div>
								<div class="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
									<Home class="size-3" />
									<a href="/listings/{quote.listingId}" class="hover:text-primary hover:underline">{quote.listing?.property?.address ?? 'Unknown listing'}</a>
									<span class="text-border">|</span>
									<span>{quote.scope}</span>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-lg font-semibold">{formatCurrency(quote.amount ?? 0)}</span>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {statusColors[quote.status]}">
									{quote.status}
								</span>
								{#if expandedQuotes.has(quote.id)}
									<ChevronUp class="size-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="size-4 text-muted-foreground" />
								{/if}
							</div>
						</button>

						<!-- Expanded Content -->
						{#if expandedQuotes.has(quote.id)}
							<div class="border-t border-border bg-muted/20 px-4 py-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<!-- Line Items -->
									<div>
										<p class="mb-2 text-xs font-semibold text-muted-foreground">Line Items</p>
										{#if quote.lineItems.length > 0}
											<div class="space-y-1.5">
												{#each quote.lineItems as item}
													<div class="flex items-center justify-between rounded bg-background px-3 py-2 text-sm">
														<span>{item.description}</span>
														<span class="font-medium">${(item.amount ?? 0).toLocaleString()}</span>
													</div>
												{/each}
												<Separator />
												<div class="flex items-center justify-between px-3 py-1 text-sm font-semibold">
													<span>Total</span>
													<span>{formatCurrency(quote.amount ?? 0)}</span>
												</div>
											</div>
										{:else}
											<p class="text-sm text-muted-foreground">Quote details pending from vendor</p>
										{/if}
									</div>

									<!-- Details -->
									<div class="space-y-3 text-sm">
										<div>
											<p class="text-xs font-semibold text-muted-foreground">Dates</p>
											<div class="mt-1 space-y-1">
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground">Requested</span>
													<span>{quote.requestedDate?.toLocaleDateString() ?? ''}</span>
												</div>
												{#if quote.receivedDate}
													<div class="flex items-center justify-between">
														<span class="text-muted-foreground">Received</span>
														<span>{quote.receivedDate.toLocaleDateString()}</span>
													</div>
												{/if}
												{#if quote.validUntil}
													<div class="flex items-center justify-between">
														<span class="text-muted-foreground">Valid Until</span>
														<span class="font-medium">{quote.validUntil.toLocaleDateString()}</span>
													</div>
												{/if}
											</div>
										</div>
										{#if quote.notes}
											<div>
												<p class="text-xs font-semibold text-muted-foreground">Notes</p>
												<p class="mt-1 text-muted-foreground">{quote.notes}</p>
											</div>
										{/if}

										<!-- Actions -->
										{#if quote.status === 'received'}
											<div class="flex items-center gap-2 pt-2">
												<form method="POST" action="?/approve" use:enhance={() => {
													return async ({ result, update }) => {
														if (result.type === 'success') {
															toast.success('Quote approved');
															await update();
														} else if (result.type === 'failure') {
															toast.error(String(result.data?.error ?? 'Failed to approve'));
														}
													};
												}}>
													<input type="hidden" name="quoteId" value={quote.id} />
													<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
													<Button size="sm" class="h-8" type="submit">
														<Check class="mr-1.5 size-3.5" />
														Approve
													</Button>
												</form>
												<form method="POST" action="?/decline" use:enhance={() => {
													return async ({ result, update }) => {
														if (result.type === 'success') {
															toast.success('Quote declined');
															await update();
														} else if (result.type === 'failure') {
															toast.error(String(result.data?.error ?? 'Failed to decline'));
														}
													};
												}}>
													<input type="hidden" name="quoteId" value={quote.id} />
													<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
													<Button variant="outline" size="sm" class="h-8" type="submit">
														<X class="mr-1.5 size-3.5" />
														Decline
													</Button>
												</form>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			{:else}
				<div class="py-12 text-center">
					<FileText class="mx-auto size-10 text-muted-foreground/40" />
					<p class="mt-3 font-medium text-muted-foreground">No quotes in this category</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Compare View -->
	{#if compareMode}
		{#if comparableGroups().length > 0}
			{#each comparableGroups() as [listingId, groupQuotes]}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-lg">
							<Scale class="size-5" />
							Quote Comparison
						</CardTitle>
						<CardDescription class="flex items-center gap-1.5">
							<Home class="size-3.5" />
							<a href="/listings/{listingId}" class="hover:text-primary hover:underline">{(groupQuotes[0].listing?.property as { address?: string } | undefined)?.address ?? 'Unknown listing'}</a> -- {groupQuotes.length} quotes
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-border text-left">
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Vendor</th>
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Scope</th>
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Amount</th>
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Status</th>
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Timeline</th>
										<th class="pb-3 text-xs font-semibold text-muted-foreground">Action</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each groupQuotes as quote}
										{@const isLowest = (quote.amount ?? 0) === Math.min(...groupQuotes.map((q) => q.amount ?? 0))}
										<tr class="{isLowest ? 'bg-emerald-50/50' : ''}">
											<td class="py-3 pr-4">
												<div>
													<a href="/vendors/{quote.vendorId}" class="text-sm font-medium hover:text-primary">
														{quote.vendor?.name ?? 'Unknown'}
													</a>
													<p class="text-xs text-muted-foreground">{quote.vendor?.company ?? ''}</p>
												</div>
											</td>
											<td class="py-3 pr-4">
												<span class="text-sm">{quote.scope}</span>
											</td>
											<td class="py-3 pr-4">
												<div class="flex items-center gap-1.5">
													<span class="text-sm font-semibold">{formatCurrency(quote.amount ?? 0)}</span>
													{#if isLowest}
														<span class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
															LOWEST
														</span>
													{/if}
												</div>
												{#if quote.lineItems.length > 0}
													<p class="text-xs text-muted-foreground">{quote.lineItems.length} line items</p>
												{/if}
											</td>
											<td class="py-3 pr-4">
												<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {statusColors[quote.status]}">
													{quote.status}
												</span>
											</td>
											<td class="py-3 pr-4 text-xs text-muted-foreground">
												{#if quote.receivedDate}
													<p>Recv: {quote.receivedDate.toLocaleDateString()}</p>
												{:else}
													<p>Req: {quote.requestedDate?.toLocaleDateString() ?? ''}</p>
												{/if}
												{#if quote.validUntil}
													<p>Exp: {quote.validUntil.toLocaleDateString()}</p>
												{/if}
											</td>
											<td class="py-3">
												{#if quote.status === 'received'}
													<div class="flex items-center gap-1">
														<form method="POST" action="?/approve" use:enhance={() => {
															return async ({ result, update }) => {
																if (result.type === 'success') {
																	toast.success('Quote approved');
																	await update();
																} else if (result.type === 'failure') {
																	toast.error(String(result.data?.error ?? 'Failed to approve'));
																}
															};
														}}>
															<input type="hidden" name="quoteId" value={quote.id} />
															<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
															<Button variant="default" size="sm" class="h-7 text-xs" type="submit">
																<Check class="mr-1 size-3" />
																Approve
															</Button>
														</form>
														<form method="POST" action="?/decline" use:enhance={() => {
															return async ({ result, update }) => {
																if (result.type === 'success') {
																	toast.success('Quote declined');
																	await update();
																} else if (result.type === 'failure') {
																	toast.error(String(result.data?.error ?? 'Failed to decline'));
																}
															};
														}}>
															<input type="hidden" name="quoteId" value={quote.id} />
															<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
															<Button variant="ghost" size="sm" class="h-7 text-xs" type="submit">
																<X class="size-3" />
															</Button>
														</form>
													</div>
												{:else if quote.status === 'approved'}
													<span class="text-xs text-emerald-600 font-medium">Approved</span>
												{:else if quote.status === 'requested'}
													<span class="text-xs text-muted-foreground">Waiting...</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Line Item Comparison -->
						{@const itemizedQuotes = groupQuotes.filter((q) => q.lineItems.length > 0)}
						{#if itemizedQuotes.length >= 2}
							<Separator class="my-4" />
							<p class="mb-3 text-xs font-semibold text-muted-foreground">Line Item Breakdown</p>
							<div class="grid gap-4 sm:grid-cols-{itemizedQuotes.length}">
								{#each itemizedQuotes as quote}
									<div class="rounded-lg border border-border p-3">
										<p class="mb-2 text-sm font-medium">{quote.vendor?.name ?? 'Unknown'}</p>
										<div class="space-y-1.5">
											{#each quote.lineItems as item}
												<div class="flex items-center justify-between text-xs">
													<span class="text-muted-foreground">{item.description}</span>
													<span class="font-medium">${(item.amount ?? 0).toLocaleString()}</span>
												</div>
											{/each}
											<Separator />
											<div class="flex items-center justify-between text-sm font-semibold">
												<span>Total</span>
												<span>{formatCurrency(quote.amount ?? 0)}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/each}
		{:else}
			<div class="py-12 text-center">
				<Scale class="mx-auto size-10 text-muted-foreground/40" />
				<p class="mt-3 font-medium text-muted-foreground">No comparable quotes found</p>
				<p class="text-sm text-muted-foreground/60">
					Comparison requires 2+ quotes for the same listing
				</p>
			</div>
		{/if}
	{/if}
</div>
