<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { PHASES, PHASE_LIST, type ListingPhase } from '$lib/config';
	import { formatCurrency } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const listings = $derived(data.listings ?? []);
	const tasks = $derived(data.tasks ?? []);
	const aiInsights = $derived(data.aiInsights ?? []);
	const showings = $derived(data.showings ?? []);

	// Computed dashboard values from server data
	const activeCount = $derived(listings.filter((l: any) => l.phase === 'active').length);
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
		Receipt,
		DollarSign,
	} from 'lucide-svelte';

	const avgDom = $derived(Math.round(
		listings.filter((l: any) => l.daysOnMarket > 0).reduce((s: number, l: any) => s + l.daysOnMarket, 0) /
			(listings.filter((l: any) => l.daysOnMarket > 0).length || 1)
	));

	const openTaskCount = $derived(tasks.filter((t: any) => t.status !== 'done').length);

	const pendingQuoteCount = $derived(data.pendingQuoteCount ?? 0);
	const budgetSummary = $derived(data.budgetSummary ?? { totalCommitted: 0, totalEstimated: 0, totalPaid: 0 });

	const deltas = $derived(data.deltas ?? { listingsDelta: 0, pipelineValueDelta: 0, domDelta: 0 });

	function formatDelta(value: number, suffix: string): string {
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value} ${suffix}`;
	}

	const stats = $derived([
		{ label: 'Active Listings', value: String(activeCount), icon: Home, trend: (deltas.listingsDelta >= 0 ? 'up' : 'down') as 'up' | 'down', change: formatDelta(deltas.listingsDelta, 'this month') },
		{ label: 'Avg. Days on Market', value: String(avgDom), icon: Clock, trend: (deltas.domDelta <= 0 ? 'down' : 'up') as 'up' | 'down', change: formatDelta(deltas.domDelta, 'days vs. last quarter') },
		{ label: 'Open Tasks', value: String(openTaskCount), icon: CheckSquare, trend: (overdueTasks.length > 0 ? 'up' : 'down') as 'up' | 'down', change: `${overdueTasks.length} overdue` },
	]);

	// Task filter state
	let taskFilter = $state<'upcoming' | 'overdue'>('upcoming');

	// Reminder dropdown state
	let reminderOpenForTask = $state<string | null>(null);

	/** Generate an .ics calendar file and trigger download */
	function downloadICS(task: any) {
		const start = task.dueDate ? new Date(task.dueDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
		const uid = `task-${task.id}@hometrack`;
		const ics = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//HomeTrack//Tasks//EN',
			'BEGIN:VEVENT',
			`UID:${uid}`,
			`DTSTART:${start}`,
			`SUMMARY:${(task.title ?? '').replace(/[,;\\]/g, ' ')}`,
			`DESCRIPTION:${(task.listing?.property?.address ?? '').replace(/[,;\\]/g, ' ')}`,
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');
		const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${(task.title ?? 'task').replace(/\s+/g, '-').toLowerCase()}.ics`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success('Calendar event downloaded');
	}

	/** Handle reminder selection */
	function setReminder(task: any, option: string) {
		reminderOpenForTask = null;
		toast.success(`Reminder set for ${option}`);
	}

	// Task toggle
	let togglingTasks = $state<Set<string>>(new Set());

	async function toggleTask(task: any) {
		const taskId = task.id;
		const listingId = task.listingId ?? task.listing?.id;
		if (!taskId || !listingId || togglingTasks.has(taskId)) return;

		togglingTasks = new Set([...togglingTasks, taskId]);
		const newStatus = task.status === 'done' ? 'todo' : 'done';

		try {
			const formData = new FormData();
			formData.set('taskId', taskId);
			formData.set('status', newStatus);

			const res = await fetch(`/listings/${listingId}/tasks?/toggleStatus`, {
				method: 'POST',
				body: formData,
			});
			if (res.ok) {
				toast.success(newStatus === 'done' ? 'Task completed' : 'Task reopened');
				await invalidateAll();
			} else {
				toast.error('Failed to update task');
			}
		} catch {
			toast.error('Failed to update task');
		} finally {
			const next = new Set(togglingTasks);
			next.delete(taskId);
			togglingTasks = next;
		}
	}

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

	// Pipeline bar tooltip
	let hoveredPhase = $state<string | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function handleBarHover(e: MouseEvent, phaseKey: string) {
		hoveredPhase = phaseKey;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}

	function handleBarLeave() {
		hoveredPhase = null;
	}
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
			<Button variant="outline" size="sm" href="/mobile/voice-memo">
				<Mic class="mr-1.5 size-4" />
				Voice Memo
			</Button>
			<Button variant="outline" size="sm" href="/mobile/field-notes">
				<FileText class="mr-1.5 size-4" />
				Quick Note
			</Button>
		</div>
	</div>

	<!-- Row 1: Metric Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

		<!-- Pending Quotes -->
		<a href="/vendors/quotes?status=requested">
			<Card class="transition-shadow hover:shadow-md">
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Pending Quotes</CardTitle>
					<Receipt class="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{pendingQuoteCount}</div>
					<p class="text-xs text-muted-foreground">
						{pendingQuoteCount === 1 ? '1 quote awaiting response' : `${pendingQuoteCount} quotes awaiting response`}
					</p>
				</CardContent>
			</Card>
		</a>

		<!-- Budget Summary -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Budget Summary</CardTitle>
				<DollarSign class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{formatCurrency(budgetSummary.totalCommitted + budgetSummary.totalEstimated)}</div>
				<div class="mt-1 space-y-0.5 text-xs text-muted-foreground">
					<p>{formatCurrency(budgetSummary.totalPaid)} paid</p>
					<p>{formatCurrency(budgetSummary.totalCommitted - budgetSummary.totalPaid)} committed</p>
					<p>{formatCurrency(budgetSummary.totalEstimated)} estimated</p>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Row 2: Pipeline Summary Bar -->
	<Card>
		<CardHeader class="pb-3">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Pipeline Summary</CardTitle>
					<CardDescription>{listings.length} listings across {PHASE_LIST.length} phases</CardDescription>
				</div>
				<a href="/listings" class="inline-flex items-center gap-1 text-sm text-primary hover:underline">
					View board <ArrowRight class="size-3.5" />
				</a>
			</div>
		</CardHeader>
		<CardContent>
			{#if listings.length === 0}
				<div class="flex h-12 items-center justify-center rounded-lg bg-muted">
					<p class="text-sm text-muted-foreground">No listings yet</p>
				</div>
			{:else}
				<!-- Stacked horizontal bar -->
				<div class="relative flex h-10 w-full overflow-hidden rounded-lg">
					{#each PHASE_LIST as phase}
						{@const count = listingsByPhase[phase.key]?.length || 0}
						{@const pct = (count / listings.length) * 100}
						{#if count > 0}
							<a
								href="/listings?phase={phase.key}"
								class="relative flex h-full items-center justify-center transition-opacity hover:opacity-80"
								style="width: {pct}%; background-color: {phase.color}"
								onmouseenter={(e) => handleBarHover(e, phase.key)}
								onmousemove={(e) => handleBarHover(e, phase.key)}
								onmouseleave={handleBarLeave}
							>
								{#if pct > 12}
									<span class="text-xs font-medium text-white drop-shadow-sm">{count}</span>
								{/if}
							</a>
						{/if}
					{/each}
				</div>
				<!-- Legend -->
				<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
					{#each PHASE_LIST as phase}
						{@const count = listingsByPhase[phase.key]?.length || 0}
						<div class="flex items-center gap-1.5">
							<span class="size-2 rounded-full shrink-0" style="background-color: {phase.color}"></span>
							<span class="text-xs text-muted-foreground">{phase.label} ({count})</span>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Tooltip (positioned via fixed) -->
	{#if hoveredPhase}
		{@const phase = PHASES[hoveredPhase as ListingPhase]}
		{@const count = listingsByPhase[hoveredPhase]?.length || 0}
		<div
			class="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md"
			style="left: {tooltipX + 12}px; top: {tooltipY - 32}px"
		>
			<span class="font-medium">{phase.label}</span>
			<span class="text-muted-foreground ml-1.5">{count} {count === 1 ? 'listing' : 'listings'}</span>
		</div>
	{/if}

	<!-- Row 3: Upcoming Showings + My Tasks -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Upcoming Showings -->
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
					<div class="space-y-3">
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
								<input
								type="checkbox"
								checked={task.status === 'done'}
								disabled={togglingTasks.has(task.id)}
								onchange={() => toggleTask(task)}
								class="mt-1 size-4 rounded border-border accent-primary cursor-pointer disabled:opacity-50"
							/>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium leading-snug">{task.title}</p>
									<div class="mt-1 flex items-center gap-2">
										<Badge variant={getPriorityVariant(task.priority)} class="text-[10px] px-1.5 py-0">
											{task.priority}
										</Badge>
										<span class="text-xs text-muted-foreground">{task.listing?.property?.address ?? ''}</span>
									</div>
									<p class="text-xs text-muted-foreground mt-0.5">Due {task.dueDate}</p>
								</div>
								<div class="flex items-center gap-1 shrink-0">
									{#if task.isOverdue}
										<Badge variant="destructive" class="text-[10px] mr-1">Overdue</Badge>
									{/if}
									<button
										title="Add to calendar"
onclick={() => downloadICS(task)}
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
														onclick={() => setReminder(task, option)}
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
	</div>

	<!-- Row 4: Recent Activity + Alerts -->
	<div class="grid gap-6 lg:grid-cols-2">
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
</div>
