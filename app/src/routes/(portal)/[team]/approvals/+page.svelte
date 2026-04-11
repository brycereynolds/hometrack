<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		CheckCircle,
		XCircle,
		ChevronDown,
		ChevronUp,
		DollarSign,
		FileText,
		Image,
		Leaf,
		Handshake,
		Info
	} from 'lucide-svelte';
	import { offers, quotes, formatCurrency } from '$lib/data/mock-data';

	const clientOffer = offers.find((o) => o.id === 'o-4')!;
	const landscapingQuote = quotes.find((q) => q.id === 'q-4')!;

	let expandedItem = $state<string | null>(null);

	function toggleExpand(id: string) {
		expandedItem = expandedItem === id ? null : id;
	}

	const pendingItems = [
		{
			id: 'approval-1',
			type: 'quote',
			title: 'Landscaping quote from Green Thumb',
			subtitle: 'Curb appeal package for 123 Main Street',
			amount: landscapingQuote.amountFormatted,
			status: 'pending' as const,
			date: 'Received Apr 8',
			details:
				'Scope includes front yard refresh, drought-tolerant plantings, new mulch, edging, and seasonal color. Estimated 3-day project. Maria Santos has completed 6 projects with our team.',
			icon: Leaf
		},
		{
			id: 'approval-2',
			type: 'offer',
			title: 'New offer received — Chen-Williams',
			subtitle: `${clientOffer.priceFormatted} · ${clientOffer.financingType}`,
			amount: clientOffer.priceFormatted,
			status: 'pending' as const,
			date: 'Submitted Apr 9',
			details: `Buyers: ${clientOffer.buyerName} (represented by ${clientOffer.buyerAgent}). Earnest deposit: ${formatCurrency(clientOffer.earnestDeposit)}. Contingencies: ${clientOffer.contingencies.join(', ')}. Proposed close: ${clientOffer.closeDate}. ${clientOffer.notes}`,
			icon: Handshake
		},
		{
			id: 'approval-3',
			type: 'marketing',
			title: 'Instagram carousel for Open House',
			subtitle: '5-image carousel post scheduled for Apr 11',
			status: 'pending' as const,
			date: 'Created Apr 9',
			details:
				'Instagram carousel featuring the kitchen remodel, backyard oasis, and primary suite. Copy highlights the upcoming Open House on Apr 12, 1-4 PM. Includes neighborhood lifestyle shots.',
			icon: Image
		}
	];

	const historyItems = [
		{
			id: 'history-1',
			title: 'Property brochure design',
			subtitle: 'Digital + print brochure for listing launch',
			status: 'approved' as const,
			date: 'Approved Apr 3',
			icon: FileText
		},
		{
			id: 'history-2',
			title: 'Photography & video package',
			subtitle: 'Tran Group Photography — $1,800',
			status: 'approved' as const,
			date: 'Approved Mar 30',
			icon: DollarSign
		},
		{
			id: 'history-3',
			title: 'Kitchen update — Bradley Renovations',
			subtitle: 'Minor refresh — $11,200',
			status: 'approved' as const,
			date: 'Approved Mar 10',
			icon: DollarSign
		},
		{
			id: 'history-4',
			title: 'Johnson Trust offer',
			subtitle: '$2,400,000 — Jumbo loan',
			status: 'declined' as const,
			date: 'Declined Apr 9',
			icon: Handshake
		}
	];
</script>

<div class="space-y-8">
	<div>
		<div class="flex items-center gap-3">
			<h1 class="font-serif text-2xl font-bold tracking-tight">Approvals</h1>
			<Badge class="bg-primary/10 text-primary">{pendingItems.length} pending</Badge>
		</div>
		<p class="text-muted-foreground">Review and approve items for your listing.</p>
	</div>

	<!-- Pending Approvals -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
			Needs Your Decision
		</h2>
		{#each pendingItems as item}
			<Card class="border-l-4 border-l-amber-400 transition-shadow hover:shadow-md">
				<CardContent class="p-0">
					<div class="flex items-start gap-4 p-4">
						<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
							<item.icon class="size-5 text-amber-600" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="font-medium">{item.title}</p>
									<p class="text-sm text-muted-foreground">{item.subtitle}</p>
								</div>
								{#if item.amount && item.type !== 'offer'}
									<Badge variant="outline" class="shrink-0 text-base font-semibold">{item.amount}</Badge>
								{/if}
							</div>
							<p class="mt-1 text-xs text-muted-foreground">{item.date}</p>

							<button
								class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
								onclick={() => toggleExpand(item.id)}
							>
								<Info class="size-3" />
								{expandedItem === item.id ? 'Hide details' : 'View details'}
								{#if expandedItem === item.id}
									<ChevronUp class="size-3" />
								{:else}
									<ChevronDown class="size-3" />
								{/if}
							</button>

							{#if expandedItem === item.id}
								<div class="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
									{item.details}
								</div>
							{/if}
						</div>
					</div>

					<Separator />

					<div class="flex items-center justify-end gap-2 p-3">
						<Button variant="outline" size="sm" class="gap-1.5">
							<XCircle class="size-3.5" />
							Decline
						</Button>
						<Button size="sm" class="gap-1.5">
							<CheckCircle class="size-3.5" />
							Approve
						</Button>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Decision History -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
			Decision History
		</h2>
		{#each historyItems as item}
			<Card class="transition-colors hover:bg-muted/30">
				<CardContent class="flex items-center gap-4 p-4">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-lg {item.status === 'approved'
							? 'bg-emerald-500/10'
							: 'bg-red-500/10'}"
					>
						{#if item.status === 'approved'}
							<CheckCircle class="size-5 text-emerald-500" />
						{:else}
							<XCircle class="size-5 text-red-500" />
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">{item.title}</p>
						<p class="text-xs text-muted-foreground">{item.subtitle}</p>
					</div>
					<div class="text-right">
						<Badge
							variant="outline"
							class="text-xs {item.status === 'approved'
								? 'border-emerald-200 text-emerald-600'
								: 'border-red-200 text-red-600'}"
						>
							{item.status === 'approved' ? 'Approved' : 'Declined'}
						</Badge>
						<p class="mt-1 text-xs text-muted-foreground">{item.date}</p>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
