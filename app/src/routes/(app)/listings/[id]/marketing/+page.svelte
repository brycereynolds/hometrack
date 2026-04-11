<script lang="ts">
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { listings, marketingAssets, formatNumber } from '$lib/data/mock-data.js';
	import {
		Camera,
		Video,
		Map,
		FileText,
		Globe,
		CheckCircle2,
		Circle,
		Clock,
		Send,
		Eye,
		MousePointer2,
		Bookmark,
		Image,
		Share2,
		Briefcase,
		ExternalLink,
		ImageIcon,
		Play
	} from 'lucide-svelte';

	const listing = $derived(listings.find((l) => l.id === $page.params.id));
	const assets = $derived(marketingAssets.filter((a) => a.listingId === listing?.id));

	const socialPosts = $derived(assets.filter((a) => a.type === 'social_post'));
	const productionAssets = $derived(assets.filter((a) => a.type !== 'social_post'));

	const contentChecklist = $derived([
		{ label: 'Photography', icon: Camera, done: assets.some((a) => a.type === 'photo' && a.status === 'complete') },
		{ label: 'Video Tour', icon: Video, done: assets.some((a) => a.type === 'video' && a.status === 'complete') },
		{ label: 'Floor Plan', icon: Map, done: assets.some((a) => a.type === 'floorplan' && a.status === 'complete') },
		{ label: 'Brochure', icon: FileText, done: assets.some((a) => a.type === 'brochure' && a.status === 'complete') },
		{ label: 'Virtual Tour', icon: Globe, done: assets.some((a) => a.type === 'virtual_tour' && a.status === 'complete') },
		{ label: 'MLS Copy', icon: FileText, done: false }
	]);

	const completedCount = $derived(contentChecklist.filter((c) => c.done).length);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'complete': return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Complete' };
			case 'published': return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Published' };
			case 'in_production': return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'In Production' };
			case 'scheduled': return { color: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Scheduled' };
			default: return { color: 'bg-gray-100 text-gray-600', label: status };
		}
	}

	function getPlatformIcon(platform?: string) {
		switch (platform) {
			case 'Instagram': return Image;
			case 'Facebook': return Share2;
			case 'LinkedIn': return Briefcase;
			default: return Globe;
		}
	}

	function getPlatformColor(platform?: string) {
		switch (platform) {
			case 'Instagram': return 'text-pink-600 bg-pink-50';
			case 'Facebook': return 'text-blue-600 bg-blue-50';
			case 'LinkedIn': return 'text-sky-700 bg-sky-50';
			default: return 'text-gray-600 bg-gray-50';
		}
	}
</script>

{#if listing}
	<div class="space-y-6">
		<h2 class="font-serif text-lg font-semibold">Marketing</h2>

		<!-- Photo Gallery -->
		{#if listing.photos && listing.photos.length > 0}
			<Card>
				<CardHeader class="flex-row items-center justify-between">
					<CardTitle class="font-serif text-base">Photo Gallery</CardTitle>
					<Badge variant="secondary">{listing.photos.length} Photos</Badge>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
						{#each listing.photos as photo, i}
							<div class="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer">
								<img
									src={photo}
									alt="Property photo {i + 1}"
									class="h-full w-full object-cover transition-transform group-hover:scale-105"
								/>
								<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
									<div class="opacity-0 group-hover:opacity-100 transition-opacity">
										<div class="rounded-full bg-white/90 p-2">
											<ImageIcon class="size-4 text-gray-700" />
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Media Production Checklist -->
			<Card>
				<CardHeader>
					<CardTitle class="font-serif text-base">Media Production</CardTitle>
					<p class="text-sm text-muted-foreground">{completedCount}/{contentChecklist.length} items complete</p>
				</CardHeader>
				<CardContent>
					<div class="h-1.5 rounded-full bg-muted mb-4">
						<div
							class="h-1.5 rounded-full bg-green-500 transition-all"
							style="width: {(completedCount / contentChecklist.length) * 100}%"
						></div>
					</div>
					<div class="divide-y">
						{#each contentChecklist as item}
							{@const Icon = item.icon}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								{#if item.done}
									<CheckCircle2 class="size-5 text-green-500 shrink-0" />
								{:else}
									<Circle class="size-5 text-muted-foreground/40 shrink-0" />
								{/if}
								<Icon class="size-4 text-muted-foreground" />
								<span class="text-sm flex-1 {item.done ? 'text-muted-foreground' : 'font-medium'}">
									{item.label}
								</span>
								{#if item.done}
									<Badge variant="outline" class="text-[10px] bg-green-100 text-green-700 border-green-200">Done</Badge>
								{:else}
									<Badge variant="outline" class="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
								{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Production Assets -->
			<Card>
				<CardHeader>
					<CardTitle class="font-serif text-base">Production Assets</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each productionAssets as asset}
							{@const status = getStatusBadge(asset.status)}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<div class="rounded-md bg-muted p-1.5">
									{#if asset.type === 'photo'}
										<Camera class="size-4 text-muted-foreground" />
									{:else if asset.type === 'video'}
										<Video class="size-4 text-muted-foreground" />
									{:else if asset.type === 'floorplan'}
										<Map class="size-4 text-muted-foreground" />
									{:else if asset.type === 'virtual_tour'}
										<Globe class="size-4 text-muted-foreground" />
									{:else}
										<FileText class="size-4 text-muted-foreground" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium truncate">{asset.name}</p>
									<p class="text-xs text-muted-foreground">{asset.date}</p>
								</div>
								<Badge variant="outline" class="text-[10px] shrink-0 {status.color}">
									{status.label}
								</Badge>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Social Media Posts -->
		<Card>
			<CardHeader class="flex-row items-center justify-between">
				<CardTitle class="font-serif text-base">Social Media</CardTitle>
				<Button size="sm" variant="outline">
					<Send class="mr-1.5 size-3.5" />
					New Post
				</Button>
			</CardHeader>
			<CardContent>
				{#if socialPosts.length > 0}
					<div class="divide-y">
						{#each socialPosts as post}
							{@const PlatformIcon = getPlatformIcon(post.platform)}
							{@const platformColor = getPlatformColor(post.platform)}
							{@const status = getStatusBadge(post.status)}
							<div class="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
								<div class="rounded-lg p-2 {platformColor} shrink-0">
									<PlatformIcon class="size-5" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="text-sm font-medium">{post.name}</p>
										<Badge variant="outline" class="text-[10px] {status.color}">
											{status.label}
										</Badge>
									</div>
									<p class="text-xs text-muted-foreground mt-0.5">
										{post.platform} -- {post.date}
									</p>
									{#if post.metrics}
										<div class="mt-2 flex items-center gap-4">
											{#if post.metrics.impressions}
												<div class="flex items-center gap-1 text-xs text-muted-foreground">
													<Eye class="size-3" />
													<span class="font-medium text-foreground">{formatNumber(post.metrics.impressions)}</span>
													impressions
												</div>
											{/if}
											{#if post.metrics.clicks}
												<div class="flex items-center gap-1 text-xs text-muted-foreground">
													<MousePointer2 class="size-3" />
													<span class="font-medium text-foreground">{formatNumber(post.metrics.clicks)}</span>
													clicks
												</div>
											{/if}
											{#if post.metrics.saves}
												<div class="flex items-center gap-1 text-xs text-muted-foreground">
													<Bookmark class="size-3" />
													<span class="font-medium text-foreground">{formatNumber(post.metrics.saves)}</span>
													saves
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground text-center py-6">No social posts yet.</p>
				{/if}
			</CardContent>
		</Card>
	</div>
{/if}
