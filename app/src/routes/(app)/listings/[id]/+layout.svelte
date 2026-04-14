<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { PHASES, PHASE_LIST, type ListingPhase } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		ArrowLeft,
		Edit,
		Share2,
		RefreshCw,
		ChevronLeft,
		ChevronRight,
		Check,
		Loader2
	} from 'lucide-svelte';

	let { children, data } = $props();

	const listing = $derived(data.listing);
	const currentPhaseOrder = $derived(listing ? PHASES[listing.phase].order : 0);

	// Dialog state
	let phaseDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let phaseSubmitting = $state(false);
	let editSubmitting = $state(false);

	// Edit form state (populated when dialog opens)
	let editAddress = $state('');
	let editCity = $state('');
	let editState = $state('');
	let editZip = $state('');
	let editPrice = $state('');
	let editBeds = $state(0);
	let editBaths = $state(0);
	let editSqft = $state(0);
	let editLotSqft = $state(0);
	let editYearBuilt = $state(0);
	let editPropertyType = $state('');
	let editDescription = $state('');
	let editMlsNumber = $state('');

	function openEditDialog() {
		if (!listing) return;
		editAddress = listing.address;
		editCity = listing.city;
		editState = listing.state;
		editZip = listing.zip;
		editPrice = listing.price?.toString() ?? '';
		editBeds = listing.beds ?? 0;
		editBaths = listing.baths ?? 0;
		editSqft = listing.sqft ?? 0;
		editLotSqft = listing.lotSqft ?? 0;
		editYearBuilt = listing.yearBuilt ?? 0;
		editPropertyType = listing.propertyType ?? 'single_family';
		editDescription = listing.description ?? '';
		editMlsNumber = listing.mlsNumber ?? '';
		editDialogOpen = true;
	}

	const fieldNotesCount = $derived(data.fieldNotesCount ?? 0);

	const tabs = $derived([
		{ href: '', label: 'Overview', count: 0 },
		{ href: '/activity', label: 'Activity', count: 0 },
		{ href: '/tasks', label: 'Tasks', count: 0 },
		{ href: '/field-notes', label: 'Field Notes', count: fieldNotesCount },
		{ href: '/documents', label: 'Documents', count: 0 },
		{ href: '/financials', label: 'Financials', count: 0 },
		{ href: '/marketing', label: 'Marketing', count: 0 },
		{ href: '/showings', label: 'Showings', count: 0 },
		{ href: '/offers', label: 'Offers', count: 0 },
		{ href: '/analytics', label: 'Analytics', count: 0 },
		{ href: '/portal-settings', label: 'Portal', count: 0 }
	]);

	let tabsContainer = $state<HTMLDivElement>(null!);

	function scrollTabs(direction: 'left' | 'right') {
		if (tabsContainer) {
			tabsContainer.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
		}
	}

	function isActiveTab(tabHref: string): boolean {
		const basePath = `/listings/${$page.params.id}`;
		const currentPath = $page.url.pathname;
		if (tabHref === '') {
			return currentPath === basePath || currentPath === basePath + '/';
		}
		return currentPath.startsWith(basePath + tabHref);
	}
</script>

