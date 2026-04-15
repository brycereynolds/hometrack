<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { UserPlus, CheckCircle2, Home } from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const source = $derived(data.source);

	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestAgent = $state('');
	let heardAbout = $state('');
	let isSaving = $state(false);
	let isComplete = $state(false);

	const heardOptions = ['Zillow', 'Redfin', 'Realtor.com', 'Social Media', 'Sign/Drive-by', 'Friend/Family', 'Agent Referral', 'Other'];

	function formatPrice(price: number | null) {
		if (!price) return '';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price);
	}

	async function handleRegister() {
		if (!guestName.trim() || !guestEmail.trim()) return;

		isSaving = true;
		try {
			const response = await fetch('/api/open-house/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listingId: listing.id,
					guestName: guestName.trim(),
					guestEmail: guestEmail.trim(),
					guestPhone: guestPhone.trim(),
					guestAgent: guestAgent.trim(),
					heardAbout,
					source,
				}),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Registration failed');
			}

			isComplete = true;
		} catch (err: any) {
			alert(err.message || 'Something went wrong. Please try again.');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Welcome — {listing.address}</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
	<div class="w-full max-w-md">
		{#if isComplete}
			<!-- Success state -->
			<div class="text-center">
				<div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100">
					<CheckCircle2 class="size-10 text-emerald-600" />
				</div>
				<h1 class="font-serif text-2xl font-bold">Welcome!</h1>
				<p class="mt-2 text-muted-foreground">
					Thanks for visiting {listing.address}. Enjoy the tour!
				</p>
			</div>
		{:else}
			<!-- Listing header -->
			<div class="mb-6 text-center">
				<div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
					<Home class="size-6 text-primary" />
				</div>
				<h1 class="font-serif text-xl font-bold">{listing.address}</h1>
				<p class="text-sm text-muted-foreground">
					{listing.city}, {listing.state} {listing.zip}
					{#if listing.price}
						&middot; {formatPrice(listing.price)}
					{/if}
				</p>
			</div>

			<!-- Registration form -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<UserPlus class="size-5" />
						Visitor Registration
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
						onclick={handleRegister}
					>
						<UserPlus class="size-5" />
						{isSaving ? 'Registering...' : 'Register'}
					</Button>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
