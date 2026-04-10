<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { contacts } from '$lib/data/mock-data.js';
	import {
		ArrowLeft,
		Search,
		Users,
		Star,
		Building,
		MapPin,
		MessageSquare,
		Sparkles,
		Clock,
	} from 'lucide-svelte';

	let search = $state('');

	const agents = $derived(() => {
		const list = contacts.filter((c) => c.type === 'agent');
		if (!search.trim()) return list;
		const q = search.toLowerCase();
		return list.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				(c.company && c.company.toLowerCase().includes(q)) ||
				(c.marketFocus && c.marketFocus.toLowerCase().includes(q))
		);
	});

	const totalAgents = contacts.filter((c) => c.type === 'agent').length;
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/contacts">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="font-serif text-3xl font-bold">Agent Network</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{totalAgents} agents in your network
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" href="/contacts/agents/intelligence">
				<Sparkles class="mr-1.5 size-4" />
				Intelligence Dashboard
			</Button>
			<Button>
				<MessageSquare class="mr-1.5 size-4" />
				Log Interaction
			</Button>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<input
			type="text"
			bind:value={search}
			placeholder="Search agents by name, company, or market area..."
			class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
		/>
	</div>

	<!-- Agent Cards Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each agents() as agent (agent.id)}
			<a href="/contacts/{agent.id}" class="group block">
				<Card class="h-full transition-all group-hover:shadow-md">
					<CardContent class="p-5">
						<!-- Agent Header -->
						<div class="flex items-start gap-3">
							<Avatar class="size-11">
								<AvatarFallback class="bg-blue-50 text-sm font-semibold text-blue-700">
									{agent.initials}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0 flex-1">
								<h3 class="font-semibold transition-colors group-hover:text-primary">
									{agent.name}
								</h3>
								<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
									<Building class="size-3" />
									<span>{agent.company}</span>
								</div>
							</div>
						</div>

						<!-- Relationship Strength -->
						<div class="mt-3 flex items-center gap-1.5">
							<span class="text-xs text-muted-foreground">Relationship:</span>
							<div class="flex items-center gap-0.5">
								{#each Array(5) as _, i}
									<Star
										class="size-3.5 {i < (agent.relationshipStrength ?? 0)
											? 'fill-amber-400 text-amber-400'
											: 'text-muted-foreground/25'}"
									/>
								{/each}
							</div>
						</div>

						<!-- Market Focus -->
						{#if agent.marketFocus}
							<div class="mt-3 flex items-start gap-1.5">
								<MapPin class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
								<p class="text-sm text-muted-foreground">{agent.marketFocus}</p>
							</div>
						{/if}

						<!-- Buyer Needs -->
						{#if agent.buyerNeeds}
							<div class="mt-3 rounded-md bg-blue-50/80 p-2.5">
								<p class="text-[11px] font-medium text-blue-700">Active Buyer Need</p>
								<p class="mt-0.5 text-xs text-blue-600/80">{agent.buyerNeeds}</p>
							</div>
						{/if}

						<!-- Footer -->
						<div
							class="mt-4 flex items-center justify-between border-t border-border pt-3"
						>
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Clock class="size-3" />
								<span>{agent.lastInteractionDate}</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="h-7 px-2 text-xs"
								onclick={(e) => e.preventDefault()}
							>
								<MessageSquare class="mr-1 size-3" />
								Log
							</Button>
						</div>
					</CardContent>
				</Card>
			</a>
		{:else}
			<div class="col-span-full py-12 text-center">
				<Users class="mx-auto size-10 text-muted-foreground/40" />
				<p class="mt-3 font-medium text-muted-foreground">No agents found</p>
			</div>
		{/each}
	</div>
</div>
