<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { vendors } from '$lib/data/mock-data.js';
	import {
		Plus,
		Star,
		Search,
		Clock,
		ArrowUpDown,
		Award,
		DollarSign,
		Users,
	} from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

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
					v.company.toLowerCase().includes(q) ||
					v.specialties.some((s) => s.toLowerCase().includes(q))
			);
		}
		result = [...result].sort((a, b) => {
			if (sortBy === 'rating') return b.rating - a.rating;
			if (sortBy === 'reliability') return b.reliabilityScore - a.reliabilityScore;
			if (sortBy === 'projects') return b.projectsCompleted - a.projectsCompleted;
			const costA = parseInt(a.avgCost.replace(/[$,]/g, ''));
			const costB = parseInt(b.avgCost.replace(/[$,]/g, ''));
			return costA - costB;
		});
		return result;
	});

	function isPreferred(vendor: typeof vendors[0]): boolean {
		return vendor.rating >= 4.8 && vendor.reliabilityScore >= 95;
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
			<a href="/vendors/{vendor.id}" class="group block">
				<Card class="h-full transition-all group-hover:shadow-md">
					<CardContent class="p-5">
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
							<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {categoryColors[vendor.category] ?? 'bg-muted text-muted-foreground'}">
								{vendor.categoryLabel}
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
								<span class="font-medium">{vendor.reliabilityScore}%</span>
							</div>
							<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all {vendor.reliabilityScore >= 95
										? 'bg-emerald-500'
										: vendor.reliabilityScore >= 85
											? 'bg-amber-500'
											: 'bg-red-400'}"
									style="width: {vendor.reliabilityScore}%"
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
					</CardContent>
				</Card>
			</a>
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
		<div class="space-y-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="vendor-name" class="text-sm font-medium">Contact Name</label>
					<input
						id="vendor-name"
						type="text"
						bind:value={newVendorName}
						placeholder="e.g. Mike Johnson"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="vendor-company" class="text-sm font-medium">Company</label>
					<input
						id="vendor-company"
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
					type="text"
					bind:value={newVendorSpecialties}
					placeholder="e.g. Kitchen remodels, Bathroom renovations"
					class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
				/>
				<p class="mt-1 text-xs text-muted-foreground">Comma-separated list</p>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => showAddVendor = false}>Cancel</Button>
			<Button onclick={() => showAddVendor = false}>Add Vendor</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
