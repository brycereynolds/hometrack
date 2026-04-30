<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Mic,
		Square,
		Play,
		Pause,
		Save,
		Trash2,
		Paperclip,
		X,
		Video,
		Loader2,
		Tag,
		ArrowLeft,
		MapPin,
		CheckCircle2
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { invalidateAll, goto, beforeNavigate } from '$app/navigation';

	interface Props {
		open: boolean;
		listings: any[];
		teamId: string;
	}

	let { open = $bindable(false), listings, teamId }: Props = $props();

	// Step state
	let step = $state<1 | 2>(1);
	let selectedListing = $state('');
	let selectedListingName = $state('');

	// Form state
	let selectedTag = $state<string>('showing');
	let noteText = $state('');
	let saving = $state(false);

	// Recording state
	let isRecording = $state(false);
	let hasRecording = $state(false);
	let isPlaying = $state(false);
	let recordingTime = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	// MediaRecorder state
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let audioBlob: Blob | null = null;
	let audioUrl: string | null = null;
	let audioElement: HTMLAudioElement | null = null;

	// Attachments
	interface Attachment {
		file: File;
		previewUrl: string | null;
		isVideo: boolean;
		uploading: boolean;
		uploaded: boolean;
		progress: number; // 0-100
		storagePath: string | null;
		error: string | null;
	}

	let attachments = $state<Attachment[]>([]);
	let fileInput = $state<HTMLInputElement>(null!);

	// Prevent accidental navigation during upload/save
	const isUploading = $derived(saving || attachments.some(a => a.uploading));

	beforeNavigate(({ cancel }) => {
		if (isUploading) {
			if (!confirm('Upload in progress. Leaving will cancel it. Are you sure?')) {
				cancel();
			}
		}
	});

	const tags = [
		{ id: 'showing', label: 'Showing', color: 'bg-blue-500/10 text-blue-700' },
		{ id: 'vendor', label: 'Vendor', color: 'bg-amber-500/10 text-amber-700' },
		{ id: 'client', label: 'Client', color: 'bg-emerald-500/10 text-emerald-700' },
		{ id: 'general', label: 'General', color: 'bg-gray-500/10 text-gray-700' }
	];

	// Waveform bars for visual feedback
	const waveformBars = Array.from({ length: 30 }, (_, i) => ({
		height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20
	}));

	// Recent listings (first 4 active listings)
	const recentListings = $derived(
		listings.slice(0, 4).map((l: any) => ({
			id: l.id,
			name: l.property.address,
			city: l.property.city
		}))
	);

	// Autocomplete search value (for step 1)
	let autocompleteValue = $state('');

	// Watch autocomplete selection and advance to step 2
	$effect(() => {
		if (step === 1 && autocompleteValue) {
			const match = listings.find((l: any) => l.id === autocompleteValue);
			if (match) {
				selectProperty(match.id, match.property.address);
			}
		}
	});

	// ── Step navigation ──

	function selectProperty(id: string, name: string) {
		selectedListing = id;
		selectedListingName = name;
		autocompleteValue = '';
		step = 2;
	}

	function skipProperty() {
		selectedListing = '';
		selectedListingName = 'General Note';
		autocompleteValue = '';
		step = 2;
	}

	function goBack() {
		step = 1;
	}

	// ── Recording functions ──

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
					? 'audio/webm;codecs=opus'
					: 'audio/webm'
			});
			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				audioUrl = URL.createObjectURL(audioBlob);
				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start(1000);
			isRecording = true;
			hasRecording = false;
			recordingTime = 0;
			timer = setInterval(() => {
				recordingTime++;
			}, 1000);
		} catch (err) {
			toast.error('Could not access microphone. Please check permissions.');
			console.error('Microphone error:', err);
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
		isRecording = false;
		hasRecording = true;
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function togglePlayback() {
		if (!audioUrl) return;
		if (!audioElement) {
			audioElement = new Audio(audioUrl);
			audioElement.onended = () => {
				isPlaying = false;
			};
		}
		if (isPlaying) {
			audioElement.pause();
			isPlaying = false;
		} else {
			audioElement.play();
			isPlaying = true;
		}
	}

	function discardRecording() {
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			audioUrl = null;
		}
		audioBlob = null;
		audioChunks = [];
		hasRecording = false;
		isPlaying = false;
		recordingTime = 0;
	}

	// ── Attachment functions ──

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

	let isDragOver = $state(false);

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

	function uploadAttachment(att: Attachment): Promise<boolean> {
		if (att.uploaded) return Promise.resolve(true);
		att.uploading = true;
		att.progress = 0;
		att.error = null;

		return new Promise(async (resolve) => {
			try {
				// Step 1: Get signed upload URL
				const signedRes = await fetch('/api/field-media/signed-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fileName: att.file.name,
						listingId: selectedListing || null,
						contentType: att.file.type,
						noteId: lastSavedNoteId,
					}),
				});

				if (!signedRes.ok) {
					const err = await signedRes.json();
					throw new Error(err.error ?? 'Failed to get upload URL');
				}

				const { signedUrl, storagePath, teamId: uploadTeamId, memberId, memberName, memberInitials } = await signedRes.json();

				// Step 2: Upload directly to Supabase Storage with progress
				const xhr = new XMLHttpRequest();
				xhr.open('PUT', signedUrl);
				xhr.setRequestHeader('Content-Type', att.file.type);

				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) {
						att.progress = Math.round((e.loaded / e.total) * 100);
					}
				};

				xhr.onload = async () => {
					console.log(`[Upload] Status: ${xhr.status}, Response: ${xhr.responseText}`);
					if (xhr.status >= 200 && xhr.status < 300) {
						att.progress = 100;

						// Step 3: Insert attachment record + trigger workflow
						try {
							const completeRes = await fetch('/api/field-media/complete', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									noteId: lastSavedNoteId,
									storagePath,
									listingId: selectedListing || null,
									fileName: att.file.name,
									fileSize: att.file.size,
									contentType: att.file.type,
									teamId: uploadTeamId,
									memberId,
									memberName,
									memberInitials,
								}),
							});

							if (!completeRes.ok) throw new Error('Failed to finalize');
							att.uploaded = true;
							att.storagePath = storagePath;
							att.uploading = false;
							resolve(true);
						} catch (err) {
							att.error = 'Upload succeeded but failed to save record';
							att.uploading = false;
							resolve(false);
						}
					} else {
						att.error = `Upload failed (${xhr.status})`;
						att.uploading = false;
						resolve(false);
					}
				};

				xhr.onerror = () => {
					att.error = 'Network error during upload';
					att.uploading = false;
					resolve(false);
				};

				xhr.send(att.file);
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

	function truncateName(name: string, max = 14): string {
		if (name.length <= max) return name;
		const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
		return name.slice(0, max - ext.length - 1) + '...' + ext;
	}

	// ── Save logic ──

	const canSave = $derived(noteText.trim() || hasRecording || attachments.length > 0);
	let lastSavedNoteId = $state<string | null>(null);
	let saveComplete = $state(false);

	async function save() {
		if (!canSave) return;
		saving = true;
		saveComplete = false;

		try {
			if (hasRecording && audioBlob) {
				// Voice memo path (keep as-is — has its own pipeline)
				const formData = new FormData();
				formData.append('audio', audioBlob, 'voice-memo.webm');
				if (selectedListing) formData.append('listingId', selectedListing);
				formData.append('duration', recordingTime.toString());
				if (noteText.trim()) formData.append('textContent', noteText.trim());

				const response = await fetch('/api/voice-memos', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					const err = await response.json();
					throw new Error(err.error || 'Upload failed');
				}

				const result = await response.json();
				lastSavedNoteId = result.fieldNoteId;

				// Upload any file attachments alongside the voice memo
				if (attachments.length > 0) {
					const uploaded = await uploadAllAttachments();
					const failed = attachments.length - uploaded;
					if (failed > 0) {
						toast.error(`Voice memo saved but ${failed} file(s) failed to upload`);
					} else {
						toast.success(`Voice memo saved with ${uploaded} file(s)! Processing will begin shortly.`);
					}
				} else {
					toast.success('Voice memo saved! Processing will begin shortly.');
				}
			} else {
				// Unified path: create note first, then upload attachments
				const createRes = await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						textContent: noteText.trim() || null,
						listingId: selectedListing || null,
						teamId,
					}),
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
						toast.success(noteText.trim()
							? `Note saved with ${uploaded} file(s)`
							: `${uploaded} file(s) uploaded`);
					}
				} else {
					toast.success('Note saved');
				}
			}

			// Show success state instead of navigating
			saveComplete = true;
		} catch (err: any) {
			toast.error(err.message || 'Failed to save');
			console.error('Save error:', err);
		} finally {
			saving = false;
		}
	}

	// ── Reset / cleanup ──

	function resetForm() {
		noteText = '';
		selectedListing = '';
		selectedListingName = '';
		selectedTag = 'showing';
		autocompleteValue = '';
		lastSavedNoteId = null;
		saveComplete = false;
		step = 1;
		discardRecording();
		attachments.forEach((a) => {
			if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
		});
		attachments = [];
	}

	function resetAndClose() {
		if (isRecording) stopRecording();
		resetForm();
		open = false;
	}

	// Clean up when dialog closes
	let wasOpen = $state(false);
	$effect(() => {
		if (wasOpen && !open) {
			resetForm();
		}
		wasOpen = open;
	});
