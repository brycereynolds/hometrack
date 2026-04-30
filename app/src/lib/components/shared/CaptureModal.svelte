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
		MapPin
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { invalidateAll, goto } from '$app/navigation';

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
		storagePath: string | null;
		error: string | null;
	}

	let attachments = $state<Attachment[]>([]);
	let fileInput = $state<HTMLInputElement>(null!);

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

	// ── Save logic ──

	const canSave = $derived(noteText.trim() || hasRecording || attachments.length > 0);
	let lastSavedNoteId: string | null = null;

	async function save() {
		if (!canSave) return;
		saving = true;

		try {
			if (hasRecording && audioBlob) {
				// Voice memo path: upload audio, create field_note with mediaType='voice_memo'
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

				// Upload file attachments if any
				if (attachments.length > 0) {
					const uploaded = await uploadAllAttachments();
					const failed = attachments.length - uploaded;
					if (failed > 0) {
						toast.success(`Voice memo saved, but ${failed} attachment(s) failed to upload`);
					} else {
						toast.success(`Voice memo saved with ${uploaded} attachment(s)! Processing will begin shortly.`);
					}
				} else {
					toast.success('Voice memo saved! Processing will begin shortly.');
				}
			} else {
				// Text-only path
				const response = await fetch('/api/field-notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: noteText.trim() || '(attachment)',
						listingId: selectedListing || null,
						tag: selectedTag,
						teamId
					})
				});

				if (!response.ok) {
					const err = await response.json();
					throw new Error(err.error || 'Failed to save note');
				}

				const result = await response.json();
				lastSavedNoteId = result.noteId;

				// Upload file attachments if any
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
			}

			// Navigate to the note detail page
			const navNoteId = lastSavedNoteId;

			resetForm();
			open = false;

			if (navNoteId) {
				await goto(`/notes/${navNoteId}`);
			} else {
				await invalidateAll();
			}
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

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) resetAndClose(); }}>
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

			<!-- Note text area -->
			<div>
				<textarea
					bind:value={noteText}
					placeholder="Type or paste your note here..."
					class="min-h-[120px] w-full resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				></textarea>
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
					accept="image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/webm"
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
										<span class="text-destructive">Upload failed</span>
									{:else if att.uploading}
										Uploading...
									{:else}
										{(att.file.size / (1024 * 1024)).toFixed(1)} MB · {att.isVideo ? 'Video' : 'Image'}
									{/if}
								</p>
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
		{/if}

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
