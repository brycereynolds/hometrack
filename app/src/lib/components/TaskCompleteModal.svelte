<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		CheckCircle2,
		Circle,
		Clock,
		DollarSign,
		FileQuestion,
		Paperclip,
		Loader2,
		ExternalLink,
		ArrowRight,
		RotateCcw,
	} from 'lucide-svelte';
	import type { TeamMember } from '$lib/types.js';

	interface Vendor {
		id: string;
		name: string;
		company?: string | null;
		category?: string | null;
	}

	interface LinkedCost {
		id: string;
		title: string;
		amount?: number | null;
		status: string;
		category?: string | null;
		vendor?: { name: string } | null;
	}

	interface LinkedQuote {
		id: string;
		scope?: string | null;
		amount?: number | null;
		status: string;
		taskId?: string | null;
		vendor?: { name: string } | null;
	}

	interface Task {
		id: string;
		title: string;
		description?: string | null;
		status: string;
		priority: string;
		phase?: string | null;
		taskCategory?: string | null;
		dueDate?: string | Date | null;
		assigneeId?: string | null;
		assignee?: { id: string; name?: string | null } | null;
		sourceFieldNoteActionId?: string | null;
		[key: string]: any;
	}

	interface Props {
		open: boolean;
		task: Task;
		teamMembers: TeamMember[];
		vendors: Vendor[];
		listingId: string;
		costs?: LinkedCost[];
		quotes?: LinkedQuote[];
	}

	let {
		open = $bindable(false),
		task,
		teamMembers,
		vendors,
		listingId,
		costs = [],
		quotes: allQuotes = [],
	}: Props = $props();

	const COST_CATEGORIES = [
		'onboarding', 'improvements', 'disclosures', 'staging', 'media',
		'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general'
	] as const;

	// Editable fields
	let editTitle = $state('');
	let editDescription = $state('');
	let editPriority = $state('medium');
	let editStatus = $state('todo');
	let editAssigneeId = $state('');
	let editDueDate = $state('');
	let editCategory = $state('');

	// Action panel states
	let showCostForm = $state(false);
	let showQuoteForm = $state(false);

	// Cost fields
	let costAmount = $state('');
	let costCategory = $state('general');
	let costNotes = $state('');

	// Quote fields
	let selectedVendorId = $state('');

	let savingTask = $state(false);
	let savingCost = $state(false);
	let savingQuote = $state(false);
	let togglingStatus = $state(false);

	// Linked items for this task
	const taskCosts = $derived(costs.filter((c) => (c as any).taskId === task.id));
	const taskQuotes = $derived(allQuotes.filter((q) => q.taskId === task.id));

	function formatDateForInput(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toISOString().split('T')[0];
	}

	function formatCurrency(amount: number | null | undefined): string {
		if (amount == null) return '--';
		return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
	}

	// Reset fields when modal opens or task changes
	$effect(() => {
		if (open) {
			editTitle = task.title;
			editDescription = task.description ?? '';
			editPriority = task.priority;
			editStatus = task.status;
			editAssigneeId = task.assignee?.id ?? task.assigneeId ?? '';
			editDueDate = formatDateForInput(task.dueDate);
			editCategory = task.taskCategory ?? '';
			showCostForm = false;
			showQuoteForm = false;
			costAmount = '';
			costCategory = task.taskCategory ?? 'general';
			costNotes = '';
			selectedVendorId = '';
			savingTask = false;
			savingCost = false;
			savingQuote = false;
			togglingStatus = false;
		}
	});

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'done': return 'bg-green-100 text-green-700 border-green-200';
			case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
			default: return 'bg-gray-100 text-gray-600 border-gray-200';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'done': return 'Done';
			case 'in_progress': return 'In Progress';
			case 'overdue': return 'Overdue';
			default: return 'To Do';
		}
	}

	function getStatusActionLabel(status: string): string {
		switch (status) {
			case 'done': return 'Reopen';
			case 'in_progress': return 'Mark as Done';
			default: return 'Mark In Progress';
		}
	}

	function getStatusActionTarget(status: string): string {
		switch (status) {
			case 'done': return 'todo';
			case 'in_progress': return 'done';
			default: return 'in_progress';
		}
	}

	function getQuoteStatusClass(status: string): string {
		switch (status) {
			case 'approved': return 'bg-green-100 text-green-700';
			case 'received': return 'bg-blue-100 text-blue-700';
			case 'declined': return 'bg-red-100 text-red-700';
			default: return 'bg-amber-100 text-amber-700';
		}
	}

	function getCostStatusClass(status: string): string {
		switch (status) {
			case 'paid': return 'bg-green-100 text-green-700';
			case 'committed': return 'bg-blue-100 text-blue-700';
			case 'quoted': return 'bg-amber-100 text-amber-700';
			default: return 'bg-gray-100 text-gray-600';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-xl max-h-[85vh] overflow-y-auto">
		<!-- Header -->
		<Dialog.Header>
			<div class="flex items-start justify-between gap-3">
				<Dialog.Title class="font-serif text-lg flex-1">
					{task.title}
				</Dialog.Title>
				<Badge variant="outline" class="shrink-0 {getStatusBadgeClass(editStatus)}">
					{getStatusLabel(editStatus)}
				</Badge>
			</div>
			<Dialog.Description class="sr-only">Task details for {task.title}</Dialog.Description>
		</Dialog.Header>

		<!-- Task Details Form -->
		<form
			method="POST"
			action="?/updateTask"
			use:enhance={() => {
				savingTask = true;
				return async ({ result, update }) => {
					savingTask = false;
					if (result.type === 'success') {
						toast.success('Task updated');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String((result.data as any)?.error ?? 'Failed to update task'));
					}
				};
			}}
		>
			<input type="hidden" name="taskId" value={task.id} />
			<input type="hidden" name="status" value={editStatus} />

			<div class="space-y-4 py-4">
				<!-- Title -->
				<div>
					<label for="detail-title" class="text-xs font-medium text-muted-foreground">Title</label>
					<input
						id="detail-title"
						name="title"
						type="text"
						bind:value={editTitle}
						required
						class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="detail-desc" class="text-xs font-medium text-muted-foreground">Description</label>
					<textarea
						id="detail-desc"
						name="description"
						bind:value={editDescription}
						rows={2}
						placeholder="Add a description..."
						class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2 resize-none"
					></textarea>
				</div>

				<!-- Grid: Priority, Category -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="detail-priority" class="text-xs font-medium text-muted-foreground">Priority</label>
						<select
							id="detail-priority"
							name="priority"
							bind:value={editPriority}
							class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>
					<div>
						<label for="detail-category" class="text-xs font-medium text-muted-foreground">Category</label>
						<select
							id="detail-category"
							name="taskCategory"
							bind:value={editCategory}
							class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="">None</option>
							{#each COST_CATEGORIES as cat}
								<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Grid: Assignee, Due Date -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="detail-assignee" class="text-xs font-medium text-muted-foreground">Assignee</label>
						<select
							id="detail-assignee"
							name="assigneeId"
							bind:value={editAssigneeId}
							class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="">Unassigned</option>
							{#each teamMembers as member}
								<option value={member.id}>{member.name ?? member.email ?? 'Team member'}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="detail-due" class="text-xs font-medium text-muted-foreground">Due Date</label>
						<input
							id="detail-due"
							name="dueDate"
							type="date"
							bind:value={editDueDate}
							class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit" size="sm" variant="outline" disabled={savingTask}>
						{#if savingTask}
							<Loader2 class="mr-1.5 size-3.5 animate-spin" />
						{/if}
						Save Changes
					</Button>
				</div>
			</div>
		</form>

		<Separator />

		<!-- Linked Items -->
		{#if taskCosts.length > 0 || taskQuotes.length > 0 || task.sourceFieldNoteActionId}
			<div class="py-4 space-y-3">
				<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Items</h4>

				<!-- Costs -->
				{#if taskCosts.length > 0}
					<div class="space-y-1.5">
						<p class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
							<DollarSign class="size-3" />
							Costs
						</p>
						{#each taskCosts as cost}
							<div class="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
								<div class="flex items-center gap-2">
									<span>{cost.title}</span>
									<Badge variant="outline" class="text-[10px] {getCostStatusClass(cost.status)}">{cost.status}</Badge>
								</div>
								<span class="font-medium">{formatCurrency(cost.amount)}</span>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Quotes -->
				{#if taskQuotes.length > 0}
					<div class="space-y-1.5">
						<p class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
							<FileQuestion class="size-3" />
							Quotes
						</p>
						{#each taskQuotes as quote}
							<div class="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
								<div class="flex items-center gap-2">
									<span>{quote.vendor?.name ?? 'Vendor'}</span>
									<Badge variant="outline" class="text-[10px] {getQuoteStatusClass(quote.status)}">{quote.status}</Badge>
								</div>
								<span class="font-medium">{formatCurrency(quote.amount)}</span>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Source field note -->
				{#if task.sourceFieldNoteActionId}
					<div>
						<p class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
							<ExternalLink class="size-3" />
							Source
						</p>
						<p class="mt-1 text-sm text-muted-foreground">Created from field note action</p>
					</div>
				{/if}
			</div>

			<Separator />
		{/if}

		<!-- Action Buttons -->
		<div class="py-4 space-y-3">
			<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>

			<div class="flex flex-wrap gap-2">
				<!-- Status toggle -->
				<form
					method="POST"
					action="?/toggleStatus"
					use:enhance={() => {
						togglingStatus = true;
						return async ({ result, update }) => {
							togglingStatus = false;
							if (result.type === 'success') {
								const target = getStatusActionTarget(editStatus);
								editStatus = target;
								toast.success('Status updated');
								await update();
							} else {
								toast.error('Failed to update status');
							}
						};
					}}
				>
					<input type="hidden" name="taskId" value={task.id} />
					<input type="hidden" name="status" value={getStatusActionTarget(editStatus)} />
					<Button type="submit" size="sm" disabled={togglingStatus}
						variant={editStatus === 'in_progress' ? 'default' : 'outline'}
					>
						{#if togglingStatus}
							<Loader2 class="mr-1.5 size-3.5 animate-spin" />
						{:else if editStatus === 'done'}
							<RotateCcw class="mr-1.5 size-3.5" />
						{:else if editStatus === 'in_progress'}
							<CheckCircle2 class="mr-1.5 size-3.5" />
						{:else}
							<ArrowRight class="mr-1.5 size-3.5" />
						{/if}
						{getStatusActionLabel(editStatus)}
					</Button>
				</form>

				<!-- Track Cost button -->
				<Button
					size="sm"
					variant="outline"
					onclick={() => { showCostForm = !showCostForm; showQuoteForm = false; }}
				>
					<DollarSign class="mr-1.5 size-3.5" />
					Track Cost
				</Button>

				<!-- Request Quote button -->
				<Button
					size="sm"
					variant="outline"
					onclick={() => { showQuoteForm = !showQuoteForm; showCostForm = false; }}
				>
					<FileQuestion class="mr-1.5 size-3.5" />
					Request Quote
				</Button>

				<!-- Attach File button -->
				<Button size="sm" variant="outline" disabled>
					<Paperclip class="mr-1.5 size-3.5" />
					Attach File
				</Button>
			</div>

			<!-- Inline Cost Form -->
			{#if showCostForm}
				<form
					method="POST"
					action="?/trackCost"
					class="rounded-lg border border-dashed p-3 space-y-3"
					use:enhance={() => {
						savingCost = true;
						return async ({ result, update }) => {
							savingCost = false;
							if (result.type === 'success') {
								toast.success('Cost tracked');
								showCostForm = false;
								costAmount = '';
								costNotes = '';
								await update();
							} else if (result.type === 'failure') {
								toast.error(String((result.data as any)?.error ?? 'Failed to track cost'));
							}
						};
					}}
				>
					<input type="hidden" name="taskId" value={task.id} />
					<div>
						<label for="inline-cost-amount" class="text-xs font-medium text-muted-foreground">Amount</label>
						<div class="relative mt-1">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
							<input
								id="inline-cost-amount"
								name="costAmount"
								type="number"
								step="0.01"
								min="0"
								bind:value={costAmount}
								required
								placeholder="0.00"
								class="h-9 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm outline-none ring-ring focus:ring-2"
							/>
						</div>
					</div>
					<div>
						<label for="inline-cost-cat" class="text-xs font-medium text-muted-foreground">Category</label>
						<select
							id="inline-cost-cat"
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
						<label for="inline-cost-notes" class="text-xs font-medium text-muted-foreground">Notes</label>
						<textarea
							id="inline-cost-notes"
							name="costNotes"
							bind:value={costNotes}
							rows={2}
							placeholder="Optional notes..."
							class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2 resize-none"
						></textarea>
					</div>
					<div class="flex justify-end gap-2">
						<Button type="button" size="sm" variant="ghost" onclick={() => showCostForm = false}>Cancel</Button>
						<Button type="submit" size="sm" disabled={savingCost}>
							{#if savingCost}
								<Loader2 class="mr-1.5 size-3.5 animate-spin" />
							{/if}
							Save Cost
						</Button>
					</div>
				</form>
			{/if}

			<!-- Inline Quote Form -->
			{#if showQuoteForm}
				<form
					method="POST"
					action="?/requestQuote"
					class="rounded-lg border border-dashed p-3 space-y-3"
					use:enhance={() => {
						savingQuote = true;
						return async ({ result, update }) => {
							savingQuote = false;
							if (result.type === 'success') {
								toast.success('Quote requested');
								showQuoteForm = false;
								selectedVendorId = '';
								await update();
							} else if (result.type === 'failure') {
								toast.error(String((result.data as any)?.error ?? 'Failed to request quote'));
							}
						};
					}}
				>
					<input type="hidden" name="taskId" value={task.id} />
					<div>
						<label for="inline-vendor" class="text-xs font-medium text-muted-foreground">Vendor</label>
						<select
							id="inline-vendor"
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
					<div class="flex justify-end gap-2">
						<Button type="button" size="sm" variant="ghost" onclick={() => showQuoteForm = false}>Cancel</Button>
						<Button type="submit" size="sm" disabled={savingQuote}>
							{#if savingQuote}
								<Loader2 class="mr-1.5 size-3.5 animate-spin" />
							{/if}
							Send Request
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
