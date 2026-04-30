<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PHASES } from '$lib/config.js';
	import { Plus, Pencil, Zap, CheckSquare, Settings, Trash2, GripVertical } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const workflowTemplates = $derived(data.workflowTemplates);

	// ── Template Editor state ──────────────────────────────────────────
	let showEditor = $state(false);
	let editorTemplateId = $state('');
	let editorName = $state('');
	let editorDescription = $state('');
	let editorPhase = $state('');
	let editorTasks = $state<{ id?: string; title: string; priority: string; sortOrder: number; isNew?: boolean }[]>([]);
	let editorSubmitting = $state(false);

	function openEditor(wf: typeof workflowTemplates[number]) {
		editorTemplateId = wf.id;
		editorName = wf.name;
		editorDescription = wf.description ?? '';
		editorPhase = wf.phase;
		editorTasks = (wf.tasks ?? []).map((t, i) => ({
			id: t.id,
			title: t.title,
			priority: t.priority ?? 'medium',
			sortOrder: t.sortOrder ?? i,
		}));
		showEditor = true;
	}

	function addTask() {
		editorTasks = [
			...editorTasks,
			{
				title: '',
				priority: 'medium',
				sortOrder: editorTasks.length,
				isNew: true,
			},
		];
	}

	function removeTask(index: number) {
		editorTasks = editorTasks.filter((_, i) => i !== index).map((t, i) => ({ ...t, sortOrder: i }));
	}

	function updateTaskTitle(index: number, value: string) {
		editorTasks = editorTasks.map((t, i) => (i === index ? { ...t, title: value } : t));
	}

	function updateTaskPriority(index: number, value: string) {
		editorTasks = editorTasks.map((t, i) => (i === index ? { ...t, priority: value } : t));
	}

	// Drag & drop reordering
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function handleDragStart(index: number) {
		dragIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDrop(index: number) {
		if (dragIndex === null || dragIndex === index) {
			dragIndex = null;
			dragOverIndex = null;
			return;
		}
		const tasks = [...editorTasks];
		const [moved] = tasks.splice(dragIndex, 1);
		tasks.splice(index, 0, moved);
		editorTasks = tasks.map((t, i) => ({ ...t, sortOrder: i }));
		dragIndex = null;
		dragOverIndex = null;
	}

	function handleDragEnd() {
		dragIndex = null;
		dragOverIndex = null;
	}

	const hasEmptyTitles = $derived(editorTasks.some((t) => !t.title.trim()));

	// Create workflow modal state
	let showCreateWorkflow = $state(false);
	let createWorkflowName = $state('');
	let createWorkflowDescription = $state('');
	let createWorkflowPhase = $state('pre_market');
	let createSubmitting = $state(false);

	// Automation rules (mock)
	const automationRules = [
		{
			id: 'ar-1',
			trigger: 'Listing enters "Active" phase',
			condition: 'Has scheduled open house',
			action: 'Send showing prep checklist to staging lead',
			enabled: true
		},
		{
			id: 'ar-2',
			trigger: 'New offer received',
			condition: 'Offer price > 95% of list price',
			action: 'Notify listing agent + client immediately',
			enabled: true
		},
		{
			id: 'ar-3',
			trigger: 'Task overdue by 24 hours',
			condition: 'Priority is high or urgent',
			action: 'Escalate to team lead and send reminder',
			enabled: true
		},
		{
			id: 'ar-4',
			trigger: 'Client message received',
			condition: 'No response within 2 hours',
			action: 'Send alert to assigned agent',
			enabled: false
		}
	];

	const priorityColors: Record<string, string> = {
		low: '#9C958E',
		medium: '#6B9FC4',
		high: '#C4704B',
		urgent: '#B04F4F',
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-serif text-lg font-semibold">Workflows & Automations</h2>
			<p class="text-sm text-muted-foreground">Phase templates and automation rules</p>
		</div>
		<Button class="gap-2" onclick={() => showCreateWorkflow = true}>
			<Plus class="size-4" />
			Create Custom Workflow
		</Button>
	</div>

	<!-- Workflow templates by phase -->
	<Card>
		<CardHeader>
			<CardTitle>Workflow Templates</CardTitle>
			<CardDescription>Task templates organized by listing phase</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<div class="divide-y">
				{#each workflowTemplates as wf}
					{@const phase = PHASES[wf.phase]}
					<div class="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
						<div class="flex items-center gap-3">
							<div class="size-2 rounded-full flex-shrink-0" style="background-color: {phase.color}"></div>
							<div>
								<div class="flex items-center gap-2">
									<p class="text-sm font-medium">{wf.name}</p>
									{#if wf.isDefault}
										<Badge variant="secondary" class="text-xs">Default</Badge>
									{:else}
										<Badge variant="outline" class="text-xs">Custom</Badge>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<Badge variant="outline" class="gap-1 text-xs">
								<CheckSquare class="size-3" />
								{wf.taskCount} tasks
							</Badge>
							<Badge
								variant="outline"
								class="text-xs"
								style="border-color: {phase.color}; color: {phase.color}"
							>
								{phase.label}
							</Badge>
							<Button variant="ghost" size="sm" class="h-7 text-xs gap-1" onclick={() => openEditor(wf)}>
								<Pencil class="size-3" />
								Edit
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Automation Rules -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="flex items-center gap-2">
						<Zap class="size-4 text-[#C49A3C]" />
						Automation Rules
						<Badge variant="secondary" class="text-xs font-normal">Coming Soon</Badge>
					</CardTitle>
					<CardDescription>Trigger-based automations that run in the background</CardDescription>
				</div>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
							<Plus class="size-3" />
							Add Rule
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Coming Soon</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			<div class="divide-y">
				{#each automationRules as rule}
					<div class="px-6 py-4 opacity-60">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-start gap-3 flex-1">
								<Zap class="size-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
								<div class="space-y-2 flex-1">
									<div class="flex flex-wrap items-center gap-2 text-sm">
										<Badge variant="outline" class="text-xs font-normal">When</Badge>
										<span>{rule.trigger}</span>
									</div>
									<div class="flex flex-wrap items-center gap-2 text-sm">
										<Badge variant="outline" class="text-xs font-normal">If</Badge>
										<span class="text-muted-foreground">{rule.condition}</span>
									</div>
									<div class="flex flex-wrap items-center gap-2 text-sm">
										<Badge variant="outline" class="text-xs font-normal">Then</Badge>
										<span class="text-muted-foreground">{rule.action}</span>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant="secondary" class="text-xs">
									{rule.enabled ? 'Active' : 'Disabled'}
								</Badge>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button variant="ghost" size="sm" class="h-7 opacity-50" disabled>
											<Settings class="size-3" />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>Coming Soon</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Template Editor Modal -->
<Dialog.Root bind:open={showEditor}>
	<Dialog.Content class="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Template</Dialog.Title>
			<Dialog.Description>Update the template details and manage its tasks.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/saveTemplateTasks"
			use:enhance={() => {
				editorSubmitting = true;
				return async ({ result, update }) => {
					editorSubmitting = false;
					if (result.type === 'success') {
						showEditor = false;
						toast.success('Template saved');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to save template'));
					}
				};
			}}
		>
			<input type="hidden" name="templateId" value={editorTemplateId} />
			<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
			<input type="hidden" name="tasks" value={JSON.stringify(editorTasks.filter((t) => t.title.trim()).map((t, i) => ({ id: t.id, title: t.title.trim(), priority: t.priority, sortOrder: i })))} />

			<div class="space-y-5 py-4">
				<!-- Template metadata -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="editor-name" class="text-sm font-medium">Name</label>
						<input
							id="editor-name"
							name="templateName"
							type="text"
							bind:value={editorName}
							required
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="editor-phase" class="text-sm font-medium">Phase</label>
						<div class="mt-1 flex h-10 items-center rounded-md border border-input bg-muted/30 px-3">
							{#if editorPhase && PHASES[editorPhase as keyof typeof PHASES]}
								<Badge
									variant="outline"
									class="text-xs"
									style="border-color: {PHASES[editorPhase as keyof typeof PHASES].color}; color: {PHASES[editorPhase as keyof typeof PHASES].color}"
								>
									{PHASES[editorPhase as keyof typeof PHASES].label}
								</Badge>
							{/if}
						</div>
					</div>
				</div>
				<div>
					<label for="editor-description" class="text-sm font-medium">Description</label>
					<textarea
						id="editor-description"
						name="templateDescription"
						bind:value={editorDescription}
						rows="2"
						class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
					></textarea>
				</div>

				<!-- Tasks list -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-sm font-medium">Tasks ({editorTasks.length})</label>
					</div>

					{#if editorTasks.length === 0}
						<div class="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center">
							<p class="text-sm text-muted-foreground">No tasks yet. Add your first task below.</p>
						</div>
					{:else}
						<div class="space-y-1.5">
							{#each editorTasks as task, index}
								<div
									class="group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 transition-colors {dragOverIndex === index ? 'border-primary bg-primary/5' : 'border-input'}"
									draggable="true"
									ondragstart={() => handleDragStart(index)}
									ondragover={(e) => handleDragOver(e, index)}
									ondrop={() => handleDrop(index)}
									ondragend={handleDragEnd}
									role="listitem"
								>
									<button
										type="button"
										class="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
										tabindex="-1"
									>
										<GripVertical class="size-4" />
									</button>

									<span class="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
										{index + 1}.
									</span>

									<input
										type="text"
										value={task.title}
										oninput={(e) => updateTaskTitle(index, e.currentTarget.value)}
										placeholder="Task title..."
										class="flex-1 h-8 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
									/>

									<select
										value={task.priority}
										onchange={(e) => updateTaskPriority(index, e.currentTarget.value)}
										class="h-7 rounded border border-input bg-background px-1.5 text-xs outline-none ring-ring focus:ring-1"
										style="color: {priorityColors[task.priority] ?? '#9C958E'}"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="urgent">Urgent</option>
									</select>

									<button
										type="button"
										onclick={() => removeTask(index)}
										class="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
										title="Remove task"
									>
										<Trash2 class="size-3.5" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<Button
						type="button"
						variant="outline"
						size="sm"
						class="mt-3 gap-1.5 text-xs w-full border-dashed"
						onclick={addTask}
					>
						<Plus class="size-3" />
						Add Task
					</Button>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditor = false}>Cancel</Button>
				<Button type="submit" disabled={editorSubmitting || !editorName.trim() || hasEmptyTitles}>
					{editorSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Create Workflow Modal -->
<Dialog.Root bind:open={showCreateWorkflow}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Create Custom Workflow</Dialog.Title>
			<Dialog.Description>Add a new workflow template for a listing phase.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createWorkflow"
			use:enhance={() => {
				createSubmitting = true;
				return async ({ result, update }) => {
					createSubmitting = false;
					if (result.type === 'success') {
						showCreateWorkflow = false;
						createWorkflowName = '';
						createWorkflowDescription = '';
						createWorkflowPhase = 'pre_market';
						toast.success('Workflow created');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to create workflow'));
					}
				};
			}}
		>
			<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="create-wf-name" class="text-sm font-medium">Name</label>
					<input
						id="create-wf-name"
						name="name"
						type="text"
						bind:value={createWorkflowName}
						required
						placeholder="e.g. Custom Pre-Market Prep"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="create-wf-phase" class="text-sm font-medium">Phase</label>
					<select
						id="create-wf-phase"
						name="phase"
						bind:value={createWorkflowPhase}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						{#each Object.entries(PHASES) as [value, phase]}
							<option {value}>{phase.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="create-wf-description" class="text-sm font-medium">Description</label>
					<textarea
						id="create-wf-description"
						name="description"
						bind:value={createWorkflowDescription}
						rows="3"
						placeholder="What does this workflow cover?"
						class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
					></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showCreateWorkflow = false}>Cancel</Button>
				<Button type="submit" disabled={createSubmitting || !createWorkflowName.trim()}>
					{createSubmitting ? 'Creating...' : 'Create Workflow'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
