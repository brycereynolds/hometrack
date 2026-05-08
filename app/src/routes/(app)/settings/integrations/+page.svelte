<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		Mail,
		Calendar,
		FileSignature,
		Database,
		BarChart,
		MessageSquare,
		Send,
		CheckCircle,
		XCircle,
		AlertCircle,
		RefreshCw,
		Loader2,
		Unplug
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import SlackSetupModal from '$lib/components/SlackSetupModal.svelte';

	let { data } = $props();
	let slackModalOpen = $state(false);
	let disconnectingSlack = $state(false);
	let testingSlack = $state(false);

	// Static card definitions — always shown regardless of DB state.
	// Only Slack is a real integration; all others are demo placeholders.
	const STATIC_CARDS = [
		{ name: 'Gmail', description: 'Email sync and send', category: 'email', icon: 'Mail', demo: true },
		{ name: 'Google Calendar', description: 'Showings and appointments', category: 'calendar', icon: 'Calendar', demo: true },
		{ name: 'DocuSign', description: 'E-signatures and document routing', category: 'documents', icon: 'FileSignature', demo: true },
		{ name: 'MLSListings (Bay Area)', description: 'MLS data and comp feeds', category: 'mls', icon: 'Database', demo: true },
		{ name: 'Zillow', description: 'View and save analytics', category: 'marketing', icon: 'BarChart', demo: true },
		{ name: 'Twilio', description: 'SMS messaging (Phase 2)', category: 'communication', icon: 'MessageSquare', demo: true },
		{ name: 'Postmark', description: 'Transactional email delivery', category: 'email', icon: 'Send', demo: true },
		{ name: 'Slack', description: 'Team notifications and activity updates', category: 'communication', icon: 'MessageSquare', demo: false },
	];

	const iconMap: Record<string, any> = { Mail, Calendar, FileSignature, Database, BarChart, MessageSquare, Send };

	const categoryLabels: Record<string, string> = {
		email: 'Email',
		calendar: 'Calendar',
		documents: 'Documents',
		mls: 'MLS & Data',
		marketing: 'Marketing',
		financial: 'Financial',
		communication: 'Communication',
	};

	const categoryOrder = ['email', 'calendar', 'documents', 'mls', 'marketing', 'financial', 'communication'];

	// Merge static cards with live DB rows (connected integrations only), keyed by name.
	const cards = $derived(() => {
		const byName = new Map((data.connectedIntegrations ?? []).map((r: any) => [r.name, r]));
		return STATIC_CARDS.map((card) => {
			const live = byName.get(card.name);
			return {
				...card,
				id: live?.id ?? null,
				status: (live?.status ?? 'disconnected') as 'connected' | 'disconnected' | 'error',
				config: live?.config ?? null,
				connectedBy: live?.connectedBy ?? null,
				lastSync: live?.lastSync ?? null,
			};
		});
	});

	const grouped = $derived(() => {
		const groups: Record<string, ReturnType<typeof cards>> = {};
		for (const card of cards()) {
			const label = categoryLabels[card.category] || card.category;
			if (!groups[label]) groups[label] = [];
			groups[label]!.push(card);
		}
		return categoryOrder
			.map((cat) => [categoryLabels[cat] || cat, groups[categoryLabels[cat] || cat]] as [string, ReturnType<typeof cards>])
			.filter(([, items]) => items?.length);
	});

	const connectedCount = $derived(cards().filter((c) => c.status === 'connected').length);
	const availableCount = $derived(cards().filter((c) => c.status !== 'connected').length);

	const statusConfig = {
		connected: { icon: CheckCircle, color: 'text-green-600', label: 'Connected' },
		disconnected: { icon: XCircle, color: 'text-muted-foreground', label: 'Disconnected' },
		error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
	};

	onMount(() => {
		const slackParam = $page.url.searchParams.get('slack');
		if (slackParam === 'connected') toast.success('Slack connected via OAuth');
		else if (slackParam === 'error') toast.error('Failed to connect Slack. Please try again.');
	});

	async function testSlackConnection(card: any) {
		const config = card.config as { webhookUrl?: string } | null;
		if (!config?.webhookUrl) return;
		testingSlack = true;
		try {
			const res = await fetch('/api/integrations/slack/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ webhookUrl: config.webhookUrl }),
			});
			toast[res.ok ? 'success' : 'error'](res.ok ? 'Test message sent to Slack' : 'Failed to send test message');
		} catch {
			toast.error('Failed to reach Slack');
		} finally {
			testingSlack = false;
		}
	}

	async function disconnectSlack() {
		disconnectingSlack = true;
		try {
			const res = await fetch('?/disconnectSlack', { method: 'POST', body: new FormData() });
			if (res.ok) {
				toast.success('Slack disconnected');
				await invalidateAll();
			} else {
				toast.error('Failed to disconnect Slack');
			}
		} catch {
			toast.error('Failed to disconnect Slack');
		} finally {
			disconnectingSlack = false;
		}
	}
