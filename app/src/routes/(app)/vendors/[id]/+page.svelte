<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { vendors, quotes, PHASES } from '$lib/data/mock-data.js';
	import {
		ArrowLeft,
		Mail,
		Phone,
		Star,
		MapPin,
		Clock,
		Award,
		TrendingUp,
		DollarSign,
		Briefcase,
		CheckCircle,
		XCircle,
		FileText,
		Home,
		Users,
	} from 'lucide-svelte';

	const vendor = $derived(vendors.find((v) => v.id === $page.params.id));

	const vendorQuotes = $derived(() => {
		if (!vendor) return [];
		return quotes.filter((q) => q.vendorId === vendor.id);
	});

	const categoryColors: Record<string, string> = {
		contractor: 'bg-orange-100 text-orange-700',
		stager: 'bg-purple-100 text-purple-700',
		photographer: 'bg-blue-100 text-blue-700',
		inspector: 'bg-slate-100 text-slate-600',
		landscaper: 'bg-emerald-100 text-emerald-700',
		painter: 'bg-amber-100 text-amber-700',
	};

	const quoteStatusColors: Record<string, string> = {
		requested: 'bg-blue-100 text-blue-700',
		received: 'bg-amber-100 text-amber-700',
		approved: 'bg-emerald-100 text-emerald-700',
		declined: 'bg-red-100 text-red-700',
	};

	function isPreferred(v: typeof vendors[0]): boolean {
		return v.rating >= 4.8 && v.reliabilityScore >= 95;
	}

	// Mock project history for active/past projects
	const mockProjects = [
		{ listing: '123 Main Street', listingId: 'l-1', scope: 'Kitchen update', status: 'completed', cost: '$11,200', date: '2026-03-15' },
		{ listing: '456 Oak Avenue', listingId: 'l-2', scope: 'Full renovation', status: 'completed', cost: '$24,000', date: '2026-02-28' },
		{ listing: '88 Sunnyvale Avenue', listingId: 'l-8', scope: 'Bathroom renovation', status: 'pending', cost: '$12,400', date: '2026-04-07' },
	];

	// Chart.js cost trend
	let chartCanvas: HTMLCanvasElement;

	onMount(async () => {
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);

		if (chartCanvas) {
			new Chart(chartCanvas, {
				type: 'line',
				data: {
					labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
					datasets: [
						{
							label: 'Project Cost',
							data: [7200, 8800, 6500, 9200, 11200, 8500, 12400],
							borderColor: '#C4704B',
							backgroundColor: '#C4704B15',
							fill: true,
							tension: 0.4,
							pointBackgroundColor: '#C4704B',
							pointBorderColor: '#fff',
							pointBorderWidth: 2,
							pointRadius: 4,
						},
						{
							label: 'Market Average',
							data: [8000, 8200, 8100, 8500, 8800, 9000, 9200],
							borderColor: '#7B8B6F',
							borderDash: [5, 5],
							fill: false,
							tension: 0.4,
							pointRadius: 0,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom',
							labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
						},
						tooltip: {
							callbacks: {
								label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
							},
						},
					},
					scales: {
						y: {
							beginAtZero: false,
							ticks: {
								callback: (val) => `$${(Number(val) / 1000).toFixed(0)}k`,
								font: { size: 11 },
							},
							grid: { color: '#E5E0D820' },
						},
						x: {
							ticks: { font: { size: 11 } },
							grid: { display: false },
						},
					},
				},
			});
		}
	});
</script>

