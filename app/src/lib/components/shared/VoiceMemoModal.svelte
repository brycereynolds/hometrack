<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Mic, Square, Play, Pause, Save, Trash2, RotateCcw } from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		open: boolean;
		listings: any[];
		teamId: string;
	}

	let { open = $bindable(false), listings, teamId }: Props = $props();

	let isRecording = $state(false);
	let hasRecording = $state(false);
	let isPlaying = $state(false);
	let isSaving = $state(false);
	let recordingTime = $state(0);
	let selectedListing = $state('');
	let timer: ReturnType<typeof setInterval> | null = null;

	// MediaRecorder state
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let audioBlob: Blob | null = null;
	let audioUrl: string | null = null;
	let audioElement: HTMLAudioElement | null = null;

	// Waveform bars for visual feedback
	const waveformBars = Array.from({ length: 30 }, (_, i) => ({
		height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20
	}));

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

	async function saveRecording() {
		if (!audioBlob) return;

		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('audio', audioBlob, 'voice-memo.webm');
			if (selectedListing) formData.append('listingId', selectedListing);
			formData.append('duration', recordingTime.toString());

			const response = await fetch('/api/voice-memos', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Upload failed');
			}

			await response.json();
			toast.success('Voice memo saved! Processing will begin shortly.');
			discardRecording();
			selectedListing = '';
			open = false;
			await invalidateAll();
		} catch (err: any) {
			toast.error(err.message || 'Failed to save voice memo');
			console.error('Save error:', err);
		} finally {
			isSaving = false;
		}
	}

	function resetAndClose() {
		if (isRecording) stopRecording();
		discardRecording();
		selectedListing = '';
		open = false;
	}


</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) resetAndClose(); }}>
	<Dialog.Content class="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
		<Dialog.Header>
			<Dialog.Title class="font-serif">Voice Memo</Dialog.Title>
			<Dialog.Description>Record a quick voice note</Dialog.Description>
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

		<!-- Recording area -->
		<div class="flex flex-col items-center py-4">
			{#if !isRecording && !hasRecording}
				<button
					class="group relative mb-4 flex size-24 items-center justify-center rounded-full bg-primary shadow-lg transition-all active:scale-95"
					onclick={startRecording}
				>
					<div class="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100"></div>
					<Mic class="size-10 text-primary-foreground" />
				</button>
				<p class="text-sm text-muted-foreground">Tap to start recording</p>
			{:else if isRecording}
				<div class="w-full text-center">
					<div class="mb-4 flex h-16 items-center justify-center gap-0.5">
						{#each waveformBars as bar, i}
							<div
								class="w-1 rounded-full bg-primary"
								style="height: {bar.height}%; animation: voice-pulse 0.8s ease-in-out {i * 0.05}s infinite alternate"
							></div>
						{/each}
					</div>
					<div class="mb-1">
						<span class="font-mono text-3xl font-bold text-primary">{formatTime(recordingTime)}</span>
					</div>
					<div class="mb-4 flex items-center justify-center gap-2">
						<div class="size-2 animate-pulse rounded-full bg-primary"></div>
						<span class="text-sm font-medium text-primary">Recording</span>
					</div>
					<button
						class="flex size-16 mx-auto items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:bg-primary/90 active:scale-95"
						onclick={stopRecording}
					>
						<Square class="size-6 text-white" />
					</button>
				</div>
			{:else if hasRecording}
				<div class="w-full text-center">
					<div class="mb-4 flex h-12 items-center justify-center gap-0.5 opacity-60">
						{#each waveformBars as bar}
							<div
								class="w-1 rounded-full bg-primary/60"
								style="height: {bar.height}%"
							></div>
						{/each}
					</div>
					<p class="mb-3 font-mono text-xl font-bold">{formatTime(recordingTime)}</p>
					<div class="flex items-center justify-center gap-3">
						<Button variant="outline" size="icon" class="size-10 rounded-full" onclick={togglePlayback}>
							{#if isPlaying}
								<Pause class="size-4" />
							{:else}
								<Play class="size-4 ml-0.5" />
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Bottom actions -->
		{#if hasRecording}
			<Dialog.Footer class="flex gap-2 sm:justify-between">
				<div class="flex gap-2">
					<Button variant="outline" size="sm" class="gap-1.5" onclick={discardRecording} disabled={isSaving}>
						<Trash2 class="size-3.5" />
						Discard
					</Button>
					<Button variant="outline" size="sm" class="gap-1.5" onclick={() => { discardRecording(); startRecording(); }} disabled={isSaving}>
						<RotateCcw class="size-3.5" />
						Redo
					</Button>
				</div>
				<Button size="sm" class="gap-1.5" onclick={saveRecording} disabled={isSaving}>
					<Save class="size-3.5" />
					{isSaving ? 'Saving...' : 'Save'}
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
