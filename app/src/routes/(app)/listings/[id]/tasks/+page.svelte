<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { PHASES, PHASE_LIST, type ListingPhase } from '$lib/config.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		CheckCircle2,
		Circle,
		AlertCircle,
		Clock,
		Plus,
		ChevronDown,
		ChevronRight,
		Filter,
		Calendar,
		User,
		Pencil
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';

	let { data } = $props();
	const listing = $derived(data.listing);
	const listingTasks = $derived(data.tasks ?? []);

	let filterAssignee = $state('all');
	let filterStatus = $state('all');
	let filterPriority = $state('all');
	let collapsedPhases = $state<Set<string>>(new Set());

	// Task edit modal state
	let showTaskModal = $state(false);
	let editingTask = $state<any | null>(null);
	let editTitle = $state('');
	let editStatus = $state('todo');
	let editPriority = $state('medium');
	let editDueDate = $state('');

	// Add task modal state
	let showAddModal = $state(false);
	let newTitle = $state('');
	let newPriority = $state('medium');
	let newPhase = $state('');
	let newDueDate = $state('');

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatDateForInput(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toISOString().split('T')[0];
	}

	const filteredTasks = $derived(
		listingTasks.filter((t: any) => {
			if (filterAssignee !== 'all' && t.assignee?.id !== filterAssignee) return false;
			if (filterStatus !== 'all' && t.status !== filterStatus) return false;
			if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
			return true;
		})
	);

	const tasksByPhase = $derived(() => {
		const grouped: Record<string, any[]> = {};
		for (const task of filteredTasks) {
			const phase = task.phase ?? 'general';
			if (!grouped[phase]) grouped[phase] = [];
			grouped[phase].push(task);
		}
		return grouped;
	});

	const uniqueAssignees = $derived(
		Array.from(new Set(listingTasks.map((t: any) => JSON.stringify({ id: t.assignee?.id, name: t.assignee?.name })).filter((s: string) => {
			const parsed = JSON.parse(s);
			return parsed.id && parsed.name;
		})))
			.map((s: string) => JSON.parse(s))
	);

	function togglePhase(phase: string) {
		const next = new Set(collapsedPhases);
		if (next.has(phase)) {
			next.delete(phase);
		} else {
			next.add(phase);
		}
		collapsedPhases = next;
	}

	function openTaskEdit(task: any) {
		editingTask = task;
		editTitle = task.title;
		editStatus = task.status;
		editPriority = task.priority;
		editDueDate = formatDateForInput(task.dueDate);
		showTaskModal = true;
	}

	function getNextStatus(status: string): string {
		const statusCycle: Record<string, string> = {
			todo: 'in_progress',
			in_progress: 'done',
			done: 'todo',
			overdue: 'in_progress',
		};
		return statusCycle[status] || 'todo';
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
			case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
			case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
			default: return 'bg-gray-100 text-gray-600 border-gray-200';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'done': return CheckCircle2;
			case 'in_progress': return Clock;
			case 'overdue': return AlertCircle;
			default: return Circle;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'done': return 'text-green-500';
			case 'in_progress': return 'text-blue-500';
			case 'overdue': return 'text-red-500';
			default: return 'text-muted-foreground';
		}
	}
</script>

