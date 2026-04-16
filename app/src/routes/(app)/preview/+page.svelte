<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import MetricCard from '$lib/components/shared/MetricCard.svelte';
	import PhaseBadge from '$lib/components/shared/PhaseBadge.svelte';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import ListingCard from '$lib/components/shared/ListingCard.svelte';
	import ContactCard from '$lib/components/shared/ContactCard.svelte';
	import ActivityFeedItem from '$lib/components/shared/ActivityFeedItem.svelte';
	import AIInsightCard from '$lib/components/shared/AIInsightCard.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import DataTable from '$lib/components/shared/DataTable.svelte';
	import ListingDetailTabs from '$lib/components/shared/ListingDetailTabs.svelte';
	import Breadcrumbs from '$lib/components/shared/Breadcrumbs.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus } from 'lucide-svelte';
	import { PHASE_LIST, type ListingPhase } from '$lib/config';

	// Inline example data for the design system preview
	const exampleAgent = { id: 'tm-1', teamId: 't-1', userId: null, name: 'Lauren Chen', email: 'lauren@example.com', role: 'admin' as const, roleLabel: 'Team Lead', avatar: '', initials: 'LC', phone: null, createdAt: new Date(), updatedAt: new Date() };

	const listings: any[] = [
		{ id: 'l-1', teamId: 't-1', address: '123 Main St', city: 'Palo Alto', state: 'CA', zip: '94301', price: 2495000, beds: 4, baths: 3, sqft: 2850, lotSqft: 6000, yearBuilt: 1952, propertyType: 'Single Family', mlsNumber: 'ML81234567', description: 'Stunning mid-century modern.', features: null, photoUrl: null, photos: null, lat: null, lng: null, phase: 'active' as ListingPhase, underContract: false, daysInPhase: 8, daysOnMarket: 8, listDate: null, targetListDate: null, listingAgreementDate: null, closeDate: null, canceledAt: null, cancelReason: null, agentId: 'tm-1', clientId: null, tasksDone: 12, tasksTotal: 18, documentsCount: 5, showingsCount: 6, offersCount: 2, zillowViews: 1245, zillowSaves: 198, createdAt: new Date(), updatedAt: new Date(), agent: exampleAgent, client: null },
		{ id: 'l-2', teamId: 't-1', address: '456 Oak Ave', city: 'Menlo Park', state: 'CA', zip: '94025', price: 1895000, beds: 3, baths: 2, sqft: 1950, lotSqft: 5000, yearBuilt: 1968, propertyType: 'Single Family', mlsNumber: 'ML81234568', description: 'Charming ranch style.', features: null, photoUrl: null, photos: null, lat: null, lng: null, phase: 'pre_market' as ListingPhase, underContract: false, daysInPhase: 14, daysOnMarket: 0, listDate: null, targetListDate: null, listingAgreementDate: null, closeDate: null, canceledAt: null, cancelReason: null, agentId: 'tm-1', clientId: null, tasksDone: 5, tasksTotal: 12, documentsCount: 3, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, createdAt: new Date(), updatedAt: new Date(), agent: exampleAgent, client: null },
		{ id: 'l-3', teamId: 't-1', address: '789 Elm Blvd', city: 'Los Altos', state: 'CA', zip: '94022', price: 3200000, beds: 5, baths: 4, sqft: 3400, lotSqft: 8000, yearBuilt: 2005, propertyType: 'Single Family', mlsNumber: 'ML81234569', description: 'Spacious modern home.', features: null, photoUrl: null, photos: null, lat: null, lng: null, phase: 'closed' as ListingPhase, underContract: false, daysInPhase: 3, daysOnMarket: 21, listDate: null, targetListDate: null, listingAgreementDate: null, closeDate: null, canceledAt: null, cancelReason: null, agentId: 'tm-1', clientId: null, tasksDone: 18, tasksTotal: 18, documentsCount: 8, showingsCount: 12, offersCount: 4, zillowViews: 2400, zillowSaves: 340, createdAt: new Date(), updatedAt: new Date(), agent: exampleAgent, client: null },
		{ id: 'l-4', teamId: 't-1', address: '321 Pine Ct', city: 'Mountain View', state: 'CA', zip: '94040', price: 1650000, beds: 3, baths: 2.5, sqft: 1800, lotSqft: 4500, yearBuilt: 1975, propertyType: 'Townhouse', mlsNumber: 'ML81234570', description: 'Updated townhouse.', features: null, photoUrl: null, photos: null, lat: null, lng: null, phase: 'active' as ListingPhase, underContract: true, daysInPhase: 5, daysOnMarket: 12, listDate: null, targetListDate: null, listingAgreementDate: null, closeDate: null, canceledAt: null, cancelReason: null, agentId: 'tm-1', clientId: null, tasksDone: 8, tasksTotal: 15, documentsCount: 4, showingsCount: 8, offersCount: 1, zillowViews: 890, zillowSaves: 142, createdAt: new Date(), updatedAt: new Date(), agent: exampleAgent, client: null },
	];

	const contacts: any[] = [
		{ id: 'c-1', teamId: 't-1', name: 'David Nguyen', email: 'david@example.com', phone: '(650) 555-0101', type: 'client', typeLabel: 'Client', company: null, initials: 'DN', lastInteraction: '2 days ago', buyerNeeds: null, relationshipStrength: null, listingId: null, createdAt: new Date(), updatedAt: new Date() },
		{ id: 'c-2', teamId: 't-1', name: 'Sarah Kim', email: 'sarah@compass.com', phone: '(650) 555-0102', type: 'agent', typeLabel: 'Agent', company: 'Compass', initials: 'SK', lastInteraction: '1 day ago', buyerNeeds: 'Looking for 3+ bed in Palo Alto, $2M budget', relationshipStrength: 4, listingId: null, createdAt: new Date(), updatedAt: new Date() },
		{ id: 'c-3', teamId: 't-1', name: 'Mike Torres', email: 'mike@example.com', phone: '(408) 555-0103', type: 'vendor', typeLabel: 'Vendor', company: 'Torres Staging', initials: 'MT', lastInteraction: '5 days ago', buyerNeeds: null, relationshipStrength: null, listingId: null, createdAt: new Date(), updatedAt: new Date() },
		{ id: 'c-4', teamId: 't-1', name: 'Jennifer Park', email: 'jpark@serenogroup.com', phone: '(650) 555-0104', type: 'agent', typeLabel: 'Agent', company: 'Sereno Group', initials: 'JP', lastInteraction: '3 days ago', buyerNeeds: 'Downsizers looking for single-story', relationshipStrength: 3, listingId: null, createdAt: new Date(), updatedAt: new Date() },
		{ id: 'c-5', teamId: 't-1', name: 'Robert Chen', email: 'robert@firstrepublic.com', phone: '(415) 555-0105', type: 'lender', typeLabel: 'Lender', company: 'First Republic', initials: 'RC', lastInteraction: '1 week ago', buyerNeeds: null, relationshipStrength: null, listingId: null, createdAt: new Date(), updatedAt: new Date() },
	];

	const activityItems: any[] = [
		{ id: 'a-1', teamId: 't-1', listingId: 'l-1', type: 'message', authorId: 'tm-1', authorName: 'Lauren Chen', authorInitials: 'LC', content: 'Updated the client on showing feedback from this weekend.', metadata: null, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'a-2', teamId: 't-1', listingId: 'l-1', type: 'email', authorId: 'tm-1', authorName: 'Lauren Chen', authorInitials: 'LC', content: 'Sent comparative market analysis to client.', metadata: { subject: 'CMA for 123 Main St' }, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'a-3', teamId: 't-1', listingId: 'l-2', type: 'task_complete', authorId: 'tm-1', authorName: 'Lauren Chen', authorInitials: 'LC', content: 'Completed staging consultation for 456 Oak Ave.', metadata: null, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'a-4', teamId: 't-1', listingId: null, type: 'ai_insight', authorId: null, authorName: 'HomeTrack', authorInitials: 'HT', content: 'Price adjustment may improve showing velocity for 123 Main St.', metadata: null, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'a-5', teamId: 't-1', listingId: 'l-1', type: 'voice_memo', authorId: 'tm-1', authorName: 'Lauren Chen', authorInitials: 'LC', content: 'Notes from showing with the Kim family.', metadata: { duration: '2:34' }, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
	];

	const aiInsights: any[] = [
		{ id: 'ai-1', teamId: 't-1', listingId: 'l-1', type: 'connection', title: 'Buyer match found', description: 'Sarah Kim has a buyer looking for exactly this type of property — 4 bed in Palo Alto.', actionLabel: 'View match', actionUrl: '/contacts/c-2', dismissed: false, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'ai-2', teamId: 't-1', listingId: 'l-1', type: 'anomaly', title: 'Views dropping', description: 'Online views for 123 Main St have declined 25% in the past week. Consider a price adjustment or fresh marketing push.', actionLabel: 'Review analytics', actionUrl: '/analytics/listings', dismissed: false, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'ai-3', teamId: 't-1', listingId: null, type: 'recommendation', title: 'Optimal list timing', description: 'Based on seasonal patterns, listings going active in the next 2 weeks see 15% more engagement.', actionLabel: 'Schedule listing', actionUrl: '/listings', dismissed: false, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
		{ id: 'ai-4', teamId: 't-1', listingId: 'l-4', type: 'warning', title: 'Disclosure deadline approaching', description: 'TDS for 321 Pine Ct is due in 3 days. The document has not yet been uploaded.', actionLabel: 'Upload now', actionUrl: '/listings/l-4', dismissed: false, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() },
	];
</script>

<svelte:head>
	<title>Component Preview | HomeTrack</title>
</svelte:head>

<div class="max-w-6xl space-y-16">
	<!-- Page Header -->
	<section>
		<h2 class="mb-6 font-serif text-2xl font-bold text-foreground">Component Preview Gallery</h2>
		<p class="mb-8 text-sm text-muted-foreground">
			All shared components rendered with mock data. This is the design system checkpoint before building pages.
		</p>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- PAGE HEADER -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="PageHeader" />
		<div class="rounded-lg border bg-card p-6">
			<PageHeader title="Listings" subtitle="Manage your active listing pipeline">
				{#snippet actions()}
					<Button>
						<Plus class="mr-2 size-4" />
						New Listing
					</Button>
				{/snippet}
			</PageHeader>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- BREADCRUMBS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="Breadcrumbs" />
		<div class="rounded-lg border bg-card p-6 space-y-4">
			<Breadcrumbs items={[
				{ label: 'Dashboard', href: '/dashboard' },
			]} />
			<Breadcrumbs items={[
				{ label: 'Listings', href: '/listings' },
				{ label: '123 Main Street' },
			]} />
			<Breadcrumbs items={[
				{ label: 'Listings', href: '/listings' },
				{ label: '123 Main Street', href: '/listings/l-1' },
				{ label: 'Tasks' },
			]} />
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- METRIC CARDS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="MetricCard" />
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<MetricCard label="Active Listings" value="8" trend="+3 this month" trendDirection="up" />
			<MetricCard label="Pipeline Value" value="$18.5M" trend="+12% MoM" trendDirection="up" />
			<MetricCard label="Avg Days on Market" value="21" trend="-3 days" trendDirection="down" />
			<MetricCard label="Open Tasks" value="14" detail="3 overdue" trendDirection="neutral" />
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- PHASE BADGES -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="PhaseBadge" />
		<div class="rounded-lg border bg-card p-6">
			<div class="flex flex-wrap gap-2">
				{#each PHASE_LIST as phase}
					<PhaseBadge phase={phase.key} />
				{/each}
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<span class="text-sm text-muted-foreground mr-2">Small:</span>
				{#each PHASE_LIST as phase}
					<PhaseBadge phase={phase.key} size="sm" />
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- STATUS BADGES -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="StatusBadge" />
		<div class="rounded-lg border bg-card p-6">
			<div class="flex flex-wrap gap-2">
				<StatusBadge status="Completed" variant="success" />
				<StatusBadge status="In Progress" variant="primary" />
				<StatusBadge status="Overdue" variant="error" />
				<StatusBadge status="Pending Review" variant="warning" />
				<StatusBadge status="Informational" variant="info" />
				<StatusBadge status="Draft" variant="neutral" />
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<span class="text-sm text-muted-foreground mr-2">With dot:</span>
				<StatusBadge status="Active" variant="success" dot />
				<StatusBadge status="Under Review" variant="warning" dot />
				<StatusBadge status="Rejected" variant="error" dot />
				<StatusBadge status="New" variant="info" dot />
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<span class="text-sm text-muted-foreground mr-2">Small:</span>
				<StatusBadge status="Done" variant="success" size="sm" />
				<StatusBadge status="Todo" variant="neutral" size="sm" />
				<StatusBadge status="Urgent" variant="error" size="sm" />
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- LISTING CARDS — Pipeline Variant -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ListingCard — Pipeline Variant" />
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each listings.slice(0, 4) as listing}
				<ListingCard {listing} variant="pipeline" />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- LISTING CARDS — List Variant -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ListingCard — List Variant" />
		<div class="space-y-3">
			{#each listings.slice(0, 3) as listing}
				<ListingCard {listing} variant="list" />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- CONTACT CARDS — Card Variant -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ContactCard — Card Variant" />
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each contacts.slice(0, 3) as contact}
				<ContactCard {contact} variant="card" />
			{/each}
		</div>

		<!-- Show an agent card with buyer needs -->
		<p class="mt-6 mb-3 text-sm font-medium text-muted-foreground">Agent with buyer needs:</p>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each contacts.filter(c => c.type === 'agent').slice(0, 2) as contact}
				<ContactCard {contact} variant="card" />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- CONTACT CARDS — Row Variant -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ContactCard — Row Variant" />
		<div class="rounded-lg border bg-card divide-y">
			{#each contacts.slice(0, 5) as contact}
				<ContactCard {contact} variant="row" />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- ACTIVITY FEED ITEMS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ActivityFeedItem — All Types" />
		<div class="rounded-lg border bg-card p-4 divide-y divide-border/50">
			{#each activityItems as item}
				<ActivityFeedItem {item} showListing />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- AI INSIGHT CARDS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="AIInsightCard — All Types" />
		<div class="space-y-3">
			{#each aiInsights.slice(0, 4) as insight}
				<AIInsightCard {insight} />
			{/each}
		</div>

		<p class="mt-6 mb-3 text-sm font-medium text-muted-foreground">Compact variant (for sidebar):</p>
		<div class="max-w-sm space-y-2">
			{#each aiInsights.slice(0, 2) as insight}
				<AIInsightCard {insight} compact />
			{/each}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- LISTING DETAIL TABS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="ListingDetailTabs" />
		<div class="rounded-lg border bg-card">
			<ListingDetailTabs listingId="l-1" activeTab="overview" />
			<div class="p-6">
				<p class="text-sm text-muted-foreground">Tab content area (Overview tab active)</p>
			</div>
		</div>
		<div class="mt-4 rounded-lg border bg-card">
			<ListingDetailTabs listingId="l-1" activeTab="tasks" />
			<div class="p-6">
				<p class="text-sm text-muted-foreground">Tab content area (Tasks tab active)</p>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- DATA TABLE -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="DataTable" />
		<DataTable
			columns={[
				{ key: 'address', label: 'Address', sortable: true },
				{ key: 'city', label: 'City', sortable: true },
				{ key: 'price', label: 'Price', sortable: true, align: 'right' },
				{ key: 'phase', label: 'Phase' },
				{ key: 'agent', label: 'Agent' },
			]}
			data={listings.slice(0, 5)}
			totalRows={listings.length}
			page={1}
			pageSize={5}
		>
			{#snippet filters()}
				<div class="flex items-center gap-2">
					<input
						type="search"
						placeholder="Search listings..."
						class="h-8 w-64 rounded-md border bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
					<Button variant="outline" size="sm">Filters</Button>
				</div>
			{/snippet}
			{#snippet row(item, _index)}
				<tr class="hover:bg-muted/50 transition-colors">
					<td class="px-4 py-3 text-sm font-medium">{item.property?.address ?? item.address}</td>
					<td class="px-4 py-3 text-sm text-muted-foreground">{item.property?.city ?? item.city}</td>
					<td class="px-4 py-3 text-right text-sm font-serif font-semibold">{"$" + (item.price / 1000000).toFixed(1) + "M"}</td>
					<td class="px-4 py-3"><PhaseBadge phase={item.phase} size="sm" /></td>
					<td class="px-4 py-3 text-sm text-muted-foreground">{item.agent.name}</td>
				</tr>
			{/snippet}
		</DataTable>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- EMPTY STATE -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="EmptyState" />
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div class="rounded-lg border bg-card">
				<EmptyState
					icon="home"
					title="No active listings"
					description="Create your first listing to see your pipeline come to life."
					actionLabel="Create Listing"
					onAction={() => {}}
				/>
			</div>
			<div class="rounded-lg border bg-card">
				<EmptyState
					icon="message"
					title="No messages yet"
					description="Start a conversation or send a note to get the activity feed going."
				/>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- TYPOGRAPHY -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="Typography" />
		<div class="rounded-lg border bg-card p-6 space-y-4">
			<h1 class="font-serif text-4xl font-bold">DM Serif Display — Page Title (4xl)</h1>
			<h2 class="font-serif text-3xl font-bold">DM Serif Display — Section Title (3xl)</h2>
			<h3 class="text-2xl font-semibold">Inter — Section Header (2xl)</h3>
			<h4 class="text-xl font-semibold">Inter — Card Title (xl)</h4>
			<h5 class="text-lg font-medium">Inter — Widget Title (lg)</h5>
			<p class="text-base">Inter — Body text at 16px base size. This is how most content reads.</p>
			<p class="text-sm text-muted-foreground">Inter — Secondary text (sm), used for labels, metadata, timestamps.</p>
			<p class="text-xs text-muted-foreground">Inter — Fine print (xs), legal text, micro labels.</p>
			<p class="font-serif text-5xl font-bold">$2.5M <span class="text-sm font-sans font-normal text-muted-foreground">big metric number</span></p>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<!-- COLORS -->
	<!-- ═══════════════════════════════════════════════════════════════════ -->
	<section>
		<SectionTitle title="Color Palette" />
		<div class="rounded-lg border bg-card p-6">
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
				<ColorSwatch name="Primary" class_="bg-primary" textClass="text-primary-foreground" />
				<ColorSwatch name="Secondary" class_="bg-secondary" textClass="text-secondary-foreground" />
				<ColorSwatch name="Accent" class_="bg-accent" textClass="text-accent-foreground" />
				<ColorSwatch name="Destructive" class_="bg-destructive" textClass="text-destructive-foreground" />
				<ColorSwatch name="Muted" class_="bg-muted" textClass="text-foreground" />
			</div>
			<Separator class="my-4" />
			<p class="mb-3 text-sm font-medium text-muted-foreground">Status Colors:</p>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<ColorSwatch name="Success" class_="bg-success" textClass="text-success-foreground" />
				<ColorSwatch name="Warning" class_="bg-warning" textClass="text-warning-foreground" />
				<ColorSwatch name="Error" class_="bg-error" textClass="text-error-foreground" />
				<ColorSwatch name="Info" class_="bg-info" textClass="text-info-foreground" />
			</div>
			<Separator class="my-4" />
			<p class="mb-3 text-sm font-medium text-muted-foreground">Backgrounds:</p>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<ColorSwatch name="Background" class_="bg-background border border-border" textClass="text-foreground" />
				<ColorSwatch name="Card" class_="bg-card border border-border" textClass="text-foreground" />
				<ColorSwatch name="Bg Secondary" class_="bg-background-secondary border border-border" textClass="text-foreground" />
				<ColorSwatch name="Bg Tertiary" class_="bg-background-tertiary border border-border" textClass="text-foreground" />
			</div>
			<Separator class="my-4" />
			<p class="mb-3 text-sm font-medium text-muted-foreground">Phase Pipeline Colors:</p>
			<div class="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-9">
				{#each PHASE_LIST as phase}
					<div class="text-center">
						<div class="mx-auto mb-1 size-10 rounded-md" style="background-color: {phase.color}"></div>
						<p class="text-[10px] text-muted-foreground">{phase.label.split(' ')[0]}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- Helper sub-components for the preview page only                       -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

{#snippet SectionTitle(props: { title: string })}
	<div class="mb-4 flex items-center gap-3">
		<h3 class="text-lg font-semibold text-foreground">{props.title}</h3>
		<div class="flex-1 border-t border-border-subtle"></div>
	</div>
{/snippet}

{#snippet ColorSwatch(props: { name: string; class_: string; textClass: string })}
	<div class="overflow-hidden rounded-md">
		<div class="flex h-16 items-end p-2 {props.class_}">
			<span class="text-xs font-medium {props.textClass}">{props.name}</span>
		</div>
	</div>
{/snippet}
