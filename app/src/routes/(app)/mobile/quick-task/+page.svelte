<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CheckCircle,
		Circle,
		AlertTriangle,
		Clock,
		ChevronRight,
		ListChecks
	} from 'lucide-svelte';
	let { data } = $props();

	const allTasks = $derived(data.tasks);
	const listings = $derived(data.listings);

	// Get tasks for the current user, grouped by listing
	const myTasks = $derived(
		allTasks
			.filter((t) => t.status !== 'done')
			.sort((a, b) => {
				if (a.isOverdue && !b.isOverdue) return -1;
				if (!a.isOverdue && b.isOverdue) return 1;
				const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
				return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
			})
	);

	// Group tasks by listing
	const overdueTasks = $derived(myTasks.filter((t) => t.isOverdue));
	const todayTasks = $derived(myTasks.filter((t) => !t.isOverdue));

	// Group today tasks by listing
	const tasksByListing = $derived(() => {
		const grouped = new Map<string, typeof todayTasks>();
		for (const task of todayTasks) {
			const key = task.listingId;
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key)!.push(task);
		}
		return grouped;
	});

	let completedTasks = $state<Set<string>>(new Set());

	function toggleTask(taskId: string) {
		const next = new Set(completedTasks);
		if (next.has(taskId)) {
			next.delete(taskId);
		} else {
			next.add(taskId);
		}
		completedTasks = next;
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'urgent':
				return 'text-red-500';
			case 'high':
				return 'text-amber-500';
			case 'medium':
				return 'text-blue-500';
			default:
				return 'text-muted-foreground';
		}
	}

	function getListingPhoto(listingId: string) {
		return listings.find((l) => l.id === listingId)?.photoUrl || '';
	}

	function getListingAddress(listingId: string) {
		return listings.find((l) => l.id === listingId)?.address || '';
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="font-serif text-xl font-bold">Today's Tasks</h1>
			<p class="text-sm text-muted-foreground">
				{completedTasks.size} of {myTasks.length} complete
			</p>
		</div>
		<div class="flex items-center gap-2">
			<ListChecks class="size-5 text-primary" />
			<span class="text-2xl font-bold text-primary">{myTasks.length - completedTasks.size}</span>
		</div>
	</div>

	<!-- Progress bar -->
	<div class="mb-6 h-2 overflow-hidden rounded-full bg-muted">
		<div
			class="h-full rounded-full bg-primary transition-all"
			style="width: {myTasks.length > 0 ? (completedTasks.size / myTasks.length) * 100 : 0}%"
		></div>
	</div>

	<!-- Overdue tasks -->
	{#if overdueTasks.length > 0}
		<div class="mb-6">
			<div class="mb-2 flex items-center gap-2">
				<AlertTriangle class="size-4 text-red-500" />
				<h2 class="text-sm font-semibold text-red-600">Overdue</h2>
			</div>
			<div class="space-y-1.5">
				{#each overdueTasks as task}
					<Card class="border-red-200 bg-red-50/50">
						<CardContent class="p-0">
							<button
								class="flex w-full items-center gap-3 p-3 text-left transition-all active:bg-red-100/50"
								onclick={() => toggleTask(task.id)}
							>
								<div class="shrink-0">
									{#if completedTasks.has(task.id)}
										<CheckCircle class="size-7 text-emerald-500" />
									{:else}
										<Circle class="size-7 text-red-300" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium leading-tight {completedTasks.has(task.id) ? 'line-through text-muted-foreground' : ''}">
										{task.title}
									</p>
									<div class="mt-1 flex items-center gap-2 text-xs text-red-600">
										<Clock class="size-3" />
										Due {task.dueDate?.toLocaleDateString() ?? ''}
									</div>
								</div>
								<Badge variant="outline" class="shrink-0 border-red-200 text-red-600 text-[10px]">
									{task.priority}
								</Badge>
							</button>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tasks grouped by listing -->
	{#each [...tasksByListing().entries()] as [listingId, listingTasks]}
		<div class="mb-6">
			<!-- Listing header -->
			<div class="mb-2 flex items-center gap-3">
				<img
					src={getListingPhoto(listingId)}
					alt=""
					class="size-10 rounded-lg object-cover"
				/>
				<div class="flex-1">
					<p class="text-sm font-semibold">{getListingAddress(listingId)}</p>
					<p class="text-xs text-muted-foreground">{listingTasks.length} task{listingTasks.length > 1 ? 's' : ''}</p>
				</div>
			</div>

			<!-- Tasks -->
			<div class="space-y-1.5">
				{#each listingTasks as task}
					<Card class="transition-all {completedTasks.has(task.id) ? 'opacity-60' : ''}">
						<CardContent class="p-0">
							<button
								class="flex w-full items-center gap-3 p-3 text-left transition-all active:bg-muted/50"
								onclick={() => toggleTask(task.id)}
							>
								<div class="shrink-0">
									{#if completedTasks.has(task.id)}
										<CheckCircle class="size-7 text-emerald-500" />
									{:else}
										<Circle class="size-7 {getPriorityColor(task.priority)}" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium leading-tight {completedTasks.has(task.id) ? 'line-through text-muted-foreground' : ''}">
										{task.title}
									</p>
									<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
										<Clock class="size-3" />
										Due {task.dueDate?.toLocaleDateString() ?? ''}
										<Badge variant="outline" class="text-[10px] {getPriorityColor(task.priority)}">
											{task.priority}
										</Badge>
									</div>
								</div>
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							</button>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	{/each}

	{#if myTasks.length === 0}
		<div class="py-12 text-center">
			<CheckCircle class="mx-auto mb-3 size-12 text-emerald-500" />
			<p class="text-lg font-medium">All caught up!</p>
			<p class="text-sm text-muted-foreground">No tasks for today.</p>
		</div>
	{/if}
</div>
