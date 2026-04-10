<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { teamMembers } from '$lib/data/mock-data.js';
	import { UserPlus, Shield, Crown, Briefcase, ClipboardList, Megaphone, PaintBucket } from 'lucide-svelte';

	const roleIcons: Record<string, typeof Shield> = {
		admin: Crown,
		listing_agent: Briefcase,
		tc: ClipboardList,
		marketing: Megaphone,
		staging_lead: PaintBucket
	};

	const roleDescriptions: Record<string, string> = {
		admin: 'Full access to all settings, billing, and team management. Can manage integrations and workflows.',
		listing_agent: 'Manage assigned listings end-to-end. Access to contacts, tasks, and analytics for their listings.',
		tc: 'Manage documents, compliance, and transaction timelines. Access to all listing documents and tasks.',
		marketing: 'Create and manage marketing assets, social media, and content production workflows.',
		staging_lead: 'Coordinate staging vendors, design consultations, and improvement planning.'
	};

	const allMembers = [
		...teamMembers.map((m) => ({ ...m, status: 'active' as const })),
		{
			id: 'tm-inv-1',
			name: 'Alex Thompson',
			email: 'alex.t@hometrack.co',
			role: 'listing_agent' as const,
			roleLabel: 'Listing Agent',
			avatar: '',
			initials: 'AT',
			status: 'invited' as const
		}
	];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-serif text-lg font-semibold">Team Management</h2>
			<p class="text-sm text-muted-foreground">Manage your team members and their roles</p>
		</div>
		<Button class="gap-2">
			<UserPlus class="size-4" />
			Invite Member
		</Button>
	</div>

	<!-- Team info -->
	<Card>
		<CardContent class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium">Chen Realty Group</p>
					<p class="text-xs text-muted-foreground">hometrack.co/chen-realty</p>
				</div>
				<Badge variant="outline">{allMembers.length} members</Badge>
			</div>
		</CardContent>
	</Card>

	<!-- Members list -->
	<Card>
		<CardHeader>
			<CardTitle>Team Members</CardTitle>
			<CardDescription>{allMembers.filter((m) => m.status === 'active').length} active, {allMembers.filter((m) => m.status === 'invited').length} pending invitation</CardDescription>
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
									{#if member.status === 'invited'}
										<Badge variant="secondary" class="text-xs">Invited</Badge>
									{/if}
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
								{#if member.status === 'active'}
									<span class="inline-block size-2 rounded-full bg-green-500"></span>
									<span class="text-xs text-muted-foreground">Active</span>
								{:else}
									<span class="inline-block size-2 rounded-full bg-amber-400"></span>
									<span class="text-xs text-muted-foreground">Pending</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

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
							<p class="text-sm font-medium">{member?.roleLabel || role}</p>
							<p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
