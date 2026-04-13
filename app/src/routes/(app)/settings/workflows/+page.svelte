<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PHASES } from '$lib/config.js';
	import { Plus, Pencil, Zap, ArrowRight, CheckSquare, Settings } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const workflowTemplates = $derived(data.workflowTemplates);

	// Edit workflow modal state
	let showEditWorkflow = $state(false);
	let editWorkflowId = $state('');
	let editWorkflowName = $state('');
	let editWorkflowDescription = $state('');
	let editSubmitting = $state(false);

	function openEditWorkflow(wf: typeof workflowTemplates[number]) {
		editWorkflowId = wf.id;
		editWorkflowName = wf.name;
		editWorkflowDescription = wf.description ?? '';
		showEditWorkflow = true;
	}

	// Group by phase
	const byPhase = $derived(() => {
		const groups: Record<string, typeof workflowTemplates> = {};
		for (const wf of workflowTemplates) {
			const phase = PHASES[wf.phase];
			const key = phase.label;
			if (!groups[key]) groups[key] = [];
			groups[key].push(wf);
		}
		return Object.entries(groups);
	});

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
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-serif text-lg font-semibold">Workflows & Automations</h2>
			<p class="text-sm text-muted-foreground">Phase templates and automation rules</p>
		</div>
		<Button class="gap-2">
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
							<Button variant="ghost" size="sm" class="h-7 text-xs gap-1" onclick={() => openEditWorkflow(wf)}>
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
					</CardTitle>
					<CardDescription>Trigger-based automations that run in the background</CardDescription>
				</div>
				<Button variant="outline" size="sm" class="gap-1">
					<Plus class="size-3" />
					Add Rule
				</Button>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			<div class="divide-y">
				{#each automationRules as rule}
					<div class="px-6 py-4 {rule.enabled ? '' : 'opacity-50'}">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-start gap-3 flex-1">
								<Zap class="size-4 mt-0.5 flex-shrink-0 {rule.enabled ? 'text-[#C49A3C]' : 'text-muted-foreground'}" />
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
								<Badge variant={rule.enabled ? 'default' : 'secondary'} class="text-xs">
									{rule.enabled ? 'Active' : 'Disabled'}
								</Badge>
								<Button variant="ghost" size="sm" class="h-7">
									<Settings class="size-3" />
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Edit Workflow Modal -->
<Dialog.Root bind:open={showEditWorkflow}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Workflow</Dialog.Title>
			<Dialog.Description>Update the name and description for this workflow template.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editWorkflow"
			use:enhance={() => {
				editSubmitting = true;
				return async ({ result, update }) => {
					editSubmitting = false;
					if (result.type === 'success') {
						showEditWorkflow = false;
						toast.success('Workflow updated');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to update workflow'));
					}
				};
			}}
		>
			<input type="hidden" name="workflowId" value={editWorkflowId} />
			<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="wf-name" class="text-sm font-medium">Name</label>
					<input
						id="wf-name"
						name="name"
						type="text"
						bind:value={editWorkflowName}
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="wf-description" class="text-sm font-medium">Description</label>
					<textarea
						id="wf-description"
						name="description"
						bind:value={editWorkflowDescription}
						rows="3"
						class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
					></textarea>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditWorkflow = false}>Cancel</Button>
				<Button type="submit" disabled={editSubmitting || !editWorkflowName.trim()}>
					{editSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
