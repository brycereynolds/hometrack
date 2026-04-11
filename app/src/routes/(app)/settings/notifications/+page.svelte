<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Bell,
		Mail,
		Smartphone,
		CheckSquare,
		MessageSquare,
		Home,
		Sparkles,
		Moon,
		Clock
	} from 'lucide-svelte';

	type Channel = 'inApp' | 'email' | 'push';

	interface NotificationPref {
		id: string;
		label: string;
		description: string;
		channels: Record<Channel, boolean>;
	}

	interface NotificationCategory {
		label: string;
		icon: typeof Bell;
		prefs: NotificationPref[];
	}

	let categories = $state<NotificationCategory[]>([
		{
			label: 'Task Notifications',
			icon: CheckSquare,
			prefs: [
				{ id: 'task-assigned', label: 'Task assigned to me', description: 'When a new task is assigned', channels: { inApp: true, email: true, push: true } },
				{ id: 'task-overdue', label: 'Task overdue', description: 'When a task passes its due date', channels: { inApp: true, email: true, push: true } },
				{ id: 'task-completed', label: 'Task completed', description: 'When a team member completes a task', channels: { inApp: true, email: false, push: false } }
			]
		},
		{
			label: 'Communication',
			icon: MessageSquare,
			prefs: [
				{ id: 'new-message', label: 'New messages', description: 'Client or agent messages', channels: { inApp: true, email: true, push: true } },
				{ id: 'new-email', label: 'Email received', description: 'Synced email from connected accounts', channels: { inApp: true, email: false, push: false } },
				{ id: 'client-action', label: 'Client actions', description: 'Document signatures, portal activity', channels: { inApp: true, email: true, push: false } }
			]
		},
		{
			label: 'Listing Updates',
			icon: Home,
			prefs: [
				{ id: 'phase-change', label: 'Phase changes', description: 'When a listing moves to a new phase', channels: { inApp: true, email: true, push: false } },
				{ id: 'new-showing', label: 'New showings', description: 'Showing requests and confirmations', channels: { inApp: true, email: true, push: true } },
				{ id: 'new-offer', label: 'New offers', description: 'When an offer is submitted', channels: { inApp: true, email: true, push: true } }
			]
		},
		{
			label: 'Alerts',
			icon: Sparkles,
			prefs: [
				{ id: 'ai-connection', label: 'Connections found', description: 'Buyer-listing matches and agent connections', channels: { inApp: true, email: false, push: false } },
				{ id: 'ai-anomaly', label: 'Anomalies detected', description: 'Unusual patterns in views, showings, or pricing', channels: { inApp: true, email: true, push: false } },
				{ id: 'ai-recommendation', label: 'Recommendations', description: 'Pricing, timing, and strategy suggestions', channels: { inApp: true, email: false, push: false } }
			]
		}
	]);

	let quietHoursEnabled = $state(true);
	let quietStart = $state('22:00');
	let quietEnd = $state('07:00');
	let digestFrequency = $state('realtime');

	const channelIcons = {
		inApp: Bell,
		email: Mail,
		push: Smartphone
	};

	const channelLabels = {
		inApp: 'In-app',
		email: 'Email',
		push: 'Push'
	};

	function toggle(catIndex: number, prefIndex: number, channel: Channel) {
		categories[catIndex].prefs[prefIndex].channels[channel] = !categories[catIndex].prefs[prefIndex].channels[channel];
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Notification Preferences</h2>
		<p class="text-sm text-muted-foreground">Choose how and when you want to be notified</p>
	</div>

	<!-- Channel legend -->
	<div class="flex items-center gap-4">
		{#each Object.entries(channelLabels) as [key, label]}
			{@const Icon = channelIcons[key as Channel]}
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Icon class="size-3.5" />
				<span>{label}</span>
			</div>
		{/each}
	</div>

	<!-- Notification categories -->
	{#each categories as cat, catIndex}
		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="flex items-center gap-2 text-base">
					<cat.icon class="size-4" />
					{cat.label}
				</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y">
					{#each cat.prefs as pref, prefIndex}
						<div class="flex items-center justify-between px-6 py-3">
							<div>
								<p class="text-sm font-medium">{pref.label}</p>
								<p class="text-xs text-muted-foreground">{pref.description}</p>
							</div>
							<div class="flex items-center gap-3">
								{#each (['inApp', 'email', 'push'] as Channel[]) as channel}
									{@const Icon = channelIcons[channel]}
									<button
										onclick={() => toggle(catIndex, prefIndex, channel)}
										class="flex items-center justify-center size-8 rounded-md border transition-colors
											{pref.channels[channel]
												? 'bg-primary/10 border-primary/30 text-primary'
												: 'bg-muted/50 border-transparent text-muted-foreground/40 hover:text-muted-foreground'}"
									>
										<Icon class="size-3.5" />
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/each}

	<!-- Quiet Hours -->
	<Card>
		<CardHeader class="pb-3">
			<CardTitle class="flex items-center gap-2 text-base">
				<Moon class="size-4" />
				Quiet Hours
			</CardTitle>
			<CardDescription>Suppress push notifications during these hours</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex items-center gap-4">
				<button
					onclick={() => quietHoursEnabled = !quietHoursEnabled}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {quietHoursEnabled ? 'bg-primary' : 'bg-muted'}"
				>
					<span class="inline-block size-4 transform rounded-full bg-white transition-transform shadow {quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'}"></span>
				</button>
				{#if quietHoursEnabled}
					<div class="flex items-center gap-2 text-sm">
						<input
							type="time"
							bind:value={quietStart}
							class="rounded-md border bg-transparent px-2 py-1 text-sm"
						/>
						<span class="text-muted-foreground">to</span>
						<input
							type="time"
							bind:value={quietEnd}
							class="rounded-md border bg-transparent px-2 py-1 text-sm"
						/>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Digest Frequency -->
	<Card>
		<CardHeader class="pb-3">
			<CardTitle class="flex items-center gap-2 text-base">
				<Clock class="size-4" />
				Digest Frequency
			</CardTitle>
			<CardDescription>How often to receive email digest summaries</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex gap-2">
				{#each [
					{ value: 'realtime', label: 'Real-time' },
					{ value: 'daily', label: 'Daily digest' },
					{ value: 'weekly', label: 'Weekly digest' }
				] as option}
					<button
						onclick={() => digestFrequency = option.value}
						class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors
							{digestFrequency === option.value
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background hover:bg-muted'}"
					>
						{option.label}
					</button>
				{/each}
			</div>
		</CardContent>
	</Card>

	<div class="flex justify-end">
		<Button>Save Preferences</Button>
	</div>
</div>
