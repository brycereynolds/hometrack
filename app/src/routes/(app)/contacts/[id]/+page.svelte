<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { PHASES } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
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
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let { data } = $props();
	const contact = $derived(data.contact);

	let savingNote = $state(false);
	let showLogInteraction = $state(false);
	let interactionType = $state('message');
	let interactionContent = $state('');
	let submittingInteraction = $state(false);

	const associatedListings = $derived(() => {
		return data.listings ?? [];
	});

	const contactActivity = $derived(() => {
		if (!contact) return [];
		const name = contact.name.split(' ')[0];
		return (data.activity ?? []).filter(
			(a: { authorName: string | null; content: string | null }) =>
				(a.authorName && a.authorName.includes(name)) ||
				(a.content && a.content.toLowerCase().includes(contact.name.toLowerCase().split(' ')[0]))
		);
	});

	const typeLabels: Record<string, string> = {
		client: 'Client',
		agent: 'Agent',
		vendor: 'Vendor',
		lender: 'Lender',
		inspector: 'Inspector',
		title: 'Title',
	};

	function getInitials(name: string, initials?: string | null): string {
		if (initials) return initials;
		return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
	}

	function formatDate(d: string | Date | null): string {
		if (!d) return '';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function timeAgo(d: string | Date | null): string {
		if (!d) return '';
		const date = typeof d === 'string' ? new Date(d) : d;
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

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

	// Buyer preferences state
	let showPrefsForm = $state(false);
	let savingPrefs = $state(false);
	const buyerPrefs = $derived(data.buyerPreferences);

	const propertyTypeOptions = [
		{ value: 'single_family', label: 'Single Family' },
		{ value: 'condo', label: 'Condo' },
		{ value: 'townhome', label: 'Townhome' },
		{ value: 'multi_family', label: 'Multi-Family' },
		{ value: 'land', label: 'Land' },
		{ value: 'other', label: 'Other' },
	];
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
							{getInitials(contact.name, contact.initials)}
						</AvatarFallback>
					</Avatar>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-serif text-2xl font-bold">{contact.name}</h1>
							<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold {typeColors[contact.type]}">
								{typeLabels[contact.type] ?? contact.type}
							</span>
						</div>
						{#if contact.company}
							<p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
								<Building class="size-3.5" />
								{contact.company}
							</p>
						{/if}
						<p class="mt-1 text-xs text-muted-foreground">
							Last interaction: {formatDate(contact.lastInteractionDate)}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" href="mailto:{contact.email ?? ''}">
						<Mail class="mr-1.5 size-3.5" />
						Email
					</Button>
					<Button variant="outline" size="sm" href="tel:{contact.phone ?? ''}">
						<Phone class="mr-1.5 size-3.5" />
						Call
					</Button>
					<Button size="sm" href="mailto:{contact.email ?? ''}?subject=Re: {contact.name}">
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
							<a href="mailto:{contact.email ?? ''}" class="text-primary hover:underline">{contact.email ?? ''}</a>
						</div>
						<div class="flex items-center gap-3">
							<Phone class="size-4 shrink-0 text-muted-foreground" />
							<a href="tel:{contact.phone ?? ''}" class="text-primary hover:underline">{contact.phone ?? ''}</a>
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
								<span class="text-sm font-medium">{associatedListings().length}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Approvals Pending</span>
								<span class="text-sm font-medium">0</span>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Buyer Preferences (for agents and clients) -->
				{#if contact.type === 'agent' || contact.type === 'client'}
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-sm">Buyer Preferences</CardTitle>
								<Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => showPrefsForm = !showPrefsForm}>
									<Edit class="mr-1 size-3" />
									{buyerPrefs ? 'Edit' : 'Add'}
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{#if buyerPrefs && !showPrefsForm}
								<div class="space-y-3 text-sm">
									{#if buyerPrefs.preferredBedsMin || buyerPrefs.preferredBedsMax}
										<div class="flex items-center justify-between">
											<span class="text-muted-foreground">Bedrooms</span>
											<span class="font-medium">
												{buyerPrefs.preferredBedsMin ?? 'Any'} - {buyerPrefs.preferredBedsMax ?? 'Any'}
											</span>
										</div>
									{/if}
									{#if buyerPrefs.preferredBathsMin}
										<div class="flex items-center justify-between">
											<span class="text-muted-foreground">Bathrooms (min)</span>
											<span class="font-medium">{buyerPrefs.preferredBathsMin}+</span>
										</div>
									{/if}
									{#if buyerPrefs.preferredPriceMin || buyerPrefs.preferredPriceMax}
										<div class="flex items-center justify-between">
											<span class="text-muted-foreground">Price Range</span>
											<span class="font-medium">
												{buyerPrefs.preferredPriceMin ? formatCurrency(buyerPrefs.preferredPriceMin) : 'Any'}
												-
												{buyerPrefs.preferredPriceMax ? formatCurrency(buyerPrefs.preferredPriceMax) : 'Any'}
											</span>
										</div>
									{/if}
									{#if buyerPrefs.preferredSqftMin || buyerPrefs.preferredSqftMax}
										<div class="flex items-center justify-between">
											<span class="text-muted-foreground">Sq Ft</span>
											<span class="font-medium">
												{buyerPrefs.preferredSqftMin?.toLocaleString() ?? 'Any'}
												-
												{buyerPrefs.preferredSqftMax?.toLocaleString() ?? 'Any'}
											</span>
										</div>
									{/if}
									{#if buyerPrefs.preferredAreas && (buyerPrefs.preferredAreas as string[]).length > 0}
										<div>
											<p class="text-muted-foreground">Preferred Areas</p>
											<div class="mt-1 flex flex-wrap gap-1">
												{#each (buyerPrefs.preferredAreas as string[]) as area}
													<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
														<MapPin class="mr-1 size-2.5" />
														{area}
													</span>
												{/each}
											</div>
										</div>
									{/if}
									{#if buyerPrefs.preferredPropertyTypes && (buyerPrefs.preferredPropertyTypes as string[]).length > 0}
										<div>
											<p class="text-muted-foreground">Property Types</p>
											<div class="mt-1 flex flex-wrap gap-1">
												{#each (buyerPrefs.preferredPropertyTypes as string[]) as pt}
													<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
														{(pt as string).replace('_', ' ')}
													</span>
												{/each}
											</div>
										</div>
									{/if}
									{#if buyerPrefs.notes}
										<div>
											<p class="text-muted-foreground">Notes</p>
											<p class="mt-1 rounded-md bg-muted/50 p-2 text-sm">{buyerPrefs.notes}</p>
										</div>
									{/if}
								</div>
							{:else if !showPrefsForm}
								<p class="text-center text-sm text-muted-foreground">No buyer preferences set yet</p>
							{/if}

							{#if showPrefsForm}
								<form
									method="POST"
									action="?/saveBuyerPreferences"
									use:enhance={() => {
										savingPrefs = true;
										return async ({ result, update }) => {
											savingPrefs = false;
											if (result.type === 'success') {
												showPrefsForm = false;
												toast.success('Buyer preferences saved');
												await update();
											} else if (result.type === 'failure') {
												toast.error(String(result.data?.error ?? 'Failed to save'));
											}
										};
									}}
									class="space-y-4"
								>
									{#if buyerPrefs}
										<input type="hidden" name="existingId" value={buyerPrefs.id} />
									{/if}

									<div>
										<label for="lookingForType" class="text-xs font-medium text-muted-foreground">Looking to</label>
										<select
											id="lookingForType"
											name="lookingForType"
											class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
										>
											<option value="buy" selected={buyerPrefs?.lookingForType === 'buy'}>Buy</option>
											<option value="sell" selected={buyerPrefs?.lookingForType === 'sell'}>Sell</option>
											<option value="both" selected={buyerPrefs?.lookingForType === 'both'}>Both</option>
										</select>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div>
											<label for="bedsMin" class="text-xs font-medium text-muted-foreground">Beds Min</label>
											<input id="bedsMin" name="bedsMin" type="number" min="0" max="20" value={buyerPrefs?.preferredBedsMin ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
										<div>
											<label for="bedsMax" class="text-xs font-medium text-muted-foreground">Beds Max</label>
											<input id="bedsMax" name="bedsMax" type="number" min="0" max="20" value={buyerPrefs?.preferredBedsMax ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
									</div>

									<div>
										<label for="bathsMin" class="text-xs font-medium text-muted-foreground">Baths Min</label>
										<input id="bathsMin" name="bathsMin" type="number" min="0" max="20" step="0.5" value={buyerPrefs?.preferredBathsMin ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div>
											<label for="priceMin" class="text-xs font-medium text-muted-foreground">Price Min</label>
											<input id="priceMin" name="priceMin" type="number" min="0" step="10000" value={buyerPrefs?.preferredPriceMin ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
										<div>
											<label for="priceMax" class="text-xs font-medium text-muted-foreground">Price Max</label>
											<input id="priceMax" name="priceMax" type="number" min="0" step="10000" value={buyerPrefs?.preferredPriceMax ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
									</div>

									<div class="grid grid-cols-2 gap-3">
										<div>
											<label for="sqftMin" class="text-xs font-medium text-muted-foreground">Sq Ft Min</label>
											<input id="sqftMin" name="sqftMin" type="number" min="0" step="100" value={buyerPrefs?.preferredSqftMin ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
										<div>
											<label for="sqftMax" class="text-xs font-medium text-muted-foreground">Sq Ft Max</label>
											<input id="sqftMax" name="sqftMax" type="number" min="0" step="100" value={buyerPrefs?.preferredSqftMax ?? ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										</div>
									</div>

									<div>
										<label for="preferredAreas" class="text-xs font-medium text-muted-foreground">Preferred Areas</label>
										<input id="preferredAreas" name="preferredAreas" type="text" placeholder="San Jose, Cupertino, Mountain View" value={buyerPrefs?.preferredAreas ? (buyerPrefs.preferredAreas as string[]).join(', ') : ''} class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
										<p class="mt-0.5 text-[11px] text-muted-foreground">Comma-separated city names</p>
									</div>

									<div>
										<p class="text-xs font-medium text-muted-foreground">Property Types</p>
										<div class="mt-1.5 grid grid-cols-2 gap-2">
											{#each propertyTypeOptions as opt}
												<label class="flex items-center gap-2 text-sm">
													<input
														type="checkbox"
														name="propertyType_{opt.value}"
														checked={buyerPrefs?.preferredPropertyTypes ? (buyerPrefs.preferredPropertyTypes as string[]).includes(opt.value) : false}
														class="size-4 rounded border-input"
													/>
													{opt.label}
												</label>
											{/each}
										</div>
									</div>

									<div>
										<label for="prefNotes" class="text-xs font-medium text-muted-foreground">Notes</label>
										<textarea id="prefNotes" name="notes" rows="2" placeholder="Any additional preferences..." class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2">{buyerPrefs?.notes ?? ''}</textarea>
									</div>

									<div class="flex justify-end gap-2">
										<Button variant="outline" size="sm" type="button" onclick={() => showPrefsForm = false}>Cancel</Button>
										<Button size="sm" type="submit" disabled={savingPrefs}>
											{savingPrefs ? 'Saving...' : 'Save Preferences'}
										</Button>
									</div>
								</form>
							{/if}
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
											<img src={(listing.property?.photos as any)?.[0]?.url ?? ''} alt={listing.property?.address ?? ''} class="size-full object-cover" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium">{listing.property?.address ?? ''}</p>
											<p class="text-xs text-muted-foreground">{listing.property?.city ?? ''} | {listing.price ? formatCurrency(listing.price) : 'No Price'}</p>
										</div>
										<span
											class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
											style="background-color: {PHASES[listing.phase].color}15; color: {PHASES[listing.phase].color}"
										>
											{PHASES[listing.phase].label}
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
							<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => {
								interactionType = 'message';
								interactionContent = '';
								showLogInteraction = true;
							}}>
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
													<span class="text-sm font-medium">{activity.authorName ?? 'System'}</span>
													<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
														{activity.type.replace('_', ' ')}
													</span>
												</div>
												<span class="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</span>
											</div>
											<p class="mt-1.5 text-sm text-muted-foreground">{activity.content ?? ''}</p>
											{#if activity.listingId}
												<a
													href="/listings/{activity.listingId}"
													class="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
												>
													<Home class="size-3" />
													View Listing
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
						<form
							method="POST"
							action="?/saveNote"
							use:enhance={() => {
								savingNote = true;
								return async ({ result, update }) => {
									savingNote = false;
									if (result.type === 'success') {
										newNote = '';
										toast.success('Note saved');
										await update();
									} else if (result.type === 'failure') {
										toast.error(String(result.data?.error ?? 'Failed to save note'));
									}
								};
							}}
						>
							<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
							<input type="hidden" name="contactName" value={data.currentUser?.name ?? 'Agent'} />
							<div class="space-y-3">
								<textarea
									name="content"
									bind:value={newNote}
									placeholder="Add a note about {contact.name}..."
									rows="3"
									class="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
								></textarea>
								<div class="flex justify-end">
									<Button size="sm" type="submit" disabled={!newNote.trim() || savingNote}>
										<Send class="mr-1.5 size-3.5" />
										{savingNote ? 'Saving...' : 'Save Note'}
									</Button>
								</div>
							</div>
						</form>

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
								<span class="text-xs font-medium text-muted-foreground">{data.currentUser?.name ?? 'Agent'}</span>
								<span class="text-xs text-muted-foreground">{formatDate(contact.lastInteractionDate)}</span>
							</div>
							<p class="mt-1 text-sm">{contact.lastInteraction ?? ''}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
	<!-- Log Interaction Modal -->
	<Dialog.Root bind:open={showLogInteraction}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="font-serif">Log Interaction</Dialog.Title>
				<Dialog.Description>Record a new interaction with {contact?.name ?? 'this contact'}.</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="?/logInteraction"
				use:enhance={() => {
					submittingInteraction = true;
					return async ({ result, update }) => {
						submittingInteraction = false;
						if (result.type === 'success') {
							showLogInteraction = false;
							toast.success('Interaction logged');
							await update();
						} else if (result.type === 'failure') {
							toast.error(String(result.data?.error ?? 'Failed to log interaction'));
						}
					};
				}}
			>
				<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
				<input type="hidden" name="authorName" value={data.currentUser?.name ?? 'Agent'} />
				<div class="space-y-4 py-4">
					<div>
						<label for="interaction-type" class="text-sm font-medium">Type</label>
						<select
							id="interaction-type"
							name="type"
							bind:value={interactionType}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="message">Message</option>
							<option value="email">Email</option>
							<option value="note">Note</option>
							<option value="voice_memo">Voice Memo</option>
						</select>
					</div>
					<div>
						<label for="interaction-content" class="text-sm font-medium">Details</label>
						<textarea
							id="interaction-content"
							name="content"
							bind:value={interactionContent}
							placeholder="What happened?"
							rows="4"
							required
							class="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
						></textarea>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => showLogInteraction = false}>Cancel</Button>
					<Button type="submit" disabled={submittingInteraction || !interactionContent.trim()}>
						{submittingInteraction ? 'Saving...' : 'Log Interaction'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
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
