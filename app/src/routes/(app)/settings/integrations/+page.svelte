<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		Mail,
		Calendar,
		FileSignature,
		Database,
		BarChart,
		Receipt,
		Image,
		MessageSquare,
		CheckCircle,
		XCircle,
		AlertCircle,
		RefreshCw
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let syncingIntegrations = $state<Set<string>>(new Set());
	let lastSyncTimes = $state<Record<string, Date>>({});

	async function syncIntegration(integration: any) {
		const id = integration.name;
		if (syncingIntegrations.has(id)) return;
		syncingIntegrations = new Set([...syncingIntegrations, id]);
		toast.info('Syncing...');

		// Simulate sync delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		lastSyncTimes = { ...lastSyncTimes, [id]: new Date() };
		const next = new Set(syncingIntegrations);
		next.delete(id);
		syncingIntegrations = next;
		toast.success(`${integration.name} synced successfully`);
	}

	function getLastSync(integration: any): string {
		const overrideTime = lastSyncTimes[integration.name];
		if (overrideTime) return overrideTime.toLocaleString();
		if (integration.lastSync) return integration.lastSync.toLocaleString();
		return '';
	}

	const integrations = $derived(data.integrations);

	const iconMap: Record<string, typeof Mail> = {
		Mail,
		Calendar,
		FileSignature,
		Database,
		BarChart,
		Receipt,
		Image,
		MessageSquare
	};

	const categoryLabels: Record<string, string> = {
		email: 'Email & Calendar',
		calendar: 'Email & Calendar',
		documents: 'Documents',
		mls: 'MLS & Data',
		marketing: 'Marketing',
		financial: 'Financial',
		communication: 'Communication'
	};

	const categoryOrder = ['email', 'calendar', 'documents', 'mls', 'marketing', 'financial', 'communication'];

	// Group integrations by display category
	const grouped = $derived(() => {
		const groups: Record<string, typeof integrations> = {};
		for (const int of integrations) {
			const label = categoryLabels[int.category] || int.category;
			if (!groups[label]) groups[label] = [];
			groups[label]!.push(int);
		}
		return Object.entries(groups);
	});

	const statusConfig = {
		connected: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Connected' },
		disconnected: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Disconnected' },
		error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Error' }
	};

	function isGoogleIntegration(name: string) {
		return name === 'Gmail' || name === 'Google Calendar';
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Integrations</h2>
		<p class="text-sm text-muted-foreground">Connect your tools and services to HomeTrack</p>
	</div>

	<!-- Connected count -->
	<div class="flex items-center gap-4">
		<Badge variant="outline" class="gap-1">
			<CheckCircle class="size-3 text-green-600" />
			{integrations.filter((i) => i.status === 'connected').length} connected
		</Badge>
		<Badge variant="secondary" class="gap-1">
			{integrations.filter((i) => i.status === 'disconnected').length} available
		</Badge>
	</div>

	<!-- Grouped integration cards -->
	{#each grouped() as [category, items]}
		<div class="space-y-3">
			<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">{category}</h3>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each items as integration}
					{@const Icon = iconMap[integration.icon ?? ''] || Database}
					{@const status = statusConfig[integration.status]}
					{@const StatusIcon = status.icon}
					{@const isGoogle = isGoogleIntegration(integration.name)}
					<Card class="transition-all hover:shadow-sm">
						<CardContent class="p-4">
							<div class="flex items-start gap-3">
								<div class="rounded-lg border p-2.5">
									<Icon class="size-5 text-muted-foreground" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<h4 class="font-medium text-sm">{integration.name}</h4>
										<Badge
											variant="outline"
											class="gap-1 text-xs {status.color}"
										>
											<StatusIcon class="size-3" />
											{status.label}
										</Badge>
									</div>
									<p class="mt-0.5 text-xs text-muted-foreground">{integration.description}</p>

									{#if integration.status === 'connected'}
										<div class="mt-2 flex items-center justify-between">
											<div class="text-xs text-muted-foreground">
												{@const syncTime = getLastSync(integration)}
												{#if syncTime}
													<span>Last sync: {syncTime}</span>
												{/if}
												{#if integration.connectedBy}
													<span> &middot; by {integration.connectedBy.name}</span>
												{/if}
											</div>
											{#if isGoogle}
												<Button
													variant="ghost"
													size="sm"
													class="h-6 text-xs gap-1"
													disabled={syncingIntegrations.has(integration.name)}
													onclick={() => syncIntegration(integration)}
												>
													<RefreshCw class="size-3 {syncingIntegrations.has(integration.name) ? 'animate-spin' : ''}" />
													{syncingIntegrations.has(integration.name) ? 'Syncing...' : 'Sync'}
												</Button>
											{:else}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button variant="ghost" size="sm" class="h-6 text-xs gap-1 opacity-50" disabled>
															<RefreshCw class="size-3" />
															Sync
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>
														<p>Coming Soon</p>
													</Tooltip.Content>
												</Tooltip.Root>
											{/if}
										</div>
									{:else}
										<div class="mt-2">
											{#if isGoogle}
												<a href="/api/integrations/google/connect">
													<Button variant="outline" size="sm" class="h-7 text-xs">
														Connect
													</Button>
												</a>
											{:else}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button variant="outline" size="sm" class="h-7 text-xs opacity-50" disabled>
															Connect
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>
														<p>Coming Soon</p>
													</Tooltip.Content>
												</Tooltip.Root>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	{/each}
</div>
