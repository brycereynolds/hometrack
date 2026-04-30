<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import {
		Plus,
		Star,
		Search,
		Clock,
		ArrowUpDown,
		Award,
		DollarSign,
		Users,
		Pencil,
		Trash2,
	} from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	type CategoryFilter = 'all' | string;

	let search = $state('');
	let activeCategory = $state<CategoryFilter>('all');
	let sortBy = $state<'rating' | 'reliability' | 'cost' | 'projects'>('rating');

	// Add Vendor modal state
	let showAddVendor = $state(false);
	let newVendorName = $state('');
	let newVendorCompany = $state('');
	let newVendorEmail = $state('');
	let newVendorPhone = $state('');
	let newVendorCategory = $state('contractor');
	let newVendorSpecialties = $state('');
	let submittingVendor = $state(false);

	// Edit Vendor modal state
	let showEditVendor = $state(false);
	let editVendorId = $state('');
	let editVendorName = $state('');
	let editVendorCompany = $state('');
	let editVendorEmail = $state('');
	let editVendorPhone = $state('');
	let editVendorCategory = $state('contractor');
	let editVendorRating = $state('');
	let submittingEdit = $state(false);

	// Delete confirmation
	let deletingVendorId = $state<string | null>(null);

	const vendors = $derived(data.vendors);

	function openEditVendor(vendor: typeof vendors[number]) {
		editVendorId = vendor.id;
		editVendorName = vendor.name;
		editVendorCompany = vendor.company ?? '';
		editVendorEmail = vendor.email ?? '';
		editVendorPhone = vendor.phone ?? '';
		editVendorCategory = vendor.category ?? 'contractor';
		editVendorRating = String(vendor.rating ?? '');
		showEditVendor = true;
	}

	function categoryLabel(cat: string | null) {
		if (!cat) return '';
		return cat.charAt(0).toUpperCase() + cat.slice(1);
	}

	const categories: { label: string; value: CategoryFilter }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'Contractors', value: 'contractor' },
		{ label: 'Stagers', value: 'stager' },
		{ label: 'Photographers', value: 'photographer' },
		{ label: 'Inspectors', value: 'inspector' },
		{ label: 'Landscapers', value: 'landscaper' },
		{ label: 'Painters', value: 'painter' },
	];

	const categoryColors: Record<string, string> = {
		contractor: 'bg-orange-100 text-orange-700',
		stager: 'bg-purple-100 text-purple-700',
		photographer: 'bg-blue-100 text-blue-700',
		inspector: 'bg-slate-100 text-slate-600',
		landscaper: 'bg-emerald-100 text-emerald-700',
		painter: 'bg-amber-100 text-amber-700',
	};

	const filtered = $derived(() => {
		let result = vendors;
		if (activeCategory !== 'all') {
			result = result.filter((v) => v.category === activeCategory);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			result = result.filter(
				(v) =>
					v.name.toLowerCase().includes(q) ||
					(v.company ?? '').toLowerCase().includes(q) ||
					(Array.isArray(v.specialties) && (v.specialties as string[]).some((s: string) => s.toLowerCase().includes(q)))
			);
		}
		result = [...result].sort((a, b) => {
			if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
			if (sortBy === 'reliability') return (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0);
			if (sortBy === 'projects') return (b.projectsCompleted ?? 0) - (a.projectsCompleted ?? 0);
			const costA = parseInt((a.avgCost ?? '0').replace(/[$,]/g, ''));
			const costB = parseInt((b.avgCost ?? '0').replace(/[$,]/g, ''));
			return costA - costB;
		});
		return result;
	});

	function isPreferred(vendor: typeof vendors[number]): boolean {
		return (vendor.rating ?? 0) >= 4.8 && (vendor.reliabilityScore ?? 0) >= 95;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-3xl font-bold">Vendor Directory</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{vendors.length} trusted service providers
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" href="/vendors/quotes">
				<DollarSign class="mr-1.5 size-4" />
				Manage Quotes
			</Button>
			<Button onclick={() => {
				newVendorName = '';
				newVendorCompany = '';
				newVendorEmail = '';
				newVendorPhone = '';
				newVendorCategory = 'contractor';
				newVendorSpecialties = '';
				showAddVendor = true;
			}}>
				<Plus class="mr-1.5 size-4" />
				Add Vendor
			</Button>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<input
			type="text"
			bind:value={search}
			placeholder="Search vendors by name, company, or specialty..."
			class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
		/>
	</div>

	<!-- Category Filters -->
	<div class="flex flex-wrap items-center gap-2">
		{#each categories as cat}
			<button
				onclick={() => (activeCategory = cat.value)}
				class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors {activeCategory ===
				cat.value
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			>
				{cat.label}
			</button>
		{/each}
		<div class="ml-auto flex items-center gap-1">
			<ArrowUpDown class="size-3.5 text-muted-foreground" />
			<select
				bind:value={sortBy}
				class="border-none bg-transparent text-sm text-muted-foreground outline-none"
			>
				<option value="rating">Rating</option>
				<option value="reliability">Reliability</option>
				<option value="cost">Cost (Low to High)</option>
				<option value="projects">Projects</option>
			</select>
		</div>
	</div>

	<!-- Vendor Cards Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered() as vendor (vendor.id)}
			<Card class="h-full transition-all hover:shadow-md group relative">
				<CardContent class="p-5">
					<!-- Edit/Delete buttons -->
					<div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button size="sm" variant="ghost" class="size-7 p-0" onclick={() => openEditVendor(vendor)}>
							<Pencil class="size-3.5 text-muted-foreground" />
						</Button>
						{#if deletingVendorId === vendor.id}
							<form
								method="POST"
								action="?/deleteVendor"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											toast.success('Vendor deleted');
											deletingVendorId = null;
											await update();
										} else {
											toast.error('Failed to delete vendor');
										}
									};
								}}
								class="inline-flex items-center gap-1"
							>
								<input type="hidden" name="vendorId" value={vendor.id} />
								<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs px-2">Delete</Button>
								<Button type="button" size="sm" variant="ghost" class="h-7 text-xs px-2" onclick={() => deletingVendorId = null}>No</Button>
							</form>
						{:else}
							<Button size="sm" variant="ghost" class="size-7 p-0" onclick={() => deletingVendorId = vendor.id}>
								<Trash2 class="size-3.5 text-muted-foreground" />
							</Button>
						{/if}
					</div>

					<a href="/vendors/{vendor.id}" class="block">
						<!-- Header -->
						<div class="flex items-start gap-3">
							<Avatar class="size-11">
								<AvatarFallback class="bg-primary/10 text-sm font-semibold text-primary">
									{vendor.initials}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="truncate font-semibold transition-colors group-hover:text-primary">
										{vendor.name}
									</h3>
									{#if isPreferred(vendor)}
										<Award class="size-4 shrink-0 text-amber-500" />
									{/if}
								</div>
								<p class="text-sm text-muted-foreground">{vendor.company}</p>
							</div>
						</div>

						<!-- Category & Rating -->
						<div class="mt-3 flex items-center justify-between">
							<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {categoryColors[vendor.category ?? ''] ?? 'bg-muted text-muted-foreground'}">
								{categoryLabel(vendor.category)}
							</span>
							<div class="flex items-center gap-1">
								<Star class="size-4 fill-amber-400 text-amber-400" />
								<span class="text-sm font-semibold">{vendor.rating}</span>
							</div>
						</div>

						<!-- Reliability Progress Bar -->
						<div class="mt-3">
							<div class="flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Reliability</span>
								<span class="font-medium">{vendor.reliabilityScore ?? 0}%</span>
							</div>
							<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all {(vendor.reliabilityScore ?? 0) >= 95
										? 'bg-emerald-500'
										: (vendor.reliabilityScore ?? 0) >= 85
											? 'bg-amber-500'
											: 'bg-red-400'}"
									style="width: {vendor.reliabilityScore ?? 0}%"
								></div>
							</div>
						</div>

						<!-- Stats Row -->
						<div class="mt-3 grid grid-cols-3 gap-2 text-center">
							<div>
								<p class="text-xs text-muted-foreground">Response</p>
								<p class="text-sm font-medium">{vendor.avgResponseTime}</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Projects</p>
								<p class="text-sm font-medium">{vendor.projectsCompleted}</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Avg Cost</p>
								<p class="text-sm font-medium">{vendor.avgCost}</p>
							</div>
						</div>

						<!-- Preferred Badge -->
						{#if isPreferred(vendor)}
							<div class="mt-3 flex items-center justify-center gap-1 rounded-md bg-amber-50 py-1.5 text-xs font-medium text-amber-700">
								<Award class="size-3" />
								Preferred Vendor
							</div>
						{/if}
					</a>
				</CardContent>
			</Card>
		{:else}
			<div class="col-span-full py-12 text-center">
				<Users class="mx-auto size-10 text-muted-foreground/40" />
				<p class="mt-3 font-medium text-muted-foreground">No vendors found</p>
				<p class="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
			</div>
		{/each}
	</div>
</div>

<!-- Add Vendor Modal -->
<Dialog.Root bind:open={showAddVendor}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Add Vendor</Dialog.Title>
			<Dialog.Description>Add a new service provider to your directory.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				submittingVendor = true;
				return async ({ result, update }) => {
					submittingVendor = false;
					if (result.type === 'success') {
						showAddVendor = false;
						toast.success('Vendor added successfully');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to add vendor'));
					}
				};
			}}
		>
			<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="vendor-name" class="text-sm font-medium">Contact Name</label>
						<input
							id="vendor-name"
							name="name"
							type="text"
							bind:value={newVendorName}
							placeholder="e.g. Mike Johnson"
							required
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="vendor-company" class="text-sm font-medium">Company</label>
						<input
							id="vendor-company"
							name="company"
							type="text"
							bind:value={newVendorCompany}
							placeholder="e.g. Bay Area Contractors"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="vendor-email" class="text-sm font-medium">Email</label>
						<input
							id="vendor-email"
							name="email"
							type="email"
							bind:value={newVendorEmail}
							placeholder="mike@example.com"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="vendor-phone" class="text-sm font-medium">Phone</label>
						<input
							id="vendor-phone"
							name="phone"
							type="tel"
							bind:value={newVendorPhone}
							placeholder="(555) 123-4567"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
				<div>
					<label for="vendor-category" class="text-sm font-medium">Category</label>
					<select
						id="vendor-category"
						name="category"
						bind:value={newVendorCategory}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						<option value="contractor">Contractor</option>
						<option value="stager">Stager</option>
						<option value="photographer">Photographer</option>
						<option value="inspector">Inspector</option>
						<option value="landscaper">Landscaper</option>
						<option value="painter">Painter</option>
					</select>
				</div>
				<div>
					<label for="vendor-specialties" class="text-sm font-medium">Specialties</label>
					<input
						id="vendor-specialties"
						name="specialties"
						type="text"
						bind:value={newVendorSpecialties}
						placeholder="e.g. Kitchen remodels, Bathroom renovations"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
					<p class="mt-1 text-xs text-muted-foreground">Comma-separated list</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showAddVendor = false}>Cancel</Button>
				<Button type="submit" disabled={submittingVendor || !newVendorName.trim()}>
					{submittingVendor ? 'Adding...' : 'Add Vendor'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Vendor Modal -->
<Dialog.Root bind:open={showEditVendor}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Vendor</Dialog.Title>
			<Dialog.Description>Update vendor details.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editVendor"
			use:enhance={() => {
				submittingEdit = true;
				return async ({ result, update }) => {
					submittingEdit = false;
					if (result.type === 'success') {
						showEditVendor = false;
						toast.success('Vendor updated');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to update vendor'));
					}
				};
			}}
		>
			<input type="hidden" name="vendorId" value={editVendorId} />
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-vendor-name" class="text-sm font-medium">Contact Name</label>
						<input
							id="edit-vendor-name"
							name="name"
							type="text"
							bind:value={editVendorName}
							required
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="edit-vendor-company" class="text-sm font-medium">Company</label>
						<input
							id="edit-vendor-company"
							name="company"
							type="text"
							bind:value={editVendorCompany}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-vendor-email" class="text-sm font-medium">Email</label>
						<input
							id="edit-vendor-email"
							name="email"
							type="email"
							bind:value={editVendorEmail}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
					<div>
						<label for="edit-vendor-phone" class="text-sm font-medium">Phone</label>
						<input
							id="edit-vendor-phone"
							name="phone"
							type="tel"
							bind:value={editVendorPhone}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-vendor-category" class="text-sm font-medium">Category</label>
						<select
							id="edit-vendor-category"
							name="category"
							bind:value={editVendorCategory}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="contractor">Contractor</option>
							<option value="stager">Stager</option>
							<option value="photographer">Photographer</option>
							<option value="inspector">Inspector</option>
							<option value="landscaper">Landscaper</option>
							<option value="painter">Painter</option>
						</select>
					</div>
					<div>
						<label for="edit-vendor-rating" class="text-sm font-medium">Rating</label>
						<input
							id="edit-vendor-rating"
							name="rating"
							type="number"
							step="0.1"
							min="0"
							max="5"
							bind:value={editVendorRating}
							placeholder="0-5"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditVendor = false}>Cancel</Button>
				<Button type="submit" disabled={submittingEdit || !editVendorName.trim()}>
					{submittingEdit ? 'Saving...' : 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