{#if listing}
	<div class="space-y-0">
		<!-- Hero Header -->
		<div class="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
			<div class="relative h-56 overflow-hidden sm:h-64 md:h-72">
				<img
					src={listing.photoUrl}
					alt={listing.address}
					class="h-full w-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

				<!-- Back button -->
				<div class="absolute left-4 top-4">
					<Button variant="secondary" size="sm" href="/listings" class="bg-white/90 text-stone-800 backdrop-blur-sm hover:bg-white">
						<ArrowLeft class="mr-1.5 size-4" />
						Listings
					</Button>
				</div>

				<!-- Action buttons -->
				<div class="absolute right-4 top-4 flex gap-2">
					<Button variant="secondary" size="sm" class="bg-white/90 text-stone-800 backdrop-blur-sm hover:bg-white" onclick={openEditDialog}>
						<Edit class="mr-1.5 size-4" />
						Edit
					</Button>
					<Button variant="secondary" size="sm" class="bg-white/90 text-stone-800 backdrop-blur-sm hover:bg-white" onclick={() => phaseDialogOpen = true}>
						<RefreshCw class="mr-1.5 size-4" />
						Change Phase
					</Button>
					<Button variant="secondary" size="sm" class="bg-white/90 text-stone-800 backdrop-blur-sm hover:bg-white" onclick={() => {
						if (navigator.share) {
							navigator.share({ title: listing.address, url: window.location.href });
						} else {
							navigator.clipboard.writeText(window.location.href);
							toast.success('Link copied to clipboard');
						}
					}}>
						<Share2 class="mr-1.5 size-4" />
						Share
					</Button>
				</div>

				<!-- Hero content -->
				<div class="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h1 class="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
								{listing.address}
							</h1>
							<p class="mt-1 text-sm text-white/80 sm:text-base">
								{listing.city}, {listing.state} {listing.zip}
							</p>
						</div>
						<div class="flex items-center gap-3 sm:gap-4">
							<Badge
								variant="outline"
								class="border-white/40 bg-white/10 text-white backdrop-blur-sm text-xs sm:text-sm"
								style="border-color: {PHASES[listing.phase].color}; background-color: {PHASES[listing.phase].color}20"
							>
								{PHASES[listing.phase].label}
							</Badge>
							<span class="font-serif text-2xl font-bold sm:text-3xl">{formatCurrency(listing.price ?? 0)}</span>
						</div>
					</div>
					<div class="mt-2 flex items-center gap-4 text-xs text-white/70 sm:text-sm">
						<span>MLS {listing.mlsNumber ?? 'N/A'}</span>
						<span>|</span>
						{#if (listing.daysOnMarket ?? 0) > 0}
							<span>{listing.daysOnMarket} DOM</span>
						{:else}
							<span>Pre-market</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Phase Progress Bar -->
		<div class="border-b bg-muted/30 px-4 py-3 -mx-4 md:-mx-6 lg:-mx-8 md:px-6 lg:px-8">
			<div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
				{#each PHASE_LIST as phase, i}
					{@const isComplete = phase.order < currentPhaseOrder}
					{@const isCurrent = phase.order === currentPhaseOrder}
					<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
						<div class="flex items-center gap-1.5">
							<div
								class="size-2.5 rounded-full transition-all {isCurrent ? 'ring-2 ring-offset-1 scale-125' : ''}"
								style="background-color: {isComplete || isCurrent ? phase.color : '#d1d5db'};
									   {isCurrent ? `--tw-ring-color: ${phase.color}40` : ''}"
							></div>
							<span
								class="text-[10px] sm:text-xs whitespace-nowrap {isCurrent ? 'font-semibold' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'}"
								style={isCurrent ? `color: ${phase.color}` : ''}
							>
								{phase.label}
							</span>
						</div>
						{#if i < PHASE_LIST.length - 1}
							<div
								class="h-px w-4 sm:w-6"
								style="background-color: {isComplete ? phase.color : '#e5e7eb'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="border-b -mx-4 md:-mx-6 lg:-mx-8 relative">
			<button
				onclick={() => scrollTabs('left')}
				class="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-r from-background via-background to-transparent sm:hidden"
			>
				<ChevronLeft class="size-4 text-muted-foreground" />
			</button>
			<div
				bind:this={tabsContainer}
				class="flex overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8"
			>
				{#each tabs as tab}
					{@const active = isActiveTab(tab.href)}
					<a
						href="/listings/{$page.params.id}{tab.href}"
						class="shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 flex items-center gap-1.5 {active
							? 'border-primary text-primary'
							: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}"
					>
						{tab.label}
						{#if tab.count > 0}
							<span class="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none {active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}">
								{tab.count}
							</span>
						{/if}
					</a>
				{/each}
			</div>
			<button
				onclick={() => scrollTabs('right')}
				class="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-l from-background via-background to-transparent sm:hidden"
			>
				<ChevronRight class="size-4 text-muted-foreground" />
			</button>
		</div>

		<!-- Tab Content -->
		<div class="pt-6 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
			{@render children()}
		</div>
	</div>

	<!-- Change Phase Dialog -->
	<Dialog.Root bind:open={phaseDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Change Phase</Dialog.Title>
				<Dialog.Description>Move this listing to a different phase in the pipeline.</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="/listings/{listing.id}?/changePhase"
				use:enhance={() => {
					phaseSubmitting = true;
					return async ({ result, update }) => {
						phaseSubmitting = false;
						if (result.type === 'success') {
							toast.success('Phase updated successfully');
							phaseDialogOpen = false;
							await update();
						} else if (result.type === 'failure') {
							toast.error(String(result.data?.error ?? 'Failed to change phase'));
						} else {
							await update();
						}
					};
				}}
			>
				<div class="space-y-2 py-4">
					{#each PHASE_LIST as phase}
						<label
							class="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/50
								{listing.phase === phase.key ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}
							"
						>
							<input
								type="radio"
								name="phase"
								value={phase.key}
								checked={listing.phase === phase.key}
								class="sr-only"
							/>
							<span class="size-3 rounded-full shrink-0" style="background-color: {phase.color}"></span>
							<span class="text-sm font-medium flex-1">{phase.label}</span>
							{#if listing.phase === phase.key}
								<Badge variant="secondary" class="text-xs">Current</Badge>
							{/if}
						</label>
					{/each}
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => phaseDialogOpen = false}>Cancel</Button>
					<Button type="submit" disabled={phaseSubmitting}>
						{#if phaseSubmitting}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
							Updating...
						{:else}
							<Check class="mr-1.5 size-4" />
							Update Phase
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Edit Listing Dialog -->
	<Dialog.Root bind:open={editDialogOpen}>
		<Dialog.Content class="sm:max-w-lg max-h-[85vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Edit Listing</Dialog.Title>
				<Dialog.Description>Update the property details for this listing.</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="/listings/{listing.id}?/editListing"
				use:enhance={() => {
					editSubmitting = true;
					return async ({ result, update }) => {
						editSubmitting = false;
						if (result.type === 'success') {
							toast.success('Listing updated successfully');
							editDialogOpen = false;
							await update();
						} else if (result.type === 'failure') {
							toast.error(String(result.data?.error ?? 'Failed to update listing'));
						} else {
							await update();
						}
					};
				}}
			>
				<div class="space-y-4 py-4">
					<div>
						<label for="edit-address" class="text-sm font-medium mb-1.5 block">Street Address</label>
						<input id="edit-address" name="address" type="text" bind:value={editAddress} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
					</div>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label for="edit-city" class="text-sm font-medium mb-1.5 block">City</label>
							<input id="edit-city" name="city" type="text" bind:value={editCity} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-state" class="text-sm font-medium mb-1.5 block">State</label>
							<input id="edit-state" name="state" type="text" bind:value={editState} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-zip" class="text-sm font-medium mb-1.5 block">ZIP</label>
							<input id="edit-zip" name="zip" type="text" bind:value={editZip} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
					</div>
					<Separator />
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-price" class="text-sm font-medium mb-1.5 block">Price</label>
							<input id="edit-price" name="price" type="text" bind:value={editPrice} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-mls" class="text-sm font-medium mb-1.5 block">MLS Number</label>
							<input id="edit-mls" name="mlsNumber" type="text" bind:value={editMlsNumber} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
					</div>
					<div>
						<label for="edit-type" class="text-sm font-medium mb-1.5 block">Property Type</label>
						<select id="edit-type" name="propertyType" bind:value={editPropertyType} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
							<option value="single_family">Single Family Home</option>
							<option value="condo">Condo / Apartment</option>
							<option value="townhouse">Townhouse</option>
							<option value="multi_family">Multi-Family</option>
							<option value="land">Vacant Land</option>
						</select>
					</div>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label for="edit-beds" class="text-sm font-medium mb-1.5 block">Beds</label>
							<input id="edit-beds" name="beds" type="number" bind:value={editBeds} min="0" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-baths" class="text-sm font-medium mb-1.5 block">Baths</label>
							<input id="edit-baths" name="baths" type="number" bind:value={editBaths} min="0" step="0.5" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-sqft" class="text-sm font-medium mb-1.5 block">Sq Ft</label>
							<input id="edit-sqft" name="sqft" type="number" bind:value={editSqft} min="0" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-lot" class="text-sm font-medium mb-1.5 block">Lot Size (sqft)</label>
							<input id="edit-lot" name="lotSqft" type="number" bind:value={editLotSqft} min="0" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
						<div>
							<label for="edit-year" class="text-sm font-medium mb-1.5 block">Year Built</label>
							<input id="edit-year" name="yearBuilt" type="number" bind:value={editYearBuilt} min="1800" max="2026" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</div>
					</div>
					<div>
						<label for="edit-desc" class="text-sm font-medium mb-1.5 block">Description</label>
						<textarea id="edit-desc" name="description" bind:value={editDescription} rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"></textarea>
					</div>
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => editDialogOpen = false}>Cancel</Button>
					<Button type="submit" disabled={editSubmitting}>
						{#if editSubmitting}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
							Saving...
						{:else}
							<Check class="mr-1.5 size-4" />
							Save Changes
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div class="flex flex-col items-center justify-center py-12">
		<p class="text-lg font-medium">Listing not found</p>
		<Button variant="outline" href="/listings" class="mt-4">Back to Listings</Button>
	</div>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
