<script lang="ts">
	import { goto } from '$app/navigation';
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { Save, Paperclip, X, Video, Loader2, MapPin } from 'lucide-svelte';
	let { data } = $props();

	const listings = $derived(data.listings);
	const teamId = $derived(data.team?.id ?? '');

	// Pre-select listing from URL param (e.g. /mobile/field-notes?listingId=xxx)
	const initialListingId = $page.url.searchParams.get('listingId') ?? '';
	let selectedListing = $state(initialListingId);
	let noteText = $state('');
	let saving = $state(false);

	// Attachments
	interface Attachment {
		file: File;
		previewUrl: string | null;
		isVideo: boolean;
		uploading: boolean;
		uploaded: boolean;
		progress: number;
		storagePath: string | null;
		error: string | null;
	}

	let attachments = $state<Attachment[]>([]);
	let fileInput = $state<HTMLInputElement>(null!);
	let isDragOver = $state(false);
	let lastSavedNoteId = $state<string | null>(null);
	let navigationIntended = $state(false);

	// Prevent accidental navigation during upload/save
	const isUploading = $derived(saving || attachments.some((a) => a.uploading));
	const canSave = $derived(noteText.trim() || attachments.length > 0);

	beforeNavigate(({ cancel }) => {
		if (navigationIntended) return;
		if (isUploading) {
			if (!confirm('Upload in progress. Leaving will cancel it. Are you sure?')) {
				cancel();
			}
		}
	});

	// Recent listings (first 4 active listings)
	const recentListings = $derived(
		listings.slice(0, 4).map((l: any) => ({
			id: l.id,
			name: l.property.address,
			city: l.property.city
		}))
	);

	// ── File handling ──

	function addFiles(files: FileList | File[]) {
		for (const file of files) {
			const isVideo = file.type.startsWith('video/');
			const previewUrl = isVideo ? null : URL.createObjectURL(file);
			attachments = [
				...attachments,
				{ file, previewUrl, isVideo, uploading: false, uploaded: false, progress: 0, storagePath: null, error: null }
			];
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) addFiles(input.files);
		input.value = '';
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function removeAttachment(index: number) {
		const removed = attachments[index];
		if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
		attachments = attachments.filter((_, i) => i !== index);
	}

	// ── Upload functions (TUS resumable via server proxy) ──

	function uploadAttachment(att: Attachment): Promise<boolean> {
		if (att.uploaded) return Promise.resolve(true);
		att.uploading = true;
		att.progress = 0;
		att.error = null;

		return new Promise(async (resolve) => {
			try {
				const { startUpload } = await import('$lib/upload.js');

				await startUpload({
					file: att.file,
					listingId: selectedListing || null,
					noteId: lastSavedNoteId,
					onProgress: (percentage) => {
						att.progress = percentage;
					},
					onError: (error) => {
						att.error = error.message || 'Upload failed';
						att.uploading = false;
						resolve(false);
					},
					onSuccess: (result) => {
						att.progress = 100;
						att.uploaded = true;
						att.storagePath = result.storagePath;
						att.uploading = false;
						resolve(true);
					}
				});
			} catch (err) {
				att.error = err instanceof Error ? err.message : 'Upload failed';
				att.uploading = false;
				resolve(false);
			}
		});
	}

	async function uploadAllAttachments(): Promise<number> {
		let successCount = 0;
		for (const att of attachments) {
			if (await uploadAttachment(att)) successCount++;
		}
		return successCount;
	}

	// ── Save logic ──

	async function save() {
		if (!canSave) return;
		saving = true;

		try {
			// Create note first via /api/notes
			const createRes = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					textContent: noteText.trim() || null,
					listingId: selectedListing || null,
					teamId
				})
			});

			if (!createRes.ok) {
				const err = await createRes.json();
				throw new Error(err.error || 'Failed to create note');
			}

			const noteResult = await createRes.json();
			lastSavedNoteId = noteResult.noteId;

			// Upload attachments to the same note
			if (attachments.length > 0) {
				const uploaded = await uploadAllAttachments();
				const failed = attachments.length - uploaded;
				if (failed > 0) {
					toast.error(`Note saved but ${failed} file(s) failed to upload`);
				} else {
					toast.success(
						noteText.trim()
							? `Note saved with ${uploaded} file(s)`
							: `${uploaded} file(s) uploaded`
					);
				}
			} else {
				toast.success('Note saved');
			}

			// Clean up and navigate to the note detail
			attachments.forEach((a) => {
				if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
			});
			attachments = [];
			noteText = '';
			saving = false;

			if (lastSavedNoteId) {
				navigationIntended = true;
				goto(`/notes/${lastSavedNoteId}`);
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to save');
			console.error('Save error:', err);
			saving = false;
		}
	}
