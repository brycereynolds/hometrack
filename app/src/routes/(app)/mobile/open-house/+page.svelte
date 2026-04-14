<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		UserPlus,
		Users,
		Clock,
		Monitor
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	let { data } = $props();

	const listings = $derived(data.listings);
	const loadedCheckIns = $derived(data.checkIns ?? []);

	let selectedListing = $state('');
	$effect(() => { if (!selectedListing && listings[0]) selectedListing = listings[0].id; });
	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestAgent = $state('');
	let heardAbout = $state('');
	let isSaving = $state(false);
	let localCheckIns: Array<{ name: string; email: string; time: string; hasAgent: boolean; agent: string }> = $state([]);

	const heardOptions = ['Zillow', 'Redfin', 'Realtor.com', 'Social Media', 'Sign/Drive-by', 'Friend/Family', 'Agent Referral', 'Other'];

	const currentListing = $derived(listings.find((l: any) => l.id === selectedListing));

	// Merge loaded check-ins with local ones
	const allCheckIns = $derived([...localCheckIns, ...loadedCheckIns]);

	async function handleCheckIn() {
		if (!guestName.trim() || !guestEmail.trim()) return;

		isSaving = true;
		try {
			const response = await fetch('/api/open-house/check-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listingId: selectedListing,
					guestName: guestName.trim(),
					guestEmail: guestEmail.trim(),
					guestPhone: guestPhone.trim(),
					guestAgent: guestAgent.trim(),
					heardAbout,
				}),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Check-in failed');
			}

			// Add to local list for immediate UI feedback
			localCheckIns = [{
				name: guestName.trim(),
				email: guestEmail.trim(),
				time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
				hasAgent: !!guestAgent.trim(),
				agent: guestAgent.trim(),
			}, ...localCheckIns];

			toast.success(`${guestName} checked in`);
			guestName = '';
			guestEmail = '';
			guestPhone = '';
			guestAgent = '';
			heardAbout = '';
		} catch (err: any) {
			toast.error(err.message || 'Failed to check in');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<!-- Active open house header -->
	<div class="mb-6 text-center">
		<Badge class="mb-3 bg-emerald-500/10 text-emerald-700 border-emerald-200">
			<div class="mr-1 size-2 animate-pulse rounded-full bg-emerald-500"></div>
			Open House Active
		</Badge>
		{#if currentListing}
			<h1 class="font-serif text-xl font-bold">{currentListing.address}</h1>
			<p class="text-sm text-muted-foreground">{currentListing.city}, {currentListing.state} {currentListing.zip}</p>
		{/if}
	</div>

	<!-- Select open house -->
	<div class="mb-4">
		<Autocomplete
			items={listings.map((l) => ({ value: l.id, label: l.address, subtitle: l.city }))}
			bind:value={selectedListing}
			placeholder="Search listings..."
		/>
	</div>

	<!-- Tablet view link -->
	{#if selectedListing}
		<div class="mb-4">
			<Button variant="outline" class="w-full gap-2" href="/open-house/{selectedListing}">
				<Monitor class="size-4" />
				Open Tablet View
			</Button>
		</div>
	{/if}

	<!-- Visitor counter -->
	<Card class="mb-6 bg-primary/5 border-primary/20">
		<CardContent class="flex items-center justify-center gap-3 p-4">
			<Users class="size-6 text-primary" />
			<span class="text-3xl font-bold text-primary">{allCheckIns.length}</span>
			<span class="text-sm text-muted-foreground">visitors today</span>
		</CardContent>
	</Card>

	<!-- Check-in form -->
	<Card class="mb-6">
		<CardHeader class="pb-3">
			<CardTitle class="flex items-center gap-2 text-base">
				<UserPlus class="size-5" />
				Guest Check-In
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3">
			<Input
				placeholder="Full name *"
				bind:value={guestName}
				class="h-12 rounded-xl text-base"
			/>
			<Input
				type="email"
				placeholder="Email address *"
				bind:value={guestEmail}
				class="h-12 rounded-xl text-base"
			/>
			<Input
				type="tel"
				placeholder="Phone number"
				bind:value={guestPhone}
				class="h-12 rounded-xl text-base"
			/>
			<Input
				placeholder="Agent name (if represented)"
				bind:value={guestAgent}
				class="h-12 rounded-xl text-base"
			/>

			<!-- How did you hear? -->
			<div>
				<p class="mb-2 text-sm font-medium">How did you hear about this property?</p>
				<div class="flex flex-wrap gap-1.5">
					{#each heardOptions as option}
						<button
							class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95
								{heardAbout === option
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:bg-muted'}"
							onclick={() => { heardAbout = option; }}
						>
							{option}
						</button>
					{/each}
				</div>
			</div>

			<Button
				class="h-12 w-full gap-2 rounded-xl text-base"
				disabled={!guestName.trim() || !guestEmail.trim() || isSaving}
				onclick={handleCheckIn}
			>
				<UserPlus class="size-5" />
				{isSaving ? 'Checking in...' : 'Check In'}
			</Button>
		</CardContent>
	</Card>

	<!-- Previous check-ins -->
	{#if allCheckIns.length > 0}
		<div>
			<h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
				<Clock class="size-4" />
				Today's Visitors
			</h2>
			<div class="space-y-1.5">
				{#each allCheckIns as guest}
					<Card>
						<CardContent class="flex items-center gap-3 p-3">
							<Avatar class="size-9 shrink-0">
								<AvatarFallback class="bg-primary/10 text-primary text-xs">
									{guest.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium">{guest.name}</p>
								<p class="text-xs text-muted-foreground">
									{guest.email}
									{#if guest.hasAgent}
										&middot; <span class="text-primary">{guest.agent}</span>
									{/if}
								</p>
							</div>
							<span class="shrink-0 text-xs text-muted-foreground">{guest.time}</span>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	{/if}
</div>