</script>

<svelte:window onbeforeunload={(e) => { if (isUploading) { e.preventDefault(); return ''; } }} />
<Dialog.Root bind:open onOpenChange={(v) => { if (!v && !isUploading) resetAndClose(); }}>
	<Dialog.Content class="max-h-[90svh] w-[calc(100%-1rem)] sm:w-full sm:max-w-lg overflow-y-auto" onOpenAutoFocus={(e: Event) => e.preventDefault()}>

		{#if step === 1}
			<!-- ═══════════════════════════════════ -->
			<!-- STEP 1: Select Property             -->
			<!-- ═══════════════════════════════════ -->
			<Dialog.Header>
				<Dialog.Title class="font-serif">Capture Field Note</Dialog.Title>
				<Dialog.Description>Which property is this for?</Dialog.Description>
			</Dialog.Header>

			<!-- Listing search -->
			<div>
				<Autocomplete
					items={listings.map((l: any) => ({ value: l.id, label: l.property.address, subtitle: l.property.city }))}
					bind:value={autocompleteValue}
					placeholder="Search listings..."
					autofocus={false}
				/>
			</div>

			<!-- Recent listings -->
			{#if recentListings.length > 0}
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent</p>
					<div class="space-y-1">
						{#each recentListings as listing}
							<button
								type="button"
								class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
								onclick={() => selectProperty(listing.id, listing.name)}
							>
								<MapPin class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0 flex-1">
									<span class="block truncate font-medium">{listing.name}</span>
									{#if listing.city}
										<span class="block truncate text-xs text-muted-foreground">{listing.city}</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Skip button -->
			<div class="pt-2">
				<Button variant="ghost" class="w-full text-muted-foreground" onclick={skipProperty}>
					Skip — General Note
				</Button>
			</div>

		{:else}
			<!-- ═══════════════════════════════════ -->
			<!-- STEP 2: Capture                     -->
			<!-- ═══════════════════════════════════ -->
			<Dialog.Header class="flex-row items-center gap-2 space-y-0">
				<button
					type="button"
					class="flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
					onclick={goBack}
				>
					<ArrowLeft class="size-4" />
				</button>
				<div class="min-w-0 flex-1">
					<Dialog.Title class="font-serif truncate">{selectedListingName || 'General Note'}</Dialog.Title>
					<Dialog.Description class="sr-only">Capture your note</Dialog.Description>
				</div>
			</Dialog.Header>

			{#if saveComplete}
			<!-- Success state -->
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<div class="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100">
					<CheckCircle2 class="size-7 text-emerald-600" />
				</div>
				<h3 class="font-serif text-lg font-semibold">Note Saved</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					{attachments.some(a => a.uploaded) ? 'Your file has been uploaded and is being processed.' : 'Your note has been saved.'}
				</p>
				<div class="mt-6 flex gap-3">
					{#if lastSavedNoteId}
						<Button variant="outline" onclick={() => { const id = lastSavedNoteId; resetForm(); open = false; goto(`/notes/${id}`); }}>
							View Details
						</Button>
					{/if}
					<Button onclick={() => { resetForm(); }}>
						Capture Another
					</Button>
				</div>
			</div>
		{:else}

			<!-- Note text area + drop zone -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative rounded-lg border transition-colors {isDragOver ? 'border-primary bg-primary/5 border-dashed' : ''}"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
			>
				<textarea
					bind:value={noteText}
					placeholder="Type or paste your note here... (or drag files)"
					class="min-h-[120px] w-full resize-none rounded-lg bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-0"
				></textarea>
				{#if isDragOver}
					<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/5 pointer-events-none">
						<p class="text-sm font-medium text-primary">Drop files here</p>
					</div>
				{/if}
			</div>

			<!-- Action buttons: Record + Attach -->
			<div class="flex items-center gap-2">
				{#if !isRecording && !hasRecording}
					<Button variant="outline" size="sm" class="gap-1.5 h-10 md:h-8 px-4 md:px-3" onclick={startRecording}>
						<Mic class="size-5 md:size-4" />
						Record
					</Button>
				{/if}
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

			<!-- Recording state -->
			{#if isRecording}
				<div class="rounded-lg border bg-muted/30 p-4">
					<div class="flex h-12 items-center justify-center gap-0.5 mb-3">
						{#each waveformBars as bar, i}
							<div
								class="w-1 rounded-full bg-primary"
								style="height: {bar.height}%; animation: voice-pulse 0.8s ease-in-out {i * 0.05}s infinite alternate"
							></div>
						{/each}
					</div>
					<div class="flex items-center justify-center gap-3">
						<div class="flex items-center gap-2">
							<div class="size-2 animate-pulse rounded-full bg-primary"></div>
							<span class="font-mono text-lg font-bold text-primary">{formatTime(recordingTime)}</span>
							<span class="text-sm text-muted-foreground">Recording...</span>
						</div>
						<Button variant="destructive" size="sm" class="gap-1.5" onclick={stopRecording}>
							<Square class="size-3.5" />
							Stop
						</Button>
					</div>
				</div>
			{/if}

			<!-- Audio attached indicator -->
			{#if hasRecording && !isRecording}
				<div class="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
					<Mic class="size-4 text-primary" />
					<span class="flex-1 text-sm font-medium">Audio attached ({formatTime(recordingTime)})</span>
					<Button variant="ghost" size="icon" class="size-7" onclick={togglePlayback}>
						{#if isPlaying}
							<Pause class="size-3.5" />
						{:else}
							<Play class="size-3.5 ml-0.5" />
						{/if}
					</Button>
					<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={discardRecording}>
						<Trash2 class="size-3.5" />
					</Button>
				</div>
			{/if}

			<!-- Attachments preview -->
			{#if attachments.length > 0}
				<div class="space-y-2">
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

			<!-- Footer -->
			<Dialog.Footer class="flex gap-2 sm:justify-end">
				<Button variant="outline" onclick={resetAndClose} disabled={saving}>
					Cancel
				</Button>
				<Button class="gap-1.5" onclick={save} disabled={!canSave || saving}>
					<Save class="size-4" />
					{saving ? 'Saving...' : 'Save Note'}
				</Button>
			</Dialog.Footer>
		{/if}<!-- end saveComplete else -->
		{/if}<!-- end step 2 -->

	</Dialog.Content>
</Dialog.Root>

<style>
	@keyframes voice-pulse {
		from {
			transform: scaleY(0.4);
		}
		to {
			transform: scaleY(1);
		}
	}
</style>
