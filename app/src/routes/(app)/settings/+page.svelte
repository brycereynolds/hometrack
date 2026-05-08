<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { UserPlus, Shield, Crown, Briefcase, ClipboardList, Megaphone, PaintBucket, Trash2, Bot } from 'lucide-svelte';

	let { data } = $props();

	const allTeamMembers = $derived(data.teamMembers ?? []);
	const teamMembers = $derived(allTeamMembers.filter((m) => !m.isAgent));
	const agentMembers = $derived(allTeamMembers.filter((m) => m.isAgent));
	const team = $derived(data.team);

	const roleIcons: Record<string, typeof Shield> = {
		admin: Crown,
		listing_agent: Briefcase,
		tc: ClipboardList,
		marketing: Megaphone,
		staging_lead: PaintBucket
	};

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		listing_agent: 'Listing Agent',
		tc: 'Transaction Coordinator',
		marketing: 'Marketing',
		staging_lead: 'Staging Lead'
	};

	const roleDescriptions: Record<string, string> = {
		admin: 'Full access to all settings, billing, and team management. Can manage integrations and workflows.',
		listing_agent: 'Manage assigned listings end-to-end. Access to contacts, tasks, and analytics for their listings.',
		tc: 'Manage documents, compliance, and transaction timelines. Access to all listing documents and tasks.',
		marketing: 'Create and manage marketing assets, social media, and content production workflows.',
		staging_lead: 'Coordinate staging vendors, design consultations, and improvement planning.'
	};

	const allMembers = $derived(
		teamMembers.map((m) => ({ ...m, status: 'active' as const }))
	);

	const agentTypeLabels: Record<string, string> = {
		slack: 'Slack',
		email: 'Email',
		api: 'API',
	};

	// Invite member modal state
	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let inviteName = $state('');
	let inviteRole = $state('listing_agent');
	let inviteSubmitting = $state(false);

	// Remove member confirmation
	let showRemoveConfirm = $state(false);
	let removeMemberId = $state('');
	let removeMemberName = $state('');
	let removeSubmitting = $state(false);

	function openRemoveConfirm(member: { id: string; name: string }) {
		removeMemberId = member.id;
		removeMemberName = member.name;
		showRemoveConfirm = true;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-serif text-lg font-semibold">Team Management</h2>
			<p class="text-sm text-muted-foreground">Manage your team members and their roles</p>
		</div>
		<Button class="gap-2" onclick={() => showInviteModal = true}>
			<UserPlus class="size-4" />
			Invite Member
		</Button>
	</div>

	<!-- Team info -->
	<Card>
		<CardContent class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium">{team?.name ?? 'Your Team'}</p>
					<p class="text-xs text-muted-foreground">{team?.slug ? `hometrack.co/${team.slug}` : ''}</p>
				</div>
				<Badge variant="outline">{allMembers.length} member{allMembers.length === 1 ? '' : 's'}{agentMembers.length > 0 ? ` + ${agentMembers.length} agent${agentMembers.length === 1 ? '' : 's'}` : ''}</Badge>
			</div>
		</CardContent>
	</Card>

	<!-- Members list -->
	<Card>
		<CardHeader>
			<CardTitle>Team Members</CardTitle>
			<CardDescription>{allMembers.length} member{allMembers.length === 1 ? '' : 's'}</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<div class="divide-y">
				{#each allMembers as member}
					{@const RoleIcon = roleIcons[member.role] || Shield}
					<div class="flex items-center justify-between px-6 py-4">
						<div class="flex items-center gap-3">
							<Avatar class="size-10">
								<AvatarFallback class="bg-primary/10 text-primary text-sm font-medium">{member.initials}</AvatarFallback>
							</Avatar>
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium text-sm">{member.name}</p>
								</div>
								<p class="text-xs text-muted-foreground">{member.email}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<Badge variant="outline" class="gap-1 text-xs">
								<RoleIcon class="size-3" />
								{member.roleLabel}
							</Badge>
							<div class="flex items-center gap-1">
								<span class="inline-block size-2 rounded-full bg-green-500"></span>
								<span class="text-xs text-muted-foreground">Active</span>
							</div>
							{#if member.role !== 'admin'}
								<Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground hover:text-red-600" onclick={() => openRemoveConfirm(member)}>
									<Trash2 class="size-3" />
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- AI Agents -->
	{#if agentMembers.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Bot class="size-5 text-muted-foreground" />
					AI Agents
				</CardTitle>
				<CardDescription>Agent identities are created automatically when integrations are connected</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each agentMembers as agent}
						<div class="flex items-center justify-between px-6 py-4 bg-muted/30">
							<div class="flex items-center gap-3">
								<Avatar class="size-10">
									<AvatarFallback class="bg-violet-100 text-violet-600 text-sm font-medium">
										<Bot class="size-4" />
									</AvatarFallback>
								</Avatar>
								<div>
									<div class="flex items-center gap-2">
										<p class="font-medium text-sm">{agent.name}</p>
										<Badge variant="secondary" class="text-[10px] px-1.5 py-0">Agent</Badge>
									</div>
									<p class="text-xs text-muted-foreground">
										{agentTypeLabels[agent.agentType ?? ''] ?? agent.agentType ?? 'Unknown'} integration
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Badge variant="outline" class="gap-1 text-xs">
									<Bot class="size-3" />
									{agent.roleLabel ?? 'AI Agent'}
								</Badge>
								<div class="flex items-center gap-1">
									<span class="inline-block size-2 rounded-full bg-green-500"></span>
									<span class="text-xs text-muted-foreground">Active</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Role descriptions -->
	<Card>
		<CardHeader>
			<CardTitle>Role Descriptions</CardTitle>
			<CardDescription>Permissions and access levels for each role</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="divide-y">
				{#each Object.entries(roleDescriptions) as [role, description]}
					{@const RoleIcon = roleIcons[role] || Shield}
					{@const member = teamMembers.find((m) => m.role === role)}
					<div class="flex items-start gap-3 py-3">
						<div class="rounded-md bg-muted p-2 mt-0.5">
							<RoleIcon class="size-4 text-muted-foreground" />
						</div>
						<div>
							<p class="text-sm font-medium">{member?.roleLabel || roleLabels[role] || role}</p>
							<p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Invite Member Modal -->
<Dialog.Root bind:open={showInviteModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Invite Team Member</Dialog.Title>
			<Dialog.Description>Send an invitation to join your team. They'll be linked when they sign up.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/inviteMember"
			use:enhance={() => {
				inviteSubmitting = true;
				return async ({ result, update }) => {
					inviteSubmitting = false;
					if (result.type === 'success') {
						showInviteModal = false;
						inviteEmail = '';
						inviteName = '';
						inviteRole = 'listing_agent';
						toast.success('Team member invited');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to invite member'));
					}
				};
			}}
		>
			<input type="hidden" name="teamId" value={team?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="invite-name" class="text-sm font-medium">Name</label>
					<input
						id="invite-name"
						name="name"
						type="text"
						bind:value={inviteName}
						required
						placeholder="e.g. Alex Thompson"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="invite-email" class="text-sm font-medium">Email</label>
					<input
						id="invite-email"
						name="email"
						type="email"
						bind:value={inviteEmail}
						required
						placeholder="alex@example.com"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="invite-role" class="text-sm font-medium">Role</label>
					<select
						id="invite-role"
						name="role"
						bind:value={inviteRole}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						{#each Object.entries(roleLabels) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showInviteModal = false}>Cancel</Button>
				<Button type="submit" disabled={inviteSubmitting || !inviteName.trim() || !inviteEmail.trim()}>
					{inviteSubmitting ? 'Inviting...' : 'Invite Member'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Remove Member Confirmation -->
<Dialog.Root bind:open={showRemoveConfirm}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Remove Team Member</Dialog.Title>
			<Dialog.Description>Are you sure you want to remove <strong>{removeMemberName}</strong> from the team? This action cannot be undone.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/removeMember"
			use:enhance={() => {
				removeSubmitting = true;
				return async ({ result, update }) => {
					removeSubmitting = false;
					if (result.type === 'success') {
						showRemoveConfirm = false;
						toast.success(`${removeMemberName} removed from team`);
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to remove member'));
					}
				};
			}}
		>
			<input type="hidden" name="memberId" value={removeMemberId} />
			<input type="hidden" name="teamId" value={team?.id ?? ''} />
			<Dialog.Footer class="pt-4">
				<Button variant="outline" type="button" onclick={() => showRemoveConfirm = false}>Cancel</Button>
				<Button type="submit" variant="destructive" disabled={removeSubmitting}>
					{removeSubmitting ? 'Removing...' : 'Remove Member'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
