<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Chart, registerables } from 'chart.js';
	import {
		Calendar,
		Clock,
		Star,
		Users,
		ThumbsUp,
		ThumbsDown,
		Minus,
		MessageSquare,
		Plus,
		TrendingUp,
		ArrowRight,
		Building2
	} from 'lucide-svelte';

	Chart.register(...registerables);

	let { data } = $props();
	const listing = $derived(data.listing);
	const listingShowings = $derived(data.showings ?? []);
	const showingsTimeSeries = $derived(data.showingsTimeSeries ?? { labels: [] as string[], showings: [] as number[], openHouseAttendees: [] as number[] });

	const upcomingShowings = $derived(
		listingShowings.filter((s: any) => new Date(s.date) >= new Date())
	);
	const pastShowings = $derived(
		listingShowings.filter((s: any) => new Date(s.date) < new Date())
	);

	const veryInterested = $derived(listingShowings.filter((s: any) => s.interestedLevel === 'very').length);
	const somewhatInterested = $derived(listingShowings.filter((s: any) => s.interestedLevel === 'somewhat').length);

	let funnelCanvas: HTMLCanvasElement;
	let volumeCanvas: HTMLCanvasElement;
	let funnelChart: Chart | null = null;
	let volumeChart: Chart | null = null;

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(() => {
		funnelChart = new Chart(funnelCanvas, {
			type: 'bar',
			data: {
				labels: ['Showings', 'Very Interested', 'Offers'],
				datasets: [{ data: [listingShowings.length, veryInterested, listing?.offersCount ?? 0], backgroundColor: ['#C4704B', '#D4956B', '#5B8BA5'], borderWidth: 0, borderRadius: 6, barPercentage: 0.6 }]
			},
			options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 11 } } }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} total` } } } }
		});

		volumeChart = new Chart(volumeCanvas, {
			type: 'bar',
			data: {
				labels: showingsTimeSeries.labels,
				datasets: [
					{ label: 'Private Showings', data: showingsTimeSeries.showings, backgroundColor: '#C4704B', borderRadius: 4, barPercentage: 0.7 },
					{ label: 'Open House Attendees', data: showingsTimeSeries.openHouseAttendees, backgroundColor: '#D4956B80', borderRadius: 4, barPercentage: 0.7 }
				]
			},
			options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } }, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } } } }
		});

		return () => { funnelChart?.destroy(); volumeChart?.destroy(); };
	});

	function getInterestBadge(level?: string) {
		switch (level) {
			case 'very': return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Very Interested', icon: ThumbsUp };
			case 'somewhat': return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Somewhat', icon: Minus };
			case 'not': return { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Not Interested', icon: ThumbsDown };
			default: return { color: 'bg-gray-100 text-gray-500', label: 'No Feedback', icon: Minus };
		}
	}

	function getStars(rating?: number) {
		return Array(5).fill(0).map((_, i) => i < (rating || 0));
	}
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div><h2 class="font-serif text-lg font-semibold">Showings</h2><p class="text-sm text-muted-foreground">{listingShowings.length} total showings</p></div>
			<Button size="sm"><Plus class="mr-1.5 size-4" />Schedule Showing</Button>
		</div>

		<!-- Charts Row -->
		<div class="grid gap-6 lg:grid-cols-2">
			<Card><CardHeader><CardTitle class="font-serif text-base">Conversion Funnel</CardTitle><CardDescription>Showings to offers pipeline</CardDescription></CardHeader><CardContent><div class="h-48"><canvas bind:this={funnelCanvas}></canvas></div></CardContent></Card>
			<Card><CardHeader><CardTitle class="font-serif text-base">Showing Volume</CardTitle><CardDescription>Weekly showing activity</CardDescription></CardHeader><CardContent><div class="h-48"><canvas bind:this={volumeCanvas}></canvas></div></CardContent></Card>
		</div>

		<!-- Upcoming Showings -->
		{#if upcomingShowings.length > 0}
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Upcoming Showings</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each upcomingShowings as showing}
							<div class="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
								<div class="rounded-lg bg-primary/10 p-2.5 shrink-0 text-center min-w-[56px]">
									<p class="text-xs text-primary/70 font-medium">{new Date(showing.date).toLocaleDateString('en-US', { month: 'short' })}</p>
									<p class="text-lg font-bold text-primary leading-tight">{new Date(showing.date).getDate()}</p>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm">{showing.agentName}</span>
										<span class="text-xs text-muted-foreground">-- {showing.agentCompany}</span>
									</div>
									<div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
										<span class="flex items-center gap-1"><Clock class="size-3" />{showing.time}</span>
										<span class="flex items-center gap-1"><Users class="size-3" />{showing.buyerType}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Past Showings with Feedback -->
		{#if pastShowings.length > 0}
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Past Showings & Feedback</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each pastShowings as showing}
							{@const interest = getInterestBadge(showing.interestedLevel ?? undefined)}
							{@const InterestIcon = interest.icon}
							<div class="py-4 first:pt-0 last:pb-0">
								<div class="flex items-start justify-between gap-4">
									<div class="flex items-start gap-3">
										<Avatar class="size-9 shrink-0"><AvatarFallback class="text-xs bg-muted">{(showing.agentName ?? '').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
										<div>
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium">{showing.agentName}</span>
												<span class="text-xs text-muted-foreground">{showing.agentCompany}</span>
											</div>
											<div class="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
												<span>{formatDate(showing.date)}</span>
												<span>{showing.time}</span>
												<Badge variant="secondary" class="text-[10px] font-normal">{showing.buyerType}</Badge>
											</div>
										</div>
									</div>
									<Badge variant="outline" class="text-[10px] shrink-0 {interest.color}"><InterestIcon class="mr-1 size-3" />{interest.label}</Badge>
								</div>
								{#if showing.rating}
									<div class="mt-2 ml-12 flex items-center gap-1">
										{#each getStars(showing.rating) as filled}<Star class="size-3.5 {filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}" />{/each}
										<span class="text-xs text-muted-foreground ml-1">{showing.rating}/5</span>
									</div>
								{/if}
								{#if showing.feedback}
									<div class="mt-2 ml-12 rounded-md bg-muted/50 p-3"><div class="flex items-start gap-2"><MessageSquare class="size-3.5 text-muted-foreground mt-0.5 shrink-0" /><p class="text-sm text-muted-foreground">{showing.feedback}</p></div></div>
								{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if listingShowings.length === 0}
			<Card><CardContent class="flex flex-col items-center justify-center py-12"><Calendar class="size-10 text-muted-foreground/30 mb-3" /><p class="text-sm text-muted-foreground">No showings scheduled yet.</p><Button variant="outline" size="sm" class="mt-3">Schedule First Showing</Button></CardContent></Card>
		{/if}
	</div>
{/if}