</script>

<svelte:window onbeforeunload={(e) => { if (isUploading) { e.preventDefault(); return ''; } }} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-2xl flex-col px-4 py-6"
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
>
	<!-- Drag overlay -->
	{#if isDragOver}
		<div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
			<p class="text-sm font-medium text-primary">Drop files here</p>
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-6">
		<h1 class="font-serif text-xl font-bold">Field Notes</h1>
		<p class="text-sm text-muted-foreground">Quick capture while you're on-site</p>
	</div>

	<!-- Listing selector -->
	<div class="mb-4">
		<Autocomplete
			items={[
				{ value: '', label: 'General (no listing)' },
				...listings.map((l: any) => ({ value: l.id, label: l.property.address, subtitle: l.property.city }))
			]}
			bind:value={selectedListing}
			placeholder="Search listings..."
			name="listingId"
		/>
	</div>

	<!-- Note text area -->
	<div class="mb-4 flex-1">
		<textarea
			bind:value={noteText}
			placeholder="Type or paste your note here... (or drag files)"
			class="h-full min-h-[200px] w-full resize-none rounded-xl border bg-transparent p-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
		></textarea>
	</div>

	<!-- Attach button -->
	<div class="mb-4 flex items-center gap-2">
		<Button variant="outline" size="sm" class="gap-1.5" onclick={() => fileInput.click()}>
			<Paperclip class="size-4" />
			Attach
		</Button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/webm,application/pdf"
			multiple
			class="hidden"
			onchange={handleFileSelect}
		/>
	</div>

	<!-- Attachments list (card style) -->
	{#if attachments.length > 0}
		<div class="mb-4 space-y-2">
			{#each attachments as att, i}
				<div class="relative group flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
					{#if att.isVideo}
						<div class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							{#if att.uploading}
								<Loader2 class="size-5 animate-spin" />
							{:else}
								<Video class="size-5" />
							{/if}
						</div>
					{:else if att.previewUrl}
						<div class="relative shrink-0">
							<img src={att.previewUrl} alt="Attachment {i + 1}" class="size-12 rounded-md object-cover" />
							{#if att.uploading}
								<div class="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
									<Loader2 class="size-4 animate-spin text-white" />
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							{#if att.uploading}
								<Loader2 class="size-5 animate-spin" />
							{:else}
								<Paperclip class="size-5" />
							{/if}
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate">{att.file.name}</p>
						<p class="text-xs text-muted-foreground">
							{#if att.error}
								<span class="text-destructive">{att.error}</span>
							{:else if att.uploading}
								Uploading... {att.progress}%
							{:else if att.uploaded}
								Uploaded · {(att.file.size / (1024 * 1024)).toFixed(1)} MB
							{:else}
								{(att.file.size / (1024 * 1024)).toFixed(1)} MB · {att.isVideo ? 'Video' : 'Image'}
							{/if}
						</p>
						{#if att.uploading}
							<div class="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
								<div
									class="h-full rounded-full bg-primary transition-all duration-300"
									style="width: {att.progress}%"
								></div>
							</div>
						{/if}
					</div>
					<button
						type="button"
						class="shrink-0 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
						onclick={() => removeAttachment(i)}
					>
						<X class="size-3.5" />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Save button -->
	<div class="pt-2">
		<Button class="h-12 w-full gap-2 rounded-xl text-base" disabled={!canSave || saving} onclick={save}>
			<Save class="size-5" />
			{saving ? 'Saving...' : 'Save Note'}
		</Button>
	</div>
</div>