</script>

<SlackSetupModal bind:open={slackModalOpen} />

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Integrations</h2>
		<p class="text-sm text-muted-foreground">Connect your tools and services to HomeTrack</p>
	</div>

	<div class="flex items-center gap-4">
		<Badge variant="outline" class="gap-1">
			<CheckCircle class="size-3 text-green-600" />
			{connectedCount} connected
		</Badge>
		<Badge variant="secondary" class="gap-1">
			{availableCount} available
		</Badge>
	</div>

	{#each grouped() as [category, items]}
		<div class="space-y-3">
			<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">{category}</h3>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each items as card}
					{@const Icon = iconMap[card.icon] || Database}
					{@const status = statusConfig[card.status]}
					{@const StatusIcon = status.icon}
					<Card class="relative transition-all hover:shadow-sm">
						{#if card.demo}
							<div class="absolute top-2 right-2 z-10">
								<Badge variant="secondary" class="text-[10px] px-1.5 py-0 h-4 font-normal opacity-60">
									Demo
								</Badge>
							</div>
						{/if}
						<CardContent class="p-4">
							<div class="flex items-start gap-3">
								<div class="rounded-lg border p-2.5">
									<Icon class="size-5 text-muted-foreground" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<h4 class="font-medium text-sm">{card.name}</h4>
										<Badge variant="outline" class="gap-1 text-xs {status.color} {card.demo ? 'mr-8' : ''}">
											<StatusIcon class="size-3" />
											{status.label}
										</Badge>
									</div>
									<p class="mt-0.5 text-xs text-muted-foreground">{card.description}</p>

									{#if card.status === 'connected'}
										<div class="mt-2 flex items-center justify-between">
											<div class="text-xs text-muted-foreground">
												{#if (card.config as any)?.workspaceName}
													<span>{(card.config as any).workspaceName}</span>
												{/if}
												{#if card.connectedBy}
													<span> &middot; by {card.connectedBy.name}</span>
												{/if}
											</div>
											{#if !card.demo}
												<div class="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														class="h-6 text-xs gap-1"
														disabled={testingSlack}
														onclick={() => testSlackConnection(card)}
													>
														{#if testingSlack}
															<Loader2 class="size-3 animate-spin" />
														{:else}
															<RefreshCw class="size-3" />
														{/if}
														Test
													</Button>
													<Button
														variant="ghost"
														size="sm"
														class="h-6 text-xs gap-1 text-red-500 hover:text-red-600"
														disabled={disconnectingSlack}
														onclick={disconnectSlack}
													>
														<Unplug class="size-3" />
														Disconnect
													</Button>
												</div>
											{/if}
										</div>
									{:else}
										<div class="mt-2">
											{#if card.demo}
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
											{:else}
												<Button
													variant="outline"
													size="sm"
													class="h-7 text-xs"
													onclick={() => { slackModalOpen = true; }}
												>
													Connect
												</Button>
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
