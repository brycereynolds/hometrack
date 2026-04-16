<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { formatNumber } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
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
		Play,
		Plus,
		Pencil,
		Trash2
	} from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const assets = $derived(data.marketingAssets ?? []);

	const socialPosts = $derived(assets.filter((a: any) => a.type === 'social_post'));
	const productionAssets = $derived(assets.filter((a: any) => a.type !== 'social_post'));

	// Add Asset modal state
	let showAddAsset = $state(false);
	let newAssetType = $state('photo');
	let newAssetName = $state('');
	let newAssetStatus = $state('scheduled');
	let newAssetUrl = $state('');
	let newAssetPlatform = $state('');

	// Edit Asset modal state
	let showEditAsset = $state(false);
	let editAssetId = $state('');
	let editAssetType = $state('photo');
	let editAssetName = $state('');
	let editAssetUrl = $state('');
	let editAssetPlatform = $state('');

	// Delete confirmation
	let deletingAssetId = $state<string | null>(null);

	function resetAddForm() {
		newAssetType = 'photo';
		newAssetName = '';
		newAssetStatus = 'scheduled';
		newAssetUrl = '';
		newAssetPlatform = '';
	}

	function openEditAsset(asset: any) {
		editAssetId = asset.id;
		editAssetType = asset.type;
		editAssetName = asset.name;
		editAssetUrl = asset.url ?? '';
		editAssetPlatform = asset.platform ?? '';
		showEditAsset = true;
	}

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const contentChecklist = $derived([
		{ label: 'Photography', icon: Camera, done: assets.some((a: any) => a.type === 'photo' && a.status === 'complete') },
		{ label: 'Video Tour', icon: Video, done: assets.some((a: any) => a.type === 'video' && a.status === 'complete') },
		{ label: 'Floor Plan', icon: Map, done: assets.some((a: any) => a.type === 'floorplan' && a.status === 'complete') },
		{ label: 'Brochure', icon: FileText, done: assets.some((a: any) => a.type === 'brochure' && a.status === 'complete') },
		{ label: 'Virtual Tour', icon: Globe, done: assets.some((a: any) => a.type === 'virtual_tour' && a.status === 'complete') },
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
		<div class="flex items-center justify-between">
			<h2 class="font-serif text-lg font-semibold">Marketing</h2>
			<Button size="sm" onclick={() => { resetAddForm(); showAddAsset = true; }}>
				<Plus class="mr-1.5 size-4" />Add Asset
			</Button>
		</div>

		<!-- Photo Gallery -->
		{#if listing.photos && (listing.photos as string[]).length > 0}
			<Card>
				<CardHeader class="flex-row items-center justify-between">
					<CardTitle class="font-serif text-base">Photo Gallery</CardTitle>
					<Badge variant="secondary">{(listing.photos as string[]).length} Photos</Badge>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
						{#each listing.photos as photo, i}
							<div class="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer">
								<img src={photo} alt="Property photo {i + 1}" class="h-full w-full object-cover transition-transform group-hover:scale-105" />
								<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
									<div class="opacity-0 group-hover:opacity-100 transition-opacity"><div class="rounded-full bg-white/90 p-2"><ImageIcon class="size-4 text-gray-700" /></div></div>
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
					<div class="h-1.5 rounded-full bg-muted mb-4"><div class="h-1.5 rounded-full bg-green-500 transition-all" style="width: {(completedCount / contentChecklist.length) * 100}%"></div></div>
					<div class="divide-y">
						{#each contentChecklist as item}
							{@const Icon = item.icon}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								{#if item.done}<CheckCircle2 class="size-5 text-green-500 shrink-0" />{:else}<Circle class="size-5 text-muted-foreground/40 shrink-0" />{/if}
								<Icon class="size-4 text-muted-foreground" />
								<span class="text-sm flex-1 {item.done ? 'text-muted-foreground' : 'font-medium'}">{item.label}</span>
								{#if item.done}<Badge variant="outline" class="text-[10px] bg-green-100 text-green-700 border-green-200">Done</Badge>{:else}<Badge variant="outline" class="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Production Assets -->
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Production Assets</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each productionAssets as asset}
							{@const status = getStatusBadge(asset.status)}
							<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<div class="rounded-md bg-muted p-1.5">
									{#if asset.type === 'photo'}<Camera class="size-4 text-muted-foreground" />
									{:else if asset.type === 'video'}<Video class="size-4 text-muted-foreground" />
									{:else if asset.type === 'floorplan'}<Map class="size-4 text-muted-foreground" />
									{:else if asset.type === 'virtual_tour'}<Globe class="size-4 text-muted-foreground" />
									{:else}<FileText class="size-4 text-muted-foreground" />{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium truncate">{asset.name}</p>
									<p class="text-xs text-muted-foreground">{formatDate(asset.date)}</p>
								</div>
								<!-- Status dropdown -->
								<form
									method="POST"
									action="?/updateStatus"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												toast.success('Status updated');
												await update();
											} else {
												toast.error('Failed to update status');
											}
										};
									}}
									class="shrink-0"
								>
									<input type="hidden" name="assetId" value={asset.id} />
									<select
										name="status"
										value={asset.status}
										onchange={(e) => e.currentTarget.form?.requestSubmit()}
										class="h-7 rounded-md border border-input bg-background px-2 text-[10px] font-medium outline-none ring-ring focus:ring-2"
									>
										<option value="scheduled">Scheduled</option>
										<option value="in_production">In Production</option>
										<option value="complete">Complete</option>
										<option value="published">Published</option>
									</select>
								</form>
								<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => openEditAsset(asset)}>
									<Pencil class="size-3.5 text-muted-foreground" />
								</Button>
								{#if deletingAssetId === asset.id}
									<form
										method="POST"
										action="?/deleteAsset"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													toast.success('Asset deleted');
													deletingAssetId = null;
													await update();
												} else {
													toast.error('Failed to delete asset');
												}
											};
										}}
										class="inline-flex items-center gap-1"
									>
										<input type="hidden" name="assetId" value={asset.id} />
										<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs px-2">Delete</Button>
										<Button type="button" size="sm" variant="ghost" class="h-7 text-xs px-2" onclick={() => deletingAssetId = null}>No</Button>
									</form>
								{:else}
									<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => deletingAssetId = asset.id}>
										<Trash2 class="size-3.5 text-muted-foreground" />
									</Button>
								{/if}
							</div>
						{/each}
						{#if productionAssets.length === 0}
							<p class="text-sm text-muted-foreground text-center py-6">No production assets yet.</p>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Social Media Posts -->
		<Card>
			<CardHeader class="flex-row items-center justify-between">
				<CardTitle class="font-serif text-base">Social Media</CardTitle>
			</CardHeader>
			<CardContent>
				{#if socialPosts.length > 0}
					<div class="divide-y">
						{#each socialPosts as post}
							{@const PlatformIcon = getPlatformIcon(post.platform ?? undefined)}
							{@const platformColor = getPlatformColor(post.platform ?? undefined)}
							{@const status = getStatusBadge(post.status)}
							<div class="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
								<div class="rounded-lg p-2 {platformColor} shrink-0"><PlatformIcon class="size-5" /></div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="text-sm font-medium">{post.name}</p>
										<Badge variant="outline" class="text-[10px] {status.color}">{status.label}</Badge>
									</div>
									<p class="text-xs text-muted-foreground mt-0.5">{post.platform} -- {formatDate(post.date)}</p>
									{#if post.metrics}
										{@const metrics = post.metrics as Record<string, number>}
										<div class="mt-2 flex items-center gap-4">
											{#if metrics.impressions}<div class="flex items-center gap-1 text-xs text-muted-foreground"><Eye class="size-3" /><span class="font-medium text-foreground">{formatNumber(metrics.impressions)}</span>impressions</div>{/if}
											{#if metrics.clicks}<div class="flex items-center gap-1 text-xs text-muted-foreground"><MousePointer2 class="size-3" /><span class="font-medium text-foreground">{formatNumber(metrics.clicks)}</span>clicks</div>{/if}
											{#if metrics.saves}<div class="flex items-center gap-1 text-xs text-muted-foreground"><Bookmark class="size-3" /><span class="font-medium text-foreground">{formatNumber(metrics.saves)}</span>saves</div>{/if}
										</div>
									{/if}
								</div>
								<div class="flex items-center gap-1 shrink-0">
									<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => openEditAsset(post)}>
										<Pencil class="size-3.5 text-muted-foreground" />
									</Button>
									{#if deletingAssetId === post.id}
										<form
											method="POST"
											action="?/deleteAsset"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														toast.success('Post deleted');
														deletingAssetId = null;
														await update();
													} else {
														toast.error('Failed to delete post');
													}
												};
											}}
											class="inline-flex items-center gap-1"
										>
											<input type="hidden" name="assetId" value={post.id} />
											<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs px-2">Delete</Button>
											<Button type="button" size="sm" variant="ghost" class="h-7 text-xs px-2" onclick={() => deletingAssetId = null}>No</Button>
										</form>
									{:else}
										<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => deletingAssetId = post.id}>
											<Trash2 class="size-3.5 text-muted-foreground" />
										</Button>
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

<!-- Add Asset Modal -->
<Dialog.Root bind:open={showAddAsset}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Add Marketing Asset</Dialog.Title>
			<Dialog.Description>Add a new marketing asset for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createAsset"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Asset added');
						showAddAsset = false;
						await update();
					} else {
						toast.error('Failed to add asset');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div>
					<label for="asset-type" class="text-sm font-medium">Type</label>
					<select
						id="asset-type"
						name="type"
						bind:value={newAssetType}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						<option value="photo">Photography</option>
						<option value="video">Video</option>
						<option value="floorplan">Floor Plan</option>
						<option value="brochure">Brochure</option>
						<option value="social_post">Social Post</option>
						<option value="virtual_tour">Virtual Tour</option>
					</select>
				</div>
				<div>
					<label for="asset-name" class="text-sm font-medium">Name</label>
					<input
						id="asset-name"
						name="name"
						type="text"
						bind:value={newAssetName}
						required
						placeholder="e.g. Interior Photography"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="asset-status" class="text-sm font-medium">Status</label>
					<select
						id="asset-status"
						name="status"
						bind:value={newAssetStatus}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						<option value="scheduled">Scheduled</option>
						<option value="in_production">In Production</option>
						<option value="complete">Complete</option>
						<option value="published">Published</option>
					</select>
				</div>
				<div>
					<label for="asset-url" class="text-sm font-medium">URL</label>
					<input
						id="asset-url"
						name="url"
						type="url"
						bind:value={newAssetUrl}
						placeholder="https://..."
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				{#if newAssetType === 'social_post'}
					<div>
						<label for="asset-platform" class="text-sm font-medium">Platform</label>
						<select
							id="asset-platform"
							name="platform"
							bind:value={newAssetPlatform}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="">Select...</option>
							<option value="Instagram">Instagram</option>
							<option value="Facebook">Facebook</option>
							<option value="LinkedIn">LinkedIn</option>
						</select>
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showAddAsset = false}>Cancel</Button>
				<Button type="submit">Add Asset</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Asset Modal -->
<Dialog.Root bind:open={showEditAsset}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Asset</Dialog.Title>
			<Dialog.Description>Update this marketing asset.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editAsset"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Asset updated');
						showEditAsset = false;
						await update();
					} else {
						toast.error('Failed to update asset');
					}
				};
			}}
		>
			<input type="hidden" name="assetId" value={editAssetId} />
			<div class="space-y-4 py-4">
				<div>
					<label for="edit-asset-type" class="text-sm font-medium">Type</label>
					<select
						id="edit-asset-type"
						name="type"
						bind:value={editAssetType}
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					>
						<option value="photo">Photography</option>
						<option value="video">Video</option>
						<option value="floorplan">Floor Plan</option>
						<option value="brochure">Brochure</option>
						<option value="social_post">Social Post</option>
						<option value="virtual_tour">Virtual Tour</option>
					</select>
				</div>
				<div>
					<label for="edit-asset-name" class="text-sm font-medium">Name</label>
					<input
						id="edit-asset-name"
						name="name"
						type="text"
						bind:value={editAssetName}
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="edit-asset-url" class="text-sm font-medium">URL</label>
					<input
						id="edit-asset-url"
						name="url"
						type="url"
						bind:value={editAssetUrl}
						placeholder="https://..."
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				{#if editAssetType === 'social_post'}
					<div>
						<label for="edit-asset-platform" class="text-sm font-medium">Platform</label>
						<select
							id="edit-asset-platform"
							name="platform"
							bind:value={editAssetPlatform}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="">Select...</option>
							<option value="Instagram">Instagram</option>
							<option value="Facebook">Facebook</option>
							<option value="LinkedIn">LinkedIn</option>
						</select>
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditAsset = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
