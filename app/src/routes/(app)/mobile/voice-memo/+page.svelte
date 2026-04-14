<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Mic,
		Square,
		Play,
		Pause,
		Save,
		Trash2,
		RotateCcw
	} from 'lucide-svelte';
	import { Autocomplete } from '$lib/components/shared';
	import { toast } from 'svelte-sonner';
	let { data } = $props();

	const listings = $derived(data.listings);

	let isRecording = $state(false);
	let hasRecording = $state(false);
	let isPlaying = $state(false);
	let isSaving = $state(false);
	let recordingTime = $state(0);
	let selectedListing = $state('');
	$effect(() => { if (!selectedListing && listings[0]) selectedListing = listings[0].id; });
	let timer: ReturnType<typeof setInterval> | null = null;

	// MediaRecorder state
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let audioBlob: Blob | null = null;
	let audioUrl: string | null = null;
	let audioElement: HTMLAudioElement | null = null;

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
					? 'audio/webm;codecs=opus'
					: 'audio/webm',
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
				// Stop all tracks to release the microphone
				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start(1000); // Collect data every second
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
		if (!audioBlob || !selectedListing) return;

		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('audio', audioBlob, 'voice-memo.webm');
			formData.append('listingId', selectedListing);
			formData.append('duration', recordingTime.toString());

			const response = await fetch('/api/voice-memos', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Upload failed');
			}

			toast.success('Voice memo saved');
			discardRecording();
		} catch (err: any) {
			toast.error(err.message || 'Failed to save voice memo');
			console.error('Save error:', err);
		} finally {
			isSaving = false;
		}
	}

	// Waveform bars for visual feedback
	const waveformBars = Array.from({ length: 40 }, (_, i) => ({
		height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20
	}));
</script>

<div class="mx-auto flex min-h-[calc(100svh-8rem)] max-w-lg flex-col px-4 py-6">
	<!-- Header -->
	<div class="mb-6 text-center">
		<h1 class="font-serif text-xl font-bold">Voice Memo</h1>
		<p class="text-sm text-muted-foreground">Record notes on the go</p>
	</div>

	<!-- Listing selector -->
	<div class="mb-6">
		<label for="listing-select" class="mb-1.5 block text-sm font-medium">Associate with listing</label>
		<Autocomplete
			items={listings.map((l) => ({ value: l.id, label: l.address, subtitle: l.city }))}
			bind:value={selectedListing}
			placeholder="Search listings..."
		/>
	</div>

	<!-- Main recording area -->
	<div class="flex flex-1 flex-col items-center justify-center">
		{#if !isRecording && !hasRecording}
			<!-- Idle state -->
			<div class="text-center">
				<button
					class="group relative mb-6 flex size-32 items-center justify-center rounded-full bg-primary shadow-lg transition-all active:scale-95"
					onclick={startRecording}
				>
					<div class="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100"></div>
					<Mic class="size-12 text-primary-foreground" />
				</button>
				<p class="text-sm text-muted-foreground">Tap to start recording</p>
			</div>
		{:else if isRecording}
			<!-- Recording state -->
			<div class="w-full text-center">
				<!-- Animated waveform -->
				<div class="mb-8 flex h-20 items-center justify-center gap-0.5">
					{#each waveformBars as bar, i}
						<div
							class="w-1 rounded-full bg-primary"
							style="height: {bar.height}%; animation: pulse 0.8s ease-in-out {i * 0.05}s infinite alternate"
						></div>
					{/each}
				</div>

				<!-- Timer -->
				<div class="mb-2">
					<span class="font-mono text-4xl font-bold text-primary">{formatTime(recordingTime)}</span>
				</div>
				<div class="mb-8 flex items-center justify-center gap-2">
					<div class="size-2 animate-pulse rounded-full bg-red-500"></div>
					<span class="text-sm font-medium text-red-500">Recording</span>
				</div>

				<!-- Stop button -->
				<button
					class="flex size-20 items-center justify-center rounded-full bg-red-500 shadow-lg transition-all active:scale-95"
					onclick={stopRecording}
				>
					<Square class="size-8 text-white" />
				</button>
			</div>
		{:else if hasRecording}
			<!-- Playback state -->
			<div class="w-full text-center">
				<!-- Static waveform -->
				<div class="mb-6 flex h-16 items-center justify-center gap-0.5 opacity-60">
					{#each waveformBars as bar}
						<div
							class="w-1 rounded-full bg-primary/60"
							style="height: {bar.height}%"
						></div>
					{/each}
				</div>

				<!-- Duration -->
				<p class="mb-4 font-mono text-2xl font-bold">{formatTime(recordingTime)}</p>

				<!-- Playback controls -->
				<div class="mb-6 flex items-center justify-center gap-4">
					<Button
						variant="outline"
						size="icon"
						class="size-12 rounded-full"
						onclick={togglePlayback}
					>
						{#if isPlaying}
							<Pause class="size-5" />
						{:else}
							<Play class="size-5 ml-0.5" />
						{/if}
					</Button>
				</div>

				<!-- Transcription preview (placeholder for future) -->
				<Card class="mb-6 text-left">
					<CardContent class="p-4">
						<div class="flex items-center gap-2 mb-2">
							<Badge variant="outline" class="text-xs">Auto-transcription</Badge>
						</div>
						<p class="text-sm text-muted-foreground italic leading-relaxed">
							Transcription will be available after saving...
						</p>
					</CardContent>
				</Card>
			</div>
		{/if}
	</div>

	<!-- Bottom actions -->
	{#if hasRecording}
		<div class="flex gap-3 pt-4">
			<Button variant="outline" class="flex-1 gap-2" onclick={discardRecording} disabled={isSaving}>
				<Trash2 class="size-4" />
				Discard
			</Button>
			<Button variant="outline" class="gap-2" onclick={() => { discardRecording(); startRecording(); }} disabled={isSaving}>
				<RotateCcw class="size-4" />
				Redo
			</Button>
			<Button class="flex-1 gap-2" onclick={saveRecording} disabled={isSaving}>
				<Save class="size-4" />
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		from {
			transform: scaleY(0.4);
		}
		to {
			transform: scaleY(1);
		}
	}
</style>
