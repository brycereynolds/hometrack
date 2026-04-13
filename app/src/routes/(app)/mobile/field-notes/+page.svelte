<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Camera, ChevronDown, Save, X, Tag } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	let { data } = $props();

	const listings = $derived(data.listings);

	let selectedListing = $state(listings[0]?.id ?? '');
	let noteText = $state('');
	let selectedTag = $state<string>('showing');
	let saving = $state(false);
	let photos = $state<string[]>([
		'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=200&h=200&fit=crop',
		'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop'
	]);

	const tags = [
		{ id: 'showing', label: 'Showing Note', color: 'bg-blue-500/10 text-blue-700' },
		{ id: 'vendor', label: 'Vendor Note', color: 'bg-amber-500/10 text-amber-700' },
		{ id: 'client', label: 'Client Note', color: 'bg-emerald-500/10 text-emerald-700' }
	];

	function removePhoto(index: number) {
		photos = photos.filter((_, i) => i !== index);
	}
</script>

<div class="mx-auto flex min-h-[calc(100svh-8rem)] max-w-lg flex-col px-4 py-6">
	<!-- Header -->
	<div class="mb-4">
		<h1 class="font-serif text-xl font-bold">Field Notes</h1>
		<p class="text-sm text-muted-foreground">Quick capture while you're on-site</p>
	</div>

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					noteText = '';
					toast.success('Note saved');
					await update();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.error ?? 'Failed to save note'));
				}
			};
		}}
	>
		<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
		<input type="hidden" name="tag" value={selectedTag} />

		<!-- Listing selector -->
		<div class="mb-4">
			<div class="relative">
				<select
					name="listingId"
					bind:value={selectedListing}
					class="h-11 w-full appearance-none rounded-xl border bg-muted/50 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					{#each listings as listing}
						<option value={listing.id}>{listing.address} — {listing.city}</option>
					{/each}
				</select>
				<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			</div>
		</div>

		<!-- Tag selector -->
		<div class="mb-4 flex gap-2">
			{#each tags as tag}
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
						{selectedTag === tag.id ? tag.color + ' border-current' : 'bg-transparent text-muted-foreground hover:bg-muted'}"
					onclick={() => { selectedTag = tag.id; }}
				>
					<Tag class="size-3" />
					{tag.label}
				</button>
			{/each}
		</div>

		<!-- Note text area — large and comfortable -->
		<div class="mb-4 flex-1">
			<textarea
				name="content"
				bind:value={noteText}
				placeholder="Type your note here..."
				class="h-full min-h-[200px] w-full resize-none rounded-xl border bg-transparent p-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
		</div>

		<!-- Photo section -->
		<div class="mb-4">
			<div class="flex items-center gap-2 mb-3">
				<span class="text-sm font-medium">Photos</span>
				{#if photos.length > 0}
					<Badge variant="outline" class="text-xs">{photos.length}</Badge>
				{/if}
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each photos as photo, i}
					<div class="relative group">
						<img
							src={photo}
							alt="Note photo {i + 1}"
							class="size-20 rounded-lg object-cover"
						/>
						<button
							type="button"
							class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
							onclick={() => removePhoto(i)}
						>
							<X class="size-3" />
						</button>
					</div>
				{/each}
				<!-- Add photo button -->
				<button
					type="button"
					class="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-95"
				>
					<Camera class="size-5" />
					<span class="text-[10px]">Add</span>
				</button>
			</div>
		</div>

		<!-- Save button — bottom anchored -->
		<div class="pt-2">
			<Button type="submit" class="h-12 w-full gap-2 rounded-xl text-base" disabled={!noteText.trim() || saving}>
				<Save class="size-5" />
				{saving ? 'Saving...' : 'Save Note'}
			</Button>
		</div>
	</form>
</div>
