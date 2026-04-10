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
	import {
		listings,
		contacts,
		activityItems,
		aiInsights,
		PHASE_LIST,
		type ListingPhase
	} from '$lib/data/mock-data';
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
					<td class="px-4 py-3 text-sm font-medium">{item.address}</td>
					<td class="px-4 py-3 text-sm text-muted-foreground">{item.city}</td>
					<td class="px-4 py-3 text-right text-sm font-serif font-semibold">{item.priceFormatted}</td>
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
