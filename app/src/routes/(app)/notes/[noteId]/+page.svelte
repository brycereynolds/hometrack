<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import CommentThread from '$lib/components/shared/CommentThread.svelte';
	import MarkAsTaskModal from '$lib/components/MarkAsTaskModal.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { onMount, onDestroy } from 'svelte';
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
		Check,
		X,
		Sparkles,
		CheckSquare,
		ChevronDown,
		MapPin,
		Paperclip,
		Pencil,
	} from 'lucide-svelte';

	let { data } = $props();
	const note = $derived(data.note);

	// Processing stages from the workflow
	const STAGES = [
		{ key: 'download', label: 'Preparing media' },
		{ key: 'extract', label: 'Extracting audio & frames' },
		{ key: 'transcribe', label: 'Transcribing speech' },
		{ key: 'moments', label: 'Identifying key moments' },
		{ key: 'vision', label: 'Matching visuals' },
		{ key: 'insights', label: 'Generating insights' },
		{ key: 'linking', label: 'Linking actions to moments' },
		{ key: 'saving', label: 'Finalizing' },
	] as const;

	const stages = $derived((note?.processingStages ?? {}) as Record<string, string>);

	let retrying = $state(false);
	async function retryProcessing() {
		if (!note) return;
		retrying = true;
		try {
			const res = await fetch(`/api/field-notes/${note.id}/retry`, { method: 'POST' });
			if (res.ok) {
				mediaUrlFetched = false;
				mediaUrl = null;
				await invalidateAll();
			}
		} finally {
			retrying = false;
		}
	}

	// Poll for updates when note is being processed
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (note?.status === 'pending' || note?.status === 'processing') {
			pollInterval = setInterval(() => invalidateAll(), 3000);
		}
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	$effect(() => {
		if (note?.status === 'completed' || note?.status === 'failed') {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
		}
	});

	// Cast relations
	const moments = $derived((note?.moments ?? []) as MomentWithFrame[]);
	const actions = $derived((note?.actions ?? []) as (ActionWithSourceMoment & { actionMoments?: any[] })[]);
	const listing = $derived((note as any)?.listing ?? null);

	let videoElement: HTMLVideoElement | undefined = $state();
	let mediaUrl: string | null = $state(null);
	let mediaUrlFetched = false;

	// Fetch signed URL once for media playback
	$effect(() => {
		if (note?.mediaStoragePath && !mediaUrlFetched && (note.mediaType === 'video' || note.mediaType === 'voice_memo')) {
			mediaUrlFetched = true;
			fetch(`/api/field-notes/${note.id}/media`)
				.then((r) => r.ok ? r.json() : null)
				.then((data) => { if (data?.url) mediaUrl = data.url; })
				.catch(() => { mediaUrlFetched = false; });
		}
	});

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

	const noteStatus = $derived(statusConfig[note?.status ?? 'pending'] ?? statusConfig.pending);

	// Split actions by status
	const suggestedActions = $derived(actions.filter((a) => a.status === 'suggested'));
	const acceptedActions = $derived(actions.filter((a) => a.status === 'task_created'));
	const dismissedActions = $derived(actions.filter((a: any) => a.status === 'dismissed'));
	let dismissedOpen = $state(false);
	let reviewModalOpen = $state(false);
	let reviewModalStartIndex = $state(0);

	function openModalForAction(action: ActionWithSourceMoment) {
		const idx = suggestedActions.findIndex((a) => a.id === action.id);
		reviewModalStartIndex = idx >= 0 ? idx : 0;
		reviewModalOpen = true;
	}

	// Get transcript
	const transcript = $derived(note?.transcripts?.[0] ?? null);

	// Build a map of momentId -> action count for showing indicators on moments
	const momentActionCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const action of actions) {
			if (action.actionMoments) {
				for (const am of action.actionMoments) {
					if (am.moment?.id) {
						counts[am.moment.id] = (counts[am.moment.id] ?? 0) + 1;
					}
				}
			}
			// Also count the legacy sourceMomentId
			if (action.sourceMomentId) {
				counts[action.sourceMomentId] = (counts[action.sourceMomentId] ?? 0) + 1;
			}
		}
		return counts;
	});

	// Build action -> linked moment timestamps for action item cards
	const actionMomentTimestamps = $derived.by(() => {
		const map: Record<string, { momentId: string; timestamp: number }[]> = {};
		for (const action of actions) {
			const linked: { momentId: string; timestamp: number }[] = [];
			if (action.actionMoments) {
				for (const am of action.actionMoments) {
					if (am.moment) {
						linked.push({ momentId: am.moment.id, timestamp: am.moment.timestamp });
					}
				}
			}
			if (linked.length === 0 && action.sourceMoment) {
				linked.push({ momentId: action.sourceMoment.id, timestamp: action.sourceMoment.timestamp });
			}
			if (linked.length > 0) {
				map[action.id] = linked;
			}
		}
		return map;
	});

	// Parse raw segments for transcript tab
	const rawSegments = $derived.by(() => {
		const t = transcript;
		if (!t?.rawSegments || !Array.isArray(t.rawSegments)) return [];
		return t.rawSegments as { start: number; end?: number; text: string; speaker?: string }[];
	});

	// Group segments by speaker for nicer display
	const groupedSegments = $derived.by(() => {
		const segs = rawSegments;
		if (segs.length === 0) return [];

		const groups: { speaker: string; start: number; texts: { start: number; text: string }[] }[] = [];
		let current: typeof groups[0] | null = null;

		for (const seg of segs) {
			const speaker = seg.speaker ?? 'Speaker';
			if (!current || current.speaker !== speaker) {
				current = { speaker, start: seg.start, texts: [] };
				groups.push(current);
			}
			current.texts.push({ start: seg.start, text: seg.text });
		}

		return groups;
	});

	// Attachment info
	const attachment = $derived((note as any)?.attachments?.[0] ?? null);

	// AI correction state
	let correctingActionId = $state<string | null>(null);
	let correctionText = $state('');
	let correctionLoading = $state(false);

	async function submitCorrection(actionId: string) {
		if (!correctionText.trim() || !note) return;
		correctionLoading = true;
		try {
			const res = await fetch(`/api/field-notes/${note.id}/correct`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ actionId, correction: correctionText.trim() }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Correction failed');
			}
			toast.success('Correction applied');
			correctingActionId = null;
			correctionText = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Correction failed');
		} finally {
			correctionLoading = false;
		}
	}
