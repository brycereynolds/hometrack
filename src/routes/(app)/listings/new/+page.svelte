<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		teamMembers,
		contacts,
		PHASE_LIST,
		PHASES,
	} from '$lib/data/mock-data.js';
	import {
		Home,
		DollarSign,
		Users,
		UserPlus,
		GitBranch,
		CheckCircle,
		ArrowLeft,
		ArrowRight,
		Check,
		MapPin,
	} from 'lucide-svelte';

	const STEPS = [
		{ label: 'Property Details', icon: Home, description: 'Address, type, and features' },
		{ label: 'Pricing', icon: DollarSign, description: 'List price and strategy' },
		{ label: 'Client Assignment', icon: Users, description: 'Link to seller client' },
		{ label: 'Team Assignment', icon: UserPlus, description: 'Assign team members' },
		{ label: 'Pipeline & Phase', icon: GitBranch, description: 'Set initial phase' },
		{ label: 'Review & Create', icon: CheckCircle, description: 'Confirm and create listing' },
	];

	let currentStep = $state(0);

	// Form state
	let address = $state('');
	let city = $state('');
	let stateVal = $state('CA');
	let zip = $state('');
	let propertyType = $state('single_family');
	let beds = $state(3);
	let baths = $state(2);
	let sqft = $state(1800);
	let lotSqft = $state(6000);
	let yearBuilt = $state(1970);
	let description = $state('');

	let listPrice = $state('');
	let pricingStrategy = $state('market');

	let selectedClientId = $state('');
	let selectedAgentId = $state('tm-1');
	let selectedTcId = $state('tm-3');
	let selectedPhase = $state('onboarding');

	const clientContacts = contacts.filter((c) => c.type === 'client');

	let isComplete = $derived(currentStep === STEPS.length - 1);

	function nextStep() {
		if (currentStep < STEPS.length - 1) currentStep++;
	}

	function prevStep() {
		if (currentStep > 0) currentStep--;
	}

	function getStepStatus(index: number): 'complete' | 'current' | 'upcoming' {
		if (index < currentStep) return 'complete';
		if (index === currentStep) return 'current';
		return 'upcoming';
	}
</script>

