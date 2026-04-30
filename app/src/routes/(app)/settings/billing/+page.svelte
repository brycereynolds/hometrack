<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		CreditCard,
		Check,
		Download,
		Users,
		Home,
		HardDrive,
		Zap,
		ArrowUpRight
	} from 'lucide-svelte';

	const currentPlan = {
		name: 'Starter',
		price: 99,
		interval: 'user/mo',
		users: 3,
		billingDate: 'May 1, 2026',
		totalMonthly: 297
	};

	const plans = [
		{
			name: 'Free',
			price: 0,
			interval: 'forever',
			features: ['Solo agent — 1 seat', 'Up to 4 active listings', '4 video/voice walkthroughs per month', 'Basic analytics', 'Email support'],
			current: false,
			recommended: false
		},
		{
			name: 'Starter',
			price: 99,
			interval: 'user/mo',
			features: ['Team up to 5 users', '15 active listings', '15 video/voice walkthroughs per month', 'Standard analytics', 'Gmail & Calendar sync', 'Priority email support'],
			current: true,
			recommended: true
		},
		{
			name: 'Professional',
			price: 300,
			interval: 'user/mo',
			features: ['Unlimited team size', 'Unlimited listings', 'Unlimited video/voice walkthroughs', 'Client portal (white-label)', 'Advanced analytics & AI insights', 'Vendor & financial management', 'Open house digital check-in', 'All integrations (DocuSign, MLS, etc.)', 'Onboarding & migration support', 'Priority chat + phone support'],
			current: false,
			recommended: false
		}
	];

	const usage = [
		{ label: 'Active Listings', value: 8, max: 15, icon: Home, unit: 'of 15' },
		{ label: 'Team Members', value: 3, max: 5, icon: Users, unit: 'of 5' },
		{ label: 'Video/Voice Walkthroughs', value: 9, max: 15, icon: HardDrive, unit: 'of 15 this month' }
	];

	const invoices = [
		{ id: 'INV-2026-04', date: 'Apr 1, 2026', amount: '$297.00', status: 'Paid' },
		{ id: 'INV-2026-03', date: 'Mar 1, 2026', amount: '$297.00', status: 'Paid' },
		{ id: 'INV-2026-02', date: 'Feb 1, 2026', amount: '$297.00', status: 'Paid' },
		{ id: 'INV-2026-01', date: 'Jan 1, 2026', amount: '$198.00', status: 'Paid' },
		{ id: 'INV-2025-12', date: 'Dec 1, 2025', amount: '$198.00', status: 'Paid' }
	];
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Billing & Subscription</h2>
		<p class="text-sm text-muted-foreground">Manage your plan, usage, and payment method</p>
	</div>

	<!-- Current plan card -->
	<Card class="border-primary/20 bg-primary/[0.02]">
		<CardContent class="p-5">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="rounded-lg bg-primary/10 p-3">
						<Zap class="size-6 text-primary" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-lg font-bold">{currentPlan.name} Plan</h3>
							<Badge>Current</Badge>
						</div>
						<p class="text-sm text-muted-foreground">
							${currentPlan.price}/{currentPlan.interval} &middot; {currentPlan.users} users &middot; ${currentPlan.totalMonthly}/month total
						</p>
					</div>
				</div>
				<div class="text-right">
					<p class="text-sm text-muted-foreground">Next billing date</p>
					<p class="font-medium">{currentPlan.billingDate}</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Usage stats -->
	<div class="grid gap-3 sm:grid-cols-3">
		{#each usage as item}
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2 mb-2">
						<item.icon class="size-4 text-muted-foreground" />
						<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
					</div>
					<p class="text-xl font-bold font-mono">{item.value}</p>
					<p class="text-xs text-muted-foreground">{item.unit}</p>
					{#if item.max}
						<div class="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full bg-[#C4704B]"
								style="width: {(item.value / item.max) * 100}%"
							></div>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Plan comparison -->
	<Card>
		<CardHeader>
			<CardTitle>Plans</CardTitle>
			<CardDescription>Compare features and choose the right plan for your team</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 lg:grid-cols-3">
				{#each plans as plan}
					<div class="rounded-lg border p-4 {plan.current ? 'border-primary ring-1 ring-primary/20' : ''} {plan.recommended ? 'relative' : ''}">
						{#if plan.recommended}
							<Badge class="absolute -top-2.5 left-4 text-xs">Recommended</Badge>
						{/if}
						<h3 class="text-lg font-bold">{plan.name}</h3>
						<div class="mt-1 flex items-baseline gap-1">
							<span class="text-2xl font-bold font-mono">${plan.price}</span>
							<span class="text-sm text-muted-foreground">/{plan.interval}</span>
						</div>
						<ul class="mt-4 space-y-2">
							{#each plan.features as feature}
								<li class="flex items-start gap-2 text-sm">
									<Check class="size-4 text-green-600 flex-shrink-0 mt-0.5" />
									<span>{feature}</span>
								</li>
							{/each}
						</ul>
						<div class="mt-4">
							{#if plan.current}
								<Button variant="outline" class="w-full" disabled>Current Plan</Button>
							{:else}
								<Tooltip.Root>
									<Tooltip.Trigger class="w-full">
										<Button variant="outline" class="w-full gap-1 opacity-50" disabled>
											{plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
											<ArrowUpRight class="size-3" />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>Stripe integration coming soon</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Payment method -->
	<Card>
		<CardHeader>
			<CardTitle>Payment Method</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="rounded-md border p-2">
						<CreditCard class="size-5 text-muted-foreground" />
					</div>
					<div>
						<p class="text-sm font-medium">Visa ending in 4242</p>
						<p class="text-xs text-muted-foreground">Expires 08/2028</p>
					</div>
				</div>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="sm" class="opacity-50" disabled>Update</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Stripe integration coming soon</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</CardContent>
	</Card>

	<!-- Invoice history -->
	<Card>
		<CardHeader>
			<CardTitle>Invoice History</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="px-6 py-2.5 text-left font-medium text-muted-foreground">Invoice</th>
							<th class="px-6 py-2.5 text-left font-medium text-muted-foreground">Date</th>
							<th class="px-6 py-2.5 text-left font-medium text-muted-foreground">Amount</th>
							<th class="px-6 py-2.5 text-left font-medium text-muted-foreground">Status</th>
							<th class="px-6 py-2.5 text-right font-medium text-muted-foreground"></th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each invoices as inv}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="px-6 py-2.5 font-mono text-xs">{inv.id}</td>
								<td class="px-6 py-2.5">{inv.date}</td>
								<td class="px-6 py-2.5 font-mono">{inv.amount}</td>
								<td class="px-6 py-2.5">
									<Badge variant="secondary" class="text-xs">{inv.status}</Badge>
								</td>
								<td class="px-6 py-2.5 text-right">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button variant="ghost" size="sm" class="h-7 text-xs gap-1 opacity-50" disabled>
												<Download class="size-3" />
												PDF
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>Coming Soon</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</div>
