<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Camera, Save, X, Tag, Video, Loader2 } from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	let { data } = $props();

	const listings = $derived(data.listings);

	let selectedListing = $state('');
	$effect(() => { if (!selectedListing && listings[0]) selectedListing = listings[0].id; });
	let noteText = $state('');
	let selectedTag = $state<string>('showing');
	let saving = $state(false);

	interface Attachment {
		file: File;
		previewUrl: string | null;
		isVideo: boolean;
		uploading: boolean;
		uploaded: boolean;
		storagePath: string | null;
		error: string | null;
	}

	let attachments = $state<Attachment[]>([]);
	let fileInput: HTMLInputElement;

	const tags = [
		{ id: 'showing', label: 'Showing Note', color: 'bg-blue-500/10 text-blue-700' },
		{ id: 'vendor', label: 'Vendor Note', color: 'bg-amber-500/10 text-amber-700' },
		{ id: 'client', label: 'Client Note', color: 'bg-emerald-500/10 text-emerald-700' }
	];

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files) return;

		for (const file of files) {
			const isVideo = file.type.startsWith('video/');
			const previewUrl = isVideo ? null : URL.createObjectURL(file);

			attachments = [
				...attachments,
				{ file, previewUrl, isVideo, uploading: false, uploaded: false, storagePath: null, error: null }
			];
		}

		input.value = '';
	}

	function removeAttachment(index: number) {
		const removed = attachments[index];
		if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
		attachments = attachments.filter((_, i) => i !== index);
	}

	async function uploadAttachment(att: Attachment): Promise<boolean> {
		if (att.uploaded) return true;

		att.uploading = true;
		att.error = null;

		try {
			const formData = new FormData();
			formData.append('file', att.file);
			formData.append('listingId', selectedListing);

			const res = await fetch('/api/field-media', { method: 'POST', body: formData });

			if (!res.ok) {
				const body = await res.json().catch(() => ({ error: 'Upload failed' }));
				throw new Error(body.error ?? 'Upload failed');
			}

			const result = await res.json();
			att.uploaded = true;
			att.storagePath = result.storagePath;
			return true;
		} catch (err) {
			att.error = err instanceof Error ? err.message : 'Upload failed';
			return false;
		} finally {
			att.uploading = false;
		}
	}

	async function uploadAllAttachments(): Promise<number> {
		let successCount = 0;
		for (const att of attachments) {
			if (await uploadAttachment(att)) successCount++;
		}
		return successCount;
	}

	function truncateName(name: string, max = 14): string {
		if (name.length <= max) return name;
		const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
		return name.slice(0, max - ext.length - 1) + '...' + ext;
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
				if (result.type === 'success') {
					if (attachments.length > 0) {
						const uploaded = await uploadAllAttachments();
						const failed = attachments.length - uploaded;
						if (failed > 0) {
							toast.error(`Note saved but ${failed} file(s) failed to upload`);
						} else {
							toast.success(`Note saved with ${uploaded} attachment(s)`);
						}
					} else {
						toast.success('Note saved');
					}

					// Redirect to the field note detail view
					const noteId = (result.data as any)?.noteId;
					const listingId = (result.data as any)?.listingId;
					if (noteId && listingId) {
						attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
						attachments = [];
						goto(`/listings/${listingId}/field-notes/${noteId}`);
						return;
					}

					noteText = '';
					attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
					attachments = [];
					await update();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.error ?? 'Failed to save note'));
				}
				saving = false;
			};
		}}
	>
		<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
		<input type="hidden" name="tag" value={selectedTag} />

		<!-- Listing selector -->
		<div class="mb-4">
			<Autocomplete
				items={listings.map((l) => ({ value: l.id, label: l.address, subtitle: l.city }))}
				bind:value={selectedListing}
				placeholder="Search listings..."
				name="listingId"
			/>
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

		<!-- Note text area -->
		<div class="mb-4 flex-1">
			<textarea
				name="content"
				bind:value={noteText}
				placeholder="Type your note here..."
				class="h-full min-h-[200px] w-full resize-none rounded-xl border bg-transparent p-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
		</div>

		<!-- Attachments section -->
		<div class="mb-4">
			<div class="flex items-center gap-2 mb-3">
				<span class="text-sm font-medium">Attachments</span>
				{#if attachments.length > 0}
					<Badge variant="outline" class="text-xs">{attachments.length}</Badge>
				{/if}
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each attachments as att, i}
					<div class="relative group">
						{#if att.isVideo}
							<div class="flex size-20 flex-col items-center justify-center gap-1 rounded-lg bg-muted text-muted-foreground">
								{#if att.uploading}
									<Loader2 class="size-5 animate-spin" />
								{:else}
									<Video class="size-5" />
								{/if}
								<span class="text-[9px] text-center px-1 leading-tight">{truncateName(att.file.name)}</span>
							</div>
						{:else if att.previewUrl}
							<div class="relative">
								<img
									src={att.previewUrl}
									alt="Attachment {i + 1}"
									class="size-20 rounded-lg object-cover"
								/>
								{#if att.uploading}
									<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
										<Loader2 class="size-5 animate-spin text-white" />
									</div>
								{/if}
							</div>
						{/if}
						{#if att.error}
							<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-destructive/20 p-1">
								<span class="text-[9px] text-destructive font-medium text-center">Failed</span>
							</div>
						{/if}
						{#if att.uploaded}
							<div class="absolute bottom-1 right-1 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
								<svg class="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						{/if}
						<button
							type="button"
							class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
							onclick={() => removeAttachment(i)}
						>
							<X class="size-3" />
						</button>
					</div>
				{/each}
				<!-- Add photo/video button -->
				<button
					type="button"
					class="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-95"
					onclick={() => fileInput.click()}
				>
					<Camera class="size-5" />
					<span class="text-[10px]">Add</span>
				</button>
			</div>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/webm"
				multiple
				class="hidden"
				onchange={handleFileSelect}
			/>
		</div>

		<!-- Save button -->
		<div class="pt-2">
			<Button type="submit" class="h-12 w-full gap-2 rounded-xl text-base" disabled={!noteText.trim() || saving}>
				<Save class="size-5" />
				{saving ? 'Saving...' : 'Save Note'}
			</Button>
		</div>
	</form>
</div>
