<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		CheckCircle,
		XCircle,
		ChevronDown,
		ChevronUp,
		Info,
		FileText,
		Download,
		ClipboardCheck
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let expandedItem = $state<string | null>(null);
	let declineReason = $state<Record<string, string>>({});
	let showDeclineForm = $state<string | null>(null);

	function toggleExpand(id: string) {
		expandedItem = expandedItem === id ? null : id;
	}

	const pendingQuotes = $derived(data.pendingQuotes ?? []);
	const reviewedQuotes = $derived(data.reviewedQuotes ?? []);
	const pendingCount = $derived(pendingQuotes.length);

	function reviewBadge(status: string | null) {
		switch (status) {
			case 'client_approved':
				return { label: 'Approved', class: 'border-emerald-200 text-emerald-600' };
			case 'client_declined':
				return { label: 'Declined', class: 'border-red-200 text-red-600' };
			default:
				return { label: 'Pending Review', class: 'border-amber-200 text-amber-600' };
		}
	}
</script>

<div class="space-y-8">
	<div>
		<div class="flex items-center gap-3">
			<h1 class="font-serif text-2xl font-bold tracking-tight">Quotes for Review</h1>
			{#if pendingCount > 0}
				<Badge class="bg-primary/10 text-primary">{pendingCount} pending</Badge>
			{/if}
		</div>
		<p class="text-muted-foreground">Review quotes shared by your agent.</p>
	</div>

	<!-- Pending Quotes -->
	{#if pendingCount > 0}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Needs Your Decision
			</h2>

			{#each pendingQuotes as quote}
				<Card class="border-l-4 border-l-amber-400 transition-shadow hover:shadow-md">
					<CardContent class="p-0">
						<div class="flex items-start gap-4 p-4">
							<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
								<ClipboardCheck class="size-5 text-amber-600" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-2">
									<div>
										<p class="font-medium">
											{quote.scope ?? 'Quote'} from {quote.vendor?.name ?? 'Vendor'}
										</p>
										<p class="text-sm text-muted-foreground">
											{quote.vendor?.company ?? ''}
										</p>
									</div>
									{#if quote.amount}
										<Badge variant="outline" class="shrink-0 text-base font-semibold">{formatCurrency(quote.amount)}</Badge>
									{/if}
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									{quote.receivedDate ? `Received ${new Date(quote.receivedDate).toLocaleDateString()}` : 'Pending'}
									{#if quote.validUntil}
										 &middot; Valid until {new Date(quote.validUntil).toLocaleDateString()}
									{/if}
								</p>

								<button
									class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
									onclick={() => toggleExpand(quote.id)}
								>
									<Info class="size-3" />
									{expandedItem === quote.id ? 'Hide details' : 'View details'}
									{#if expandedItem === quote.id}
										<ChevronUp class="size-3" />
									{:else}
										<ChevronDown class="size-3" />
									{/if}
								</button>

								{#if expandedItem === quote.id}
									<div class="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-2">
										{#if quote.notes}
											<p>{quote.notes}</p>
										{/if}

										<!-- Line Items -->
										{#if quote.lineItems?.length > 0}
											<div class="space-y-1">
												<p class="text-xs font-medium text-foreground">Line Items</p>
												{#each quote.lineItems as item}
													<div class="flex justify-between text-xs">
														<span>{item.description}</span>
														{#if item.amount}
															<span class="font-medium">{formatCurrency(item.amount)}</span>
														{/if}
													</div>
												{/each}
											</div>
										{/if}

										<!-- Document download -->
										{#if quote.documentPath}
											<a
												href="/api/files/download?path={encodeURIComponent(quote.documentPath)}"
												target="_blank"
												rel="noopener"
												class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
											>
												<Download class="size-3" />
												{quote.documentName ?? 'Download Quote Document'}
											</a>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<Separator />

						<div class="flex items-center justify-end gap-2 p-3">
							{#if showDeclineForm === quote.id}
								<form
									method="POST"
									action="?/declineQuote"
									use:enhance
									class="flex w-full items-center gap-2"
								>
									<input type="hidden" name="id" value={quote.id} />
									<input
										type="text"
										name="reason"
										placeholder="Reason (optional)"
										bind:value={declineReason[quote.id]}
										class="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none ring-ring focus:ring-2"
									/>
									<Button type="submit" variant="outline" size="sm" class="gap-1.5 shrink-0">
										<XCircle class="size-3.5" />
										Confirm
									</Button>
									<Button type="button" variant="ghost" size="sm" onclick={() => showDeclineForm = null}>
										Cancel
									</Button>
								</form>
							{:else}
								<Button variant="outline" size="sm" class="gap-1.5" onclick={() => showDeclineForm = quote.id}>
									<XCircle class="size-3.5" />
									Decline
								</Button>
								<form method="POST" action="?/approveQuote" use:enhance>
									<input type="hidden" name="id" value={quote.id} />
									<Button type="submit" size="sm" class="gap-1.5">
										<CheckCircle class="size-3.5" />
										Approve
									</Button>
								</form>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="py-8 text-center text-muted-foreground">
				<CheckCircle class="mx-auto mb-2 size-8 text-emerald-500" />
				<p class="font-medium">All caught up</p>
				<p class="text-sm">No quotes need your review right now.</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Review History -->
	{#if reviewedQuotes.length > 0}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Review History
			</h2>
			{#each reviewedQuotes as quote}
				{@const badge = reviewBadge(quote.clientReviewStatus)}
				<Card class="transition-colors hover:bg-muted/30">
					<CardContent class="flex items-center gap-4 p-4">
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-lg {quote.clientReviewStatus === 'client_approved'
								? 'bg-emerald-500/10'
								: 'bg-red-500/10'}"
						>
							{#if quote.clientReviewStatus === 'client_approved'}
								<CheckCircle class="size-5 text-emerald-500" />
							{:else}
								<XCircle class="size-5 text-red-500" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">{quote.scope ?? 'Quote'} - {quote.vendor?.name ?? 'Vendor'}</p>
							<p class="text-xs text-muted-foreground">
								{quote.amount ? formatCurrency(quote.amount) : ''}
								{#if quote.vendor?.company}
									&middot; {quote.vendor.company}
								{/if}
							</p>
						</div>
						<Badge variant="outline" class="text-xs {badge.class}">
							{badge.label}
						</Badge>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
