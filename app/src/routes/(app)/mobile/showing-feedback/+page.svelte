<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ChevronDown, Star, Send, ThumbsUp, ThumbsDown, Minus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	let { data } = $props();

	const listings = $derived(data.listings);
	const showings = $derived(data.showings);

	let selectedListing = $state('');
	let selectedShowing = $state('');
	$effect(() => { if (!selectedListing && listings[0]) selectedListing = listings[0].id; });
	$effect(() => { if (!selectedShowing && showings[0]) selectedShowing = showings[0].id; });
	let interestLevel = $state<string>('');
	let rating = $state(0);
	let hoverRating = $state(0);
	let priceFeedback = $state<string>('');
	let selectedPros = $state<string[]>([]);
	let selectedCons = $state<string[]>([]);
	let comments = $state('');
	let submitting = $state(false);

	const listingShowings = $derived(showings.filter((s) => s.listingId === selectedListing));

	const pros = ['Location', 'Layout', 'Kitchen', 'Yard', 'Schools', 'Natural Light', 'Storage', 'Parking', 'Quiet Street', 'Updates'];
	const cons = ['Price', 'Size', 'Condition', 'Noise', 'Parking', 'Layout', 'Yard Size', 'Schools', 'Dated', 'HOA'];

	function togglePro(item: string) {
		selectedPros = selectedPros.includes(item)
			? selectedPros.filter((p) => p !== item)
			: [...selectedPros, item];
	}

	function toggleCon(item: string) {
		selectedCons = selectedCons.includes(item)
			? selectedCons.filter((c) => c !== item)
			: [...selectedCons, item];
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="font-serif text-xl font-bold">Showing Feedback</h1>
		<p class="text-sm text-muted-foreground">Quick feedback after a showing</p>
	</div>

	<form
		method="POST"
		action="?/submit"
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				submitting = false;
				if (result.type === 'success') {
					interestLevel = '';
					rating = 0;
					priceFeedback = '';
					selectedPros = [];
					selectedCons = [];
					comments = '';
					toast.success('Feedback submitted');
					await update();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.error ?? 'Failed to submit feedback'));
				}
			};
		}}
	>
		<input type="hidden" name="showingId" value={selectedShowing} />
		<input type="hidden" name="interestLevel" value={interestLevel} />
		<input type="hidden" name="rating" value={rating} />
		<input type="hidden" name="priceFeedback" value={priceFeedback} />
		<input type="hidden" name="pros" value={selectedPros.join(', ')} />
		<input type="hidden" name="cons" value={selectedCons.join(', ')} />

		<!-- Listing & showing selector -->
		<div class="mb-6 space-y-3">
			<div class="relative">
				<select
					bind:value={selectedListing}
					class="h-11 w-full appearance-none rounded-xl border bg-muted/50 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each listings.filter((l) => (l.showingsCount ?? 0) > 0) as listing}
						<option value={listing.id}>{listing.address} — {listing.city}</option>
					{/each}
				</select>
				<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			</div>

			{#if listingShowings.length > 0}
				<div class="relative">
					<select
						bind:value={selectedShowing}
						class="h-11 w-full appearance-none rounded-xl border bg-muted/50 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{#each listingShowings as showing}
							<option value={showing.id}>{showing.date.toLocaleDateString()} {showing.time ?? ''} — {showing.agentName} ({showing.agentCompany})</option>
						{/each}
					</select>
					<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				</div>
			{/if}
		</div>

		<!-- Interest Level — large tap targets -->
		<div class="mb-6">
			<p class="mb-3 text-sm font-semibold">Buyer interest level</p>
			<div class="grid grid-cols-3 gap-2">
				{#each [
					{ id: 'very', label: 'Very Interested', icon: ThumbsUp, color: 'bg-emerald-500/10 border-emerald-300 text-emerald-700' },
					{ id: 'somewhat', label: 'Somewhat', icon: Minus, color: 'bg-amber-500/10 border-amber-300 text-amber-700' },
					{ id: 'not', label: 'Not Interested', icon: ThumbsDown, color: 'bg-red-500/10 border-red-300 text-red-700' }
				] as level}
					<button
						type="button"
						class="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-95
							{interestLevel === level.id ? level.color : 'border-border bg-transparent text-muted-foreground hover:bg-muted'}"
						onclick={() => { interestLevel = level.id; }}
					>
						<level.icon class="size-6" />
						<span class="text-xs">{level.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Star Rating -->
		<div class="mb-6">
			<p class="mb-3 text-sm font-semibold">Overall rating</p>
			<div class="flex justify-center gap-2">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						type="button"
						class="transition-transform active:scale-90"
						onmouseenter={() => { hoverRating = star; }}
						onmouseleave={() => { hoverRating = 0; }}
						onclick={() => { rating = star; }}
					>
						<Star
							class="size-10 {(hoverRating || rating) >= star
								? 'fill-amber-400 text-amber-400'
								: 'text-muted-foreground/30'}"
						/>
					</button>
				{/each}
			</div>
		</div>

		<!-- Price Feedback -->
		<div class="mb-6">
			<p class="mb-3 text-sm font-semibold">Price perception</p>
			<div class="grid grid-cols-3 gap-2">
				{#each [
					{ id: 'high', label: 'Too High' },
					{ id: 'right', label: 'Just Right' },
					{ id: 'value', label: 'Good Value' }
				] as price}
					<button
						type="button"
						class="flex h-12 items-center justify-center rounded-xl border-2 text-sm font-medium transition-all active:scale-95
							{priceFeedback === price.id
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:bg-muted'}"
						onclick={() => { priceFeedback = price.id; }}
					>
						{price.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Pros -->
		<div class="mb-6">
			<p class="mb-3 text-sm font-semibold">Property pros</p>
			<div class="flex flex-wrap gap-2">
				{#each pros as item}
					<button
						type="button"
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95
							{selectedPros.includes(item)
								? 'border-emerald-300 bg-emerald-500/10 text-emerald-700'
								: 'border-border text-muted-foreground hover:bg-muted'}"
						onclick={() => togglePro(item)}
					>
						{#if selectedPros.includes(item)}+ {/if}{item}
					</button>
				{/each}
			</div>
		</div>

		<!-- Cons -->
		<div class="mb-6">
			<p class="mb-3 text-sm font-semibold">Property cons</p>
			<div class="flex flex-wrap gap-2">
				{#each cons as item}
					<button
						type="button"
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95
							{selectedCons.includes(item)
								? 'border-red-300 bg-red-500/10 text-red-700'
								: 'border-border text-muted-foreground hover:bg-muted'}"
						onclick={() => toggleCon(item)}
					>
						{#if selectedCons.includes(item)}- {/if}{item}
					</button>
				{/each}
			</div>
		</div>

		<!-- Open text feedback -->
		<div class="mb-6">
			<label for="comments" class="mb-2 block text-sm font-semibold">Additional comments</label>
			<textarea
				id="comments"
				name="comments"
				bind:value={comments}
				placeholder="Any other feedback from the showing..."
				rows="3"
				class="w-full resize-none rounded-xl border bg-transparent p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
		</div>

		<!-- Submit -->
		<Button type="submit" class="h-12 w-full gap-2 rounded-xl text-base" disabled={!selectedShowing || submitting}>
			<Send class="size-5" />
			{submitting ? 'Submitting...' : 'Submit Feedback'}
		</Button>
	</form>
</div>
