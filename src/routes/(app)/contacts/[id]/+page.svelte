<script lang="ts">
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { contacts, listings, activityItems, PHASES } from '$lib/data/mock-data.js';
	import {
		ArrowLeft,
		Mail,
		Phone,
		Building,
		MapPin,
		Star,
		MessageSquare,
		FileText,
		Clock,
		Home,
		Plus,
		Send,
		Briefcase,
		Shield,
		Calendar,
		Edit,
		Users,
	} from 'lucide-svelte';

	const contact = $derived(contacts.find((c) => c.id === $page.params.id));

	const associatedListings = $derived(() => {
		if (!contact) return [];
		return listings.filter(
			(l) => l.client.id === contact.id || l.agent.id === contact.id
		);
	});

	const contactActivity = $derived(() => {
		if (!contact) return [];
		const name = contact.name.split(' ')[0];
		return activityItems.filter(
			(a) =>
				a.author.includes(name) ||
				a.content.toLowerCase().includes(contact.name.toLowerCase().split(' ')[0])
		);
	});

	const typeColors: Record<string, string> = {
		client: 'bg-primary/10 text-primary',
		agent: 'bg-blue-100 text-blue-700',
		vendor: 'bg-emerald-100 text-emerald-700',
		lender: 'bg-amber-100 text-amber-700',
		inspector: 'bg-slate-100 text-slate-600',
		title: 'bg-slate-100 text-slate-600',
	};

	const activityIcons: Record<string, typeof Mail> = {
		message: MessageSquare,
		email: Mail,
		note: FileText,
		voice_memo: MessageSquare,
		system: Clock,
		ai_insight: Star,
		phase_change: Clock,
		task_complete: Clock,
	};

	let newNote = $state('');
</script>

