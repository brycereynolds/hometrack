<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { MomentWithFrame, ActionWithSourceMoment } from '$lib/types.js';
	import {
		ArrowLeft,
		Video,
		Mic,
		FileText,
		Image,
		Clock,
		Loader2,
		CheckCircle2,
		AlertTriangle,
		Play,
		ListChecks,
		MessageSquareQuote,
		Lightbulb,
		AlertCircle,
		HelpCircle,
		Check,
		X
	} from 'lucide-svelte';

	let { data } = $props();
	const note = $derived(data.note);

	// Drizzle's inferred types don't include `with:` relations, so we cast
	// the loaded data to our centralized composite types.
	const moments = $derived((note?.moments ?? []) as MomentWithFrame[]);
	const actions = $derived((note?.actions ?? []) as ActionWithSourceMoment[]);

	let videoElement: HTMLVideoElement | undefined = $state();

	function jumpToTime(seconds: number) {
		if (videoElement) {
			videoElement.currentTime = seconds;
			videoElement.play();
		}
	}

	function formatTimestamp(seconds: number | null): string {
		if (seconds == null) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatDate(date: any): string {
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const tagColors: Record<string, string> = {
		showing: 'bg-blue-500/10 text-blue-700 border-blue-200',
		vendor: 'bg-amber-500/10 text-amber-700 border-amber-200',
		client: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
		general: 'bg-stone-500/10 text-stone-700 border-stone-200'
	};

	const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
		pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
		processing: { icon: Loader2, color: 'text-blue-600', label: 'Processing' },
		completed: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Complete' },
		failed: { icon: AlertTriangle, color: 'text-destructive', label: 'Failed' }
	};

	const priorityColors: Record<string, string> = {
		low: 'bg-stone-100 text-stone-700',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-amber-100 text-amber-700',
		urgent: 'bg-red-100 text-red-700'
	};

	const categoryIcons: Record<string, any> = {
		topic_change: MessageSquareQuote,
		observation: Lightbulb,
		decision: CheckCircle2,
		action_item: ListChecks,
		condition_note: AlertCircle,
		visual_reference: Image
	};

	// Status derived
	const noteStatus = $derived(statusConfig[note?.status ?? 'pending'] ?? statusConfig.pending);

	// Split actions by status
	const suggestedActions = $derived(
		actions.filter((a) => a.status === 'suggested')
	);
	const acceptedActions = $derived(
		actions.filter((a) => a.status === 'task_created')
	);
	const dismissedActions = $derived(
		(note?.actions ?? []).filter((a: any) => a.status === 'dismissed')
	);

	// Get transcript
	const transcript = $derived(note?.transcripts?.[0] ?? null);
</script>

{#if note}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-3">
				<Button
					variant="outline"
					size="sm"
					href="/notes"
				>
					<ArrowLeft class="mr-1 size-4" />
					Back
				</Button>
				<div>
					<h2 class="font-serif text-xl font-bold">
						Field Note from {note.author?.name ?? 'Unknown'}
					</h2>
					<p class="text-sm text-muted-foreground">
						{formatDate(note.createdAt)}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Badge
					variant="outline"
					class={tagColors[note.tag] ?? tagColors.general}
				>
					{note.tag}
				</Badge>
				<Badge
					variant="outline"
					class={noteStatus.color}
				>
					{#if note.status === 'processing'}
						<Loader2 class="mr-1 size-3 animate-spin" />
					{/if}
					{noteStatus.label}
				</Badge>
			</div>
		</div>

		<!-- Media Player -->
		{#if note.mediaType === 'video'}
			<Card>
				<CardContent class="p-0">
					<video
						bind:this={videoElement}
						controls
						class="w-full rounded-t-lg"
						src={note.processedMediaPath ?? note.mediaStoragePath ?? ''}
						preload="metadata"
					>
						<track kind="captions" />
					</video>
				</CardContent>
			</Card>
		{:else if note.mediaType === 'voice_memo'}
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-3">
						<Mic class="size-8 text-muted-foreground" />
						<audio
							controls
							class="flex-1"
							src={note.mediaStoragePath ?? ''}
							preload="metadata"
						>
							Your browser does not support audio playback.
						</audio>
					</div>
				</CardContent>
			</Card>
		{:else if note.mediaType === 'text' && note.textContent && note.textContent !== '(attachment)'}
			<Card>
				<CardContent class="p-4">
					<p class="whitespace-pre-wrap text-sm leading-relaxed">
						{note.textContent}
					</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Frame Gallery -->
		{#if note.frames && note.frames.length > 0}
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="font-serif text-base">Frames</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
						{#each note.frames as frame}
							<button
								class="group relative overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
								onclick={() => jumpToTime(frame.timestamp)}
							>
								{#if frame.storagePath}
									<img
										src={frame.storagePath}
										alt={frame.caption ?? `Frame at ${formatTimestamp(frame.timestamp)}`}
										class="aspect-video w-full object-cover"
									/>
								{:else}
									<div
										class="flex aspect-video items-center justify-center bg-muted"
									>
										<Image class="size-4 text-muted-foreground" />
									</div>
								{/if}
								<div
									class="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] font-medium text-white"
								>
									{formatTimestamp(frame.timestamp)}
								</div>
							</button>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Transcript -->
		{#if transcript}
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="font-serif text-base">Transcript</CardTitle>
				</CardHeader>
				<CardContent>
					{#if transcript.enrichedTranscript}
						<div class="prose prose-sm max-w-none text-sm leading-relaxed">
							{@html transcript.enrichedTranscript}
						</div>
					{:else if transcript.rawTranscript}
						<p class="whitespace-pre-wrap text-sm leading-relaxed">
							{transcript.rawTranscript}
						</p>
					{:else}
						<p class="text-sm text-muted-foreground italic">
							Transcript not yet available
						</p>
					{/if}

					{#if transcript.rawSegments && Array.isArray(transcript.rawSegments)}
						<Separator class="my-4" />
						<div class="space-y-2">
							{#each transcript.rawSegments as segment}
								<div class="flex gap-2">
									<button
										class="shrink-0 text-xs font-mono text-primary hover:underline"
										onclick={() => jumpToTime(segment.start)}
									>
										{formatTimestamp(segment.start)}
									</button>
									<p class="text-sm">{segment.text}</p>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Key Moments -->
		{#if moments && moments.length > 0}
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="font-serif text-base">Key Moments</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each moments as moment}
							{@const MomentIcon =
								categoryIcons[moment.category ?? ''] ?? MessageSquareQuote}
							<button
								class="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50"
								onclick={() =>
									jumpToTime(moment.scrubStart ?? moment.timestamp)}
							>
								<div
									class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
								>
									<MomentIcon class="size-4 text-primary" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="text-[10px]">
											{formatTimestamp(moment.timestamp)}
											{#if moment.endTimestamp}
												→ {formatTimestamp(moment.endTimestamp)}
											{/if}
										</Badge>
										{#if moment.category}
											<span
												class="text-[10px] capitalize text-muted-foreground"
											>
												{moment.category.replace('_', ' ')}
											</span>
										{/if}
									</div>
									<p class="mt-1 text-sm">{moment.description}</p>
									{#if moment.enrichedCaption}
										<p
											class="mt-1 text-xs text-muted-foreground"
										>
											{moment.enrichedCaption}
										</p>
									{/if}
								</div>
								{#if moment.bestFrame?.storagePath}
									<img
										src={moment.bestFrame.storagePath}
										alt="Moment frame"
										class="size-16 shrink-0 rounded object-cover"
									/>
								{/if}
							</button>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Action Items (read-only for standalone notes — no form actions) -->
		{#if actions && actions.length > 0}
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="font-serif text-base">
						Action Items
						<Badge variant="outline" class="ml-2 text-xs">
							{actions.length}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each suggestedActions as action}
							<div class="rounded-lg border p-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium">{action.title}</p>
										{#if action.description}
											<p class="mt-1 text-xs text-muted-foreground">
												{action.description}
											</p>
										{/if}
										<div class="mt-2 flex flex-wrap items-center gap-1.5">
											{#if action.category}
												<Badge variant="outline" class="text-[10px]">
													{action.category}
												</Badge>
											{/if}
											{#if action.priority}
												<Badge
													class="text-[10px] {priorityColors[action.priority] ?? ''}"
												>
													{action.priority}
												</Badge>
											{/if}
										</div>
										{#if action.sourceQuote}
											<p
												class="mt-2 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground"
											>
												"{action.sourceQuote}"
											</p>
										{/if}
									</div>
									{#if action.sourceMoment?.bestFrame?.storagePath}
										<img
											src={action.sourceMoment.bestFrame.storagePath}
											alt="Source frame"
											class="size-14 shrink-0 rounded object-cover"
										/>
									{/if}
								</div>
							</div>
						{/each}

						{#each acceptedActions as action}
							<div
								class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
							>
								<div class="flex items-center gap-2">
									<CheckCircle2
										class="size-4 shrink-0 text-emerald-600"
									/>
									<p class="text-sm font-medium">{action.title}</p>
									<div class="flex items-center gap-1.5">
										{#if action.category}
											<Badge variant="outline" class="text-[10px]">
												{action.category}
											</Badge>
										{/if}
										{#if action.priority}
											<Badge
												class="text-[10px] {priorityColors[action.priority] ?? ''}"
											>
												{action.priority}
											</Badge>
										{/if}
									</div>
								</div>
							</div>
						{/each}

						{#each dismissedActions as action}
							<div
								class="rounded-lg border border-stone-200 bg-stone-50/50 p-3 opacity-60"
							>
								<div class="flex items-center gap-2">
									<X class="size-4 shrink-0 text-stone-400" />
									<p
										class="text-sm font-medium text-muted-foreground line-through"
									>
										{action.title}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Summary -->
		{#if note.summary}
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="font-serif text-base">Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm leading-relaxed">{note.summary}</p>
				</CardContent>
			</Card>
		{/if}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-12">
		<p class="text-lg font-medium">Field note not found</p>
		<Button
			variant="outline"
			href="/notes"
			class="mt-4"
		>
			Back to Notes
		</Button>
	</div>
{/if}