{#if vendor}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-3">
				<Button variant="ghost" size="icon" href="/vendors" class="mt-1">
					<ArrowLeft class="size-4" />
				</Button>
				<Avatar class="size-14">
					<AvatarFallback class="bg-primary/10 text-lg font-bold text-primary">
						{vendor.initials}
					</AvatarFallback>
				</Avatar>
				<div>
					<div class="flex items-center gap-2">
						<h1 class="font-serif text-2xl font-bold">{vendor.name}</h1>
						{#if isPreferred(vendor)}
							<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
								<Award class="size-3" />
								Preferred
							</span>
						{/if}
					</div>
					<p class="text-sm text-muted-foreground">{vendor.company}</p>
					<div class="mt-1 flex items-center gap-3">
						<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {categoryColors[vendor.category] ?? 'bg-muted text-muted-foreground'}">
							{vendor.categoryLabel}
						</span>
						<div class="flex items-center gap-1">
							{#each Array(5) as _, i}
								<Star
									class="size-3.5 {i < Math.floor(vendor.rating)
										? 'fill-amber-400 text-amber-400'
										: 'text-muted-foreground/25'}"
								/>
							{/each}
							<span class="ml-1 text-sm font-medium">{vendor.rating}</span>
						</div>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm">
					<Mail class="mr-1.5 size-3.5" />
					Email
				</Button>
				<Button variant="outline" size="sm">
					<Phone class="mr-1.5 size-3.5" />
					Call
				</Button>
				<Button size="sm">
					<FileText class="mr-1.5 size-3.5" />
					Request Quote
				</Button>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Left Column -->
			<div class="space-y-4 lg:col-span-1">
				<!-- Contact Info -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Contact Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3 text-sm">
						<div class="flex items-center gap-3">
							<Mail class="size-4 shrink-0 text-muted-foreground" />
							<a href="mailto:{vendor.email}" class="text-primary hover:underline">{vendor.email}</a>
						</div>
						<div class="flex items-center gap-3">
							<Phone class="size-4 shrink-0 text-muted-foreground" />
							<span>{vendor.phone}</span>
						</div>
						<div class="flex items-center gap-3">
							<MapPin class="size-4 shrink-0 text-muted-foreground" />
							<span>{vendor.serviceArea}</span>
						</div>
					</CardContent>
				</Card>

				<!-- Performance Card -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Performance Metrics</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Reliability -->
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Reliability</span>
								<span class="font-semibold">{vendor.reliabilityScore}%</span>
							</div>
							<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full {vendor.reliabilityScore >= 95
										? 'bg-emerald-500'
										: vendor.reliabilityScore >= 85
											? 'bg-amber-500'
											: 'bg-red-400'}"
									style="width: {vendor.reliabilityScore}%"
								></div>
							</div>
						</div>
						<Separator />
						<div class="flex items-center justify-between text-sm">
							<span class="flex items-center gap-2 text-muted-foreground">
								<Clock class="size-3.5" /> Avg Response
							</span>
							<span class="font-medium">{vendor.avgResponseTime}</span>
						</div>
						<div class="flex items-center justify-between text-sm">
							<span class="flex items-center gap-2 text-muted-foreground">
								<Briefcase class="size-3.5" /> Projects
							</span>
							<span class="font-medium">{vendor.projectsCompleted}</span>
						</div>
						<div class="flex items-center justify-between text-sm">
							<span class="flex items-center gap-2 text-muted-foreground">
								<DollarSign class="size-3.5" /> Avg Cost
							</span>
							<span class="font-medium">{vendor.avgCost}</span>
						</div>
					</CardContent>
				</Card>

				<!-- Specialties -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Specialties</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-wrap gap-1.5">
							{#each vendor.specialties as specialty}
								<span class="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
									{specialty}
								</span>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Right Column -->
			<div class="space-y-4 lg:col-span-2">
				<!-- Cost Trend Chart -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-sm">
							<TrendingUp class="size-4" />
							Cost Trend
						</CardTitle>
						<CardDescription>Project costs over time vs market average</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="h-64">
							<canvas bind:this={chartCanvas}></canvas>
						</div>
					</CardContent>
				</Card>

				<!-- Quote History -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Quote History</CardTitle>
						<CardDescription>{vendorQuotes().length} quotes on record</CardDescription>
					</CardHeader>
					<CardContent>
						{#if vendorQuotes().length > 0}
							<div class="divide-y divide-border">
								{#each vendorQuotes() as quote}
									<div class="py-3 first:pt-0 last:pb-0">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<Home class="size-4 text-muted-foreground" />
												<div>
													<a href="/listings/{quote.listingId}" class="text-sm font-medium hover:text-primary">
														{quote.listingAddress}
													</a>
													<p class="text-xs text-muted-foreground">{quote.scope}</p>
												</div>
											</div>
											<div class="flex items-center gap-3">
												<span class="text-sm font-semibold">{quote.amountFormatted}</span>
												<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {quoteStatusColors[quote.status]}">
													{quote.status}
												</span>
											</div>
										</div>
										{#if quote.lineItems.length > 0}
											<div class="ml-7 mt-2 space-y-1">
												{#each quote.lineItems as item}
													<div class="flex items-center justify-between text-xs text-muted-foreground">
														<span>{item.description}</span>
														<span>${item.amount.toLocaleString()}</span>
													</div>
												{/each}
											</div>
										{/if}
										<div class="ml-7 mt-1.5 text-xs text-muted-foreground">
											Requested: {quote.requestedDate}
											{#if quote.receivedDate}
												 | Received: {quote.receivedDate}
											{/if}
											{#if quote.validUntil}
												 | Valid until: {quote.validUntil}
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="py-4 text-center text-sm text-muted-foreground">No quotes on record</p>
						{/if}
					</CardContent>
				</Card>

				<!-- Active & Past Projects -->
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">Projects</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="divide-y divide-border">
							{#each mockProjects as project}
								<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
									<div class="flex items-center gap-3">
										{#if project.status === 'completed'}
											<CheckCircle class="size-4 text-emerald-500" />
										{:else}
											<Clock class="size-4 text-amber-500" />
										{/if}
										<div>
											<a href="/listings/{project.listingId}" class="text-sm font-medium hover:text-primary">
												{project.listing}
											</a>
											<p class="text-xs text-muted-foreground">{project.scope}</p>
										</div>
									</div>
									<div class="text-right">
										<p class="text-sm font-medium">{project.cost}</p>
										<p class="text-xs text-muted-foreground">{project.date}</p>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{:else}
	<div class="py-12 text-center">
		<Users class="mx-auto size-10 text-muted-foreground/40" />
		<p class="mt-3 text-lg font-medium">Vendor not found</p>
		<Button variant="outline" href="/vendors" class="mt-4">
			<ArrowLeft class="mr-1.5 size-4" />
			Back to Vendors
		</Button>
	</div>
{/if}
