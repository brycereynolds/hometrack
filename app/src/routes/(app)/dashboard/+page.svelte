<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { PHASES, PHASE_LIST, type ListingPhase } from '$lib/config';
	import { formatCurrency } from '$lib/utils';

	let { data } = $props();

	const listings = $derived(data.listings ?? []);
	const tasks = $derived(data.tasks ?? []);
	const aiInsights = $derived(data.aiInsights ?? []);
	const showings = $derived(data.showings ?? []);
	const teamPerformanceData = $derived(data.teamPerformanceData ?? { members: [] as string[], activeTasks: [] as number[], completedThisMonth: [] as number[], avgCompletionDays: [] as number[] });

	// Computed dashboard values from server data
	const activeCount = $derived(listings.filter((l: any) => l.phase === 'active').length);
	const pipelineValue = $derived(formatCurrency(data.pipelineValue ?? 0));
	const overdueTasks = $derived(data.overdueTasks ?? []);
	const recentActivity = $derived(data.recentActivity ?? []);
	const listingsByPhase = $derived((() => {
		const grouped: Record<string, any[]> = {};
		for (const listing of listings) {
			const phase = (listing as any).phase;
			if (!grouped[phase]) grouped[phase] = [];
			grouped[phase].push(listing);
		}
		return grouped;
	})());

	import {
		TrendingUp,
		TrendingDown,
		Home,
		DollarSign,
		Clock,
		CheckSquare,
		Plus,
		Mic,
		FileText,
		ArrowRight,
		AlertTriangle,
		Lightbulb,
		Link,
		Eye,
		X,
		Check,
		Calendar,
		CalendarPlus,
		Bell,
		Mail,
		MessageSquare,
		StickyNote,
		Sparkles,
		ChevronRight,
		MapPin,
	} from 'lucide-svelte';
	import { Chart, registerables } from 'chart.js';
	Chart.register(...registerables);

	const avgDom = $derived(Math.round(
		listings.filter((l: any) => l.daysOnMarket > 0).reduce((s: number, l: any) => s + l.daysOnMarket, 0) /
			(listings.filter((l: any) => l.daysOnMarket > 0).length || 1)
	));

	const openTaskCount = $derived(tasks.filter((t: any) => t.status !== 'done').length);

	const stats = $derived([
		{ label: 'Active Listings', value: String(activeCount), icon: Home, trend: 'up' as const, change: '+2 this month' },
		{ label: 'Pipeline Value', value: pipelineValue, icon: DollarSign, trend: 'up' as const, change: '+$1.2M from last month' },
		{ label: 'Avg. Days on Market', value: String(avgDom), icon: Clock, trend: 'down' as const, change: '-3 days vs. last quarter' },
		{ label: 'Open Tasks', value: String(openTaskCount), icon: CheckSquare, trend: 'up' as const, change: `${overdueTasks.length} overdue` },
	]);

	// Task filter state
	let taskFilter = $state<'upcoming' | 'overdue'>('upcoming');
	const todayStr = '2026-04-09';

	// Reminder dropdown state
	let reminderOpenForTask = $state<string | null>(null);

	let filteredTasks = $derived(
		(() => {
			const allOpen = tasks.filter((t: any) => t.status !== 'done');
			switch (taskFilter) {
				case 'overdue':
					return allOpen.filter((t: any) => t.isOverdue);
				case 'upcoming':
					return allOpen.filter((t: any) => !t.isOverdue).sort((a: any, b: any) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
			}
		})()
	);

	// AI Insights (non-dismissed)
	let dismissedIds = $state<Set<string>>(new Set());
	let visibleInsights = $derived(aiInsights.filter((a: any) => !a.dismissed && !dismissedIds.has(a.id)));

	// Today's showings
	const todayShowings = $derived(showings.slice(0, 3));

	// Activity type icons mapping
	function getActivityIcon(type: string) {
		switch (type) {
			case 'message': return MessageSquare;
			case 'email': return Mail;
			case 'note': return StickyNote;
			case 'voice_memo': return Mic;
			case 'phase_change': return ArrowRight;
			case 'task_complete': return Check;
			case 'ai_insight': return Sparkles;
			default: return Home;
		}
	}

	function getInsightBorderColor(type: string) {
		switch (type) {
			case 'warning': return 'border-l-amber-500';
			case 'anomaly': return 'border-l-amber-500';
			case 'connection': return 'border-l-blue-500';
			case 'recommendation': return 'border-l-blue-500';
			default: return 'border-l-border';
		}
	}

	function getInsightIcon(type: string) {
		switch (type) {
			case 'warning': return AlertTriangle;
			case 'anomaly': return Eye;
			case 'connection': return Link;
			case 'recommendation': return Lightbulb;
			default: return Sparkles;
		}
	}

	function getInsightIconColor(type: string) {
		switch (type) {
			case 'warning': case 'anomaly': return 'text-amber-500';
			case 'connection': case 'recommendation': return 'text-blue-500';
			default: return 'text-muted-foreground';
		}
	}

	// Priority styles
	function getPriorityVariant(priority: string): 'destructive' | 'default' | 'secondary' | 'outline' {
		switch (priority) {
			case 'urgent': return 'destructive';
			case 'high': return 'default';
			case 'medium': return 'secondary';
			default: return 'outline';
		}
	}

	// Workload chart
	let workloadCanvas: HTMLCanvasElement;

	onMount(() => {
		new Chart(workloadCanvas, {
			type: 'bar',
			data: {
				labels: teamPerformanceData.members,
				datasets: [
					{
						label: 'Active Tasks',
						data: teamPerformanceData.activeTasks,
						backgroundColor: '#C4704B',
						borderRadius: 4,
						barThickness: 20,
					},
					{
						label: 'Completed This Month',
						data: teamPerformanceData.completedThisMonth,
						backgroundColor: '#7B8B6F',
						borderRadius: 4,
						barThickness: 20,
					},
				],
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 16 },
					},
				},
				scales: {
					x: { grid: { display: false }, ticks: { font: { size: 11 } } },
					y: { grid: { display: false }, ticks: { font: { size: 11 } } },
				},
			},
		});
	});
