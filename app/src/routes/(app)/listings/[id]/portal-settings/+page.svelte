<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import {
		Eye,
		EyeOff,
		Globe,
		Lock,
		Users,
		FileText,
		Image,
		BarChart3,
		Calendar,
		MessageSquare,
		CheckCircle2,
		Clock,
		X,
		ExternalLink,
		Copy,
		Shield,
		UserPlus,
		Send,
		Settings,
		Bell,
		RefreshCw,
		Mail,
		Smartphone,
		Link2,
		Trash2
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);

	// Portal section visibility toggles
	let portalSections = $state([
		{ id: 'overview', label: 'Property Overview', icon: Globe, enabled: true, description: 'Address, price, photos, and basic details' },
		{ id: 'timeline', label: 'Timeline & Milestones', icon: Calendar, enabled: true, description: 'Phase progress and upcoming dates' },
		{ id: 'documents', label: 'Documents', icon: FileText, enabled: true, description: 'Disclosures, contracts, and reports' },
		{ id: 'photos', label: 'Photo Gallery', icon: Image, enabled: true, description: 'Marketing photos and virtual tours' },
		{ id: 'showings', label: 'Showing Activity', icon: Users, enabled: false, description: 'Showing schedule and feedback summaries' },
		{ id: 'analytics', label: 'Market Analytics', icon: BarChart3, enabled: false, description: 'Views, saves, and market data' },
		{ id: 'offers', label: 'Offer Details', icon: FileText, enabled: false, description: 'Offer status and comparison' },
		{ id: 'messages', label: 'Messages', icon: MessageSquare, enabled: true, description: 'Direct communication channel' }
	]);

	// Document sharing controls
	let documentSharing = $state([
		{ id: 'disclosures', label: 'Disclosures Package', shared: true, count: 3 },
		{ id: 'inspection', label: 'Inspection Reports', shared: true, count: 2 },
		{ id: 'title', label: 'Title Documents', shared: false, count: 1 },
		{ id: 'contracts', label: 'Contracts', shared: false, count: 2 },
		{ id: 'marketing', label: 'Marketing Materials', shared: true, count: 1 },
		{ id: 'photos', label: 'Photo Package', shared: true, count: 1 }
	]);

	// Approval queue items
	const approvalQueue = [
		{ id: 'aq-1', type: 'document', label: 'Pest Inspection Report', requestedBy: 'Client', date: '2026-04-08', status: 'pending' },
		{ id: 'aq-2', type: 'analytics', label: 'Zillow view data access', requestedBy: 'Client', date: '2026-04-09', status: 'pending' },
		{ id: 'aq-3', type: 'document', label: 'Listing Agreement copy', requestedBy: 'Client', date: '2026-04-07', status: 'approved' }
	];

	// Client access
	const clientAccess = $derived([
		{ name: listing?.client?.name || 'Client', email: listing?.client?.email || '', role: 'Owner', status: 'active', lastAccess: '2 hours ago', magicLinkExpires: '2026-04-17' }
	]);

	// Notification settings
	let notificationSettings = $state([
		{ id: 'phase_change', label: 'Phase Changes', description: 'Notify when listing moves to a new phase', icon: RefreshCw, email: true, sms: false },
		{ id: 'new_document', label: 'New Documents', description: 'Notify when new documents are shared', icon: FileText, email: true, sms: true },
		{ id: 'showing_scheduled', label: 'Showing Scheduled', description: 'Notify when a new showing is booked', icon: Calendar, email: true, sms: true },
		{ id: 'offer_received', label: 'Offer Received', description: 'Notify when a new offer comes in', icon: Mail, email: true, sms: true },
		{ id: 'task_complete', label: 'Task Completed', description: 'Notify when team tasks are finished', icon: CheckCircle2, email: true, sms: false },
		{ id: 'weekly_summary', label: 'Weekly Summary', description: 'Send a weekly activity digest', icon: BarChart3, email: true, sms: false }
	]);

	function toggleNotification(id: string, channel: 'email' | 'sms') {
		notificationSettings = notificationSettings.map((n) =>
			n.id === id ? { ...n, [channel]: !n[channel] } : n
		);
	}

	function toggleSection(id: string) {
		portalSections = portalSections.map((s) =>
			s.id === id ? { ...s, enabled: !s.enabled } : s
		);
	}

	function toggleDocSharing(id: string) {
		documentSharing = documentSharing.map((d) =>
			d.id === id ? { ...d, shared: !d.shared } : d
		);
	}

	const portalUrl = $derived(listing ? `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/${data.team?.slug ?? 'team'}` : '');
	let copyButtonText = $state('Copy Link');

	async function copyPortalUrl() {
		try {
			await navigator.clipboard.writeText(portalUrl);
			copyButtonText = 'Copied!';
			setTimeout(() => { copyButtonText = 'Copy Link'; }, 2000);
		} catch {
			copyButtonText = 'Failed';
			setTimeout(() => { copyButtonText = 'Copy Link'; }, 2000);
		}
	}
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-serif text-lg font-semibold">Client Portal Settings</h2>
				<p class="text-sm text-muted-foreground">Control what your client sees in their portal</p>
			</div>
			<Button size="sm" variant="outline" href={portalUrl} target="_blank">
				<ExternalLink class="mr-1.5 size-4" />
				Go to Client Portal
			</Button>
		</div>

		<!-- Portal URL -->
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2"><Globe class="size-5 text-primary" /></div>
					<div class="flex-1 min-w-0"><p class="text-sm font-medium">Portal Link</p><p class="text-xs text-muted-foreground truncate">{portalUrl}</p></div>
					<Button variant="outline" size="sm" onclick={copyPortalUrl}><Copy class="mr-1.5 size-3.5" />{copyButtonText}</Button>
					<Button size="sm"><Send class="mr-1.5 size-3.5" />Send to Client</Button>
				</div>
			</CardContent>
		</Card>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Section Visibility Toggles -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Portal Sections</CardTitle><CardDescription>Toggle visibility of each section in the client portal</CardDescription></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each portalSections as section}
							{@const Icon = section.icon}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<div class="rounded-md p-1.5 {section.enabled ? 'bg-primary/10' : 'bg-muted'}"><Icon class="size-4 {section.enabled ? 'text-primary' : 'text-muted-foreground'}" /></div>
								<div class="flex-1 min-w-0"><p class="text-sm font-medium">{section.label}</p><p class="text-xs text-muted-foreground">{section.description}</p></div>
								<button aria-label="Toggle {section.label}" onclick={() => toggleSection(section.id)} class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {section.enabled ? 'bg-primary' : 'bg-muted'}"><span class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform {section.enabled ? 'translate-x-6' : 'translate-x-1'}"></span></button>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Document Sharing Controls -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Document Sharing</CardTitle><CardDescription>Control which document categories clients can access</CardDescription></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each documentSharing as doc}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<div class="rounded-md p-1.5 {doc.shared ? 'bg-green-50' : 'bg-muted'}">{#if doc.shared}<Eye class="size-4 text-green-600" />{:else}<EyeOff class="size-4 text-muted-foreground" />{/if}</div>
								<div class="flex-1"><p class="text-sm font-medium">{doc.label}</p><p class="text-xs text-muted-foreground">{doc.count} document{doc.count !== 1 ? 's' : ''}</p></div>
								<button aria-label="Toggle {doc.label} sharing" onclick={() => toggleDocSharing(doc.id)} class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {doc.shared ? 'bg-green-500' : 'bg-muted'}"><span class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform {doc.shared ? 'translate-x-6' : 'translate-x-1'}"></span></button>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Approval Queue -->
		<Card>
			<CardHeader><CardTitle class="font-serif text-base">Approval Queue</CardTitle><CardDescription>Pending client requests and access approvals</CardDescription></CardHeader>
			<CardContent>
				<div class="divide-y">
					{#each approvalQueue as item}
						<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<div class="rounded-full p-1.5 {item.status === 'pending' ? 'bg-amber-100' : 'bg-green-100'}">{#if item.status === 'pending'}<Clock class="size-4 text-amber-600" />{:else}<CheckCircle2 class="size-4 text-green-600" />{/if}</div>
							<div class="flex-1 min-w-0"><p class="text-sm font-medium">{item.label}</p><p class="text-xs text-muted-foreground">Requested by {item.requestedBy} -- {item.date}</p></div>
							{#if item.status === 'pending'}
								<div class="flex gap-1.5">
									<Button variant="outline" size="sm" class="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"><CheckCircle2 class="mr-1 size-3" />Approve</Button>
									<Button variant="outline" size="sm" class="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"><X class="mr-1 size-3" />Deny</Button>
								</div>
							{:else}
								<Badge variant="outline" class="text-[10px] bg-green-100 text-green-700 border-green-200">Approved</Badge>
							{/if}
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Notification Settings -->
		<Card>
			<CardHeader><CardTitle class="font-serif text-base">Client Notifications</CardTitle><CardDescription>Configure which alerts your client receives</CardDescription></CardHeader>
			<CardContent>
				<div class="overflow-x-auto -mx-6 px-6">
					<table class="w-full text-sm">
						<thead><tr class="border-b"><th class="pb-2 text-left font-medium text-muted-foreground">Notification</th><th class="pb-2 text-center font-medium text-muted-foreground w-20"><div class="flex items-center justify-center gap-1"><Mail class="size-3.5" />Email</div></th><th class="pb-2 text-center font-medium text-muted-foreground w-20"><div class="flex items-center justify-center gap-1"><Smartphone class="size-3.5" />SMS</div></th></tr></thead>
						<tbody class="divide-y">
							{#each notificationSettings as setting}
								{@const Icon = setting.icon}
								<tr>
									<td class="py-3"><div class="flex items-center gap-2.5"><Icon class="size-4 text-muted-foreground shrink-0" /><div><p class="font-medium">{setting.label}</p><p class="text-xs text-muted-foreground">{setting.description}</p></div></div></td>
									<td class="py-3 text-center"><button aria-label="Toggle {setting.label} email" onclick={() => toggleNotification(setting.id, 'email')} class="relative mx-auto inline-flex h-5 w-9 items-center rounded-full transition-colors {setting.email ? 'bg-primary' : 'bg-muted'}"><span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform {setting.email ? 'translate-x-4.5' : 'translate-x-0.5'}"></span></button></td>
									<td class="py-3 text-center"><button aria-label="Toggle {setting.label} SMS" onclick={() => toggleNotification(setting.id, 'sms')} class="relative mx-auto inline-flex h-5 w-9 items-center rounded-full transition-colors {setting.sms ? 'bg-primary' : 'bg-muted'}"><span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform {setting.sms ? 'translate-x-4.5' : 'translate-x-0.5'}"></span></button></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>

		<!-- Client Access Management -->
		<Card>
			<CardHeader class="flex-row items-center justify-between"><div><CardTitle class="font-serif text-base">Client Access</CardTitle><CardDescription>Manage who can access this listing's portal</CardDescription></div><Button variant="outline" size="sm"><UserPlus class="mr-1.5 size-3.5" />Invite</Button></CardHeader>
			<CardContent>
				<div class="divide-y">
					{#each clientAccess as client}
						<div class="py-4 first:pt-0 last:pb-0">
							<div class="flex items-center gap-3">
								<Avatar class="size-10"><AvatarFallback class="bg-primary/10 text-primary text-xs">{listing?.client?.initials ?? '?'}</AvatarFallback></Avatar>
								<div class="flex-1 min-w-0"><p class="text-sm font-medium">{client.name}</p><p class="text-xs text-muted-foreground">{client.email}</p></div>
								<div class="text-right"><Badge variant="secondary" class="text-[10px]">{client.role}</Badge><p class="text-[10px] text-muted-foreground mt-0.5">Last active: {client.lastAccess}</p></div>
								<Badge variant="outline" class="text-[10px] bg-green-100 text-green-700 border-green-200">Active</Badge>
							</div>
							<div class="mt-3 ml-13 flex flex-wrap items-center gap-2 pl-[52px]">
								<Button variant="outline" size="sm" class="h-7 text-xs"><Link2 class="mr-1 size-3" />Regenerate Magic Link</Button>
								<span class="text-[10px] text-muted-foreground">Expires: {client.magicLinkExpires}</span>
								<div class="flex-1"></div>
								<Button variant="outline" size="sm" class="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"><Trash2 class="mr-1 size-3" />Revoke Access</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
