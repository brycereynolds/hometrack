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
		Tag
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		open: boolean;
		listings: any[];
		teamId: string;
	}

	let { open = $bindable(false), listings, teamId }: Props = $props();

	// Form state
	let selectedListing = $state('');
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
	let fileInput: HTMLInputElement;

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

	const canSave = $derived(noteText.trim() || hasRecording);

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

				await response.json();

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

			resetForm();
			open = false;
			await invalidateAll();
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
		selectedTag = 'showing';
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
	<Dialog.Content class="sm:max-w-md max-h-[90svh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
		<Dialog.Header>
			<Dialog.Title class="font-serif">Capture Field Note</Dialog.Title>
			<Dialog.Description>Record, type, or attach media</Dialog.Description>
		</Dialog.Header>

		<!-- Listing selector -->
		<div>
			<label for="listing-select" class="mb-1.5 block text-sm font-medium">Associate with listing</label>
			<Autocomplete
				items={[
					{ value: '', label: 'General (no listing)' },
					...listings.map((l: any) => ({ value: l.id, label: l.property.address, subtitle: l.property.city }))
				]}
				bind:value={selectedListing}
				placeholder="Search listings..."
			/>
		</div>

		<!-- Tag selector -->
		<div class="flex gap-2 flex-wrap">
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
				placeholder="Type or paste your note here..."
				class="min-h-[120px] w-full resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			></textarea>
		</div>

		<!-- Action buttons: Record + Attach -->
		<div class="flex items-center gap-2">
			{#if !isRecording && !hasRecording}
				<Button variant="outline" size="sm" class="gap-1.5" onclick={startRecording}>
					<Mic class="size-4" />
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