</script>

{#if note}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-3">
				<Button variant="outline" size="sm" href="/notes">
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
					{#if attachment}
						<span class="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Paperclip class="size-3" />
							{attachment.fileName}
							{#if attachment.fileSize}
								&middot; {(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB
							{/if}
						</span>
					{/if}
					{#if listing?.property?.address}
						<a
							href="/listings/{listing.id}"
							class="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							<MapPin class="size-3.5" />
							{listing.property.address}
						</a>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant="outline" class={tagColors[note.tag] ?? tagColors.general}>
					{note.tag}
				</Badge>
				<Badge variant="outline" class={noteStatus.color}>
					{#if note.status === 'processing'}
						<Loader2 class="mr-1 size-3 animate-spin" />
					{/if}
					{noteStatus.label}
				</Badge>
			</div>
		</div>

		<!-- Processing Banner -->
		{#if note.status === 'pending' || note.status === 'processing'}
			{@const completedCount = STAGES.filter(s => stages[s.key] === 'completed').length}
			{@const activeStage = STAGES.find(s => stages[s.key] === 'active')}
			{@const progress = Math.round((completedCount / STAGES.length) * 100)}
			<div class="rounded-lg border bg-muted/30 p-4">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="size-8 rounded-full bg-primary/10 flex items-center justify-center">
							<Loader2 class="size-4 text-primary animate-spin" />
						</div>
						<div>
							<p class="text-sm font-semibold">
								{activeStage ? activeStage.label : 'Starting...'}
							</p>
							<p class="text-xs text-muted-foreground">
								Step {completedCount + 1} of {STAGES.length}
							</p>
						</div>
					</div>
					<span class="text-xs font-medium text-muted-foreground">{progress}%</span>
				</div>
				<div class="h-1.5 rounded-full bg-muted overflow-hidden">
					<div
						class="h-full rounded-full bg-primary transition-all duration-700 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		{:else if note.status === 'failed'}
			<div class="rounded-lg border bg-muted/30 p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="size-8 rounded-full bg-muted flex items-center justify-center">
							<AlertTriangle class="size-4 text-muted-foreground" />
						</div>
						<div>
							<p class="text-sm font-semibold">Processing didn't complete</p>
							<p class="text-xs text-muted-foreground">Something went wrong, but your media is safe. Try again.</p>
						</div>
					</div>
					{#if note.mediaStoragePath}
						<Button size="sm" onclick={retryProcessing} disabled={retrying}>
							{#if retrying}
								<Loader2 class="mr-1 size-3 animate-spin" />
							{/if}
							Retry
						</Button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Tabs: Overview / Transcript -->
		{#if note.status === 'completed'}
			<Tabs value="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="transcript">Transcript</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" class="mt-4">
					<!-- Summary above video -->
					{#if note.summary}
						<p class="text-sm text-muted-foreground mb-4">{note.summary}</p>
					{/if}

					<!-- Two-column layout -->
					<div class="flex flex-col lg:flex-row gap-6">
						<!-- Left column: Video + Frames -->
						<div class="w-full lg:w-[55%] space-y-4">
							<!-- Video Player (sticky so it stays visible while scrolling frames) -->
							<div class="sticky top-0 z-10 bg-background pb-2">
							{#if note.mediaType === 'video'}
								{#if mediaUrl}
									{#key mediaUrl}
									<div class="rounded-lg overflow-hidden">
										<video
											bind:this={videoElement}
											controls
											class="w-full max-h-[500px] object-contain bg-black"
											src={mediaUrl}
											preload="metadata"
										>
											<track kind="captions" />
										</video>
									</div>
									{/key}
								{:else}
									<div class="flex items-center justify-center bg-black/5 rounded-lg" style="height: 300px;">
										<div class="flex flex-col items-center gap-2 text-muted-foreground">
											<Loader2 class="size-6 animate-spin" />
											<p class="text-sm">Loading video...</p>
										</div>
									</div>
								{/if}
							{:else if note.mediaType === 'voice_memo'}
								<Card>
									<CardContent class="p-4">
										<div class="flex items-center gap-3">
											<Mic class="size-8 text-muted-foreground" />
											<audio
												controls
												class="flex-1"
												src={mediaUrl ?? ''}
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
							</div>

							<!-- Frame Grid -->
							{#if note.frames && note.frames.length > 0}
								<div class="relative">
									<div class="max-h-[400px] overflow-y-auto">
										<div class="grid grid-cols-3 gap-2">
											{#each note.frames as frame}
												<button
													class="group flex flex-col overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
													onclick={() => jumpToTime(frame.timestamp)}
												>
													{#if frame.publicUrl}
														<img
															src={frame.publicUrl}
															alt={frame.caption ?? `Frame at ${formatTimestamp(frame.timestamp)}`}
															class="w-full aspect-video object-cover"
														/>
													{:else}
														<div class="flex w-full aspect-video items-center justify-center bg-muted">
															<Image class="size-4 text-muted-foreground" />
														</div>
													{/if}
													<div class="px-1 py-1 text-center text-[10px] font-medium text-muted-foreground">
														{formatTimestamp(frame.timestamp)}
													</div>
												</button>
											{/each}
										</div>
									</div>
									<div class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent"></div>
								</div>
							{/if}
						</div>

						<!-- Right column: Key Moments (scrollable) -->
						<div class="w-full lg:w-[45%] space-y-3">
							{#if moments.length > 0}
								<h3 class="font-serif text-base font-semibold">Key Moments</h3>
								<div class="relative">
									<div class="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
										{#each moments as moment}
											{@const MomentIcon = categoryIcons[moment.category ?? ''] ?? MessageSquareQuote}
											{@const actionCount = momentActionCounts[moment.id] ?? 0}
											<button
												class="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50"
												onclick={() => jumpToTime(moment.scrubStart ?? moment.timestamp)}
											>
												<div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
													<MomentIcon class="size-4 text-primary" />
												</div>
												<div class="min-w-0 flex-1">
													<div class="flex items-center gap-2">
														<Badge variant="outline" class="text-[10px] shrink-0">
															{formatTimestamp(moment.timestamp)}
															{#if moment.endTimestamp}
																&rarr; {formatTimestamp(moment.endTimestamp)}
															{/if}
														</Badge>
														{#if moment.category}
															<span class="text-[10px] capitalize text-muted-foreground">
																{moment.category.replace('_', ' ')}
															</span>
														{/if}
														{#if actionCount > 0}
															<span class="inline-flex items-center gap-0.5 text-[10px] text-primary">
																<CheckSquare class="size-3" />
																{actionCount}
															</span>
														{/if}
													</div>
													<p class="mt-1 text-sm font-medium">{moment.description}</p>
													{#if moment.transcriptContext}
														<blockquote class="mt-1.5 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground line-clamp-2">
															{moment.transcriptContext}
														</blockquote>
													{/if}
													{#if moment.enrichedCaption}
														<p class="mt-1 text-xs text-muted-foreground">
															{moment.enrichedCaption}
														</p>
													{/if}
												</div>
												{#if moment.bestFrame?.publicUrl}
													<img
														src={moment.bestFrame.publicUrl}
														alt="Moment frame"
														class="size-14 shrink-0 rounded object-cover"
													/>
												{/if}
											</button>
										{/each}
									</div>
									<div class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent"></div>
								</div>
							{:else}
								<div class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
									No key moments identified yet
								</div>
							{/if}
						</div>
					</div>

					<!-- Action Items (below two-column area) -->
					{#if actions.length > 0}
						<Separator class="my-6" />
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="font-serif text-base font-semibold">
									Action Items
									<Badge variant="outline" class="ml-2 text-xs">
										{suggestedActions.length + acceptedActions.length}
									</Badge>
								</h3>
								{#if suggestedActions.length > 1}
									<Button
										variant="outline"
										size="sm"
										onclick={() => { reviewModalStartIndex = 0; reviewModalOpen = true; }}
									>
										<ListChecks class="mr-1 size-3" />
										Review All ({suggestedActions.length})
									</Button>
								{/if}
							</div>

							<!-- Suggested actions -->
							<div class="grid gap-3 sm:grid-cols-2">
								{#each suggestedActions as action}
									<div class="rounded-lg border p-4">
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
													<Badge class="text-[10px] {priorityColors[action.priority] ?? ''}">
														{action.priority}
													</Badge>
												{/if}
											</div>
											{#if action.sourceQuote}
												<p class="mt-2 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground">
													"{action.sourceQuote}"
												</p>
											{/if}
											{#if actionMomentTimestamps[action.id]}
												<div class="mt-2 flex flex-wrap gap-1">
													{#each actionMomentTimestamps[action.id] as linked}
														<button
															class="text-[10px] font-mono text-primary hover:underline"
															onclick={() => jumpToTime(linked.timestamp)}
														>
															{formatTimestamp(linked.timestamp)}
														</button>
													{/each}
												</div>
											{/if}
										</div>
										<div class="mt-3 flex gap-2">
											<Button
												size="sm"
												variant="default"
												class="bg-[#c2754f] hover:bg-[#a8613d] text-white"
												onclick={() => openModalForAction(action)}
											>
												<Check class="mr-1 size-3" />
												Mark as Task
											</Button>
											<form
												method="POST"
												action="?/dismissAction"
												use:enhance={() => {
													return async ({ result, update }) => {
														if (result.type === 'success') {
															toast.success('Action dismissed');
															await update();
														} else if (result.type === 'failure') {
															toast.error(String(result.data?.error ?? 'Failed to dismiss'));
														}
													};
												}}
											>
												<input type="hidden" name="actionId" value={action.id} />
												<Button type="submit" size="sm" variant="ghost">
													<X class="mr-1 size-3" />
													Dismiss
												</Button>
											</form>
											<Button
												size="sm"
												variant="ghost"
												onclick={() => {
													if (correctingActionId === action.id) {
														correctingActionId = null;
														correctionText = '';
													} else {
														correctingActionId = action.id;
														correctionText = '';
													}
												}}
											>
												<Pencil class="mr-1 size-3" />
												Correct
											</Button>
										</div>
										{#if correctingActionId === action.id}
											<div class="mt-3 space-y-2">
												<input
													type="text"
													class="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground"
													placeholder="What needs to be corrected?"
													bind:value={correctionText}
													onkeydown={(e) => { if (e.key === 'Enter' && correctionText.trim()) submitCorrection(action.id); }}
												/>
												<div class="flex gap-2">
													<Button
														size="sm"
														variant="default"
														disabled={correctionLoading || !correctionText.trim()}
														onclick={() => submitCorrection(action.id)}
													>
														{#if correctionLoading}
															<Loader2 class="mr-1 size-3 animate-spin" />
														{:else}
															<Sparkles class="mr-1 size-3" />
														{/if}
														Fix with AI
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onclick={() => { correctingActionId = null; correctionText = ''; }}
													>
														Cancel
													</Button>
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>

							<!-- Accepted actions -->
							{#each acceptedActions as action}
								<div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
									<div class="flex items-center gap-2">
										<CheckCircle2 class="size-4 shrink-0 text-emerald-600" />
										<p class="text-sm font-medium">{action.title}</p>
										<div class="flex items-center gap-1.5">
											{#if action.category}
												<Badge variant="outline" class="text-[10px]">
													{action.category}
												</Badge>
											{/if}
											{#if action.priority}
												<Badge class="text-[10px] {priorityColors[action.priority] ?? ''}">
													{action.priority}
												</Badge>
											{/if}
										</div>
									</div>
								</div>
							{/each}

							<!-- Dismissed actions (collapsible) -->
							{#if dismissedActions.length > 0}
								<div>
									<button
										class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
										onclick={() => dismissedOpen = !dismissedOpen}
									>
										<ChevronDown class="size-4 transition-transform {dismissedOpen ? 'rotate-0' : '-rotate-90'}" />
										Dismissed ({dismissedActions.length})
									</button>
									{#if dismissedOpen}
										<div class="mt-2 space-y-2">
											{#each dismissedActions as action}
												<div class="rounded-lg border border-stone-200 bg-stone-50/50 p-3 opacity-60">
													<div class="flex items-center gap-2">
														<X class="size-4 shrink-0 text-stone-400" />
														<p class="text-sm font-medium text-muted-foreground line-through">
															{action.title}
														</p>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</TabsContent>

				<TabsContent value="transcript" class="mt-4">
					{#if groupedSegments.length > 0}
						<Card>
							<CardContent class="p-4 sm:p-6">
								<div class="space-y-4">
									{#each groupedSegments as group}
										<div>
											<div class="flex items-center gap-2 mb-1">
												<span class="text-sm font-semibold">{group.speaker}</span>
												<button
													class="text-[10px] font-mono text-primary hover:underline"
													onclick={() => jumpToTime(group.start)}
												>
													{formatTimestamp(group.start)}
												</button>
											</div>
											<div class="pl-0 sm:pl-4 space-y-1">
												{#each group.texts as seg}
													<p class="text-sm leading-relaxed">
														<button
															class="inline text-[10px] font-mono text-muted-foreground hover:text-primary mr-1.5 align-baseline"
															onclick={() => jumpToTime(seg.start)}
														>
															{formatTimestamp(seg.start)}
														</button>
														{seg.text}
													</p>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</CardContent>
						</Card>
					{:else if transcript?.rawTranscript}
						<Card>
							<CardContent class="p-4 sm:p-6">
								<p class="whitespace-pre-wrap text-sm leading-relaxed">
									{transcript.rawTranscript}
								</p>
							</CardContent>
						</Card>
					{:else}
						<div class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
							No transcript available
						</div>
					{/if}
				</TabsContent>
			</Tabs>
		{:else}
			<!-- Not completed yet — show basic media/content without tabs -->
			{#if note.mediaType === 'video'}
				{#if mediaUrl}
					{#key mediaUrl}
					<div class="rounded-lg overflow-hidden">
						<video
							bind:this={videoElement}
							controls
							class="w-full max-h-[500px] object-contain bg-black"
							src={mediaUrl}
							preload="metadata"
						>
							<track kind="captions" />
						</video>
					</div>
					{/key}
				{:else if note.mediaStoragePath}
					<div class="flex items-center justify-center bg-black/5 rounded-lg" style="height: 300px;">
						<div class="flex flex-col items-center gap-2 text-muted-foreground">
							<Loader2 class="size-6 animate-spin" />
							<p class="text-sm">Loading video...</p>
						</div>
					</div>
				{/if}
			{:else if note.mediaType === 'voice_memo'}
				<Card>
					<CardContent class="p-4">
						<div class="flex items-center gap-3">
							<Mic class="size-8 text-muted-foreground" />
							<audio controls class="flex-1" src={mediaUrl ?? ''} preload="metadata">
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
		{/if}

		<!-- Comments (always shown) -->
		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="font-serif text-base">Discussion</CardTitle>
			</CardHeader>
			<CardContent>
				<CommentThread noteId={note.id} teamMembers={data.teamMembers ?? []} />
			</CardContent>
		</Card>
	</div>
	<MarkAsTaskModal
		bind:open={reviewModalOpen}
		bind:startIndex={reviewModalStartIndex}
		actionItems={suggestedActions}
		listingId={note.listingId ?? null}
		teamMembers={data.teamMembers ?? []}
		noteAuthorId={note.authorId ?? ''}
		noteId={note.id}
		videoUrl={note.mediaType === 'video' ? mediaUrl : null}
	/>
{:else}
	<div class="flex flex-col items-center justify-center py-12">
		<p class="text-lg font-medium">Field note not found</p>
		<Button variant="outline" href="/notes" class="mt-4">
			Back to Notes
		</Button>
	</div>
{/if}
