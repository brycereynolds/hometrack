<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Save, Tag, Camera, X, Video, Loader2 } from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		open: boolean;
		listings: any[];
		teamId: string;
	}

	let { open = $bindable(false), listings, teamId }: Props = $props();

	let selectedListing = $state('');
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
		{ id: 'showing', label: 'Showing', color: 'bg-blue-500/10 text-blue-700' },
		{ id: 'vendor', label: 'Vendor', color: 'bg-amber-500/10 text-amber-700' },
		{ id: 'client', label: 'Client', color: 'bg-emerald-500/10 text-emerald-700' }
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
			if (selectedListing) formData.append('listingId', selectedListing);

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

	async function saveNote() {
		if (!noteText.trim()) return;

		saving = true;
		try {
			const response = await fetch('/api/field-notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: noteText,
					listingId: selectedListing || null,
					tag: selectedTag,
					teamId
				})
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Failed to save note');
			}

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

			resetForm();
			open = false;
			await invalidateAll();
		} catch (err: any) {
			toast.error(err.message || 'Failed to save note');
			console.error('Save error:', err);
		} finally {
			saving = false;
		}
	}

	function resetForm() {
		noteText = '';
		selectedListing = '';
		selectedTag = 'showing';
		attachments.forEach((a) => {
			if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
		});
		attachments = [];
	}

	// Clean up when dialog closes
	$effect(() => {
		if (!open) {
			resetForm();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md max-h-[90svh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Quick Note</Dialog.Title>
			<Dialog.Description>Capture a note on the go</Dialog.Description>
		</Dialog.Header>

		<!-- Listing selector -->
		<div>
			<Autocomplete
				items={[
					{ value: '', label: 'General (no listing)' },
					...listings.map((l: any) => ({ value: l.id, label: l.address, subtitle: l.city }))
				]}
				bind:value={selectedListing}
				placeholder="Search listings..."
			/>
		</div>

		<!-- Tag selector -->
		<div class="flex gap-2">
			{#each tags as tag}
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors
						{selectedTag === tag.id ? tag.color + ' border-current' : 'bg-transparent text-muted-foreground hover:bg-muted'}"
					onclick={() => { selectedTag = tag.id; }}
				>
					<Tag class="size-3" />
					{tag.label}
				</button>
			{/each}
		</div>

		<!-- Note text area -->
		<div>
			<textarea
				bind:value={noteText}
				placeholder="Type your note here..."
				class="min-h-[120px] w-full resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
		</div>

		<!-- Attachments -->
		<div>
			<div class="flex items-center gap-2 mb-2">
				<span class="text-xs font-medium text-muted-foreground">Attachments</span>
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each attachments as att, i}
					<div class="relative group">
						{#if att.isVideo}
							<div class="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg bg-muted text-muted-foreground">
								{#if att.uploading}
									<Loader2 class="size-4 animate-spin" />
								{:else}
									<Video class="size-4" />
								{/if}
								<span class="text-[8px] text-center px-0.5 leading-tight">{truncateName(att.file.name)}</span>
							</div>
						{:else if att.previewUrl}
							<div class="relative">
								<img src={att.previewUrl} alt="Attachment {i + 1}" class="size-16 rounded-lg object-cover" />
								{#if att.uploading}
									<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
										<Loader2 class="size-4 animate-spin text-white" />
									</div>
								{/if}
							</div>
						{/if}
						{#if att.error}
							<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-destructive/20 p-1">
								<span class="text-[8px] text-destructive font-medium text-center">Failed</span>
							</div>
						{/if}
						<button
							type="button"
							class="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
							onclick={() => removeAttachment(i)}
						>
							<X class="size-2.5" />
						</button>
					</div>
				{/each}
				<button
					type="button"
					class="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-95"
					onclick={() => fileInput.click()}
				>
					<Camera class="size-4" />
					<span class="text-[9px]">Add</span>
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

		<Dialog.Footer>
			<Button class="w-full gap-2" onclick={saveNote} disabled={!noteText.trim() || saving}>
				<Save class="size-4" />
				{saving ? 'Saving...' : 'Save Note'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