</script>

<div class="space-y-6">
	<!-- Header with Quick Actions -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-2xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-muted-foreground">Welcome back, {data.currentUser?.name?.split(' ')[0] ?? 'there'}. Here's your overview for today.</p>
		</div>
		<div class="flex items-center gap-2">
			<a href="/listings/new">
				<Button size="sm">
					<Plus class="mr-1.5 size-4" />
					New Listing
				</Button>
			</a>
			<Button variant="outline" size="sm">
				<Mic class="mr-1.5 size-4" />
				Voice Memo
			</Button>
			<Button variant="outline" size="sm">
				<FileText class="mr-1.5 size-4" />
				Quick Note
			</Button>
		</div>
	</div>

	<!-- Stat Cards Row -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
					<stat.icon class="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{stat.value}</div>
					<p class="flex items-center gap-1 text-xs text-muted-foreground">
						{#if stat.trend === 'up'}
							<TrendingUp class="size-3 text-emerald-500" />
						{:else}
							<TrendingDown class="size-3 text-amber-500" />
						{/if}
						{stat.change}
					</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Middle Row: Pipeline Summary + Team Workload -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Pipeline Summary -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>Pipeline Summary</CardTitle>
						<CardDescription>{listings.length} listings across 4 stages</CardDescription>
					</div>
					<a href="/listings" class="inline-flex items-center gap-1 text-sm text-primary hover:underline">
						View board <ArrowRight class="size-3.5" />
					</a>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each PHASE_LIST as phase}
						{@const count = listingsByPhase[phase.key]?.length || 0}
						{@const phaseListings = listingsByPhase[phase.key] || []}
						<a href="/listings?phase={phase.key}" class="group block">
							<div class="flex items-center justify-between mb-1.5">
								<div class="flex items-center gap-2">
									<span class="size-2.5 rounded-full shrink-0" style="background-color: {phase.color}"></span>
									<span class="text-sm font-medium group-hover:text-primary transition-colors">{phase.label}</span>
								</div>
								<span class="text-sm text-muted-foreground tabular-nums">{count}</span>
							</div>
							<div class="h-2 w-full rounded-full bg-muted overflow-hidden">
								<div
									class="h-full rounded-full transition-all"
									style="width: {(count / listings.length) * 100}%; background-color: {phase.color}"
								></div>
							</div>
							{#if count > 0}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each phaseListings as listing}
										<span class="text-xs text-muted-foreground">{listing.address.split(' ').slice(0, 2).join(' ')}{phaseListings.indexOf(listing) < phaseListings.length - 1 ? ',' : ''}</span>
									{/each}
								</div>
							{/if}
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Team Workload Chart -->
		<Card>
			<CardHeader>
				<CardTitle>Team Workload</CardTitle>
				<CardDescription>Active tasks and completions by team member</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="h-[280px]">
					<canvas bind:this={workloadCanvas}></canvas>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Bottom Row: Tasks, Activity, Alerts -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- My Tasks -->
		<Card>
			<CardHeader class="pb-3">
				<div class="flex items-center justify-between">
					<CardTitle>My Tasks</CardTitle>
					<div class="flex gap-1">
						<button
							onclick={() => taskFilter = 'upcoming'}
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {taskFilter === 'upcoming' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}"
						>
							Upcoming
						</button>
						<button
							onclick={() => taskFilter = 'overdue'}
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {taskFilter === 'overdue' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:bg-muted'}"
						>
							Overdue
						</button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{#if filteredTasks.length === 0}
					<p class="text-sm text-muted-foreground py-6 text-center">No tasks in this category</p>
				{:else}
					<div class="divide-y">
						{#each filteredTasks.slice(0, 6) as task}
							<div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
								<input type="checkbox" class="mt-1 size-4 rounded border-border accent-primary cursor-pointer" />
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium leading-snug">{task.title}</p>
									<div class="mt-1 flex items-center gap-2">
										<Badge variant={getPriorityVariant(task.priority)} class="text-[10px] px-1.5 py-0">
											{task.priority}
										</Badge>
										<span class="text-xs text-muted-foreground">{task.listing?.address ?? ''}</span>
									</div>
									<p class="text-xs text-muted-foreground mt-0.5">Due {task.dueDate}</p>
								</div>
								<div class="flex items-center gap-1 shrink-0">
									{#if task.isOverdue}
										<Badge variant="destructive" class="text-[10px] mr-1">Overdue</Badge>
									{/if}
									<button
										title="Add to calendar"
										class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
									>
										<CalendarPlus class="size-3.5" />
									</button>
									<div class="relative">
										<button
											title="Set reminder"
											onclick={() => reminderOpenForTask = reminderOpenForTask === task.id ? null : task.id}
											class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
										>
											<Bell class="size-3.5" />
										</button>
										{#if reminderOpenForTask === task.id}
											<div class="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
												{#each ['1 hour before', '1 day before', 'Morning of', 'Custom'] as option}
													<button
														onclick={() => reminderOpenForTask = null}
														class="w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
													>
														{option}
													</button>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Recent Activity -->
		<Card>
			<CardHeader class="pb-3">
				<div class="flex items-center justify-between">
					<CardTitle>Recent Activity</CardTitle>
					<a href="/listings" class="text-xs text-primary hover:underline">View all</a>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each recentActivity.slice(0, 6) as item}
						{@const ActivityIcon = getActivityIcon(item.type)}
						<div class="flex gap-3">
							<div class="relative shrink-0">
								<Avatar class="size-8">
									<AvatarFallback class="bg-muted text-xs font-medium">{item.authorInitials}</AvatarFallback>
								</Avatar>
								<div class="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-background border">
									<ActivityIcon class="size-2.5 text-muted-foreground" />
								</div>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium truncate">{item.authorName}</span>
									<span class="text-xs text-muted-foreground shrink-0"></span>
								</div>
								<p class="mt-0.5 text-sm text-muted-foreground line-clamp-2">{item.content}</p>
								{#if item.listingId}
									<a href="/listings/{item.listingId}" class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
										<MapPin class="size-3" />
										View listing
									</a>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Alerts -->
		<Card>
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<Sparkles class="size-4 text-amber-500" />
					<CardTitle>Alerts</CardTitle>
				</div>
				<CardDescription>{visibleInsights.length} insights need your attention</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each visibleInsights.slice(0, 5) as insight}
						{@const InsightIcon = getInsightIcon(insight.type)}
						<div class="rounded-md border border-l-4 {getInsightBorderColor(insight.type)} p-3">
							<div class="flex items-start justify-between gap-2">
								<div class="flex items-start gap-2 min-w-0">
									<InsightIcon class="size-4 shrink-0 mt-0.5 {getInsightIconColor(insight.type)}" />
									<div class="min-w-0">
										<p class="text-sm font-medium leading-snug">{insight.title}</p>
										<p class="mt-1 text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
										<div class="mt-2 flex items-center gap-2">
											{#if insight.actionLabel}
												<a href={insight.actionUrl || '#'} class="text-xs font-medium text-primary hover:underline">
													{insight.actionLabel}
												</a>
											{/if}
											<span class="text-xs text-muted-foreground"></span>
										</div>
									</div>
								</div>
								<button
									onclick={() => dismissedIds = new Set([...dismissedIds, insight.id])}
									class="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
								>
									<X class="size-3.5" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Calendar / Upcoming Showings -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Calendar class="size-4 text-muted-foreground" />
					<CardTitle>Upcoming Showings</CardTitle>
				</div>
				<a href="/listings" class="text-xs text-primary hover:underline">View calendar</a>
			</div>
		</CardHeader>
		<CardContent>
			{#if todayShowings.length === 0}
				<p class="text-sm text-muted-foreground py-4 text-center">No upcoming showings scheduled</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each todayShowings as showing}
						<a href="/listings/{showing.listingId}" class="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
							<div class="text-center shrink-0">
								<div class="text-lg font-bold leading-tight">{new Date(showing.date).getDate()}</div>
								<div class="text-xs text-muted-foreground">Apr</div>
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium group-hover:text-primary transition-colors">Showing</p>
								<p class="text-xs text-muted-foreground">{showing.time} &middot; {showing.agentName}</p>
								<p class="text-xs text-muted-foreground">{showing.agentCompany} &middot; {showing.buyerType}</p>
							</div>
							<ChevronRight class="size-4 text-muted-foreground shrink-0 mt-1" />
						</a>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
