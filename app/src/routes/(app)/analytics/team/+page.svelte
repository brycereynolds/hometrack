<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { formatCurrency } from '$lib/utils';

	let { data } = $props();

	const teamPerformanceData = $derived(data.teamPerformanceData ?? { members: [] as string[], activeTasks: [] as number[], completedThisMonth: [] as number[], avgCompletionDays: [] as number[] });
	const memberTaskCounts = $derived(data.memberTaskCounts ?? []);
	const projectedCommission = $derived(data.projectedCommission ?? 0);
	const ytdClosed = $derived(data.ytdClosed ?? 0);
	import { Users, CheckCircle, Clock, DollarSign, BarChart3, PieChart } from 'lucide-svelte';

	Chart.register(...registerables);

	const tabs = [
		{ href: '/analytics', label: 'Overview', active: false },
		{ href: '/analytics/listings', label: 'Listing Performance', active: false },
		{ href: '/analytics/team', label: 'Team Performance', active: true },
		{ href: '/analytics/insights', label: 'Insights', active: false }
	];

	let tasksCanvas: HTMLCanvasElement;
	let workloadCanvas: HTMLCanvasElement;
	let completionCanvas: HTMLCanvasElement;
	let tasksChart: Chart | undefined;
	let workloadChart: Chart | undefined;
	let completionChart: Chart | undefined;

	onMount(() => {
		tasksChart = new Chart(tasksCanvas, {
			type: 'bar',
			data: {
				labels: teamPerformanceData.members,
				datasets: [
					{
						label: 'Completed This Month',
						data: teamPerformanceData.completedThisMonth,
						backgroundColor: 'rgba(196, 112, 75, 0.8)',
						borderColor: '#C4704B',
						borderWidth: 1,
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				indexAxis: 'y',
				plugins: {
					legend: { display: false }
				},
				scales: {
					x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
					y: { grid: { display: false } }
				}
			}
		});

		workloadChart = new Chart(workloadCanvas, {
			type: 'doughnut',
			data: {
				labels: teamPerformanceData.members,
				datasets: [
					{
						data: teamPerformanceData.activeTasks,
						backgroundColor: ['#C4704B', '#7B8B6F', '#5B8BA5', '#C49A3C', '#D4956B'],
						borderWidth: 2,
						borderColor: '#fff'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '60%',
				plugins: {
					legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } }
				}
			}
		});

		completionChart = new Chart(completionCanvas, {
			type: 'bar',
			data: {
				labels: teamPerformanceData.members,
				datasets: [
					{
						label: 'Avg Days to Complete',
						data: teamPerformanceData.avgCompletionDays,
						backgroundColor: [
							'rgba(91, 139, 165, 0.8)',
							'rgba(91, 139, 165, 0.8)',
							'rgba(123, 139, 111, 0.8)',
							'rgba(196, 154, 60, 0.8)',
							'rgba(212, 149, 107, 0.8)'
						],
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'Days' } },
					x: { grid: { display: false } }
				}
			}
		});

		return () => {
			tasksChart?.destroy();
			workloadChart?.destroy();
			completionChart?.destroy();
		};
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Team Performance</h1>
		<p class="text-muted-foreground">Productivity metrics and workload distribution</p>
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

	<!-- Team Member Cards -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each memberTaskCounts as member}
			<Card class="relative">
				{#if member.overdueTasks > 0}
					<div class="absolute top-2 right-2">
						<span class="inline-block size-2 rounded-full bg-red-500"></span>
					</div>
				{/if}
				<CardContent class="p-4 text-center">
					<Avatar class="mx-auto size-12">
						<AvatarFallback class="bg-primary/10 text-primary font-medium">{member.initials}</AvatarFallback>
					</Avatar>
					<p class="mt-2 font-medium text-sm">{member.name}</p>
					<Badge variant="outline" class="mt-1 text-xs">{member.roleLabel}</Badge>
					<div class="mt-3 grid grid-cols-3 gap-1 text-center">
						<div>
							<p class="text-lg font-bold font-mono">{member.activeTasks}</p>
							<p class="text-[10px] text-muted-foreground">Active</p>
						</div>
						<div>
							<p class="text-lg font-bold font-mono text-green-600">{member.completedTasks}</p>
							<p class="text-[10px] text-muted-foreground">Done</p>
						</div>
						<div>
							<p class="text-lg font-bold font-mono {member.overdueTasks > 0 ? 'text-red-500' : ''}">{member.overdueTasks}</p>
							<p class="text-[10px] text-muted-foreground">Overdue</p>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Charts row -->
	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="font-serif flex items-center gap-2">
					<BarChart3 class="size-4 text-[#C4704B]" />
					Tasks Completed This Month
				</CardTitle>
				<CardDescription>Individual task completion counts for April</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="h-56">
					<canvas bind:this={tasksCanvas}></canvas>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="font-serif flex items-center gap-2">
					<PieChart class="size-4 text-[#7B8B6F]" />
					Workload Distribution
				</CardTitle>
				<CardDescription>Active tasks distributed across team members</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="h-56">
					<canvas bind:this={workloadCanvas}></canvas>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Completion time chart -->
	<Card>
		<CardHeader>
			<CardTitle class="font-serif flex items-center gap-2">
				<Clock class="size-4 text-[#5B8BA5]" />
				Average Task Completion Time
			</CardTitle>
			<CardDescription>Average number of days to complete tasks by team member</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="h-56">
				<canvas bind:this={completionCanvas}></canvas>
			</div>
		</CardContent>
	</Card>

	<!-- Revenue Tracking -->
	<Card>
		<CardHeader>
			<CardTitle class="font-serif flex items-center gap-2">
				<DollarSign class="size-4 text-[#C49A3C]" />
				Revenue Tracking
			</CardTitle>
			<CardDescription>Commission projections and year-to-date performance</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-lg border p-4">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Projected Commission</p>
					<p class="mt-1 text-2xl font-bold font-mono">{formatCurrency(projectedCommission)}</p>
					<p class="mt-1 text-xs text-muted-foreground">2.5% avg on active pipeline</p>
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">YTD Closed Commission</p>
					<p class="mt-1 text-2xl font-bold font-mono text-green-600">{formatCurrency(ytdClosed)}</p>
					<p class="mt-1 text-xs text-muted-foreground">6 transactions closed</p>
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Commission/Deal</p>
					<p class="mt-1 text-2xl font-bold font-mono">{formatCurrency(ytdClosed / 6)}</p>
					<p class="mt-1 text-xs text-muted-foreground">$2.41M avg sale price</p>
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline Coverage</p>
					<p class="mt-1 text-2xl font-bold font-mono">3.2x</p>
					<p class="mt-1 text-xs text-muted-foreground">Pipeline vs YTD target</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Team Efficiency Metrics -->
	<Card>
		<CardHeader>
			<CardTitle class="font-serif">Team Efficiency Metrics</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div class="flex items-center gap-3 rounded-lg border p-3">
					<CheckCircle class="size-8 text-green-500" />
					<div>
						<p class="text-sm font-medium">On-Time Task Rate</p>
						<p class="text-xl font-bold font-mono">92%</p>
					</div>
				</div>
				<div class="flex items-center gap-3 rounded-lg border p-3">
					<Users class="size-8 text-[#5B8BA5]" />
					<div>
						<p class="text-sm font-medium">Client Response Time</p>
						<p class="text-xl font-bold font-mono">&lt; 2 hrs</p>
					</div>
				</div>
				<div class="flex items-center gap-3 rounded-lg border p-3">
					<Clock class="size-8 text-[#C49A3C]" />
					<div>
						<p class="text-sm font-medium">Avg Days to List</p>
						<p class="text-xl font-bold font-mono">18 days</p>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
