<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	let { data } = $props();
	const aiInsights = $derived(data.aiInsights ?? []);

	import {
		Sparkles,
		Link2,
		AlertTriangle,
		Lightbulb,
		ShieldAlert,
		ExternalLink,
		X,
		Brain,
		Zap,
		Eye,
		TrendingUp
	} from 'lucide-svelte';

	const tabs = [
		{ href: '/analytics', label: 'Overview', active: false },
		{ href: '/analytics/listings', label: 'Listing Performance', active: false },
		{ href: '/analytics/team', label: 'Team Performance', active: false },
		{ href: '/analytics/insights', label: 'Insights', active: true }
	];

	let dismissedIds = $state<Set<string>>(new Set());

	const activeInsights = $derived(aiInsights.filter((i) => !i.dismissed && !dismissedIds.has(i.id)));

	const insightsByType = $derived({
		connection: activeInsights.filter((i) => i.type === 'connection'),
		anomaly: activeInsights.filter((i) => i.type === 'anomaly'),
		recommendation: activeInsights.filter((i) => i.type === 'recommendation'),
		warning: activeInsights.filter((i) => i.type === 'warning')
	});

	const typeConfig = {
		connection: {
			label: 'Connections',
			icon: Link2,
			color: '#5B8BA5',
			bgColor: 'bg-[#5B8BA5]/10',
			borderColor: 'border-[#5B8BA5]/30',
			description: 'Relationships and matches identified across your data'
		},
		anomaly: {
			label: 'Anomalies',
			icon: AlertTriangle,
			color: '#C49A3C',
			bgColor: 'bg-[#C49A3C]/10',
			borderColor: 'border-[#C49A3C]/30',
			description: 'Unusual patterns that need attention'
		},
		recommendation: {
			label: 'Recommendations',
			icon: Lightbulb,
			color: '#7B8B6F',
			bgColor: 'bg-[#7B8B6F]/10',
			borderColor: 'border-[#7B8B6F]/30',
			description: 'Proactive suggestions to improve outcomes'
		},
		warning: {
			label: 'Warnings',
			icon: ShieldAlert,
			color: '#C4704B',
			bgColor: 'bg-[#C4704B]/10',
			borderColor: 'border-[#C4704B]/30',
			description: 'Time-sensitive items requiring immediate action'
		}
	} as const;

	const summaryStats = $derived([
		{ label: 'Active Insights', value: activeInsights.length, icon: Brain, color: '#C4704B' },
		{ label: 'Connections Found', value: insightsByType.connection.length, icon: Link2, color: '#5B8BA5' },
		{ label: 'Actions Needed', value: insightsByType.warning.length + insightsByType.anomaly.length, icon: Zap, color: '#C49A3C' },
		{ label: 'Recommendations', value: insightsByType.recommendation.length, icon: Lightbulb, color: '#7B8B6F' }
	]);

	function dismiss(id: string) {
		dismissedIds = new Set([...dismissedIds, id]);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-start gap-3">
			<div class="rounded-xl bg-gradient-to-br from-[#C4704B] to-[#C49A3C] p-2.5 shadow-lg shadow-[#C4704B]/20">
				<Sparkles class="size-6 text-white" />
			</div>
			<div>
				<h1 class="font-serif text-2xl font-bold tracking-tight">Insights</h1>
				<p class="text-muted-foreground">Your intelligent assistant analyzing patterns across your business</p>
			</div>
		</div>
		<Badge variant="outline" class="gap-1.5 border-[#C49A3C]/30 text-[#C49A3C] self-start">
			<Sparkles class="size-3" />
			Powered by HomeTrack
		</Badge>
	</div>

	<!-- Sub-nav tabs -->
	<nav class="flex gap-1 border-b">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px {tab.active
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<!-- Summary Cards -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each summaryStats as stat}
			<Card class="relative overflow-hidden">
				<div class="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02]"></div>
				<CardContent class="relative p-4">
					<div class="flex items-center gap-3">
						<div class="rounded-lg p-2" style="background-color: {stat.color}15">
							<stat.icon class="size-5" style="color: {stat.color}" />
						</div>
						<div>
							<p class="text-2xl font-bold font-mono">{stat.value}</p>
							<p class="text-xs text-muted-foreground">{stat.label}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Insight Categories -->
	{#each Object.entries(insightsByType) as [type, insights]}
		{@const config = typeConfig[type as keyof typeof typeConfig]}
		{#if insights.length > 0}
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<config.icon class="size-4" style="color: {config.color}" />
					<h2 class="font-serif text-lg font-semibold">{config.label}</h2>
					<Badge variant="secondary" class="text-xs">{insights.length}</Badge>
					<span class="text-xs text-muted-foreground ml-2">{config.description}</span>
				</div>

				<div class="grid gap-3 lg:grid-cols-2">
					{#each insights as insight (insight.id)}
						<Card class="relative overflow-hidden transition-all hover:shadow-md {config.borderColor} border-l-4" style="border-left-color: {config.color}">
							<CardContent class="p-4">
								<!-- Generated badge -->
								<div class="flex items-start justify-between gap-2 mb-2">
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="gap-1 text-xs border-[#C49A3C]/30 text-[#C49A3C]">
											<Sparkles class="size-2.5" />
											Auto-Generated
										</Badge>
										<span class="text-xs text-muted-foreground"></span>
									</div>
									<button
										onclick={() => dismiss(insight.id)}
										class="rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
									>
										<X class="size-3.5" />
									</button>
								</div>

								<!-- Content -->
								<h3 class="font-semibold text-sm">{insight.title}</h3>
								<p class="mt-1.5 text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

								<!-- Related listing -->
								{#if insight.listingId}
									<div class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
										<Eye class="size-3" />
										<a href="/listings/{insight.listingId}" class="hover:underline hover:text-foreground transition-colors">
											View listing
										</a>
									</div>
								{/if}

								<!-- Action button -->
								{#if insight.actionLabel}
									<div class="mt-3 flex items-center gap-2">
										<Button size="sm" variant="default" class="h-7 text-xs gap-1.5">
											{insight.actionLabel}
											<ExternalLink class="size-3" />
										</Button>
										<Button size="sm" variant="ghost" class="h-7 text-xs" onclick={() => dismiss(insight.id)}>
											Dismiss
										</Button>
									</div>
								{/if}
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	<!-- Empty state if all dismissed -->
	{#if activeInsights.length === 0}
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-16">
				<div class="rounded-full bg-muted p-4">
					<Sparkles class="size-8 text-muted-foreground" />
				</div>
				<h3 class="mt-4 font-serif text-lg font-semibold">All caught up</h3>
				<p class="mt-1 text-sm text-muted-foreground">No active insights right now. Check back soon.</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Explanation footer -->
	<div class="rounded-xl border border-dashed p-4">
		<div class="flex items-start gap-3">
			<TrendingUp class="size-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
			<div>
				<p class="text-sm font-medium text-muted-foreground">How HomeTrack Insights work</p>
				<p class="mt-1 text-xs text-muted-foreground/70 leading-relaxed">
					HomeTrack continuously analyzes your listings, contacts, market data, and team activity to surface
					actionable insights. It identifies buyer-listing matches from your contact network, detects performance
					anomalies before they become problems, and recommends timing and pricing strategies based on comparable
					sales and seasonal patterns. All insights are generated locally from your data — nothing is shared externally.
				</p>
			</div>
		</div>
	</div>
</div>
