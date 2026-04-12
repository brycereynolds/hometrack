<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		ArrowLeft,
		Search,
		Sparkles,
		Star,
		Users,
		Home,
		MapPin,
		DollarSign,
		BedDouble,
		TrendingUp,
		ArrowRight,
		Check,
		X,
		Filter,
		Zap,
		Link2,
		Eye,
		MessageSquare,
		Brain,
	} from 'lucide-svelte';

	let { data } = $props();
	const agents = $derived(data.agents);
	const listings = $derived(data.listings);

	// Parse buyer needs into structured data for matching
	interface BuyerNeed {
		agentId: string;
		agentName: string;
		agentCompany: string;
		agentInitials: string;
		relationshipStrength: number;
		rawNeed: string;
		beds?: string;
		location?: string;
		budget?: string;
		buyerProfile?: string;
		lastLogged: string;
	}

	const buyerNeeds: BuyerNeed[] = [
		{
			agentId: 'c-5',
			agentName: 'Sarah Kim',
			agentCompany: 'Compass',
			agentInitials: 'SK',
			relationshipStrength: 4,
			rawNeed: '4BR in Los Gatos under $2.5M, good schools',
			beds: '4',
			location: 'Los Gatos',
			budget: '$2.0M - $2.5M',
			buyerProfile: 'Family with school-age children',
			lastLogged: '2026-03-28',
		},
		{
			agentId: 'c-6',
			agentName: 'Brian Foster',
			agentCompany: 'Sereno Group',
			agentInitials: 'BF',
			relationshipStrength: 5,
			rawNeed: 'Downsizer couple, 2-3BR, single story, Los Altos or Mountain View, up to $3M',
			beds: '2-3',
			location: 'Los Altos, Mountain View',
			budget: 'Up to $3.0M',
			buyerProfile: 'Downsizer couple, needs single story',
			lastLogged: '2026-04-03',
		},
		{
			agentId: 'c-7',
			agentName: 'Diana Reyes',
			agentCompany: 'Keller Williams',
			agentInitials: 'DR',
			relationshipStrength: 3,
			rawNeed: 'Tech relocatee family, 4BR+, Cupertino schools, $2-3.5M',
			beds: '4+',
			location: 'Cupertino, Sunnyvale',
			budget: '$2.0M - $3.5M',
			buyerProfile: 'Tech relocation family',
			lastLogged: '2026-04-05',
		},
	];

	// AI-generated matches between buyer needs and listings
	interface AIMatch {
		id: string;
		buyerNeed: BuyerNeed;
		listingIndex: number;
		matchScore: number;
		matchReasons: string[];
		mismatchReasons: string[];
		suggestion: string;
		priority: 'high' | 'medium' | 'low';
	}

	function getPhaseLabel(phase: string): string {
		const labels: Record<string, string> = {
			pre_market: 'Pre-Market',
			active: 'Active',
			closed: 'Closed',
			canceled: 'Canceled',
		};
		return labels[phase] ?? phase;
	}

	const aiMatchDefs: AIMatch[] = [
		{
			id: 'match-1',
			buyerNeed: buyerNeeds[0],
			listingIndex: 0,
			matchScore: 92,
			matchReasons: [
				'4BR matches buyer requirement',
				'Los Gatos location matches exactly',
				'Top-rated school district',
				'Price at $2.495M, just under $2.5M budget',
			],
			mismatchReasons: ['Price at top of budget'],
			suggestion: "Strong match. Sarah Kim's buyer is looking for exactly this. Reach out before the open house this weekend.",
			priority: 'high',
		},
		{
			id: 'match-2',
			buyerNeed: buyerNeeds[1],
			listingIndex: 4,
			matchScore: 78,
			matchReasons: [
				'2BR matches downsizer needs',
				'Mountain View location matches',
				'Well under $3M budget at $1.295M',
				'Townhouse with minimal maintenance',
			],
			mismatchReasons: ['Not single story', 'Townhouse vs single family'],
			suggestion: "Good fit for Brian's downsizer couple. The price point leaves room for customization. Worth a private showing.",
			priority: 'medium',
		},
		{
			id: 'match-3',
			buyerNeed: buyerNeeds[2],
			listingIndex: 2,
			matchScore: 68,
			matchReasons: [
				'Cupertino location with top schools',
				'Price at $2.15M within $2-3.5M range',
				'Near Apple Park (tech relocation)',
			],
			mismatchReasons: [
				'Only 3BR vs required 4BR+',
				'1,850 sqft may be small for family',
			],
			suggestion: "Partial match -- 789 Elm is in the right area and price range but bedroom count is short. Discuss when listing goes live; buyer may be flexible.",
			priority: 'low',
		},
		{
			id: 'match-4',
			buyerNeed: buyerNeeds[2],
			listingIndex: 5,
			matchScore: 74,
			matchReasons: [
				'5BR exceeds 4BR+ requirement',
				'Saratoga has excellent schools',
				'3,200 sqft ideal for family',
				'Within $2-3.5M budget at $3.2M',
			],
			mismatchReasons: [
				'Saratoga not Cupertino (different district)',
				'Price near top of budget',
				'Already in offers phase',
			],
			suggestion: "945 Cherry Blossom has the right profile but is already receiving offers. Alert Diana in case current offers fall through.",
			priority: 'medium',
		},
		{
			id: 'match-5',
			buyerNeed: buyerNeeds[0],
			listingIndex: 5,
			matchScore: 70,
			matchReasons: [
				'5BR exceeds 4BR requirement',
				'Saratoga adjacent to Los Gatos',
				'Top-rated schools',
			],
			mismatchReasons: [
				'Price at $3.2M exceeds $2.5M budget',
				'Different city than requested',
			],
			suggestion: "Over budget but matches other criteria well. Worth mentioning if Sarah's buyer has flexibility.",
			priority: 'low',
		},
	];

	interface ResolvedMatch extends Omit<AIMatch, 'listingIndex'> {
		listing: (typeof listings)[number];
	}

	const aiMatches = $derived(
		aiMatchDefs
			.filter((m) => m.listingIndex < listings.length)
			.map((m) => ({
				...m,
				listing: listings[m.listingIndex],
			})) as ResolvedMatch[]
	);

	let filterLocation = $state('all');
	let filterBeds = $state('all');
	let activeView = $state<'matches' | 'needs' | 'matrix'>('matches');

	const locationOptions = ['all', 'Los Gatos', 'Cupertino', 'Mountain View', 'Saratoga', 'Palo Alto'];
	const bedOptions = ['all', '2', '3', '4', '4+', '5'];

	const filteredMatches = $derived(() => {
		let results = aiMatches;
		if (filterLocation !== 'all') {
			results = results.filter(
				(m) =>
					m.listing.city === filterLocation ||
					(m.buyerNeed.location && m.buyerNeed.location.includes(filterLocation))
			);
		}
		if (filterBeds !== 'all') {
			results = results.filter((m) => {
				if (filterBeds === '4+') return (m.listing.beds ?? 0) >= 4;
				return (m.listing.beds ?? 0) === parseInt(filterBeds);
			});
		}
		return results.sort((a, b) => b.matchScore - a.matchScore);
	});

	const highPriorityCount = $derived(aiMatches.filter((m) => m.priority === 'high').length);
	const activeMatchCount = $derived(aiMatches.length);
	const totalBuyerNeeds = buyerNeeds.length;

	function scoreColor(score: number): string {
		if (score >= 85) return 'text-emerald-600';
		if (score >= 70) return 'text-amber-600';
		return 'text-muted-foreground';
	}

	function scoreBg(score: number): string {
		if (score >= 85) return 'bg-emerald-50 border-emerald-200';
		if (score >= 70) return 'bg-amber-50 border-amber-200';
		return 'bg-muted/50 border-border';
	}

	function priorityBadge(priority: string): string {
		if (priority === 'high') return 'bg-emerald-100 text-emerald-700';
		if (priority === 'medium') return 'bg-amber-100 text-amber-700';
		return 'bg-slate-100 text-slate-600';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/contacts/agents">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="font-serif text-3xl font-bold">Network Intelligence</h1>
					<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
						<Sparkles class="size-3" />
						Smart Match
					</span>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Smart matching between your agent network's buyer needs and your listings
				</p>
			</div>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-sm text-muted-foreground">Buyer Needs Logged</p>
			<p class="mt-1 font-serif text-3xl font-bold">{totalBuyerNeeds}</p>
			<p class="mt-1 text-xs text-muted-foreground">from {agents.length} agents</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-sm text-muted-foreground">Active Matches</p>
			<p class="mt-1 font-serif text-3xl font-bold text-primary">{activeMatchCount}</p>
			<p class="mt-1 text-xs text-muted-foreground">Auto-generated connections</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-sm text-muted-foreground">High Priority</p>
			<p class="mt-1 font-serif text-3xl font-bold text-emerald-600">{highPriorityCount}</p>
			<p class="mt-1 text-xs text-emerald-600">ready to act on</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-sm text-muted-foreground">Avg Match Score</p>
			<p class="mt-1 font-serif text-3xl font-bold">
				{aiMatches.length > 0 ? Math.round(aiMatches.reduce((s, m) => s + m.matchScore, 0) / aiMatches.length) : 0}%
			</p>
			<p class="mt-1 text-xs text-muted-foreground">across all connections</p>
		</div>
	</div>

	<!-- View Tabs & Filters -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-1 rounded-lg bg-muted p-1">
			<button
				onclick={() => (activeView = 'matches')}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeView === 'matches'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Sparkles class="mr-1.5 inline size-3.5" />
				Matches
			</button>
			<button
				onclick={() => (activeView = 'needs')}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeView === 'needs'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Users class="mr-1.5 inline size-3.5" />
				Buyer Needs
			</button>
			<button
				onclick={() => (activeView = 'matrix')}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeView === 'matrix'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Link2 class="mr-1.5 inline size-3.5" />
				Match Matrix
			</button>
		</div>
		<div class="flex items-center gap-2">
			<Filter class="size-3.5 text-muted-foreground" />
			<select
				bind:value={filterLocation}
				class="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
			>
				<option value="all">All Locations</option>
				{#each locationOptions.slice(1) as loc}
					<option value={loc}>{loc}</option>
				{/each}
			</select>
			<select
				bind:value={filterBeds}
				class="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
			>
				<option value="all">All Beds</option>
				{#each bedOptions.slice(1) as bed}
					<option value={bed}>{bed} BR</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- AI Matches View -->
	{#if activeView === 'matches'}
		<div class="space-y-4">
			{#each filteredMatches() as match (match.id)}
				<Card class="overflow-hidden border-l-4 {match.priority === 'high' ? 'border-l-emerald-500' : match.priority === 'medium' ? 'border-l-amber-500' : 'border-l-border'}">
					<CardContent class="p-0">
						<!-- Match Header -->
						<div class="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
							<div class="flex items-center gap-3">
								<div class="flex items-center gap-1.5">
									<Brain class="size-4 text-primary" />
									<span class="text-sm font-semibold">Connection Suggestion</span>
								</div>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {priorityBadge(match.priority)}">
									{match.priority} priority
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm text-muted-foreground">Match Score</span>
								<span class="rounded-full border px-2.5 py-0.5 font-serif text-lg font-bold {scoreBg(match.matchScore)} {scoreColor(match.matchScore)}">
									{match.matchScore}%
								</span>
							</div>
						</div>

						<!-- Match Body: Side by side comparison -->
						<div class="grid gap-0 md:grid-cols-[1fr,auto,1fr]">
							<!-- Agent / Buyer Side -->
							<div class="p-5">
								<p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Buyer Need</p>
								<div class="flex items-start gap-3">
									<Avatar class="size-10">
										<AvatarFallback class="bg-blue-50 text-sm font-semibold text-blue-700">
											{match.buyerNeed.agentInitials}
										</AvatarFallback>
									</Avatar>
									<div>
										<p class="font-semibold">{match.buyerNeed.agentName}</p>
										<p class="text-xs text-muted-foreground">{match.buyerNeed.agentCompany}</p>
										<div class="mt-1 flex items-center gap-0.5">
											{#each Array(5) as _, i}
												<Star class="size-3 {i < match.buyerNeed.relationshipStrength ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25'}" />
											{/each}
										</div>
									</div>
								</div>
								<div class="mt-4 space-y-2 text-sm">
									<div class="flex items-center gap-2">
										<BedDouble class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Beds:</span>
										<span class="font-medium">{match.buyerNeed.beds}</span>
									</div>
									<div class="flex items-center gap-2">
										<MapPin class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Location:</span>
										<span class="font-medium">{match.buyerNeed.location}</span>
									</div>
									<div class="flex items-center gap-2">
										<DollarSign class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Budget:</span>
										<span class="font-medium">{match.buyerNeed.budget}</span>
									</div>
									{#if match.buyerNeed.buyerProfile}
										<div class="mt-2 rounded-md bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
											{match.buyerNeed.buyerProfile}
										</div>
									{/if}
								</div>
							</div>

							<!-- Connection Indicator -->
							<div class="flex items-center justify-center px-3 py-4 md:flex-col md:border-x md:border-border">
								<div class="flex items-center gap-2 md:flex-col md:gap-3">
									<div class="h-px w-8 bg-border md:h-8 md:w-px"></div>
									<div class="flex size-10 items-center justify-center rounded-full {match.matchScore >= 85 ? 'bg-emerald-100' : match.matchScore >= 70 ? 'bg-amber-100' : 'bg-muted'}">
										<Link2 class="size-5 {scoreColor(match.matchScore)}" />
									</div>
									<div class="h-px w-8 bg-border md:h-8 md:w-px"></div>
								</div>
							</div>

							<!-- Listing Side -->
							<div class="p-5">
								<p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your Listing</p>
								<div class="flex items-start gap-3">
									<div class="size-10 shrink-0 overflow-hidden rounded-md">
										<img src={match.listing.photoUrl} alt={match.listing.address} class="size-full object-cover" />
									</div>
									<div>
										<a href="/listings/{match.listing.id}" class="font-semibold hover:text-primary">
											{match.listing.address}
										</a>
										<p class="text-xs text-muted-foreground">{match.listing.city}, {match.listing.state}</p>
										<p class="mt-0.5 text-sm font-semibold text-primary">{formatCurrency(match.listing.price ?? 0)}</p>
									</div>
								</div>
								<div class="mt-4 space-y-2 text-sm">
									<div class="flex items-center gap-2">
										<BedDouble class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Beds:</span>
										<span class="font-medium">{match.listing.beds ?? 0}</span>
									</div>
									<div class="flex items-center gap-2">
										<MapPin class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Location:</span>
										<span class="font-medium">{match.listing.city}</span>
									</div>
									<div class="flex items-center gap-2">
										<DollarSign class="size-3.5 text-muted-foreground" />
										<span class="text-muted-foreground">Price:</span>
										<span class="font-medium">{formatCurrency(match.listing.price ?? 0)}</span>
									</div>
									<div class="mt-2">
										<span
											class="rounded-full px-2 py-0.5 text-[10px] font-medium"
											style="background-color: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary);"
										>
											{getPhaseLabel(match.listing.phase)}
										</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Match Analysis -->
						<div class="border-t border-border bg-muted/20 px-5 py-4">
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<p class="mb-2 text-xs font-semibold text-emerald-600">Matches</p>
									<ul class="space-y-1">
										{#each match.matchReasons as reason}
											<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
												<Check class="mt-0.5 size-3 shrink-0 text-emerald-500" />
												{reason}
											</li>
										{/each}
									</ul>
								</div>
								{#if match.mismatchReasons.length > 0}
									<div>
										<p class="mb-2 text-xs font-semibold text-amber-600">Considerations</p>
										<ul class="space-y-1">
											{#each match.mismatchReasons as reason}
												<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
													<X class="mt-0.5 size-3 shrink-0 text-amber-500" />
													{reason}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>

							<!-- AI Suggestion -->
							<div class="mt-4 flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2.5">
								<Sparkles class="mt-0.5 size-4 shrink-0 text-primary" />
								<div>
									<p class="text-xs font-medium text-primary">Recommendation</p>
									<p class="mt-0.5 text-sm text-foreground/80">{match.suggestion}</p>
								</div>
							</div>

							<!-- Actions -->
							<div class="mt-3 flex items-center gap-2">
								<Button size="sm" class="h-8">
									<MessageSquare class="mr-1.5 size-3.5" />
									Message {match.buyerNeed.agentName.split(' ')[0]}
								</Button>
								<Button variant="outline" size="sm" class="h-8">
									<Eye class="mr-1.5 size-3.5" />
									Schedule Showing
								</Button>
								<Button variant="ghost" size="sm" class="h-8 text-muted-foreground">
									Dismiss
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{:else}
				<div class="py-12 text-center">
					<Sparkles class="mx-auto size-10 text-muted-foreground/40" />
					<p class="mt-3 font-medium text-muted-foreground">No matches for current filters</p>
					<p class="text-sm text-muted-foreground/60">Try adjusting location or bedroom filters</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Buyer Needs View ("Who's Looking for What") -->
	{#if activeView === 'needs'}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-lg">
					<Users class="size-5" />
					Who's Looking for What
				</CardTitle>
				<CardDescription>All logged buyer needs from your agent network</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-border text-left">
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Agent</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Buyer Profile</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Beds</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Location</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Budget</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Matches</th>
								<th class="pb-3 text-xs font-semibold text-muted-foreground">Last Logged</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each buyerNeeds as need}
								{@const matchCount = aiMatches.filter((m) => m.buyerNeed.agentId === need.agentId).length}
								{@const bestScore = Math.max(...aiMatches.filter((m) => m.buyerNeed.agentId === need.agentId).map((m) => m.matchScore), 0)}
								<tr class="group">
									<td class="py-3 pr-4">
										<div class="flex items-center gap-2">
											<Avatar class="size-8">
												<AvatarFallback class="bg-blue-50 text-xs font-semibold text-blue-700">
													{need.agentInitials}
												</AvatarFallback>
											</Avatar>
											<div>
												<a href="/contacts/{need.agentId}" class="text-sm font-medium hover:text-primary">
													{need.agentName}
												</a>
												<p class="text-[11px] text-muted-foreground">{need.agentCompany}</p>
											</div>
										</div>
									</td>
									<td class="py-3 pr-4">
										<p class="text-sm">{need.buyerProfile}</p>
									</td>
									<td class="py-3 pr-4">
										<span class="text-sm font-medium">{need.beds}</span>
									</td>
									<td class="py-3 pr-4">
										<span class="text-sm">{need.location}</span>
									</td>
									<td class="py-3 pr-4">
										<span class="text-sm font-medium">{need.budget}</span>
									</td>
									<td class="py-3 pr-4">
										{#if matchCount > 0}
											<div class="flex items-center gap-1.5">
												<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
													{matchCount} match{matchCount !== 1 ? 'es' : ''}
												</span>
												<span class="text-xs {scoreColor(bestScore)}">Best: {bestScore}%</span>
											</div>
										{:else}
											<span class="text-xs text-muted-foreground">No matches</span>
										{/if}
									</td>
									<td class="py-3">
										<span class="text-sm text-muted-foreground">{need.lastLogged}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Match Matrix View -->
	{#if activeView === 'matrix'}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-lg">
					<Link2 class="size-5" />
					Listing-Buyer Match Matrix
				</CardTitle>
				<CardDescription>
					See which listings match which buyer needs at a glance. Scores represent calculated compatibility.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr>
								<th class="sticky left-0 bg-card pb-3 text-left text-xs font-semibold text-muted-foreground">
									Listing
								</th>
								{#each buyerNeeds as need}
									<th class="min-w-[120px] pb-3 text-center text-xs font-semibold text-muted-foreground">
										<div class="flex flex-col items-center gap-1">
											<Avatar class="size-7">
												<AvatarFallback class="bg-blue-50 text-[10px] font-semibold text-blue-700">
													{need.agentInitials}
												</AvatarFallback>
											</Avatar>
											<span>{need.agentName.split(' ')[0]}</span>
											<span class="font-normal text-[10px]">{need.beds}BR, {need.location?.split(',')[0]}</span>
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each listings.slice(0, 6) as listing}
								<tr>
									<td class="sticky left-0 bg-card py-3 pr-4">
										<div class="flex items-center gap-2">
											<div class="size-8 shrink-0 overflow-hidden rounded">
												<img src={listing.photoUrl} alt={listing.address} class="size-full object-cover" />
											</div>
											<div>
												<a href="/listings/{listing.id}" class="text-sm font-medium hover:text-primary">
													{listing.address}
												</a>
												<p class="text-[11px] text-muted-foreground">{listing.city} | {listing.beds ?? 0}BR | {formatCurrency(listing.price ?? 0)}</p>
											</div>
										</div>
									</td>
									{#each buyerNeeds as need}
										{@const match = aiMatches.find(
											(m) => m.listing.id === listing.id && m.buyerNeed.agentId === need.agentId
										)}
										<td class="py-3 text-center">
											{#if match}
												<button
													class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition-colors hover:shadow-sm {scoreBg(match.matchScore)} {scoreColor(match.matchScore)}"
													onclick={() => { activeView = 'matches'; }}
												>
													{match.matchScore}%
												</button>
											{:else}
												<span class="text-xs text-muted-foreground/40">--</span>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
					<span class="flex items-center gap-1.5">
						<div class="size-3 rounded bg-emerald-100 border border-emerald-200"></div>
						85%+ Strong match
					</span>
					<span class="flex items-center gap-1.5">
						<div class="size-3 rounded bg-amber-100 border border-amber-200"></div>
						70-84% Possible match
					</span>
					<span class="flex items-center gap-1.5">
						<div class="size-3 rounded bg-muted/50 border border-border"></div>
						Below 70%
					</span>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
