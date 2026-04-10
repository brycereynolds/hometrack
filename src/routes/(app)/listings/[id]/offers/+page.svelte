<script lang="ts">
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { listings, offers, formatCurrency } from '$lib/data/mock-data.js';
	import {
		DollarSign,
		ArrowRight,
		CheckCircle2,
		Clock,
		FileCheck,
		Send,
		Sparkles,
		Trophy,
		TrendingUp,
		Zap,
		AlertTriangle,
		Calendar,
		Building2,
		User,
		Banknote,
		ShieldCheck,
		Plus
	} from 'lucide-svelte';

	const listing = $derived(listings.find((l) => l.id === $page.params.id));
	const listingOffers = $derived(offers.filter((o) => o.listingId === listing?.id));

	// Determine AI analysis badges
	const highestPrice = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((max, o) => (o.price > max.price ? o : max), listingOffers[0])
			: null
	);
	const fastestClose = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((min, o) => (new Date(o.closeDate) < new Date(min.closeDate) ? o : min), listingOffers[0])
			: null
	);
	const strongestTerms = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((best, o) => (o.contingencies.length < best.contingencies.length ? o : best), listingOffers[0])
			: null
	);

	const pipelineStages = ['received', 'reviewed', 'countered', 'accepted'] as const;

	function getStageLabel(stage: string) {
		switch (stage) {
			case 'received': return 'Received';
			case 'reviewed': return 'Reviewed';
			case 'countered': return 'Countered';
			case 'accepted': return 'Accepted';
			case 'declined': return 'Declined';
			default: return stage;
		}
	}

	function getStageColor(stage: string) {
		switch (stage) {
			case 'received': return 'bg-blue-500';
			case 'reviewed': return 'bg-amber-500';
			case 'countered': return 'bg-violet-500';
			case 'accepted': return 'bg-green-500';
			case 'declined': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'received': return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'reviewed': return 'bg-amber-100 text-amber-700 border-amber-200';
			case 'countered': return 'bg-violet-100 text-violet-700 border-violet-200';
			case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
			case 'declined': return 'bg-red-100 text-red-700 border-red-200';
			default: return 'bg-gray-100 text-gray-600';
		}
	}

	function getAIBadges(offerId: string) {
		const badges: { label: string; icon: typeof Trophy; color: string }[] = [];
		if (highestPrice && highestPrice.id === offerId) {
			badges.push({ label: 'Highest Price', icon: Trophy, color: 'bg-amber-100 text-amber-700 border-amber-300' });
		}
		if (fastestClose && fastestClose.id === offerId) {
			badges.push({ label: 'Fastest Close', icon: Zap, color: 'bg-blue-100 text-blue-700 border-blue-300' });
		}
		if (strongestTerms && strongestTerms.id === offerId) {
			badges.push({ label: 'Strongest Terms', icon: ShieldCheck, color: 'bg-green-100 text-green-700 border-green-300' });
		}
		return badges;
	}

	function getStageIndex(status: string) {
		return pipelineStages.indexOf(status as any);
	}

	function formatDownPayment(offer: typeof listingOffers[0]) {
		const match = offer.financingType.match(/(\d+)%/);
		if (match) {
			const pct = parseInt(match[1]);
			return `${pct}% (${formatCurrency(offer.price * pct / 100)})`;
		}
		if (offer.financingType.toLowerCase().includes('cash')) return '100% (All Cash)';
		return offer.financingType;
	}
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-serif text-lg font-semibold">Offers</h2>
				<p class="text-sm text-muted-foreground">{listingOffers.length} offers received</p>
			</div>
			<Button size="sm">
				<Plus class="mr-1.5 size-4" />
				Log Offer
			</Button>
		</div>

		{#if listingOffers.length > 0}
			<!-- Offer Status Pipeline -->
			<Card>
				<CardHeader>
					<CardTitle class="font-serif text-base">Offer Pipeline</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex items-center gap-2 overflow-x-auto pb-2">
						{#each pipelineStages as stage, i}
							{@const stageOffers = listingOffers.filter((o) => o.status === stage)}
							<div class="flex-1 min-w-[120px]">
								<div class="flex items-center gap-2 mb-2">
									<div class="size-2.5 rounded-full {getStageColor(stage)}"></div>
									<span class="text-xs font-semibold whitespace-nowrap">{getStageLabel(stage)}</span>
									<Badge variant="secondary" class="text-[10px] h-4 px-1.5">{stageOffers.length}</Badge>
								</div>
								<div class="rounded-lg border bg-muted/30 p-2 min-h-[60px] space-y-1.5">
									{#each stageOffers as offer}
										<div class="rounded-md bg-background border p-2 text-xs">
											<p class="font-medium truncate">{offer.buyerName}</p>
											<p class="font-bold text-primary mt-0.5">{offer.priceFormatted}</p>
										</div>
									{/each}
									{#if stageOffers.length === 0}
										<p class="text-[10px] text-muted-foreground text-center py-3">No offers</p>
									{/if}
								</div>
							</div>
							{#if i < pipelineStages.length - 1}
								<ArrowRight class="size-4 text-muted-foreground shrink-0 mt-8" />
							{/if}
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Individual Offer Cards -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each listingOffers as offer}
					{@const aiBadges = getAIBadges(offer.id)}
					<Card class="relative overflow-hidden">
						{#if aiBadges.length > 0}
							<div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"></div>
						{/if}
						<CardContent class="p-4 pt-5">
							<div class="flex items-start justify-between">
								<div>
									<p class="font-medium text-sm">{offer.buyerName}</p>
									<p class="text-xs text-muted-foreground">{offer.buyerAgent}</p>
								</div>
								<Badge variant="outline" class="text-[10px] {getStatusBadge(offer.status)}">
									{getStageLabel(offer.status)}
								</Badge>
							</div>

							{#if aiBadges.length > 0}
								<div class="mt-2 flex flex-wrap gap-1.5">
									{#each aiBadges as badge}
										{@const Icon = badge.icon}
										<Badge variant="outline" class="text-[10px] {badge.color}">
											<Sparkles class="mr-0.5 size-2.5" />
											{badge.label}
										</Badge>
									{/each}
								</div>
							{/if}

							<Separator class="my-3" />

							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Offer Price</span>
									<span class="font-bold text-lg">{offer.priceFormatted}</span>
								</div>
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Financing</span>
									<span class="font-medium">{offer.financingType}</span>
								</div>
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Earnest Deposit</span>
									<span class="font-medium">{formatCurrency(offer.earnestDeposit)}</span>
								</div>
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Close Date</span>
									<span class="font-medium">{offer.closeDate}</span>
								</div>
								<div class="text-xs">
									<span class="text-muted-foreground">Contingencies</span>
									<div class="mt-1 flex flex-wrap gap-1">
										{#each offer.contingencies as c}
											<Badge variant="secondary" class="text-[10px] font-normal">{c}</Badge>
										{/each}
									</div>
								</div>
							</div>

							{#if offer.notes}
								<div class="mt-3 rounded-md bg-muted/50 p-2">
									<p class="text-[11px] text-muted-foreground italic">{offer.notes}</p>
								</div>
							{/if}

							<div class="mt-3 flex gap-2 text-xs text-muted-foreground">
								<span>Submitted: {offer.submittedDate}</span>
								<span>|</span>
								<span>Expires: {offer.expirationDate}</span>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Side-by-Side Comparison Matrix -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<Sparkles class="size-4 text-amber-500" />
						<CardTitle class="font-serif text-base">Offer Comparison Matrix</CardTitle>
					</div>
					<CardDescription>Side-by-side analysis of all offers</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto -mx-6 px-6">
						<table class="w-full min-w-[600px]">
							<thead>
								<tr class="border-b-2">
									<th class="pb-3 pr-4 text-left text-sm font-semibold text-muted-foreground w-36">Criteria</th>
									{#each listingOffers as offer}
										{@const aiBadges = getAIBadges(offer.id)}
										<th class="pb-3 px-3 text-left text-sm">
											<div>
												<span class="font-semibold">{offer.buyerName}</span>
												{#if aiBadges.length > 0}
													<div class="mt-1 flex flex-wrap gap-1">
														{#each aiBadges as badge}
															<Badge variant="outline" class="text-[9px] px-1.5 py-0 h-4 {badge.color}">
																<Sparkles class="mr-0.5 size-2" />
																{badge.label}
															</Badge>
														{/each}
													</div>
												{/if}
											</div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								<!-- Price -->
								<tr class="border-b">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<DollarSign class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Price</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<span class="text-sm font-bold {offer.id === highestPrice?.id ? 'text-green-700' : ''}">
												{offer.priceFormatted}
											</span>
											{#if listing}
												{@const diff = offer.price - listing.price}
												<p class="text-[10px] mt-0.5 {diff >= 0 ? 'text-green-600' : 'text-red-600'}">
													{diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{((diff / listing.price) * 100).toFixed(1)}%)
												</p>
											{/if}
										</td>
									{/each}
								</tr>
								<!-- Financing -->
								<tr class="border-b bg-muted/20">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<Banknote class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Financing</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<span class="text-sm">{offer.financingType}</span>
										</td>
									{/each}
								</tr>
								<!-- Down Payment -->
								<tr class="border-b">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<TrendingUp class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Down Payment</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<span class="text-sm">{formatDownPayment(offer)}</span>
										</td>
									{/each}
								</tr>
								<!-- Contingencies -->
								<tr class="border-b bg-muted/20">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<AlertTriangle class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Contingencies</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<div class="space-y-1">
												{#each offer.contingencies as c}
													<Badge variant="secondary" class="text-[10px] font-normal block w-fit">{c}</Badge>
												{/each}
												{#if offer.contingencies.length === 0}
													<Badge variant="outline" class="text-[10px] text-green-700 bg-green-50 border-green-200">None</Badge>
												{/if}
											</div>
											<p class="text-[10px] text-muted-foreground mt-1 {offer.id === strongestTerms?.id ? 'font-medium text-green-600' : ''}">
												{offer.contingencies.length} contingenc{offer.contingencies.length === 1 ? 'y' : 'ies'}
											</p>
										</td>
									{/each}
								</tr>
								<!-- Close Date -->
								<tr class="border-b">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<Calendar class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Close Date</span>
										</div>
									</td>
									{#each listingOffers as offer}
										{@const daysToClose = Math.round((new Date(offer.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
										<td class="py-3 px-3">
											<span class="text-sm {offer.id === fastestClose?.id ? 'font-medium text-blue-700' : ''}">{offer.closeDate}</span>
											<p class="text-[10px] text-muted-foreground mt-0.5">{daysToClose} days</p>
										</td>
									{/each}
								</tr>
								<!-- Earnest Deposit -->
								<tr class="border-b bg-muted/20">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<ShieldCheck class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Earnest Deposit</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<span class="text-sm font-medium">{formatCurrency(offer.earnestDeposit)}</span>
											<p class="text-[10px] text-muted-foreground mt-0.5">
												{((offer.earnestDeposit / offer.price) * 100).toFixed(1)}% of price
											</p>
										</td>
									{/each}
								</tr>
								<!-- Special Terms -->
								<tr>
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<FileCheck class="size-3.5 text-muted-foreground" />
											<span class="text-sm font-medium">Notes</span>
										</div>
									</td>
									{#each listingOffers as offer}
										<td class="py-3 px-3">
											<p class="text-xs text-muted-foreground italic">{offer.notes}</p>
										</td>
									{/each}
								</tr>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<DollarSign class="size-10 text-muted-foreground/30 mb-3" />
					<p class="text-sm text-muted-foreground">No offers received yet.</p>
					<p class="text-xs text-muted-foreground mt-1">Offers will appear here as they come in.</p>
				</CardContent>
			</Card>
		{/if}
	</div>
{/if}
