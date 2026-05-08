<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { DollarSign, Loader2 } from 'lucide-svelte';
	import type { ActionWithSourceMoment } from '$lib/types.js';

	interface Props {
		open: boolean;
		actionItem: (ActionWithSourceMoment & { actionMoments?: any[] }) | null;
		listingId: string | null;
		noteId: string;
	}

	let {
		open = $bindable(false),
		actionItem,
		listingId,
		noteId,
	}: Props = $props();

	const COST_CATEGORIES = [
		'improvements', 'staging', 'disclosures', 'media', 'general',
	] as const;

	let category = $state('general');
	let amount = $state('');
	let notes = $state('');
	let submitting = $state(false);

	// Reset form when modal opens with new item
	$effect(() => {
		if (open && actionItem) {
			category = guessCostCategory(actionItem.category ?? '');
			amount = '';
			notes = '';
		}
	});

	function guessCostCategory(actionCategory: string): string {
		const map: Record<string, string> = {
			demolition: 'improvements',
			flooring: 'improvements',
			fixtures: 'improvements',
			paint: 'improvements',
			cleaning: 'staging',
			moving: 'staging',
			staging: 'staging',
			media: 'media',
			disclosures: 'disclosures',
		};
		return map[actionCategory] ?? 'general';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif flex items-center gap-2">
				<DollarSign class="size-5" />
				Track as Cost
			</Dialog.Title>
		</Dialog.Header>

		{#if !listingId}
			<div class="py-6 text-center">
				<p class="text-sm text-muted-foreground">
					Attach this note to a listing to track costs.
				</p>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => open = false}>Close</Button>
			</Dialog.Footer>
		{:else if actionItem}
			<div class="space-y-4">
				<!-- Action item context -->
				<div class="rounded-lg border bg-muted/30 p-3 space-y-1">
					<p class="text-sm font-medium">{actionItem.title}</p>
					{#if actionItem.description}
						<p class="text-xs text-muted-foreground">{actionItem.description}</p>
					{/if}
					{#if actionItem.sourceQuote}
						<blockquote class="border-l-2 border-muted pl-2 text-xs italic text-muted-foreground">
							"{actionItem.sourceQuote}"
						</blockquote>
					{/if}
				</div>

				<!-- Form -->
				<form
					method="POST"
					action="?/trackCost"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success('Cost tracked');
								open = false;
								await invalidateAll();
							} else if (result.type === 'failure') {
								toast.error(String(result.data?.error ?? 'Failed to track cost'));
							}
							submitting = false;
							await update({ reset: false });
						};
					}}
				>
					<input type="hidden" name="actionId" value={actionItem.id} />
					<input type="hidden" name="listingId" value={listingId} />
					<input type="hidden" name="noteId" value={noteId} />

					<div class="space-y-3">
						<div>
							<label for="cost-category" class="text-xs font-medium text-muted-foreground">Category</label>
							<select
								id="cost-category"
								name="category"
								class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
								bind:value={category}
							>
								{#each COST_CATEGORIES as cat}
									<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="cost-amount" class="text-xs font-medium text-muted-foreground">Estimated Amount ($)</label>
							<input
								id="cost-amount"
								name="amount"
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
								bind:value={amount}
							/>
						</div>

						<div>
							<label for="cost-notes" class="text-xs font-medium text-muted-foreground">Notes (optional)</label>
							<textarea
								id="cost-notes"
								name="notes"
								rows="2"
								placeholder="Additional details..."
								class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm resize-none"
								bind:value={notes}
							></textarea>
						</div>
					</div>

					<Dialog.Footer class="mt-4">
						<Button variant="outline" type="button" onclick={() => open = false}>Cancel</Button>
						<Button type="submit" class="bg-[#c2754f] hover:bg-[#a8613d] text-white" disabled={submitting}>
							{#if submitting}
								<Loader2 class="mr-1 size-3 animate-spin" />
							{:else}
								<DollarSign class="mr-1 size-3" />
							{/if}
							Track Cost
						</Button>
					</Dialog.Footer>
				</form>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
