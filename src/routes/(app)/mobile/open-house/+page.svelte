<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		UserPlus,
		Users,
		ChevronDown,
		Clock,
		Home
	} from 'lucide-svelte';
	import { listings } from '$lib/data/mock-data';

	let selectedListing = $state('l-1');
	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestAgent = $state('');
	let heardAbout = $state('');

	const heardOptions = ['Zillow', 'Redfin', 'Realtor.com', 'Social Media', 'Sign/Drive-by', 'Friend/Family', 'Agent Referral', 'Other'];

	const currentListing = $derived(listings.find((l) => l.id === selectedListing)!);

	// Previous check-ins (mock data)
	const checkIns = [
		{ name: 'Jennifer & Mark Wu', email: 'jwu@gmail.com', time: '1:05 PM', hasAgent: true, agent: 'Sarah Kim, Compass' },
		{ name: 'Robert Chen', email: 'rchen@outlook.com', time: '1:12 PM', hasAgent: false, agent: '' },
		{ name: 'Amanda Patel', email: 'amandap@yahoo.com', time: '1:24 PM', hasAgent: true, agent: 'Diana Reyes, KW' },
		{ name: 'Carlos & Maria Santos', email: 'csantos@gmail.com', time: '1:38 PM', hasAgent: false, agent: '' },
		{ name: 'David Kim', email: 'dkim@icloud.com', time: '1:45 PM', hasAgent: false, agent: '' },
		{ name: 'Lisa Thornton', email: 'lthorn@gmail.com', time: '1:52 PM', hasAgent: true, agent: 'Brian Foster, Sereno' },
		{ name: 'Raj & Sunita Gupta', email: 'rgupta@hotmail.com', time: '2:01 PM', hasAgent: false, agent: '' },
		{ name: 'Michelle Davis', email: 'mdavis@gmail.com', time: '2:15 PM', hasAgent: false, agent: '' },
		{ name: 'Patrick O\'Brien', email: 'pobrien@yahoo.com', time: '2:22 PM', hasAgent: true, agent: 'Unknown' },
		{ name: 'Yuki Tanaka', email: 'ytanaka@gmail.com', time: '2:35 PM', hasAgent: false, agent: '' },
		{ name: 'Steven & Grace Lee', email: 'sglee@gmail.com', time: '2:48 PM', hasAgent: true, agent: 'Sarah Kim, Compass' },
		{ name: 'Hannah Brooks', email: 'hbrooks@outlook.com', time: '3:02 PM', hasAgent: false, agent: '' }
	];

	function handleCheckIn() {
		if (guestName.trim() && guestEmail.trim()) {
			guestName = '';
			guestEmail = '';
			guestPhone = '';
			guestAgent = '';
			heardAbout = '';
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
		<h1 class="font-serif text-xl font-bold">{currentListing.address}</h1>
		<p class="text-sm text-muted-foreground">{currentListing.city}, {currentListing.state} {currentListing.zip}</p>
	</div>

	<!-- Select open house -->
	<div class="mb-4">
		<div class="relative">
			<select
				bind:value={selectedListing}
				class="h-11 w-full appearance-none rounded-xl border bg-muted/50 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{#each listings.filter((l) => l.showingsCount > 0) as listing}
					<option value={listing.id}>{listing.address} — Sat 1-4 PM</option>
				{/each}
			</select>
			<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		</div>
	</div>

	<!-- Visitor counter -->
	<Card class="mb-6 bg-primary/5 border-primary/20">
		<CardContent class="flex items-center justify-center gap-3 p-4">
			<Users class="size-6 text-primary" />
			<span class="text-3xl font-bold text-primary">{checkIns.length}</span>
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
				disabled={!guestName.trim() || !guestEmail.trim()}
				onclick={handleCheckIn}
			>
				<UserPlus class="size-5" />
				Check In
			</Button>
		</CardContent>
	</Card>

	<!-- Previous check-ins -->
	<div>
		<h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
			<Clock class="size-4" />
			Today's Visitors
		</h2>
		<div class="space-y-1.5">
			{#each checkIns as guest, i}
				<Card>
					<CardContent class="flex items-center gap-3 p-3">
						<Avatar class="size-9 shrink-0">
							<AvatarFallback class="bg-primary/10 text-primary text-xs">
								{guest.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
</div>
