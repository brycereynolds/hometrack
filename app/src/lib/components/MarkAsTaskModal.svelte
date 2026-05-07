<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import {
		Check,
		X,
		ChevronLeft,
		ChevronRight,
		ListChecks,
		Loader2,
		Pencil,
		Sparkles,
		DollarSign,
	} from 'lucide-svelte';
	import type { ActionWithSourceMoment, TeamMember } from '$lib/types.js';

	interface Props {
		open: boolean;
		actionItems: (ActionWithSourceMoment & { actionMoments?: any[] })[];
		listingId: string | null;
		teamMembers: TeamMember[];
		noteAuthorId: string;
		noteId?: string | null;
		startIndex?: number;
		videoUrl?: string | null;
		onTrackCost?: (action: ActionWithSourceMoment & { actionMoments?: any[] }) => void;
	}

	let {
		open = $bindable(false),
		actionItems,
		listingId,
		teamMembers: members,
		noteAuthorId,
		noteId = null,
		startIndex = $bindable(0),
		videoUrl = null,
		onTrackCost,
	}: Props = $props();

	let modalVideoElement: HTMLVideoElement | undefined = $state();
	let videoReady = $state(false);

	function formatTimestamp(seconds: number | null): string {
		if (seconds == null) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function seekTo(seconds: number) {
		if (modalVideoElement) {
			modalVideoElement.currentTime = seconds;
			modalVideoElement.play();
		}
	}

	function handleVideoReady() {
		videoReady = true;
		// If metadata was already loaded before this handler fired, trigger seek now
		seekCurrentItem();
	}

	function seekCurrentItem() {
		if (!modalVideoElement) return;
		const item = currentItem;
		if (!item) return;
		const ts = (item as any).sourceTimestamp ?? item.actionMoments?.[0]?.moment?.timestamp ?? null;
		console.log('[MarkAsTaskModal] seekCurrentItem', { ts, item: item.id, readyState: modalVideoElement.readyState });
		if (ts != null) {
			modalVideoElement.currentTime = ts;
			modalVideoElement.pause();
		}
	}

	const TASK_CATEGORIES = [
		'onboarding', 'improvements', 'disclosures', 'staging', 'media',
		'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general'
	] as const;

	const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

	const priorityColors: Record<string, string> = {
		low: 'bg-stone-100 text-stone-700',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-amber-100 text-amber-700',
		urgent: 'bg-red-100 text-red-700'
	};

	// Map action categories to task categories
	const categoryMap: Record<string, string> = {
		demolition: 'improvements',
		flooring: 'improvements',
		fixtures: 'improvements',
		paint: 'improvements',
		cleaning: 'staging',
		moving: 'staging',
		staging: 'staging',
		quoting: 'general',
		general: 'general',
		media: 'media',
		pricing: 'pricing',
		marketing: 'marketing',
		showings: 'showings',
		offers: 'offers',
		escrow: 'escrow',
		onboarding: 'onboarding',
		disclosures: 'disclosures',
	};

	// Carousel state — seed from startIndex when modal opens
	let currentIndex = $state(0);
	let submitting = $state(false);
	let bulkSubmitting = $state(false);

	// Sync startIndex into currentIndex when modal opens; reset videoReady on close
	$effect(() => {
		if (open) {
			currentIndex = startIndex;
			// If video metadata is already cached, videoReady won't fire again — check now
			if (modalVideoElement && modalVideoElement.readyState >= 1) {
				videoReady = true;
				seekCurrentItem();
			}
		} else {
			videoReady = false;
		}
	});

	// Seek video when current item changes or video becomes ready
	$effect(() => {
		// Track reactive dependencies
		const item = currentItem;
		const ready = videoReady;
		if (item && modalVideoElement && ready) {
			const ts = (item as any).sourceTimestamp ?? item.actionMoments?.[0]?.moment?.timestamp ?? null;
			console.log('[MarkAsTaskModal] seek effect', { ts, itemId: item.id, ready });
			if (ts != null) {
				modalVideoElement.currentTime = ts;
				modalVideoElement.pause();
			}
		}
	});

	// Sticky defaults
	let stickyCategory = $state('');
	let stickyPriority = $state('');
	let stickyAssignee = $state('');
	let stickyDueDate = $state('');

	// Review results
	let tasksCreated = $state(0);
	let tasksDismissed = $state(0);
	let reviewComplete = $state(false);

	// Items that are still unreviewed in this session
	let reviewedIds = $state<Set<string>>(new Set());

	const remainingItems = $derived(
		actionItems.filter((a) => !reviewedIds.has(a.id))
	);

	const currentItem = $derived(remainingItems[currentIndex] ?? null);

	// Per-item form values, seeded from sticky defaults or action data
	let formCategory = $derived.by(() => {
		if (!currentItem) return 'general';
		return stickyCategory || categoryMap[currentItem.category ?? ''] || 'general';
	});
	let formPriority = $derived.by(() => {
		if (!currentItem) return 'medium';
		return stickyPriority || currentItem.priority || 'medium';
	});
	let formAssignee = $derived.by(() => {
		return stickyAssignee || noteAuthorId;
	});
	let formDueDate = $derived.by(() => {
		return stickyDueDate;
	});

	// Local overrides for the current item
	let localCategory = $state('');
	let localPriority = $state('');
	let localAssignee = $state('');
	let localDueDate = $state('');

	const effectiveCategory = $derived(localCategory || formCategory);
	const effectivePriority = $derived(localPriority || formPriority);
	const effectiveAssignee = $derived(localAssignee || formAssignee);
	const effectiveDueDate = $derived(localDueDate || formDueDate);

	function resetLocalOverrides() {
		localCategory = '';
		localPriority = '';
		localAssignee = '';
		localDueDate = '';
	}

	function advanceAfterReview() {
		resetLocalOverrides();
		if (remainingItems.length === 0) {
			reviewComplete = true;
		} else if (currentIndex >= remainingItems.length) {
			currentIndex = Math.max(0, remainingItems.length - 1);
		}
	}

	function handleAcceptResult(result: any) {
		if (result.type === 'success') {
			// Update sticky defaults from whatever the user chose
			stickyCategory = effectiveCategory;
			stickyPriority = effectivePriority;
			stickyAssignee = effectiveAssignee;
			stickyDueDate = effectiveDueDate;

			if (currentItem) reviewedIds = new Set([...reviewedIds, currentItem.id]);
			tasksCreated++;
			toast.success('Task created');
			advanceAfterReview();
		} else if (result.type === 'failure') {
			toast.error(String(result.data?.error ?? 'Failed to create task'));
		}
		submitting = false;
	}

	function handleDismissResult(result: any) {
		if (result.type === 'success') {
			if (currentItem) reviewedIds = new Set([...reviewedIds, currentItem.id]);
			tasksDismissed++;
			toast.success('Dismissed');
			advanceAfterReview();
		} else if (result.type === 'failure') {
			toast.error(String(result.data?.error ?? 'Failed to dismiss'));
		}
		submitting = false;
	}

	function handleBulkResult(result: any) {
		if (result.type === 'success') {
			const created = result.data?.tasksCreated ?? remainingItems.length;
			tasksCreated += created;
			reviewedIds = new Set([...reviewedIds, ...remainingItems.map((a) => a.id)]);
			toast.success(`${created} tasks created`);
			reviewComplete = true;
		} else if (result.type === 'failure') {
			toast.error(String(result.data?.error ?? 'Failed to create tasks'));
		}
		bulkSubmitting = false;
	}

	function handleDone() {
		open = false;
		invalidateAll();
		// Reset state for next open
		currentIndex = 0;
		reviewedIds = new Set();
		tasksCreated = 0;
		tasksDismissed = 0;
		reviewComplete = false;
		stickyCategory = '';
		stickyPriority = '';
		stickyAssignee = '';
		stickyDueDate = '';
		resetLocalOverrides();
	}

	function goToPrevious() {
		if (currentIndex > 0) {
			currentIndex--;
			resetLocalOverrides();
		}
	}

	function goToNext() {
		if (currentIndex < remainingItems.length - 1) {
			currentIndex++;
			resetLocalOverrides();
		}
	}

	// AI correction state
	let showCorrectionInput = $state(false);
	let correctionText = $state('');
	let correctionLoading = $state(false);

	async function submitModalCorrection() {
		if (!correctionText.trim() || !currentItem || !noteId) return;
		correctionLoading = true;
		try {
			const res = await fetch(`/api/field-notes/${noteId}/correct`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ actionId: currentItem.id, correction: correctionText.trim() }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Correction failed');
			}
			toast.success('Correction applied');
			showCorrectionInput = false;
			correctionText = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Correction failed');
		} finally {
			correctionLoading = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="font-serif flex items-center gap-2">
				<ListChecks class="size-5" />
				Review Action Items
			</Dialog.Title>
			{#if !reviewComplete && remainingItems.length > 0}
				<Dialog.Description>
					{remainingItems.length} item{remainingItems.length === 1 ? '' : 's'} to review
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		{#if !listingId}
			<!-- No listing attached -->
			<div class="py-6 text-center">
				<p class="text-sm text-muted-foreground">
					This note isn't attached to a listing. Attach it to a listing to create tasks from action items.
				</p>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => open = false}>Close</Button>
			</Dialog.Footer>

		{:else if reviewComplete}
			<!-- Summary -->
			<div class="py-6 text-center space-y-3">
				<div class="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100">
					<Check class="size-6 text-emerald-600" />
				</div>
				<div>
					<p class="text-sm font-semibold">Review complete</p>
					<p class="text-sm text-muted-foreground mt-1">
						{tasksCreated} task{tasksCreated === 1 ? '' : 's'} created{tasksDismissed > 0 ? `, ${tasksDismissed} dismissed` : ''}
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button onclick={handleDone}>Done</Button>
			</Dialog.Footer>

		{:else if currentItem}
			<!-- Current action item -->
			<div class="space-y-4">
				<!-- Video player -->
				{#if videoUrl}
					<div class="rounded-lg overflow-hidden bg-black">
						<video
							bind:this={modalVideoElement}
							controls
							class="w-full max-h-[200px] object-contain"
							src={videoUrl}
							preload="metadata"
							onloadedmetadata={handleVideoReady}
						>
							<track kind="captions" />
						</video>
					</div>
					{#if currentItem.actionMoments?.length}
						<div class="flex flex-wrap gap-1">
							{#each currentItem.actionMoments as am}
								{#if am.moment?.timestamp != null}
									<button
										class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
										onclick={() => seekTo(am.moment.timestamp)}
									>
										{formatTimestamp(am.moment.timestamp)}
									</button>
								{/if}
							{/each}
						</div>
					{/if}
				{/if}

				<!-- Item display -->
				<div class="space-y-2">
					<p class="text-sm font-semibold">{currentItem.title}</p>
					{#if currentItem.description}
						<p class="text-xs text-muted-foreground">{currentItem.description}</p>
					{/if}
					<div class="flex flex-wrap items-center gap-1.5">
						{#if currentItem.category}
							<Badge variant="outline" class="text-[10px]">{currentItem.category}</Badge>
						{/if}
						{#if currentItem.priority}
							<Badge class="text-[10px] {priorityColors[currentItem.priority] ?? ''}">{currentItem.priority}</Badge>
						{/if}
					</div>
					{#if currentItem.sourceQuote}
						<blockquote class="border-l-2 border-muted pl-3 text-xs italic text-muted-foreground">
							"{currentItem.sourceQuote}"
						</blockquote>
					{/if}

					<!-- Correction -->
					{#if noteId}
						{#if showCorrectionInput}
							<div class="space-y-2 rounded-lg border border-dashed p-3">
								<input
									type="text"
									class="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground"
									placeholder="What needs to be corrected?"
									bind:value={correctionText}
									onkeydown={(e) => { if (e.key === 'Enter' && correctionText.trim()) submitModalCorrection(); }}
								/>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="default"
										disabled={correctionLoading || !correctionText.trim()}
										onclick={submitModalCorrection}
									>
										{#if correctionLoading}
											<Loader2 class="mr-1 size-3 animate-spin" />
										{:else}
											<Sparkles class="mr-1 size-3" />
										{/if}
										Fix with AI
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => { showCorrectionInput = false; correctionText = ''; }}
									>
										Cancel
									</Button>
								</div>
							</div>
						{:else}
							<button
								class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
								onclick={() => { showCorrectionInput = true; correctionText = ''; }}
							>
								<Pencil class="size-3" />
								Something wrong? Correct with AI
							</button>
						{/if}
					{/if}
				</div>

				<!-- Navigation -->
				<div class="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						onclick={goToPrevious}
						disabled={currentIndex === 0}
					>
						<ChevronLeft class="mr-1 size-3" />
						Previous
					</Button>
					<span class="text-xs text-muted-foreground">
						{currentIndex + 1} / {remainingItems.length}
					</span>
					<Button
						variant="ghost"
						size="sm"
						onclick={goToNext}
						disabled={currentIndex >= remainingItems.length - 1}
					>
						Next
						<ChevronRight class="ml-1 size-3" />
					</Button>
				</div>

				<!-- Form fields -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="task-category" class="text-xs font-medium text-muted-foreground">Category</label>
						<select
							id="task-category"
							class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
							value={effectiveCategory}
							onchange={(e) => localCategory = e.currentTarget.value}
						>
							{#each TASK_CATEGORIES as cat}
								<option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="task-priority" class="text-xs font-medium text-muted-foreground">Priority</label>
						<select
							id="task-priority"
							class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
							value={effectivePriority}
							onchange={(e) => localPriority = e.currentTarget.value}
						>
							{#each PRIORITIES as p}
								<option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="task-assignee" class="text-xs font-medium text-muted-foreground">Assignee</label>
						<select
							id="task-assignee"
							class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
							value={effectiveAssignee}
							onchange={(e) => localAssignee = e.currentTarget.value}
						>
							{#each members as member}
								<option value={member.id}>{member.name ?? member.email ?? 'Unknown'}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="task-due-date" class="text-xs font-medium text-muted-foreground">Due date</label>
						<input
							id="task-due-date"
							type="date"
							class="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
							value={effectiveDueDate}
							onchange={(e) => localDueDate = e.currentTarget.value}
						/>
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<Dialog.Footer class="flex-col gap-0 sm:flex-col">
				<div class="flex w-full items-center justify-between gap-2">
					<!-- Dismiss (left) -->
					<form
						method="POST"
						action="?/dismissAction"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								handleDismissResult(result);
								await update({ reset: false });
							};
						}}
					>
						<input type="hidden" name="actionId" value={currentItem.id} />
						<Button type="submit" variant="ghost" disabled={submitting}>
							<X class="mr-1 size-3" />
							Dismiss
						</Button>
					</form>

					<div class="flex items-center gap-2">
					<!-- Track as Cost -->
					{#if onTrackCost && listingId}
						<Button
							variant="outline"
							size="default"
							disabled={submitting}
							onclick={() => { open = false; onTrackCost?.(currentItem); }}
						>
							<DollarSign class="mr-1 size-3" />
							Cost
						</Button>
					{/if}

					<!-- Mark as Task (right) -->
					<form
						method="POST"
						action="?/markAsTask"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								handleAcceptResult(result);
								await update({ reset: false });
							};
						}}
					>
						<input type="hidden" name="actionId" value={currentItem.id} />
						<input type="hidden" name="listingId" value={listingId} />
						<input type="hidden" name="category" value={effectiveCategory} />
						<input type="hidden" name="priority" value={effectivePriority} />
						<input type="hidden" name="assigneeId" value={effectiveAssignee} />
						<input type="hidden" name="dueDate" value={effectiveDueDate} />
						<Button type="submit" class="bg-[#c2754f] hover:bg-[#a8613d] text-white" disabled={submitting}>
							{#if submitting}
								<Loader2 class="mr-1 size-3 animate-spin" />
							{:else}
								<Check class="mr-1 size-3" />
							{/if}
							Mark as Task
						</Button>
					</form>
					</div>
				</div>

				<!-- Bulk apply (below, separated) -->
				{#if remainingItems.length > 1}
					<div class="mt-3 w-full border-t pt-3">
						<form
							method="POST"
							action="?/bulkMarkAsTasks"
							class="w-full"
							use:enhance={() => {
								bulkSubmitting = true;
								return async ({ result, update }) => {
									handleBulkResult(result);
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="listingId" value={listingId} />
							<input type="hidden" name="category" value={effectiveCategory} />
							<input type="hidden" name="priority" value={effectivePriority} />
							<input type="hidden" name="assigneeId" value={effectiveAssignee} />
							<input type="hidden" name="dueDate" value={effectiveDueDate} />
							<input type="hidden" name="actionIds" value={remainingItems.map((a) => a.id).join(',')} />
							<Button type="submit" variant="outline" class="w-full" disabled={bulkSubmitting}>
								{#if bulkSubmitting}
									<Loader2 class="mr-1 size-3 animate-spin" />
								{/if}
								Apply to All Remaining ({remainingItems.length})
							</Button>
						</form>
					</div>
				{/if}
			</Dialog.Footer>
		{:else}
			<div class="py-6 text-center">
				<p class="text-sm text-muted-foreground">No action items to review.</p>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => open = false}>Close</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
