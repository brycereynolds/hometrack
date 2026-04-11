<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { contacts, listings, PHASES } from '$lib/data/mock-data.js';
	import {
		ArrowLeft,
		Search,
		User,
		Mail,
		Phone,
		Home,
		ExternalLink,
		Shield,
	} from 'lucide-svelte';

	let search = $state('');

	const clients = $derived(() => {
		const list = contacts.filter((c) => c.type === 'client');
		if (!search.trim()) return list;
		const q = search.toLowerCase();
		return list.filter(
			(c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
		);
	});

	function getClientListings(clientId: string) {
		return listings.filter((l) => l.client.id === clientId);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/contacts">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="font-serif text-3xl font-bold">Clients</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{contacts.filter((c) => c.type === 'client').length} active clients
				</p>
			</div>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<input
			type="text"
			bind:value={search}
			placeholder="Search clients..."
			class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
		/>
	</div>

	<!-- Client Cards -->
	<div class="grid gap-4 sm:grid-cols-2">
		{#each clients() as client (client.id)}
			{@const clientListings = getClientListings(client.id)}
			<a href="/contacts/{client.id}" class="group block">
				<Card class="h-full transition-all group-hover:shadow-md">
					<CardContent class="p-5">
						<div class="flex items-start gap-4">
							<Avatar class="size-12">
								<AvatarFallback class="bg-primary/10 text-sm font-semibold text-primary">
									{client.initials}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0 flex-1">
								<h3
									class="font-semibold transition-colors group-hover:text-primary"
								>
									{client.name}
								</h3>
								<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
									<Mail class="size-3" />
									<span class="truncate">{client.email}</span>
								</div>
								<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
									<Phone class="size-3" />
									<span>{client.phone}</span>
								</div>
							</div>
						</div>

						<!-- Active Listings -->
						{#if clientListings.length > 0}
							<div class="mt-4 space-y-2">
								<p class="text-xs font-medium text-muted-foreground">Active Listings</p>
								<div class="space-y-1.5">
									{#each clientListings as listing}
										<div
											class="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-sm"
										>
											<Home class="size-3.5 text-primary" />
											<span class="flex-1 truncate">{listing.address}</span>
											<span
												class="rounded-full px-2 py-0.5 text-[10px] font-medium"
												style="background-color: {PHASES[listing.phase].color}20; color: {PHASES[listing.phase].color}"
											>
												{listing.phaseLabel}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Footer -->
						<div
							class="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"
						>
							<span>Last: {client.lastInteractionDate}</span>
							<div class="flex items-center gap-1.5">
								<Shield class="size-3" />
								<span class="font-medium text-emerald-600">Portal Active</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</a>
		{:else}
			<div class="col-span-2 py-12 text-center">
				<User class="mx-auto size-10 text-muted-foreground/40" />
				<p class="mt-3 font-medium text-muted-foreground">No clients found</p>
			</div>
		{/each}
	</div>
</div>
