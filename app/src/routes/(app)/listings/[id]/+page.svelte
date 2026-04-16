<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { PHASES } from '$lib/config.js';
	import { formatCurrency } from '$lib/utils.js';
	import {
		Bed,
		Bath,
		Ruler,
		MapPin,
		Calendar,
		Home,
		CheckCircle2,
		FileText,
		Eye,
		Users,
		ClipboardList,
		Sparkles,
		ExternalLink,
		ArrowRight,
		MessageSquare,
		Mail,
		Phone,
		Globe,
		Monitor,
		TrendingUp,
		Search
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const prop = $derived(listing?.property);
	const tasks = $derived(data.tasks ?? []);
	const activityItems = $derived((data.activityItems ?? []).slice(0, 5));
	const aiInsights = $derived((data.aiInsights ?? []).filter((a: any) => !a.dismissed).slice(0, 2));
	const teamMembers = $derived(data.teamMembers ?? []);

	const confirmedComps = $derived(data.confirmedComps);

	const tasksDoneCount = $derived(tasks.filter((t: any) => t.status === 'done').length);

	// Overview map
	let overviewMapContainer = $state<HTMLDivElement>(null!);
	let overviewMap: any = null;

	onMount(async () => {
		if (!prop?.lat || !prop?.lng || !overviewMapContainer) return;

		const L = (await import('leaflet')).default;
		overviewMap = L.map(overviewMapContainer, { zoomControl: false, attributionControl: false }).setView([prop.lat, prop.lng], 15);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 18,
		}).addTo(overviewMap);

		const icon = L.divIcon({
			className: 'overview-pin',
			html: `<div style="background: #b45309; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">★</div>`,
			iconSize: [28, 28],
			iconAnchor: [14, 14],
		});
		L.marker([prop.lat, prop.lng], { icon }).addTo(overviewMap);
	});

	onDestroy(() => {
		if (overviewMap) {
			overviewMap.remove();
			overviewMap = null;
		}
	});

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function timeAgo(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function soldAgo(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / 86400000);
		if (days < 1) return 'Today';
		if (days < 30) return `${days}d ago`;
		const months = Math.floor(days / 30);
		if (months < 12) return `${months}mo ago`;
		const years = Math.floor(months / 12);
		return `${years}y ago`;
	}

	function getCompPhoto(comp: any): string | null {
		if (comp.photoUrl) return comp.photoUrl;
		if (comp.photos && Array.isArray(comp.photos) && comp.photos.length > 0) {
			return typeof comp.photos[0] === 'string' ? comp.photos[0] : comp.photos[0]?.url ?? null;
		}
		if (comp.property?.photos && Array.isArray(comp.property.photos) && comp.property.photos.length > 0) {
			const p = comp.property.photos[0];
			return typeof p === 'string' ? p : p?.url ?? null;
		}
		return null;
	}

	function getActivityColor(type: string) {
		switch (type) {
			case 'message': return 'text-blue-500';
			case 'email': return 'text-violet-500';
			case 'ai_insight': return 'text-amber-500';
			case 'system': return 'text-muted-foreground';
			case 'phase_change': return 'text-emerald-500';
			case 'task_complete': return 'text-green-500';
			case 'voice_memo': return 'text-rose-500';
			default: return 'text-muted-foreground';
		}
	}
</script>

