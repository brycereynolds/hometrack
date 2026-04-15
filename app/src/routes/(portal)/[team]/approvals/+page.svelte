<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		CheckCircle,
		XCircle,
		ChevronDown,
		ChevronUp,
		DollarSign,
		Handshake,
		Info,
		Leaf
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let expandedItem = $state<string | null>(null);

	function toggleExpand(id: string) {
		expandedItem = expandedItem === id ? null : id;
	}

	const pendingOffers = $derived(data.pendingOffers ?? []);
	const pendingQuotes = $derived(data.pendingQuotes ?? []);
	const decidedOffers = $derived(data.decidedOffers ?? []);
	const decidedQuotes = $derived(data.decidedQuotes ?? []);

	const pendingCount = $derived(pendingOffers.length + pendingQuotes.length);
</script>

<div class="space-y-8">
	<div>
		<div class="flex items-center gap-3">
			<h1 class="font-serif text-2xl font-bold tracking-tight">Approvals</h1>
			<Badge class="bg-primary/10 text-primary">{pendingCount} pending</Badge>
		</div>
		<p class="text-muted-foreground">Review and approve items for your listing.</p>
	</div>

	<!-- Pending Approvals -->
	{#if pendingCount > 0}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Needs Your Decision
			</h2>

			<!-- Pending Offers -->
			{#each pendingOffers as offer}
				<Card class="border-l-4 border-l-amber-400 transition-shadow hover:shadow-md">
					<CardContent class="p-0">
						<div class="flex items-start gap-4 p-4">
							<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
								<Handshake class="size-5 text-amber-600" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-2">
									<div>
										<p class="font-medium">Offer from {offer.buyerName ?? 'Unknown buyer'}</p>
										<p class="text-sm text-muted-foreground">
											{offer.buyerAgent ? `Agent: ${offer.buyerAgent}` : 'Direct offer'}
											{#if offer.financingType}
												&middot; {offer.financingType}
											{/if}
										</p>
									</div>
									{#if offer.price}
										<Badge variant="outline" class="shrink-0 text-base font-semibold">{formatCurrency(offer.price)}</Badge>
									{/if}
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									{offer.submittedDate ? `Submitted ${new Date(offer.submittedDate).toLocaleDateString()}` : 'Recently received'}
								</p>

								<button
									class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
									onclick={() => toggleExpand(offer.id)}
								>
									<Info class="size-3" />
									{expandedItem === offer.id ? 'Hide details' : 'View details'}
									{#if expandedItem === offer.id}
										<ChevronUp class="size-3" />
									{:else}
										<ChevronDown class="size-3" />
									{/if}
								</button>

								{#if expandedItem === offer.id}
									<div class="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
										{#if offer.earnestDeposit}
											<p>Earnest deposit: {formatCurrency(offer.earnestDeposit)}</p>
										{/if}
										{#if offer.closeDate}
											<p>Proposed close: {new Date(offer.closeDate).toLocaleDateString()}</p>
										{/if}
										{#if offer.expirationDate}
											<p>Expires: {new Date(offer.expirationDate).toLocaleDateString()}</p>
										{/if}
										{#if offer.notes}
											<p>{offer.notes}</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<Separator />

						<div class="flex items-center justify-end gap-2 p-3">
							<form method="POST" action="?/declineOffer" use:enhance>
								<input type="hidden" name="id" value={offer.id} />
								<Button type="submit" variant="outline" size="sm" class="gap-1.5">
									<XCircle class="size-3.5" />
									Decline
								</Button>
							</form>
							<form method="POST" action="?/approveOffer" use:enhance>
								<input type="hidden" name="id" value={offer.id} />
								<Button type="submit" size="sm" class="gap-1.5">
									<CheckCircle class="size-3.5" />
									Approve
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			{/each}

			<!-- Pending Quotes -->
			{#each pendingQuotes as quote}
				<Card class="border-l-4 border-l-amber-400 transition-shadow hover:shadow-md">
					<CardContent class="p-0">
						<div class="flex items-start gap-4 p-4">
							<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
								<Leaf class="size-5 text-amber-600" />
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
									<div class="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
										{#if quote.validUntil}
											<p>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</p>
										{/if}
										{#if quote.notes}
											<p>{quote.notes}</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<Separator />

						<div class="flex items-center justify-end gap-2 p-3">
							<form method="POST" action="?/declineQuote" use:enhance>
								<input type="hidden" name="id" value={quote.id} />
								<Button type="submit" variant="outline" size="sm" class="gap-1.5">
									<XCircle class="size-3.5" />
									Decline
								</Button>
							</form>
							<form method="POST" action="?/approveQuote" use:enhance>
								<input type="hidden" name="id" value={quote.id} />
								<Button type="submit" size="sm" class="gap-1.5">
									<CheckCircle class="size-3.5" />
									Approve
								</Button>
							</form>
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
				<p class="text-sm">No items need your decision right now.</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Decision History -->
	{#if decidedOffers.length + decidedQuotes.length > 0}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Decision History
			</h2>
			{#each decidedOffers as offer}
				<Card class="transition-colors hover:bg-muted/30">
					<CardContent class="flex items-center gap-4 p-4">
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-lg {offer.status === 'accepted'
								? 'bg-emerald-500/10'
								: 'bg-red-500/10'}"
						>
							{#if offer.status === 'accepted'}
								<CheckCircle class="size-5 text-emerald-500" />
							{:else}
								<XCircle class="size-5 text-red-500" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">Offer from {offer.buyerName ?? 'Unknown buyer'}</p>
							<p class="text-xs text-muted-foreground">
								{offer.price ? formatCurrency(offer.price) : ''}
								{#if offer.financingType}
									&middot; {offer.financingType}
								{/if}
							</p>
						</div>
						<div class="text-right">
							<Badge
								variant="outline"
								class="text-xs {offer.status === 'accepted'
									? 'border-emerald-200 text-emerald-600'
									: 'border-red-200 text-red-600'}"
							>
								{offer.status === 'accepted' ? 'Accepted' : offer.status === 'countered' ? 'Countered' : 'Declined'}
							</Badge>
						</div>
					</CardContent>
				</Card>
			{/each}

			{#each decidedQuotes as quote}
				<Card class="transition-colors hover:bg-muted/30">
					<CardContent class="flex items-center gap-4 p-4">
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-lg {quote.status === 'approved'
								? 'bg-emerald-500/10'
								: 'bg-red-500/10'}"
						>
							{#if quote.status === 'approved'}
								<CheckCircle class="size-5 text-emerald-500" />
							{:else}
								<XCircle class="size-5 text-red-500" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium">{quote.scope ?? 'Quote'} — {quote.vendor?.name ?? 'Vendor'}</p>
							<p class="text-xs text-muted-foreground">
								{quote.amount ? formatCurrency(quote.amount) : ''}
							</p>
						</div>
						<div class="text-right">
							<Badge
								variant="outline"
								class="text-xs {quote.status === 'approved'
									? 'border-emerald-200 text-emerald-600'
									: 'border-red-200 text-red-600'}"
							>
								{quote.status === 'approved' ? 'Approved' : 'Declined'}
							</Badge>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