{#if contact}
	<div class="space-y-6">
		<!-- Back button & Profile Header -->
		<div class="flex items-start gap-4">
			<Button variant="ghost" size="icon" href="/contacts" class="mt-1">
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
					<Avatar class="size-16">
						<AvatarFallback class="text-lg font-bold {typeColors[contact.type]?.split(' ')[0] ?? 'bg-primary/10'} {typeColors[contact.type]?.split(' ')[1] ?? 'text-primary'}">
							{contact.initials}
						</AvatarFallback>
					</Avatar>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-serif text-2xl font-bold">{contact.name}</h1>
							<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold {typeColors[contact.type]}">
								{contact.typeLabel}
							</span>
						</div>
						{#if contact.company}
							<p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
								<Building class="size-3.5" />
								{contact.company}
							</p>
						{/if}
						<p class="mt-1 text-xs text-muted-foreground">
							Last interaction: {contact.lastInteractionDate}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Mail class="mr-1.5 size-3.5" />
						Email
					</Button>
					<Button variant="outline" size="sm">
						<Phone class="mr-1.5 size-3.5" />
						Call
					</Button>
					<Button size="sm">
						<MessageSquare class="mr-1.5 size-3.5" />
						Message
					</Button>
				</div>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Left Column: Details -->
			<div class="space-y-4 lg:col-span-1">
				<!-- Contact Info -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Contact Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3 text-sm">
						<div class="flex items-center gap-3">
							<Mail class="size-4 shrink-0 text-muted-foreground" />
							<a href="mailto:{contact.email}" class="text-primary hover:underline">{contact.email}</a>
						</div>
						<div class="flex items-center gap-3">
							<Phone class="size-4 shrink-0 text-muted-foreground" />
							<span>{contact.phone}</span>
						</div>
						{#if contact.company}
							<div class="flex items-center gap-3">
								<Building class="size-4 shrink-0 text-muted-foreground" />
								<span>{contact.company}</span>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Agent-Specific: Buyer Needs & Market Focus -->
				{#if contact.type === 'agent'}
					<Card>
						<CardHeader>
							<CardTitle class="text-sm">Agent Intelligence</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							<!-- Relationship Strength -->
							<div>
								<p class="text-xs text-muted-foreground">Relationship Strength</p>
								<div class="mt-1 flex items-center gap-1">
									{#each Array(5) as _, i}
										<Star
											class="size-4 {i < (contact.relationshipStrength ?? 0)
												? 'fill-amber-400 text-amber-400'
												: 'text-muted-foreground/25'}"
										/>
									{/each}
									<span class="ml-1 text-sm font-medium">{contact.relationshipStrength}/5</span>
								</div>
							</div>

							{#if contact.marketFocus}
								<div>
									<p class="text-xs text-muted-foreground">Market Focus</p>
									<div class="mt-1 flex flex-wrap gap-1">
										{#each contact.marketFocus.split(', ') as area}
											<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
												<MapPin class="mr-1 size-2.5" />
												{area}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if contact.buyerNeeds}
								<div>
									<p class="text-xs text-muted-foreground">Active Buyer Needs</p>
									<div class="mt-1 rounded-md bg-blue-50/80 p-3 text-sm text-blue-700">
										{contact.buyerNeeds}
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}

				<!-- Client-Specific: Portal Status -->
				{#if contact.type === 'client'}
					<Card>
						<CardHeader>
							<CardTitle class="text-sm">Client Portal</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Portal Access</span>
								<span class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
									<Shield class="size-3" />
									Active
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Active Listings</span>
								<span class="text-sm font-medium">{contact.listingsCount}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Approvals Pending</span>
								<span class="text-sm font-medium">0</span>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Associated Listings -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Associated Listings</CardTitle>
					</CardHeader>
					<CardContent>
						{#if associatedListings().length > 0}
							<div class="divide-y divide-border">
								{#each associatedListings() as listing}
									<a
										href="/listings/{listing.id}"
										class="flex items-center gap-3 py-2.5 transition-colors hover:text-primary first:pt-0 last:pb-0"
									>
										<div class="size-10 shrink-0 overflow-hidden rounded">
											<img src={listing.photoUrl} alt={listing.address} class="size-full object-cover" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium">{listing.address}</p>
											<p class="text-xs text-muted-foreground">{listing.city} | {listing.priceFormatted}</p>
										</div>
										<span
											class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
											style="background-color: {PHASES[listing.phase].color}15; color: {PHASES[listing.phase].color}"
										>
											{listing.phaseLabel}
										</span>
									</a>
								{/each}
							</div>
						{:else}
							<p class="text-center text-sm text-muted-foreground">No associated listings</p>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Right Column: Timeline & Notes -->
			<div class="space-y-4 lg:col-span-2">
				<!-- Interaction Timeline -->
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle class="text-sm">Interaction Timeline</CardTitle>
							<Button variant="outline" size="sm" class="h-7 text-xs">
								<Plus class="mr-1 size-3" />
								Log Interaction
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{#if contactActivity().length > 0}
							<div class="relative ml-4 border-l-2 border-border pl-6">
								{#each contactActivity() as activity}
									{@const Icon = activityIcons[activity.type] ?? Clock}
									<div class="relative pb-6 last:pb-0">
										<!-- Timeline dot -->
										<div class="absolute -left-[31px] flex size-5 items-center justify-center rounded-full bg-background border-2 border-border">
											<Icon class="size-3 text-muted-foreground" />
										</div>

										<div class="rounded-lg border border-border bg-card p-3">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium">{activity.author}</span>
													<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
														{activity.type.replace('_', ' ')}
													</span>
												</div>
												<span class="text-xs text-muted-foreground">{activity.timeAgo}</span>
											</div>
											<p class="mt-1.5 text-sm text-muted-foreground">{activity.content}</p>
											{#if activity.listingAddress}
												<a
													href="/listings/{activity.listingId}"
													class="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
												>
													<Home class="size-3" />
													{activity.listingAddress}
												</a>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-8 text-center">
								<Clock class="mx-auto size-8 text-muted-foreground/30" />
								<p class="mt-2 text-sm text-muted-foreground">No interactions recorded yet</p>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Notes -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							<textarea
								bind:value={newNote}
								placeholder="Add a note about {contact.name}..."
								rows="3"
								class="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
							></textarea>
							<div class="flex justify-end">
								<Button size="sm" disabled={!newNote.trim()}>
									<Send class="mr-1.5 size-3.5" />
									Save Note
								</Button>
							</div>
						</div>

						{#if contact.notes}
							<Separator class="my-4" />
							<div class="rounded-md bg-muted/50 p-3">
								<div class="flex items-center justify-between">
									<span class="text-xs font-medium text-muted-foreground">Previous note</span>
									<span class="text-xs text-muted-foreground">Apr 5, 2026</span>
								</div>
								<p class="mt-1 text-sm">{contact.notes}</p>
							</div>
						{/if}

						<!-- Sample notes for richer display -->
						<Separator class="my-4" />
						<div class="rounded-md bg-muted/50 p-3">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium text-muted-foreground">Lauren Chen</span>
								<span class="text-xs text-muted-foreground">{contact.lastInteractionDate}</span>
							</div>
							<p class="mt-1 text-sm">{contact.lastInteraction}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{:else}
	<div class="py-12 text-center">
		<Users class="mx-auto size-10 text-muted-foreground/40" />
		<p class="mt-3 text-lg font-medium">Contact not found</p>
		<Button variant="outline" href="/contacts" class="mt-4">
			<ArrowLeft class="mr-1.5 size-4" />
			Back to Contacts
		</Button>
	</div>
{/if}