<div class="mx-auto max-w-3xl space-y-6">
	<!-- Header -->
	<div>
		<a href="/listings" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
			<ArrowLeft class="size-4" />
			Back to Listings
		</a>
		<h1 class="font-serif text-2xl font-bold tracking-tight">New Listing</h1>
		<p class="text-muted-foreground">Create a new property listing in your pipeline</p>
	</div>

	<!-- Step Progress Bar -->
	<div class="relative">
		<div class="flex items-center justify-between">
			{#each STEPS as step, i}
				{@const status = getStepStatus(i)}
				<div class="flex flex-col items-center gap-1.5 relative z-10" style="flex: 1;">
					<button
						onclick={() => { if (i < currentStep) currentStep = i; }}
						class="flex size-10 items-center justify-center rounded-full border-2 transition-all
							{status === 'complete' ? 'border-primary bg-primary text-primary-foreground' : ''}
							{status === 'current' ? 'border-primary bg-background text-primary shadow-sm' : ''}
							{status === 'upcoming' ? 'border-muted-foreground/30 bg-muted text-muted-foreground' : ''}
							{i < currentStep ? 'cursor-pointer hover:shadow-md' : ''}
						"
						disabled={i > currentStep}
					>
						{#if status === 'complete'}
							<Check class="size-5" />
						{:else}
							<step.icon class="size-4" />
						{/if}
					</button>
					<span class="text-xs font-medium text-center whitespace-nowrap hidden sm:block
						{status === 'current' ? 'text-primary' : 'text-muted-foreground'}
					">
						{step.label}
					</span>
				</div>
				{#if i < STEPS.length - 1}
					<div class="flex-1 h-0.5 -mt-5 sm:-mt-8 mx-1
						{i < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'}
					"></div>
				{/if}
			{/each}
		</div>
		<div class="mt-1 text-center sm:hidden">
			<span class="text-sm font-medium text-primary">Step {currentStep + 1}: {STEPS[currentStep].label}</span>
		</div>
	</div>

	<!-- Step Content -->
	<Card>
		<CardHeader>
			<CardTitle>{STEPS[currentStep].label}</CardTitle>
			<CardDescription>{STEPS[currentStep].description}</CardDescription>
		</CardHeader>
		<CardContent class="space-y-5">
			{#if currentStep === 0}
				<!-- Step 1: Property Details -->
				<div class="space-y-4">
					<div>
						<label for="address" class="text-sm font-medium mb-1.5 block">Street Address</label>
						<input
							id="address"
							type="text"
							bind:value={address}
							placeholder="123 Main Street"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					</div>

					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="city" class="text-sm font-medium mb-1.5 block">City</label>
							<input
								id="city"
								type="text"
								bind:value={city}
								placeholder="Los Gatos"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
						<div>
							<label for="state" class="text-sm font-medium mb-1.5 block">State</label>
							<select
								id="state"
								bind:value={stateVal}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="CA">California</option>
							</select>
						</div>
						<div>
							<label for="zip" class="text-sm font-medium mb-1.5 block">ZIP Code</label>
							<input
								id="zip"
								type="text"
								bind:value={zip}
								placeholder="95030"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					</div>

					<Separator />

					<div>
						<label for="propertyType" class="text-sm font-medium mb-1.5 block">Property Type</label>
						<select
							id="propertyType"
							bind:value={propertyType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="single_family">Single Family Home</option>
							<option value="condo">Condo / Apartment</option>
							<option value="townhouse">Townhouse</option>
							<option value="multi_family">Multi-Family</option>
							<option value="land">Vacant Land</option>
						</select>
					</div>

					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="beds" class="text-sm font-medium mb-1.5 block">Bedrooms</label>
							<input
								id="beds"
								type="number"
								bind:value={beds}
								min="0"
								max="20"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
						<div>
							<label for="baths" class="text-sm font-medium mb-1.5 block">Bathrooms</label>
							<input
								id="baths"
								type="number"
								bind:value={baths}
								min="0"
								max="20"
								step="0.5"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
						<div>
							<label for="sqft" class="text-sm font-medium mb-1.5 block">Square Feet</label>
							<input
								id="sqft"
								type="number"
								bind:value={sqft}
								min="0"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="lotSqft" class="text-sm font-medium mb-1.5 block">Lot Size (sqft)</label>
							<input
								id="lotSqft"
								type="number"
								bind:value={lotSqft}
								min="0"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
						<div>
							<label for="yearBuilt" class="text-sm font-medium mb-1.5 block">Year Built</label>
							<input
								id="yearBuilt"
								type="number"
								bind:value={yearBuilt}
								min="1800"
								max="2026"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					</div>

					<div>
						<label for="description" class="text-sm font-medium mb-1.5 block">Property Description <span class="text-muted-foreground font-normal">(optional)</span></label>
						<textarea
							id="description"
							bind:value={description}
							rows="3"
							placeholder="Describe the property's key features and selling points..."
							class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
						></textarea>
					</div>
				</div>

			{:else if currentStep === 1}
				<!-- Step 2: Pricing -->
				<div class="space-y-4">
					<div>
						<label for="listPrice" class="text-sm font-medium mb-1.5 block">List Price</label>
						<div class="relative">
							<DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<input
								id="listPrice"
								type="text"
								bind:value={listPrice}
								placeholder="2,495,000"
								class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					</div>

					<div>
						<label class="text-sm font-medium mb-3 block">Pricing Strategy</label>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							{#each [
								{ value: 'market', label: 'Market Price', desc: 'List at estimated market value based on comps' },
								{ value: 'aspirational', label: 'Aspirational', desc: 'List above market value with room to negotiate' },
								{ value: 'aggressive', label: 'Aggressive', desc: 'List below market value to drive multiple offers' },
							] as strategy}
								<button
									onclick={() => pricingStrategy = strategy.value}
									class="rounded-lg border p-4 text-left transition-all
										{pricingStrategy === strategy.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
									"
								>
									<p class="text-sm font-medium">{strategy.label}</p>
									<p class="text-xs text-muted-foreground mt-1">{strategy.desc}</p>
								</button>
							{/each}
						</div>
					</div>

					<Separator />

					<div class="rounded-lg bg-muted/50 p-4">
						<h3 class="text-sm font-medium mb-2">AI Pricing Insight</h3>
						<p class="text-sm text-muted-foreground">
							Based on 6 comparable sales within 0.5 miles in the last 90 days, the suggested list price range is <strong class="text-foreground">$2,050,000 - $2,200,000</strong>. Average price per sqft in this area is <strong class="text-foreground">$886/sqft</strong>.
						</p>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 3: Client Assignment -->
				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium mb-3 block">Select Seller Client</label>
						<div class="space-y-2">
							{#each clientContacts as client}
								<button
									onclick={() => selectedClientId = client.id}
									class="w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all
										{selectedClientId === client.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
									"
								>
									<div class="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
										{client.initials}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium">{client.name}</p>
										<p class="text-xs text-muted-foreground">{client.email} &middot; {client.phone}</p>
									</div>
									{#if selectedClientId === client.id}
										<Check class="size-5 text-primary shrink-0" />
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<Separator />

					<Button variant="outline" class="w-full">
						<UserPlus class="mr-1.5 size-4" />
						Create New Client
					</Button>
				</div>

			{:else if currentStep === 3}
				<!-- Step 4: Team Assignment -->
				<div class="space-y-4">
					<div>
						<label for="agent" class="text-sm font-medium mb-1.5 block">Listing Agent</label>
						<select
							id="agent"
							bind:value={selectedAgentId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#each teamMembers.filter((m) => m.role === 'admin' || m.role === 'listing_agent') as member}
								<option value={member.id}>{member.name} - {member.roleLabel}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="tc" class="text-sm font-medium mb-1.5 block">Transaction Coordinator</label>
						<select
							id="tc"
							bind:value={selectedTcId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#each teamMembers as member}
								<option value={member.id}>{member.name} - {member.roleLabel}</option>
							{/each}
						</select>
					</div>

					<Separator />

					<div>
						<h3 class="text-sm font-medium mb-3">Team Overview</h3>
						<div class="space-y-2">
							{#each teamMembers as member}
								<div class="flex items-center gap-3 rounded-lg border p-3">
									<div class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
										{member.initials}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium">{member.name}</p>
										<p class="text-xs text-muted-foreground">{member.roleLabel}</p>
									</div>
									<Badge variant="secondary" class="text-xs">{member.role}</Badge>
								</div>
							{/each}
						</div>
					</div>
				</div>

			{:else if currentStep === 4}
				<!-- Step 5: Pipeline & Phase -->
				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium mb-3 block">Initial Phase</label>
						<div class="space-y-2">
							{#each PHASE_LIST as phase}
								<button
									onclick={() => selectedPhase = phase.key}
									class="w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all
										{selectedPhase === phase.key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
									"
								>
									<span class="size-3 rounded-full shrink-0" style="background-color: {phase.color}"></span>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium">{phase.label}</p>
									</div>
									{#if selectedPhase === phase.key}
										<Check class="size-5 text-primary shrink-0" />
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4">
						<p class="text-sm text-muted-foreground">
							Most new listings start in <strong class="text-foreground">Onboarding</strong>. The workflow templates for your selected phase will be automatically applied, creating tasks for your team.
						</p>
					</div>
				</div>

			{:else if currentStep === 5}
				<!-- Step 6: Review & Create -->
				<div class="space-y-4">
					<div class="rounded-lg bg-muted/50 p-4 space-y-3">
						<h3 class="text-sm font-semibold">Property Details</h3>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span class="text-muted-foreground">Address:</span>
								<span class="ml-1 font-medium">{address || '(not set)'}</span>
							</div>
							<div>
								<span class="text-muted-foreground">City:</span>
								<span class="ml-1 font-medium">{city || '(not set)'}, {stateVal} {zip}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Type:</span>
								<span class="ml-1 font-medium capitalize">{propertyType.replace('_', ' ')}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Built:</span>
								<span class="ml-1 font-medium">{yearBuilt}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Size:</span>
								<span class="ml-1 font-medium">{beds} bd / {baths} ba / {sqft.toLocaleString()} sqft</span>
							</div>
							<div>
								<span class="text-muted-foreground">Lot:</span>
								<span class="ml-1 font-medium">{lotSqft.toLocaleString()} sqft</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4 space-y-3">
						<h3 class="text-sm font-semibold">Pricing</h3>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span class="text-muted-foreground">List Price:</span>
								<span class="ml-1 font-medium">{listPrice ? `$${listPrice}` : '(not set)'}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Strategy:</span>
								<span class="ml-1 font-medium capitalize">{pricingStrategy}</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-muted/50 p-4 space-y-3">
						<h3 class="text-sm font-semibold">Assignments</h3>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span class="text-muted-foreground">Client:</span>
								<span class="ml-1 font-medium">{clientContacts.find((c) => c.id === selectedClientId)?.name || '(not set)'}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Agent:</span>
								<span class="ml-1 font-medium">{teamMembers.find((m) => m.id === selectedAgentId)?.name || '(not set)'}</span>
							</div>
							<div>
								<span class="text-muted-foreground">TC:</span>
								<span class="ml-1 font-medium">{teamMembers.find((m) => m.id === selectedTcId)?.name || '(not set)'}</span>
							</div>
							<div>
								<span class="text-muted-foreground">Phase:</span>
								<Badge
									variant="outline"
									class="text-xs ml-1"
									style="border-color: {PHASES[selectedPhase].color}; color: {PHASES[selectedPhase].color}"
								>
									{PHASES[selectedPhase].label}
								</Badge>
							</div>
						</div>
					</div>

					<Separator />

					<div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
						<p class="text-sm">
							Creating this listing will set up the <strong>{PHASES[selectedPhase].label}</strong> workflow with pre-configured tasks for your team. You can customize tasks after creation.
						</p>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Navigation Buttons -->
	<div class="flex items-center justify-between">
		<Button
			variant="outline"
			onclick={prevStep}
			disabled={currentStep === 0}
		>
			<ArrowLeft class="mr-1.5 size-4" />
			Back
		</Button>

		<span class="text-sm text-muted-foreground">
			Step {currentStep + 1} of {STEPS.length}
		</span>

		{#if isComplete}
			<Button onclick={() => window.location.href = '/listings'}>
				<Check class="mr-1.5 size-4" />
				Create Listing
			</Button>
		{:else}
			<Button onclick={nextStep}>
				Next
				<ArrowRight class="ml-1.5 size-4" />
			</Button>
		{/if}
	</div>
</div>
