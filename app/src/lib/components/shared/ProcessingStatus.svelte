<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		fieldNoteId: string;
		initialStatus: string;
	}

	let { fieldNoteId, initialStatus }: Props = $props();

	let status = $state(initialStatus);
	let currentStage = $state('');
	let errorMessage = $state('');
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const stageLabels: Record<string, string> = {
		download: 'Downloading media...',
		extract_audio: 'Extracting audio...',
		extract_frames: 'Extracting frames...',
		transcribe: 'Processing transcript...',
		analyze_key_moments: 'Analyzing key moments...',
		correlate_frames: 'Correlating frames...',
		enrich_transcript: 'Enriching transcript...',
		extract_insights: 'Extracting insights...',
		save_results: 'Saving results...',
	};

	const stageLabel = $derived(
		currentStage ? (stageLabels[currentStage] ?? `Processing: ${currentStage}...`) : 'Processing...'
	);

	const shouldPoll = $derived(status === 'pending' || status === 'processing');

	async function fetchStatus() {
		try {
			const res = await fetch(`/api/field-notes/${fieldNoteId}/status`);
			if (!res.ok) return;

			const data = await res.json();
			status = data.status;

			if (Array.isArray(data.stages)) {
				const inProgress = data.stages.find((s: any) => s.status === 'in_progress');
				currentStage = inProgress?.stage ?? '';
			}

			if (status === 'completed') {
				stopPolling();
				await invalidateAll();
			} else if (status === 'failed') {
				errorMessage = data.processingError ?? 'Processing failed';
				stopPolling();
			}
		} catch {
			// Silently retry on next poll
		}
	}

	function startPolling() {
		if (pollInterval) return;
		pollInterval = setInterval(fetchStatus, 3000);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	$effect(() => {
		if (shouldPoll) {
			fetchStatus(); // Initial fetch immediately
			startPolling();
		} else {
			stopPolling();
		}
	});

	onDestroy(() => {
		stopPolling();
	});

	function retry() {
		status = 'processing';
		errorMessage = '';
		fetchStatus();
	}
</script>

{#if status === 'pending' || status === 'processing'}
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<Loader2 class="size-4 animate-spin text-primary" />
		<span>{stageLabel}</span>
	</div>
{:else if status === 'completed'}
	<div class="flex items-center gap-2 text-sm text-green-600">
		<CheckCircle2 class="size-4" />
		<span>Processing complete</span>
	</div>
{:else if status === 'failed'}
	<div class="flex items-center gap-2 text-sm text-red-600">
		<AlertCircle class="size-4" />
		<span>{errorMessage || 'Processing failed'}</span>
		<Button variant="ghost" size="sm" class="h-6 px-2 text-xs" onclick={retry}>
			<RotateCcw class="mr-1 size-3" />
			Retry
		</Button>
	</div>
{/if}
