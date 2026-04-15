<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		Download,
		Upload,
		Database,
		Shield,
		Key,
		Trash2,
		Clock,
		HardDrive,
		FileText,
		Users,
		DollarSign,
		RefreshCw,
		Copy,
		Eye,
		EyeOff
	} from 'lucide-svelte';

	let showApiKey = $state(false);
	const apiKey = 'ht_live_sk_a8f2c9d1e4b7...3k9m';
	const apiKeyFull = 'ht_live_sk_a8f2c9d1e4b7f6a3c8d2e5b9f1a4c7d0e3b6f9a2c5d8e1b4f7a0c3d6e9b2f5a8c1d4e7b0f3a6c9d2e5b8f1a4c7d0e3k9m';

	const exportOptions = [
		{ id: 'listings-csv', label: 'Listings CSV', description: 'All listing data including addresses, prices, phases, and metrics', icon: FileText, lastExport: '3 days ago' },
		{ id: 'contacts-csv', label: 'Contacts CSV', description: 'All contacts with types, emails, phones, and interaction history', icon: Users, lastExport: '1 week ago' },
		{ id: 'financial-report', label: 'Financial Reports', description: 'Budget summaries, expense tracking, and commission reports', icon: DollarSign, lastExport: 'Never' }
	];

	const retentionSettings = [
		{ label: 'Activity logs', value: '2 years', description: 'Messages, notes, and system events' },
		{ label: 'Completed listing data', value: '5 years', description: 'Closed/archived listing records' },
		{ label: 'Documents', value: '7 years', description: 'Uploaded files and signed documents' },
		{ label: 'Analytics data', value: '3 years', description: 'Views, showings, and performance metrics' }
	];
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Data Management</h2>
		<p class="text-sm text-muted-foreground">Export, retention, compliance, and API access</p>
	</div>

	<!-- Export tools -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Download class="size-4" />
				Export Tools
			</CardTitle>
			<CardDescription>Download your data in standard formats</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<div class="divide-y">
				{#each exportOptions as opt}
					<div class="flex items-center justify-between px-6 py-4">
						<div class="flex items-center gap-3">
							<div class="rounded-md bg-muted p-2">
								<opt.icon class="size-4 text-muted-foreground" />
							</div>
							<div>
								<p class="text-sm font-medium">{opt.label}</p>
								<p class="text-xs text-muted-foreground">{opt.description}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-xs text-muted-foreground">Last export: {opt.lastExport}</span>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
										<Download class="size-3" />
										Export
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Coming Soon</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Data retention -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Clock class="size-4" />
				Data Retention
			</CardTitle>
			<CardDescription>How long different data types are stored</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="divide-y">
				{#each retentionSettings as setting}
					<div class="flex items-center justify-between py-3">
						<div>
							<p class="text-sm font-medium">{setting.label}</p>
							<p class="text-xs text-muted-foreground">{setting.description}</p>
						</div>
						<Badge variant="outline" class="font-mono text-xs">{setting.value}</Badge>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Backup status -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<HardDrive class="size-4" />
				Backup Status
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="inline-block size-2.5 rounded-full bg-green-500"></span>
					<div>
						<p class="text-sm font-medium">All backups current</p>
						<p class="text-xs text-muted-foreground">Last backup: Today at 3:00 AM &middot; Daily automatic backups enabled</p>
					</div>
				</div>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
							<RefreshCw class="size-3" />
							Backup Now
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Coming Soon</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</CardContent>
	</Card>

	<!-- GDPR/CCPA Compliance -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Shield class="size-4" />
				Privacy & Compliance
			</CardTitle>
			<CardDescription>GDPR and CCPA compliance tools</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg border p-4 space-y-2">
					<h4 class="text-sm font-medium">Data Access Request</h4>
					<p class="text-xs text-muted-foreground">Generate a report of all data stored for a specific contact or client</p>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
								<FileText class="size-3" />
								New Request
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Coming Soon</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
				<div class="rounded-lg border p-4 space-y-2">
					<h4 class="text-sm font-medium">Data Deletion Request</h4>
					<p class="text-xs text-muted-foreground">Submit a request to permanently delete a contact's personal data</p>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
								<Trash2 class="size-3" />
								New Request
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Coming Soon</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</div>
			<div class="mt-3 rounded-md bg-muted/50 p-3">
				<p class="text-xs text-muted-foreground">
					<strong>0</strong> pending requests &middot; <strong>3</strong> completed this year &middot; Average response time: <strong>1.2 days</strong>
				</p>
			</div>
		</CardContent>
	</Card>

	<!-- API Key management -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Key class="size-4" />
				API Keys
				<Badge variant="secondary" class="text-xs font-normal">Coming Soon</Badge>
			</CardTitle>
			<CardDescription>Manage API keys for third-party integrations</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="rounded-lg border p-4 opacity-60">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Production API Key</p>
						<p class="text-xs text-muted-foreground mt-0.5">Created Apr 1, 2026 &middot; Last used 2 hours ago</p>
					</div>
					<Badge variant="outline" class="text-xs text-green-600">Active</Badge>
				</div>
				<div class="mt-3 flex items-center gap-2">
					<code class="flex-1 rounded-md bg-muted px-3 py-1.5 text-xs font-mono">
						{showApiKey ? apiKeyFull : apiKey}
					</code>
					<Button variant="ghost" size="sm" class="h-7" onclick={() => showApiKey = !showApiKey}>
						{#if showApiKey}
							<EyeOff class="size-3.5" />
						{:else}
							<Eye class="size-3.5" />
						{/if}
					</Button>
					<Button variant="ghost" size="sm" class="h-7 opacity-50" disabled>
						<Copy class="size-3.5" />
					</Button>
				</div>
			</div>
			<div class="mt-3 flex items-center gap-2">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="sm" class="gap-1 opacity-50" disabled>
							<Key class="size-3" />
							Generate New Key
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Coming Soon</p>
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="sm" class="gap-1 opacity-50" disabled>
							<Trash2 class="size-3" />
							Revoke Key
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Coming Soon</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</CardContent>
	</Card>
</div>
