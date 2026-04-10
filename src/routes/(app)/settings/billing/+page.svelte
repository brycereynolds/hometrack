<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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
		name: 'Pro',
		price: 49,
		interval: 'user/mo',
		users: 5,
		billingDate: 'May 1, 2026',
		totalMonthly: 245
	};

	const plans = [
		{
			name: 'Starter',
			price: 29,
			interval: 'user/mo',
			features: ['Up to 10 active listings', '3 team members', 'Basic analytics', 'Email integration', '5 GB storage'],
			current: false,
			recommended: false
		},
		{
			name: 'Pro',
			price: 49,
			interval: 'user/mo',
			features: ['Unlimited active listings', '10 team members', 'Advanced analytics + AI Insights', 'All integrations', '50 GB storage', 'Client portal', 'Custom workflows'],
			current: true,
			recommended: true
		},
		{
			name: 'Enterprise',
			price: 89,
			interval: 'user/mo',
			features: ['Everything in Pro', 'Unlimited team members', 'Custom branding', 'API access', 'Unlimited storage', 'Dedicated support', 'SSO / SAML', 'Custom integrations'],
			current: false,
			recommended: false
		}
	];

	const usage = [
		{ label: 'Active Listings', value: 8, max: null, icon: Home, unit: 'unlimited' },
		{ label: 'Team Members', value: 5, max: 10, icon: Users, unit: 'of 10' },
		{ label: 'Storage Used', value: 2.4, max: 50, icon: HardDrive, unit: 'GB of 50 GB' }
	];

	const invoices = [
		{ id: 'INV-2026-04', date: 'Apr 1, 2026', amount: '$245.00', status: 'Paid' },
		{ id: 'INV-2026-03', date: 'Mar 1, 2026', amount: '$245.00', status: 'Paid' },
		{ id: 'INV-2026-02', date: 'Feb 1, 2026', amount: '$245.00', status: 'Paid' },
		{ id: 'INV-2026-01', date: 'Jan 1, 2026', amount: '$196.00', status: 'Paid' },
		{ id: 'INV-2025-12', date: 'Dec 1, 2025', amount: '$196.00', status: 'Paid' }
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
								<Button variant="outline" class="w-full gap-1">
									{plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
									<ArrowUpRight class="size-3" />
								</Button>
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
				<Button variant="outline" size="sm">Update</Button>
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
									<Button variant="ghost" size="sm" class="h-7 text-xs gap-1">
										<Download class="size-3" />
										PDF
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</div>
