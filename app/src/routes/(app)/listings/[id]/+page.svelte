<script lang="ts">
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
		Monitor
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const tasks = $derived(data.tasks ?? []);
	const activityItems = $derived((data.activityItems ?? []).slice(0, 5));
	const aiInsights = $derived((data.aiInsights ?? []).filter((a: any) => !a.dismissed).slice(0, 2));
	const teamMembers = $derived(data.teamMembers ?? []);

	const tasksDoneCount = $derived(tasks.filter((t: any) => t.status === 'done').length);

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
								<div><p class="text-sm font-semibold">{listing.beds ?? 0}</p><p class="text-xs text-muted-foreground">Beds</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Bath class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{listing.baths ?? 0}</p><p class="text-xs text-muted-foreground">Baths</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><Ruler class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{(listing.sqft ?? 0).toLocaleString()}</p><p class="text-xs text-muted-foreground">Sq Ft</p></div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="rounded-md bg-muted p-1.5"><MapPin class="size-4 text-muted-foreground" /></div>
								<div><p class="text-sm font-semibold">{(listing.lotSqft ?? 0).toLocaleString()}</p><p class="text-xs text-muted-foreground">Lot Sq Ft</p></div>
							</div>
						</div>
						<Separator class="my-4" />
						<div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
							<div>
								<p class="text-muted-foreground">Property Type</p>
								<p class="font-medium">{listing.propertyType ?? 'N/A'}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Year Built</p>
								<p class="font-medium">{listing.yearBuilt ?? 'N/A'}</p>
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
						{#if listing.features && (listing.features as string[]).length > 0}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each listing.features as feature}
									<Badge variant="secondary" class="font-normal">{feature}</Badge>
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