{#if listing}
	<div class="space-y-6">
		<!-- Quick Stats Row -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<a href="/listings/{listing.id}/tasks" class="group">
				<Card class="transition-shadow hover:shadow-md">
					<CardContent class="p-4">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-blue-50 p-2">
								<ClipboardList class="size-4 text-blue-600" />
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Tasks</p>
								<p class="text-lg font-bold">{listing.tasksDone ?? 0}/{listing.tasksTotal ?? 0}</p>
							</div>
						</div>
						<div class="mt-2 h-1.5 rounded-full bg-muted">
							<div
								class="h-1.5 rounded-full bg-blue-500 transition-all"
								style="width: {(listing.tasksTotal ?? 0) > 0 ? ((listing.tasksDone ?? 0) / (listing.tasksTotal ?? 1)) * 100 : 0}%"
							></div>
						</div>
					</CardContent>
				</Card>
			</a>
			<a href="/listings/{listing.id}/documents" class="group">
				<Card class="transition-shadow hover:shadow-md">
					<CardContent class="p-4">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-violet-50 p-2">
								<FileText class="size-4 text-violet-600" />
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Documents</p>
								<p class="text-lg font-bold">{listing.documentsCount ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</a>
			<a href="/listings/{listing.id}/showings" class="group">
				<Card class="transition-shadow hover:shadow-md">
					<CardContent class="p-4">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-amber-50 p-2">
								<Eye class="size-4 text-amber-600" />
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Showings</p>
								<p class="text-lg font-bold">{listing.showingsCount ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</a>
			<a href="/listings/{listing.id}/offers" class="group">
				<Card class="transition-shadow hover:shadow-md">
					<CardContent class="p-4">
						<div class="flex items-center gap-2">
							<div class="rounded-lg bg-emerald-50 p-2">
								<Users class="size-4 text-emerald-600" />
							</div>
							<div>
								<p class="text-xs text-muted-foreground">Offers</p>
								<p class="text-lg font-bold">{listing.offersCount ?? 0}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</a>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main Content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Property Details Card -->
				<Card>
					<CardHeader>
						<CardTitle class="font-serif">Property Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Bed class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{prop?.beds ?? 0}</p><p class="text-xs text-muted-foreground">Beds</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Bath class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{prop?.baths ?? 0}</p><p class="text-xs text-muted-foreground">Baths</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Ruler class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{(prop?.sqft ?? 0).toLocaleString()}</p><p class="text-xs text-muted-foreground">Sq Ft</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><MapPin class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{(prop?.lotSqft ?? 0).toLocaleString()}</p><p class="text-xs text-muted-foreground">Lot Sq Ft</p></div>
							</div>
						</div>
						<Separator class="my-4" />
						<div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
							<div>
								<p class="text-muted-foreground">Property Type</p>
								<p class="font-medium">{prop?.propertyType ?? 'N/A'}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Year Built</p>
								<p class="font-medium">{prop?.yearBuilt ?? 'N/A'}</p>
							</div>
							<div>
								<p class="text-muted-foreground">MLS Number</p>
								<p class="font-medium">{listing.mlsNumber ?? 'N/A'}</p>
							</div>
						</div>
						{#if listing.description}
							<Separator class="my-4" />
							<p class="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
						{/if}
						{#if prop?.features && typeof prop.features === 'object'}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each Object.entries(prop.features as Record<string, unknown>).filter(([, v]) => v === true) as [key]}
									<Badge variant="secondary" class="font-normal">{key}</Badge>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Key Dates Card -->
				<Card>
					<CardHeader>
						<CardTitle class="font-serif">Key Dates</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="divide-y">
							<div class="flex items-center justify-between py-3 first:pt-0">
								<div class="flex items-center gap-2.5">
									<Calendar class="size-4 text-muted-foreground" />
									<span class="text-sm">Listed Date</span>
								</div>
								<span class="text-sm font-medium">
									{listing.listDate ? formatDate(listing.listDate) : 'Not yet listed'}
								</span>
							</div>
							<div class="flex items-center justify-between py-3">
								<div class="flex items-center gap-2.5">
									<Calendar class="size-4 text-muted-foreground" />
									<span class="text-sm">Target List Date</span>
								</div>
								<span class="text-sm font-medium">{listing.targetListDate ? formatDate(listing.targetListDate) : 'Not set'}</span>
							</div>
							<div class="flex items-center justify-between py-3 last:pb-0">
								<div class="flex items-center gap-2.5">
									<Calendar class="size-4 text-muted-foreground" />
									<span class="text-sm">Days in Phase</span>
								</div>
								<Badge variant="outline">{listing.daysInPhase ?? 0} days</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Confirmed Comparables -->
				<Card>
					<CardHeader class="flex-row items-center justify-between">
						<div class="flex items-center gap-2">
							<CardTitle class="font-serif">Confirmed Comparables</CardTitle>
							{#if confirmedComps?.comps?.length}
								<Badge variant="secondary" class="text-xs">{confirmedComps.comps.length}</Badge>
							{/if}
						</div>
						{#if confirmedComps?.comps?.length}
							<Button variant="ghost" size="sm" href="/listings/{listing.id}/listing">
								View all comps
								<ArrowRight class="ml-1 size-3.5" />
							</Button>
						{/if}
					</CardHeader>
					<CardContent>
						{#if confirmedComps?.comps?.length}
							<div class="divide-y">
								{#each confirmedComps.comps as comp}
									{@const photo = getCompPhoto(comp)}
									{@const cp = comp.property}
									<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
										{#if photo}
											<img
												src={photo}
												alt={cp?.address ?? 'Comp'}
												class="size-12 shrink-0 rounded-md object-cover"
											/>
										{:else}
											<div class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
												<Home class="size-5 text-muted-foreground" />
											</div>
										{/if}
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between gap-2">
												{#if cp?.id}
													<a href="/properties/{cp.id}" class="text-sm font-medium truncate hover:underline">{cp.address ?? 'Unknown'}</a>
												{:else}
													<span class="text-sm font-medium truncate">Unknown</span>
												{/if}
												<span class="shrink-0 text-sm font-semibold">{comp.price ? formatCurrency(comp.price) : 'N/A'}</span>
											</div>
											<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
												{#if cp?.beds != null}<span>{cp.beds}bd</span>{/if}
												{#if cp?.baths != null}<span>/ {cp.baths}ba</span>{/if}
												{#if cp?.sqft != null}<span class="before:content-['·'] before:mx-1">{cp.sqft.toLocaleString()} sqft</span>{/if}
												{#if comp.soldDate}
													<span class="before:content-['·'] before:mx-1">{comp.status === 'sold' || comp.status === 'Sold' ? 'Sold' : comp.status ?? 'Sold'} {soldAgo(comp.soldDate)}</span>
												{:else if comp.status}
													<span class="before:content-['·'] before:mx-1">{comp.status}</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
							{#if confirmedComps.analysis?.suggestedPriceLow && confirmedComps.analysis?.suggestedPriceHigh}
								<Separator class="my-3" />
								<div class="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
									<TrendingUp class="size-4 text-emerald-600 shrink-0" />
									<div class="text-sm">
										<span class="font-medium text-emerald-800">Suggested Range:</span>
										<span class="text-emerald-700">
											{formatCurrency(confirmedComps.analysis.suggestedPriceLow)} – {formatCurrency(confirmedComps.analysis.suggestedPriceHigh)}
										</span>
										{#if confirmedComps.analysis.confidence}
											<span class="text-emerald-600/70">({Math.round(confirmedComps.analysis.confidence * 100)}% confidence)</span>
										{/if}
									</div>
								</div>
							{/if}
						{:else}
							<div class="flex flex-col items-center gap-2 py-4 text-center">
								<div class="rounded-full bg-muted p-2.5">
									<Search class="size-5 text-muted-foreground" />
								</div>
								<p class="text-sm text-muted-foreground">No confirmed comps yet</p>
								<Button variant="ghost" size="sm" class="text-xs" href="/listings/{listing.id}/listing">
									Run market analysis to find comparables
									<ArrowRight class="ml-1 size-3" />
								</Button>
							</div>
						{/if}
					</CardContent>
				</Card>

			<!-- Recent Activity Mini-Feed -->
				<Card>
					<CardHeader class="flex-row items-center justify-between">
						<CardTitle class="font-serif">Recent Activity</CardTitle>
						<Button variant="ghost" size="sm" href="/listings/{listing.id}/activity">
							View All
							<ArrowRight class="ml-1 size-3.5" />
						</Button>
					</CardHeader>
					<CardContent>
						{#if activityItems.length > 0}
							<div class="divide-y">
								{#each activityItems as activity}
									<div class="flex gap-3 py-3 first:pt-0 last:pb-0 {activity.type === 'ai_insight' ? 'border-l-2 border-l-amber-400 pl-3' : ''}">
										<Avatar class="size-8 shrink-0">
											<AvatarFallback class="text-xs {activity.type === 'ai_insight' ? 'bg-amber-100 text-amber-700' : activity.type === 'system' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}">
												{activity.authorInitials ?? '?'}
											</AvatarFallback>
										</Avatar>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium">{activity.authorName ?? 'System'}</span>
												<span class="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</span>
											</div>
											<p class="mt-0.5 text-sm text-muted-foreground line-clamp-2">{activity.content}</p>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No activity yet for this listing.</p>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Location Map -->
				{#if prop?.lat && prop?.lng}
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="font-serif text-base flex items-center gap-2">
								<MapPin class="size-4 text-muted-foreground" />
								Location
							</CardTitle>
						</CardHeader>
						<CardContent class="p-3 pt-0">
							<div bind:this={overviewMapContainer} class="h-40 rounded-lg overflow-hidden border"></div>
						</CardContent>
					</Card>
				{/if}

				<!-- Open House Button -->
				<Button variant="outline" class="w-full gap-2" href="/open-house/{listing.id}">
					<Monitor class="size-4" />
					Start Open House
				</Button>

				<!-- Team Assignments -->
				<Card>
					<CardHeader>
						<CardTitle class="font-serif text-base">Team</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="divide-y">
							{#if listing.agent}
								<div class="flex items-center gap-3 py-2.5 first:pt-0">
									<Avatar class="size-9">
										<AvatarFallback class="bg-primary/10 text-primary text-xs font-medium">{listing.agent.initials ?? '?'}</AvatarFallback>
									</Avatar>
									<div class="min-w-0">
										<p class="text-sm font-medium truncate">{listing.agent.name}</p>
										<p class="text-xs text-muted-foreground">{listing.agent.roleLabel ?? listing.agent.role}</p>
									</div>
								</div>
							{/if}
							{#each teamMembers.filter((m: any) => m.id !== listing?.agent?.id).slice(0, 3) as member}
								<div class="flex items-center gap-3 py-2.5 last:pb-0">
									<Avatar class="size-9">
										<AvatarFallback class="bg-muted text-muted-foreground text-xs font-medium">{member.initials ?? '?'}</AvatarFallback>
									</Avatar>
									<div class="min-w-0">
										<p class="text-sm font-medium truncate">{member.name}</p>
										<p class="text-xs text-muted-foreground">{member.roleLabel ?? member.role}</p>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- Client Info -->
				{#if listing.client}
					<Card>
						<CardHeader>
							<CardTitle class="font-serif text-base">Client</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="flex items-center gap-3">
								<Avatar class="size-10">
									<AvatarFallback class="bg-primary/10 text-primary text-sm font-medium">{listing.client.initials ?? '?'}</AvatarFallback>
								</Avatar>
								<div>
									<p class="text-sm font-medium">{listing.client.name}</p>
									<p class="text-xs text-muted-foreground">{listing.client.type}</p>
								</div>
							</div>
							<Separator class="my-3" />
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-sm">
									<Mail class="size-3.5 text-muted-foreground" />
									<span class="text-muted-foreground truncate">{listing.client.email}</span>
								</div>
								<div class="flex items-center gap-2 text-sm">
									<Phone class="size-3.5 text-muted-foreground" />
									<span class="text-muted-foreground">{listing.client.phone}</span>
								</div>
							</div>
							<div class="mt-3 flex items-center gap-2">
								<Badge variant="outline" class="text-xs">
									<Globe class="mr-1 size-3" />
									Portal Active
								</Badge>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Insights -->
				{#if aiInsights.length > 0}
					<Card class="border-amber-200 bg-amber-50/30">
						<CardHeader>
							<CardTitle class="flex items-center gap-2 font-serif text-base">
								<Sparkles class="size-4 text-amber-500" />
								Insights
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each aiInsights as insight}
									<div class="rounded-lg border border-amber-200/50 bg-white p-3">
										<p class="text-sm font-medium">{insight.title}</p>
										<p class="mt-1 text-xs text-muted-foreground line-clamp-3">{insight.description}</p>
										{#if insight.actionLabel}
											<Button variant="ghost" size="sm" class="mt-2 h-7 text-xs text-amber-700 hover:text-amber-800" href={insight.actionUrl}>
												{insight.actionLabel}
												<ExternalLink class="ml-1 size-3" />
											</Button>
										{/if}
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</div>
{/if}