{#if listing}
	<div class="space-y-4">
		<!-- Header with Add Task -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-serif text-lg font-semibold">Tasks</h2>
				<p class="text-sm text-muted-foreground">
					{listingTasks.filter((t: any) => t.status === 'done').length} of {listingTasks.length} completed
				</p>
			</div>
			<Button size="sm" onclick={() => { newTitle = ''; newPriority = 'medium'; newPhase = ''; newDueDate = ''; showAddModal = true; }}>
				<Plus class="mr-1.5 size-4" />
				Add Task
			</Button>
		</div>

		<!-- Filter Bar -->
		<Card>
			<CardContent class="p-3">
				<div class="flex flex-wrap gap-3">
					<div class="flex items-center gap-2">
						<User class="size-3.5 text-muted-foreground" />
						<Autocomplete
							items={[{ value: 'all', label: 'All Assignees' }, ...uniqueAssignees.map((a) => ({ value: a.id, label: a.name }))]}
							bind:value={filterAssignee}
							placeholder="Filter assignee..."
							class="w-44"
						/>
					</div>
					<div class="flex items-center gap-2">
						<Filter class="size-3.5 text-muted-foreground" />
						<select
							bind:value={filterStatus}
							class="h-8 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="all">All Status</option>
							<option value="todo">To Do</option>
							<option value="in_progress">In Progress</option>
							<option value="done">Done</option>
							<option value="overdue">Overdue</option>
						</select>
					</div>
					<div class="flex items-center gap-2">
						<AlertCircle class="size-3.5 text-muted-foreground" />
						<select
							bind:value={filterPriority}
							class="h-8 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="all">All Priority</option>
							<option value="urgent">Urgent</option>
							<option value="high">High</option>
							<option value="medium">Medium</option>
							<option value="low">Low</option>
						</select>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Tasks by Phase -->
		{#each PHASE_LIST as phase}
			{@const phaseTasks = tasksByPhase()[phase.key] || []}
			{#if phaseTasks.length > 0}
				{@const doneCount = phaseTasks.filter((t: any) => t.status === 'done').length}
				{@const isCollapsed = collapsedPhases.has(phase.key)}
				<Card>
					<button
						onclick={() => togglePhase(phase.key)}
						class="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
					>
						{#if isCollapsed}
							<ChevronRight class="size-4 text-muted-foreground" />
						{:else}
							<ChevronDown class="size-4 text-muted-foreground" />
						{/if}
						<div
							class="size-2.5 rounded-full"
							style="background-color: {phase.color}"
						></div>
						<span class="text-sm font-semibold flex-1">{phase.label}</span>
						<span class="text-xs text-muted-foreground">{doneCount}/{phaseTasks.length}</span>
						<div class="h-1.5 w-20 rounded-full bg-muted">
							<div
								class="h-1.5 rounded-full transition-all"
								style="width: {phaseTasks.length > 0 ? (doneCount / phaseTasks.length) * 100 : 0}%; background-color: {phase.color}"
							></div>
						</div>
					</button>

					{#if !isCollapsed}
						<CardContent class="px-4 pb-4 pt-0">
							<div class="divide-y">
								{#each phaseTasks as task, taskIndex}
									{@const StatusIcon = getStatusIcon(task.status)}
									<div class="group flex items-start gap-3 py-3 first:pt-0 last:pb-0 rounded-md hover:bg-muted/30 -mx-2 px-2 transition-colors">
										<form
											method="POST"
											action="?/toggleStatus"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														toast.success('Task status updated');
														await update();
													} else {
														toast.error('Failed to update status');
													}
												};
											}}
											class="mt-0.5"
										>
											<input type="hidden" name="taskId" value={task.id} />
											<input type="hidden" name="status" value={getNextStatus(task.status)} />
											<button type="submit" class="cursor-pointer" title="Click to change status">
												<StatusIcon class="size-5 {getStatusColor(task.status)} transition-colors hover:opacity-70" />
											</button>
										</form>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<button
													class="text-left text-sm {task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'} hover:text-primary transition-colors"
													onclick={() => openTaskEdit(task)}
												>
													{task.title}
												</button>
											</div>
											{#if task.subtasks && (task.subtasks as any[]).length > 0}
												<div class="mt-2 ml-1 space-y-1.5">
													{#each task.subtasks as subtask, si}
														<form
															method="POST"
															action="?/toggleSubtask"
															use:enhance={() => {
																return async ({ result, update }) => {
																	if (result.type === 'success') {
																		toast.success('Subtask updated');
																		await update();
																	} else {
																		toast.error('Failed to update subtask');
																	}
																};
															}}
														>
															<input type="hidden" name="taskId" value={task.id} />
															<input type="hidden" name="subtaskIndex" value={si} />
															<button
																type="submit"
																class="flex items-center gap-2 text-xs hover:text-primary transition-colors"
															>
																{#if subtask.done}
																	<CheckCircle2 class="size-3.5 text-green-500" />
																	<span class="text-muted-foreground line-through">{subtask.title}</span>
																{:else}
																	<Circle class="size-3.5 text-muted-foreground" />
																	<span>{subtask.title}</span>
																{/if}
															</button>
														</form>
													{/each}
												</div>
											{/if}
										</div>
										<div class="flex items-center gap-2 shrink-0">
											<Badge variant="outline" class="text-[10px] {getPriorityColor(task.priority)}">
												{task.priority}
											</Badge>
											<div class="flex items-center gap-1 text-xs {task.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}">
												<Calendar class="size-3" />
												{formatDate(task.dueDate)}
											</div>
											<Avatar class="size-6">
												<AvatarFallback class="text-[9px] bg-muted">{task.assignee?.initials ?? '?'}</AvatarFallback>
											</Avatar>
											<button
												class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
												onclick={() => openTaskEdit(task)}
												title="Edit task"
											>
												<Pencil class="size-3.5 text-muted-foreground" />
											</button>
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					{/if}
				</Card>
			{/if}
		{/each}

		{#if filteredTasks.length === 0}
			<div class="flex flex-col items-center justify-center py-12">
				<CheckCircle2 class="size-10 text-muted-foreground/30 mb-3" />
				<p class="text-sm text-muted-foreground">No tasks match your filters.</p>
			</div>
		{/if}
	</div>
{/if}

<!-- Add Task Modal -->
<Dialog.Root bind:open={showAddModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Add Task</Dialog.Title>
			<Dialog.Description>Create a new task for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createTask"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Task created');
						showAddModal = false;
						await update();
					} else {
						toast.error('Failed to create task');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div>
					<label for="new-task-title" class="text-sm font-medium">Title</label>
					<input
						id="new-task-title"
						name="title"
						type="text"
						bind:value={newTitle}
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="new-task-priority" class="text-sm font-medium">Priority</label>
						<select
							id="new-task-priority"
							name="priority"
							bind:value={newPriority}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>
					<div>
						<label for="new-task-phase" class="text-sm font-medium">Phase</label>
						<select
							id="new-task-phase"
							name="phase"
							bind:value={newPhase}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="">None</option>
							{#each PHASE_LIST as phase}
								<option value={phase.key}>{phase.label}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label for="new-task-due" class="text-sm font-medium">Due Date</label>
					<input
						id="new-task-due"
						name="dueDate"
						type="date"
						bind:value={newDueDate}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showAddModal = false}>Cancel</Button>
				<Button type="submit">Create Task</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Task Edit Modal -->
<Dialog.Root bind:open={showTaskModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Task</Dialog.Title>
			<Dialog.Description>Update the details for this task.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editTask"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Task updated');
						showTaskModal = false;
						await update();
					} else {
						toast.error('Failed to update task');
					}
				};
			}}
		>
			<input type="hidden" name="taskId" value={editingTask?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="task-title" class="text-sm font-medium">Title</label>
					<input
						id="task-title"
						name="title"
						type="text"
						bind:value={editTitle}
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="task-status" class="text-sm font-medium">Status</label>
						<select
							id="task-status"
							name="status"
							bind:value={editStatus}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="todo">To Do</option>
							<option value="in_progress">In Progress</option>
							<option value="done">Done</option>
						</select>
					</div>
					<div>
						<label for="task-priority" class="text-sm font-medium">Priority</label>
						<select
							id="task-priority"
							name="priority"
							bind:value={editPriority}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>
				</div>
				<div>
					<label for="task-due" class="text-sm font-medium">Due Date</label>
					<input
						id="task-due"
						name="dueDate"
						type="date"
						bind:value={editDueDate}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showTaskModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
