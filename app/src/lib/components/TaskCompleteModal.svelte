<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { CheckCircle2, DollarSign, Receipt, FileQuestion, Loader2 } from 'lucide-svelte';
	import type { TeamMember } from '$lib/types.js';

	interface Vendor {
		id: string;
		name: string;
		company?: string | null;
		category?: string | null;
	}

	interface Task {
		id: string;
		title: string;
		description?: string | null;
		status: string;
		priority: string;
		phase?: string | null;
		taskCategory?: string | null;
		[key: string]: any;
	}

	interface Props {
		open: boolean;
		task: Task;
		teamMembers: TeamMember[];
		vendors: Vendor[];
		listingId: string;
	}

	let {
		open = $bindable(false),
		task,
		teamMembers: _teamMembers,
		vendors,
		listingId,
	}: Props = $props();

	const COST_CATEGORIES = [
		'onboarding', 'improvements', 'disclosures', 'staging', 'media',
		'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general'
	] as const;

	// Checkbox states
	let markDone = $state(true);
	let trackCost = $state(false);
	let attachReceipt = $state(false);
	let requestQuote = $state(false);

	// Cost fields
	let costAmount = $state('');
	let costCategory = $state('general');
	let costNotes = $state('');

	// Quote fields
	let selectedVendorId = $state('');

	// Receipt
	let receiptFile = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	let submitting = $state(false);

	// Reset when modal opens
	$effect(() => {
		if (open) {
			markDone = true;
			trackCost = false;
			attachReceipt = false;
			requestQuote = false;
			costAmount = '';
			costCategory = task.taskCategory ?? 'general';
			costNotes = '';
			selectedVendorId = '';
			receiptFile = null;
			submitting = false;
		}
	});

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		receiptFile = input.files?.[0] ?? null;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif flex items-center gap-2">
				<CheckCircle2 class="size-5 text-green-500" />
				Complete Task
			</Dialog.Title>
			<Dialog.Description>
				{task.title}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/completeTask"
			enctype="multipart/form-data"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success') {
						toast.success('Task completed');
						open = false;
						await update();
					} else if (result.type === 'failure') {
						toast.error(String((result.data as any)?.error ?? 'Failed to complete task'));
					}
				};
			}}
		>
			<input type="hidden" name="taskId" value={task.id} />
			<input type="hidden" name="listingId" value={listingId} />

			<div class="space-y-4 py-4">
				<!-- Checkboxes -->
				<div class="space-y-3">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="markDone"
							bind:checked={markDone}
							class="size-4 rounded border-gray-300"
						/>
						<span class="text-sm font-medium">Mark as Done</span>
					</label>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="trackCost"
							bind:checked={trackCost}
							class="size-4 rounded border-gray-300"
						/>
						<div class="flex items-center gap-1.5">
							<DollarSign class="size-3.5 text-muted-foreground" />
							<span class="text-sm font-medium">Track Cost</span>
						</div>
					</label>

					<!-- Cost fields -->
					{#if trackCost}
						<div class="ml-7 space-y-3 rounded-lg border border-dashed p-3">
							<div>
								<label for="cost-amount" class="text-xs font-medium text-muted-foreground">Amount</label>
								<div class="relative mt-1">
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
									<input
										id="cost-amount"
										name="costAmount"
										type="number"
										step="0.01"
										min="0"
										bind:value={costAmount}
										placeholder="0.00"
										class="h-9 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm outline-none ring-ring focus:ring-2"
									/>
								</div>
							</div>
							<div>
								<label for="cost-category" class="text-xs font-medium text-muted-foreground">Category</label>
								<select
									id="cost-category"
									name="costCategory"
									bind:value={costCategory}
									class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
								>
									{#each COST_CATEGORIES as cat}
										<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="cost-notes" class="text-xs font-medium text-muted-foreground">Notes</label>
								<textarea
									id="cost-notes"
									name="costNotes"
									bind:value={costNotes}
									rows={2}
									placeholder="Optional notes..."
									class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2 resize-none"
								></textarea>
							</div>
						</div>
					{/if}

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="attachReceipt"
							bind:checked={attachReceipt}
							class="size-4 rounded border-gray-300"
						/>
						<div class="flex items-center gap-1.5">
							<Receipt class="size-3.5 text-muted-foreground" />
							<span class="text-sm font-medium">Attach Receipt</span>
						</div>
					</label>

					<!-- Receipt upload -->
					{#if attachReceipt}
						<div class="ml-7 rounded-lg border border-dashed p-3">
							<input
								bind:this={fileInput}
								type="file"
								name="receiptFile"
								accept="image/*,application/pdf"
								onchange={handleFileChange}
								class="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
							/>
							{#if receiptFile}
								<p class="mt-1.5 text-xs text-muted-foreground">{receiptFile.name}</p>
							{/if}
						</div>
					{/if}

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="requestQuote"
							bind:checked={requestQuote}
							class="size-4 rounded border-gray-300"
						/>
						<div class="flex items-center gap-1.5">
							<FileQuestion class="size-3.5 text-muted-foreground" />
							<span class="text-sm font-medium">Request Quote</span>
						</div>
					</label>

					<!-- Vendor select -->
					{#if requestQuote}
						<div class="ml-7 rounded-lg border border-dashed p-3">
							<label for="vendor-select" class="text-xs font-medium text-muted-foreground">Vendor</label>
							<select
								id="vendor-select"
								name="vendorId"
								bind:value={selectedVendorId}
								required
								class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
							>
								<option value="">Select a vendor...</option>
								{#each vendors as vendor}
									<option value={vendor.id}>
										{vendor.name}{vendor.company ? ` - ${vendor.company}` : ''}{vendor.category ? ` (${vendor.category})` : ''}
									</option>
								{/each}
							</select>
							{#if vendors.length === 0}
								<p class="mt-1.5 text-xs text-muted-foreground">No vendors found. Add vendors in your team settings.</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => open = false}>Cancel</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{/if}
					Complete Task
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
