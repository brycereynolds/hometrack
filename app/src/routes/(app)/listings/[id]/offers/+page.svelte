<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatCurrency } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
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
		Plus,
		Pencil,
		Trash2,
		ArrowLeftRight,
		ChevronDown
	} from 'lucide-svelte';

	let { data } = $props();

	// Log Offer modal state
	let showOfferModal = $state(false);
	let offerBuyerName = $state('');
	let offerBuyerAgent = $state('');
	let offerPrice = $state('');
	let offerEarnest = $state('');
	let offerFinancing = $state('');
	let offerContingencies = $state('');
	let offerCloseDate = $state('');
	let offerNotes = $state('');

	// Edit modal state
	let showEditModal = $state(false);
	let editingOffer = $state<any | null>(null);
	let editBuyerName = $state('');
	let editBuyerAgent = $state('');
	let editPrice = $state('');
	let editEarnest = $state('');
	let editFinancing = $state('');
	let editContingencies = $state('');
	let editCloseDate = $state('');
	let editNotes = $state('');

	// Counter modal state
	let showCounterModal = $state(false);
	let counteringOffer = $state<any | null>(null);
	let counterPrice = $state('');
	let counterEarnest = $state('');
	let counterFinancing = $state('');
	let counterContingencies = $state('');
	let counterCloseDate = $state('');
	let counterNotes = $state('');

	// Delete confirmation
	let showDeleteModal = $state(false);
	let deletingOffer = $state<any | null>(null);

	function resetOfferForm() {
		offerBuyerName = '';
		offerBuyerAgent = '';
		offerPrice = '';
		offerEarnest = '';
		offerFinancing = '';
		offerContingencies = '';
		offerCloseDate = '';
		offerNotes = '';
	}

	function openEditModal(offer: any) {
		editingOffer = offer;
		editBuyerName = offer.buyerName ?? '';
		editBuyerAgent = offer.buyerAgent ?? '';
		editPrice = String(offer.price ?? '');
		editEarnest = String(offer.earnestDeposit ?? '');
		editFinancing = offer.financingType ?? '';
		editContingencies = ((offer.contingencies ?? []) as string[]).join(', ');
		editCloseDate = offer.closeDate ? formatDateForInput(offer.closeDate) : '';
		editNotes = offer.notes ?? '';
		showEditModal = true;
	}

	function openCounterModal(offer: any) {
		counteringOffer = offer;
		counterPrice = String(offer.price ?? '');
		counterEarnest = String(offer.earnestDeposit ?? '');
		counterFinancing = offer.financingType ?? '';
		counterContingencies = ((offer.contingencies ?? []) as string[]).join(', ');
		counterCloseDate = offer.closeDate ? formatDateForInput(offer.closeDate) : '';
		counterNotes = '';
		showCounterModal = true;
	}

	function openDeleteModal(offer: any) {
		deletingOffer = offer;
		showDeleteModal = true;
	}

	const listing = $derived(data.listing);
	const listingOffers = $derived(data.offers ?? []);

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatDateForInput(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toISOString().split('T')[0];
	}

	const highestPrice = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((max: any, o: any) => ((o.price ?? 0) > (max.price ?? 0) ? o : max), listingOffers[0])
			: null
	);
	const fastestClose = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((min: any, o: any) => (o.closeDate && min.closeDate && new Date(o.closeDate) < new Date(min.closeDate) ? o : min), listingOffers[0])
			: null
	);
	const strongestTerms = $derived(
		listingOffers.length > 0
			? listingOffers.reduce((best: any, o: any) => ((o.contingencies as string[] ?? []).length < (best.contingencies as string[] ?? []).length ? o : best), listingOffers[0])
			: null
	);

	const pipelineStages = ['received', 'reviewed', 'countered', 'accepted'] as const;
	const allStatuses = ['received', 'reviewed', 'countered', 'accepted', 'declined'] as const;

	function getStageLabel(stage: string) {
		switch (stage) {
			case 'received': return 'Received'; case 'reviewed': return 'Reviewed'; case 'countered': return 'Countered'; case 'accepted': return 'Accepted'; case 'declined': return 'Declined'; default: return stage;
		}
	}

	function getStageColor(stage: string) {
		switch (stage) {
			case 'received': return 'bg-blue-500'; case 'reviewed': return 'bg-amber-500'; case 'countered': return 'bg-violet-500'; case 'accepted': return 'bg-green-500'; case 'declined': return 'bg-red-500'; default: return 'bg-gray-500';
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'received': return 'bg-blue-100 text-blue-700 border-blue-200'; case 'reviewed': return 'bg-amber-100 text-amber-700 border-amber-200'; case 'countered': return 'bg-violet-100 text-violet-700 border-violet-200'; case 'accepted': return 'bg-green-100 text-green-700 border-green-200'; case 'declined': return 'bg-red-100 text-red-700 border-red-200'; default: return 'bg-gray-100 text-gray-600';
		}
	}

	function getAIBadges(offerId: string) {
		const badges: { label: string; icon: typeof Trophy; color: string }[] = [];
		if (highestPrice && highestPrice.id === offerId) badges.push({ label: 'Highest Price', icon: Trophy, color: 'bg-amber-100 text-amber-700 border-amber-300' });
		if (fastestClose && fastestClose.id === offerId) badges.push({ label: 'Fastest Close', icon: Zap, color: 'bg-blue-100 text-blue-700 border-blue-300' });
		if (strongestTerms && strongestTerms.id === offerId) badges.push({ label: 'Strongest Terms', icon: ShieldCheck, color: 'bg-green-100 text-green-700 border-green-300' });
		return badges;
	}

	function formatDownPayment(offer: any) {
		const match = (offer.financingType ?? '').match(/(\d+)%/);
		if (match) { const pct = parseInt(match[1]); return `${pct}% (${formatCurrency((offer.price ?? 0) * pct / 100)})`; }
		if ((offer.financingType ?? '').toLowerCase().includes('cash')) return '100% (All Cash)';
		return offer.financingType ?? 'N/A';
	}

	// Status dropdown state per offer
	let openStatusDropdown = $state<string | null>(null);

	function toggleStatusDropdown(offerId: string) {
		openStatusDropdown = openStatusDropdown === offerId ? null : offerId;
	}
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-serif text-lg font-semibold">Offers</h2>
				<p class="text-sm text-muted-foreground">{listingOffers.length} offers received</p>
			</div>
			<Button size="sm" onclick={() => { resetOfferForm(); showOfferModal = true; }}><Plus class="mr-1.5 size-4" />Log Offer</Button>
		</div>

		{#if listingOffers.length > 0}
			<!-- Offer Status Pipeline -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Offer Pipeline</CardTitle></CardHeader>
				<CardContent>
					<div class="flex items-center gap-2 overflow-x-auto pb-2">
						{#each pipelineStages as stage, i}
							{@const stageOffers = listingOffers.filter((o: any) => o.status === stage)}
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
											<p class="font-bold text-primary mt-0.5">{formatCurrency(offer.price ?? 0)}</p>
										</div>
									{/each}
									{#if stageOffers.length === 0}<p class="text-[10px] text-muted-foreground text-center py-3">No offers</p>{/if}
								</div>
							</div>
							{#if i < pipelineStages.length - 1}<ArrowRight class="size-4 text-muted-foreground shrink-0 mt-8" />{/if}
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Individual Offer Cards -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each listingOffers as offer}
					{@const aiBadges = getAIBadges(offer.id)}
					{@const contingencies = (offer.contingencies ?? []) as string[]}
					<Card class="relative overflow-hidden">
						{#if aiBadges.length > 0}<div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"></div>{/if}
						<CardContent class="p-4 pt-5">
							<div class="flex items-start justify-between">
								<div><p class="font-medium text-sm">{offer.buyerName}</p><p class="text-xs text-muted-foreground">{offer.buyerAgent}</p></div>
								<!-- Status dropdown -->
								<div class="relative">
									<button
										onclick={() => toggleStatusDropdown(offer.id)}
										class="flex items-center gap-1"
									>
										<Badge variant="outline" class="text-[10px] cursor-pointer hover:opacity-80 {getStatusBadge(offer.status)}">
											{getStageLabel(offer.status)}
											<ChevronDown class="ml-0.5 size-2.5" />
										</Badge>
									</button>
									{#if openStatusDropdown === offer.id}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="absolute right-0 top-full z-20 mt-1 w-36 rounded-md border bg-background shadow-lg py-1"
											onmouseleave={() => openStatusDropdown = null}
										>
											{#each allStatuses as status}
												<form
													method="POST"
													action="?/updateStatus"
													use:enhance={() => {
														openStatusDropdown = null;
														return async ({ result, update }) => {
															if (result.type === 'success') {
																toast.success(`Status changed to ${getStageLabel(status)}`);
																await update();
															} else {
																toast.error('Failed to update status');
															}
														};
													}}
												>
													<input type="hidden" name="offerId" value={offer.id} />
													<input type="hidden" name="newStatus" value={status} />
													<button
														type="submit"
														class="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors {offer.status === status ? 'font-semibold bg-muted/50' : ''}"
													>
														<div class="size-2 rounded-full {getStageColor(status)}"></div>
														{getStageLabel(status)}
													</button>
												</form>
											{/each}
										</div>
									{/if}
								</div>
							</div>
							{#if aiBadges.length > 0}
								<div class="mt-2 flex flex-wrap gap-1.5">
									{#each aiBadges as badge}{@const Icon = badge.icon}<Badge variant="outline" class="text-[10px] {badge.color}"><Sparkles class="mr-0.5 size-2.5" />{badge.label}</Badge>{/each}
								</div>
							{/if}
							<Separator class="my-3" />
							<div class="space-y-2">
								<div class="flex justify-between text-sm"><span class="text-muted-foreground">Offer Price</span><span class="font-bold text-lg">{formatCurrency(offer.price ?? 0)}</span></div>
								<div class="flex justify-between text-xs"><span class="text-muted-foreground">Financing</span><span class="font-medium">{offer.financingType ?? 'N/A'}</span></div>
								<div class="flex justify-between text-xs"><span class="text-muted-foreground">Earnest Deposit</span><span class="font-medium">{formatCurrency(offer.earnestDeposit ?? 0)}</span></div>
								<div class="flex justify-between text-xs"><span class="text-muted-foreground">Close Date</span><span class="font-medium">{formatDate(offer.closeDate)}</span></div>
								<div class="text-xs">
									<span class="text-muted-foreground">Contingencies</span>
									<div class="mt-1 flex flex-wrap gap-1">{#each contingencies as c}<Badge variant="secondary" class="text-[10px] font-normal">{c}</Badge>{/each}</div>
								</div>
							</div>
							{#if offer.notes}<div class="mt-3 rounded-md bg-muted/50 p-2"><p class="text-[11px] text-muted-foreground italic">{offer.notes}</p></div>{/if}
							<div class="mt-3 flex gap-2 text-xs text-muted-foreground">
								<span>Submitted: {formatDate(offer.submittedDate)}</span>
								<span>|</span>
								<span>Expires: {formatDate(offer.expirationDate)}</span>
							</div>
							<!-- Action buttons -->
							<Separator class="my-3" />
							<div class="flex items-center gap-2">
								<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => openEditModal(offer)}>
									<Pencil class="mr-1 size-3" />Edit
								</Button>
								<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => openCounterModal(offer)}>
									<ArrowLeftRight class="mr-1 size-3" />Counter
								</Button>
								<Button variant="outline" size="sm" class="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onclick={() => openDeleteModal(offer)}>
									<Trash2 class="mr-1 size-3" />Delete
								</Button>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Comparison Matrix -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2"><Sparkles class="size-4 text-amber-500" /><CardTitle class="font-serif text-base">Offer Comparison Matrix</CardTitle></div>
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
											<div><span class="font-semibold">{offer.buyerName}</span>
												{#if aiBadges.length > 0}<div class="mt-1 flex flex-wrap gap-1">{#each aiBadges as badge}<Badge variant="outline" class="text-[9px] px-1.5 py-0 h-4 {badge.color}"><Sparkles class="mr-0.5 size-2" />{badge.label}</Badge>{/each}</div>{/if}
											</div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								<tr class="border-b"><td class="py-3 pr-4"><div class="flex items-center gap-2"><DollarSign class="size-3.5 text-muted-foreground" /><span class="text-sm font-medium">Price</span></div></td>
									{#each listingOffers as offer}<td class="py-3 px-3"><span class="text-sm font-bold {offer.id === highestPrice?.id ? 'text-green-700' : ''}">{formatCurrency(offer.price ?? 0)}</span>{#if listing}{@const diff = (offer.price ?? 0) - (listing.price ?? 0)}<p class="text-[10px] mt-0.5 {diff >= 0 ? 'text-green-600' : 'text-red-600'}">{diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{(listing.price ?? 0) > 0 ? ((diff / (listing.price ?? 1)) * 100).toFixed(1) : 0}%)</p>{/if}</td>{/each}
								</tr>
								<tr class="border-b bg-muted/20"><td class="py-3 pr-4"><div class="flex items-center gap-2"><Banknote class="size-3.5 text-muted-foreground" /><span class="text-sm font-medium">Financing</span></div></td>{#each listingOffers as offer}<td class="py-3 px-3"><span class="text-sm">{offer.financingType ?? 'N/A'}</span></td>{/each}</tr>
								<tr class="border-b"><td class="py-3 pr-4"><div class="flex items-center gap-2"><Calendar class="size-3.5 text-muted-foreground" /><span class="text-sm font-medium">Close Date</span></div></td>
									{#each listingOffers as offer}<td class="py-3 px-3"><span class="text-sm {offer.id === fastestClose?.id ? 'font-medium text-blue-700' : ''}">{formatDate(offer.closeDate)}</span></td>{/each}
								</tr>
								<tr class="border-b bg-muted/20"><td class="py-3 pr-4"><div class="flex items-center gap-2"><ShieldCheck class="size-3.5 text-muted-foreground" /><span class="text-sm font-medium">Earnest Deposit</span></div></td>
									{#each listingOffers as offer}<td class="py-3 px-3"><span class="text-sm font-medium">{formatCurrency(offer.earnestDeposit ?? 0)}</span><p class="text-[10px] text-muted-foreground mt-0.5">{(offer.price ?? 0) > 0 ? (((offer.earnestDeposit ?? 0) / (offer.price ?? 1)) * 100).toFixed(1) : 0}% of price</p></td>{/each}
								</tr>
								<tr><td class="py-3 pr-4"><div class="flex items-center gap-2"><FileCheck class="size-3.5 text-muted-foreground" /><span class="text-sm font-medium">Notes</span></div></td>
									{#each listingOffers as offer}<td class="py-3 px-3"><p class="text-xs text-muted-foreground italic">{offer.notes}</p></td>{/each}
								</tr>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card><CardContent class="flex flex-col items-center justify-center py-12"><DollarSign class="size-10 text-muted-foreground/30 mb-3" /><p class="text-sm text-muted-foreground">No offers received yet.</p><p class="text-xs text-muted-foreground mt-1">Offers will appear here as they come in.</p></CardContent></Card>
		{/if}
	</div>
{/if}

<!-- Log Offer Modal -->
<Dialog.Root bind:open={showOfferModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Log Offer</Dialog.Title>
			<Dialog.Description>Record a new offer for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/logOffer"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Offer logged');
						showOfferModal = false;
						await update();
					} else {
						toast.error('Failed to log offer');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="offer-buyer" class="text-sm font-medium">Buyer Name</label>
						<input id="offer-buyer" name="buyerName" type="text" bind:value={offerBuyerName} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="offer-agent" class="text-sm font-medium">Buyer's Agent</label>
						<input id="offer-agent" name="buyerAgent" type="text" bind:value={offerBuyerAgent} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="offer-price" class="text-sm font-medium">Offer Price</label>
						<input id="offer-price" name="price" type="number" step="1000" bind:value={offerPrice} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="offer-earnest" class="text-sm font-medium">Earnest Deposit</label>
						<input id="offer-earnest" name="earnestDeposit" type="number" step="100" bind:value={offerEarnest} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="offer-financing" class="text-sm font-medium">Financing Type</label>
						<select id="offer-financing" name="financingType" bind:value={offerFinancing} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2">
							<option value="">Select...</option>
							<option value="Cash">Cash</option>
							<option value="Conventional 20%">Conventional 20%</option>
							<option value="Conventional 10%">Conventional 10%</option>
							<option value="FHA">FHA</option>
							<option value="VA">VA</option>
							<option value="Other">Other</option>
						</select>
					</div>
					<div>
						<label for="offer-close" class="text-sm font-medium">Close Date</label>
						<input id="offer-close" name="closeDate" type="date" bind:value={offerCloseDate} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div>
					<label for="offer-contingencies" class="text-sm font-medium">Contingencies</label>
					<input id="offer-contingencies" name="contingencies" type="text" bind:value={offerContingencies} placeholder="Inspection, Appraisal, Financing" class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					<p class="mt-1 text-xs text-muted-foreground">Comma-separated</p>
				</div>
				<div>
					<label for="offer-notes" class="text-sm font-medium">Notes</label>
					<textarea id="offer-notes" name="notes" bind:value={offerNotes} rows="2" class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showOfferModal = false}>Cancel</Button>
				<Button type="submit">Log Offer</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Offer Modal -->
<Dialog.Root bind:open={showEditModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Offer</Dialog.Title>
			<Dialog.Description>Update the details for this offer.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editOffer"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Offer updated');
						showEditModal = false;
						await update();
					} else {
						toast.error('Failed to update offer');
					}
				};
			}}
		>
			<input type="hidden" name="offerId" value={editingOffer?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-buyer" class="text-sm font-medium">Buyer Name</label>
						<input id="edit-buyer" name="buyerName" type="text" bind:value={editBuyerName} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="edit-agent" class="text-sm font-medium">Buyer's Agent</label>
						<input id="edit-agent" name="buyerAgent" type="text" bind:value={editBuyerAgent} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-price" class="text-sm font-medium">Offer Price</label>
						<input id="edit-price" name="price" type="number" step="1000" bind:value={editPrice} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="edit-earnest" class="text-sm font-medium">Earnest Deposit</label>
						<input id="edit-earnest" name="earnestDeposit" type="number" step="100" bind:value={editEarnest} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-financing" class="text-sm font-medium">Financing Type</label>
						<select id="edit-financing" name="financingType" bind:value={editFinancing} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2">
							<option value="">Select...</option>
							<option value="Cash">Cash</option>
							<option value="Conventional 20%">Conventional 20%</option>
							<option value="Conventional 10%">Conventional 10%</option>
							<option value="FHA">FHA</option>
							<option value="VA">VA</option>
							<option value="Other">Other</option>
						</select>
					</div>
					<div>
						<label for="edit-close" class="text-sm font-medium">Close Date</label>
						<input id="edit-close" name="closeDate" type="date" bind:value={editCloseDate} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div>
					<label for="edit-contingencies" class="text-sm font-medium">Contingencies</label>
					<input id="edit-contingencies" name="contingencies" type="text" bind:value={editContingencies} placeholder="Inspection, Appraisal, Financing" class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					<p class="mt-1 text-xs text-muted-foreground">Comma-separated</p>
				</div>
				<div>
					<label for="edit-notes" class="text-sm font-medium">Notes</label>
					<textarea id="edit-notes" name="notes" bind:value={editNotes} rows="2" class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Counter Offer Modal -->
<Dialog.Root bind:open={showCounterModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Counter Offer</Dialog.Title>
			<Dialog.Description>
				{#if counteringOffer}
					Submit a counter to {counteringOffer.buyerName}'s offer of {formatCurrency(counteringOffer.price ?? 0)}.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/counterOffer"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Counter offer created');
						showCounterModal = false;
						await update();
					} else {
						toast.error('Failed to create counter offer');
					}
				};
			}}
		>
			<input type="hidden" name="originalOfferId" value={counteringOffer?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="counter-price" class="text-sm font-medium">Counter Price</label>
						<input id="counter-price" name="price" type="number" step="1000" bind:value={counterPrice} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="counter-earnest" class="text-sm font-medium">Earnest Deposit</label>
						<input id="counter-earnest" name="earnestDeposit" type="number" step="100" bind:value={counterEarnest} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="counter-financing" class="text-sm font-medium">Financing Type</label>
						<select id="counter-financing" name="financingType" bind:value={counterFinancing} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2">
							<option value="">Select...</option>
							<option value="Cash">Cash</option>
							<option value="Conventional 20%">Conventional 20%</option>
							<option value="Conventional 10%">Conventional 10%</option>
							<option value="FHA">FHA</option>
							<option value="VA">VA</option>
							<option value="Other">Other</option>
						</select>
					</div>
					<div>
						<label for="counter-close" class="text-sm font-medium">Close Date</label>
						<input id="counter-close" name="closeDate" type="date" bind:value={counterCloseDate} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div>
					<label for="counter-contingencies" class="text-sm font-medium">Contingencies</label>
					<input id="counter-contingencies" name="contingencies" type="text" bind:value={counterContingencies} placeholder="Inspection, Appraisal, Financing" class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					<p class="mt-1 text-xs text-muted-foreground">Comma-separated</p>
				</div>
				<div>
					<label for="counter-notes" class="text-sm font-medium">Notes</label>
					<textarea id="counter-notes" name="notes" bind:value={counterNotes} rows="2" class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showCounterModal = false}>Cancel</Button>
				<Button type="submit">Submit Counter</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Offer Confirmation -->
<Dialog.Root bind:open={showDeleteModal}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Delete Offer</Dialog.Title>
			<Dialog.Description>
				{#if deletingOffer}
					Are you sure you want to delete the offer from {deletingOffer.buyerName} for {formatCurrency(deletingOffer.price ?? 0)}? This action cannot be undone.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/deleteOffer"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Offer deleted');
						showDeleteModal = false;
						await update();
					} else {
						toast.error('Failed to delete offer');
					}
				};
			}}
		>
			<input type="hidden" name="offerId" value={deletingOffer?.id ?? ''} />
			<Dialog.Footer class="mt-4">
				<Button variant="outline" type="button" onclick={() => showDeleteModal = false}>Cancel</Button>
				<Button variant="destructive" type="submit">Delete</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
