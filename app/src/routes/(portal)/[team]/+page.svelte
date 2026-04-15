<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Home,
		Clock,
		CheckCircle,
		Eye,
		Heart,
		Calendar,
		TrendingUp,
		Camera,
		Megaphone,
		Users,
		FileText,
		ArrowRight,
		Circle
	} from 'lucide-svelte';
	import { PHASES, PHASE_LIST } from '$lib/config';
	import { formatCurrency } from '$lib/utils';

	let { data } = $props();

	const listing = $derived(data.listing);
	const sections = $derived(data.portalSettings?.sections ?? {});
	const sectionEnabled = (key: string) => sections[key] !== false;
	const allPhases = PHASE_LIST;
	const currentPhaseOrder = $derived(listing ? PHASES[listing.phase].order : 0);

	// Recent updates relevant to client
	const recentUpdates = $derived(
		(data.recentActivity ?? [])
			.filter((a: any) => !listing || a.listingId === listing.id)
			.slice(0, 5)
	);

	// Showings for this listing
	const listingShowings = $derived(
		(data.showings ?? []).filter((s: any) => !listing || s.listingId === listing.id)
	);

	// Milestones
	const milestones = [
		{ label: 'Photography', status: 'complete', detail: 'Complete', icon: Camera },
		{ label: 'MLS Listing', status: 'complete', detail: 'Live since Apr 4', icon: Megaphone },
		{ label: 'Open House', status: 'upcoming', detail: 'Scheduled Apr 12', icon: Users },
		{ label: 'First Offers', status: 'active', detail: '2 received', icon: FileText }
	];
</script>

{#if !listing}
<div class="py-16 text-center">
	<p class="text-muted-foreground">No listing data available.</p>
</div>
{:else}
<div class="space-y-8">
	<!-- Welcome -->
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Welcome back.</h1>
		<p class="text-muted-foreground">Here's the latest on your property.</p>
	</div>

	<!-- Property Hero Card -->
	{#if sectionEnabled('overview')}
	<Card class="overflow-hidden">
		<div class="md:flex">
			<div class="relative md:w-2/5">
				<img
					src={listing.photoUrl}
					alt={listing.address}
					class="h-48 w-full object-cover md:h-full md:min-h-[240px]"
				/>
				<Badge class="absolute left-3 top-3 bg-primary/90 text-primary-foreground">
					{PHASES[listing.phase].label}
				</Badge>
			</div>
			<CardContent class="flex-1 p-6">
				<h2 class="font-serif text-xl font-bold">{listing.address}</h2>
				<p class="text-sm text-muted-foreground">{listing.city}, {listing.state} {listing.zip}</p>
				<p class="mt-2 text-2xl font-bold text-primary">{formatCurrency(listing.price ?? 0)}</p>
				<div class="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
					<span>{listing.beds} bed</span>
					<span class="text-border">|</span>
					<span>{listing.baths} bath</span>
					<span class="text-border">|</span>
					<span>{(listing.sqft ?? 0).toLocaleString()} sqft</span>
					<span class="text-border">|</span>
					<span>MLS# {listing.mlsNumber}</span>
				</div>
				<p class="mt-3 text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
			</CardContent>
		</div>
	</Card>
	{/if}

	<!-- Visual Timeline -->
	{#if sectionEnabled('timeline')}
	<Card>
		<CardHeader>
			<CardTitle class="text-base">Listing Progress</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="relative">
				<!-- Progress bar background -->
				<div class="absolute left-0 top-4 h-1 w-full rounded-full bg-muted"></div>
				<!-- Progress bar fill -->
				<div
					class="absolute left-0 top-4 h-1 rounded-full bg-primary transition-all"
					style="width: {((currentPhaseOrder + 1) / allPhases.length) * 100}%"
				></div>
				<!-- Phase dots -->
				<div class="relative flex justify-between">
					{#each allPhases as phase, i}
						{@const isComplete = phase.order < currentPhaseOrder}
						{@const isCurrent = phase.order === currentPhaseOrder}
						<div class="flex flex-col items-center" style="width: {100 / allPhases.length}%">
							<div
								class="relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-all {isComplete
									? 'border-primary bg-primary text-primary-foreground'
									: isCurrent
										? 'border-primary bg-background text-primary ring-4 ring-primary/20'
										: 'border-muted bg-background text-muted-foreground'}"
							>
								{#if isComplete}
									<CheckCircle class="size-4" />
								{:else if isCurrent}
									<Circle class="size-3 fill-primary" />
								{:else}
									<Circle class="size-3" />
								{/if}
							</div>
							<span
								class="mt-2 text-center text-[10px] leading-tight {isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}"
							>
								{phase.label}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Milestone Status Cards -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each milestones as milestone}
			<Card class="transition-shadow hover:shadow-md">
				<CardContent class="flex items-center gap-3 p-4">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-lg {milestone.status === 'complete'
							? 'bg-emerald-500/10'
							: milestone.status === 'active'
								? 'bg-primary/10'
								: 'bg-amber-500/10'}"
					>
						{#if milestone.status === 'complete'}
							<CheckCircle class="size-5 text-emerald-500" />
						{:else}
							<milestone.icon
								class="size-5 {milestone.status === 'active' ? 'text-primary' : 'text-amber-500'}"
							/>
						{/if}
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium">{milestone.label}</p>
						<p class="text-xs text-muted-foreground">{milestone.detail}</p>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
	{/if}

	<!-- Stats Row -->
	<div class="grid gap-3 sm:grid-cols-3">
		{#if sectionEnabled('showings')}
		<Card>
			<CardContent class="flex items-center gap-3 p-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
					<Users class="size-5 text-blue-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{listingShowings.length}</p>
					<p class="text-xs text-muted-foreground">Showings this week</p>
				</div>
			</CardContent>
		</Card>
		{/if}
		{#if sectionEnabled('analytics')}
		<Card>
			<CardContent class="flex items-center gap-3 p-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
					<Eye class="size-5 text-violet-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{(listing.zillowViews ?? 0).toLocaleString()}</p>
					<p class="text-xs text-muted-foreground">Zillow views</p>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center gap-3 p-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
					<Calendar class="size-5 text-amber-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{listing.daysOnMarket}</p>
					<p class="text-xs text-muted-foreground">Days on market</p>
				</div>
			</CardContent>
		</Card>
		{/if}
	</div>

	<!-- Recent Updates -->
	<Card>
		<CardHeader class="flex-row items-center justify-between">
			<CardTitle class="text-base">Recent Updates</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each recentUpdates as activity}
					<div class="flex gap-3">
						<div
							class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full {activity.type === 'task_complete'
								? 'bg-emerald-500/10'
								: activity.type === 'system'
									? 'bg-blue-500/10'
									: activity.type === 'voice_memo'
										? 'bg-violet-500/10'
										: 'bg-muted'}"
						>
							<span class="text-xs font-medium">{activity.authorInitials}</span>
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline gap-2">
								<span class="text-sm font-medium">{activity.authorName}</span>
								<span class="text-xs text-muted-foreground"></span>
							</div>
							<p class="text-sm text-muted-foreground">{activity.content}</p>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
{/if}
