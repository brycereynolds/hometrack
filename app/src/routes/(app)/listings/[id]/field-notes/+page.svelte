<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Video,
		Mic,
		FileText,
		Image,
		Loader2,
		CheckCircle2,
		AlertTriangle,
		Clock,
		ListChecks,
		Plus
	} from 'lucide-svelte';
	import { page } from '$app/stores';

	let { data } = $props();
	const notes = $derived(data.fieldNotes ?? []);

	let activeFilter = $state('all');

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'video', label: 'Videos' },
		{ id: 'voice_memo', label: 'Voice' },
		{ id: 'text', label: 'Text' }
	];

	const filteredNotes = $derived(
		activeFilter === 'all' ? notes : notes.filter((n: any) => n.mediaType === activeFilter)
	);

	function timeAgo(date: any): string {
		const d = date instanceof Date ? date : new Date(date);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatDuration(seconds: number | null): string {
		if (!seconds) return '';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getMediaIcon(type: string) {
		switch (type) {
			case 'video':
				return Video;
			case 'voice_memo':
				return Mic;
			case 'text':
				return FileText;
			case 'photo':
				return Image;
			default:
				return FileText;
		}
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
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="font-serif text-xl font-bold">Field Notes</h2>
			<p class="text-sm text-muted-foreground">Walkthrough recordings and field observations</p>
		</div>
		<Button href="/notes" size="sm">
			<Plus class="mr-1.5 size-4" />
			View All Notes
		</Button>
	</div>

	<!-- Filter chips -->
	<div class="flex gap-2">
		{#each filters as filter}
			<button
				class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
					{activeFilter === filter.id
					? 'border-primary bg-primary/10 text-primary'
					: 'border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => {
					activeFilter = filter.id;
				}}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if filteredNotes.length === 0}
		<!-- Empty state -->
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12 text-center">
				<div
					class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted"
				>
					<Video class="size-8 text-muted-foreground" />
				</div>
				<h3 class="font-serif text-lg font-semibold">No field notes yet</h3>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					Capture your first walkthrough — record video, voice memos, or text
					notes from the field.
				</p>
				<Button href="/notes" class="mt-4" size="sm">
					<Plus class="mr-1.5 size-4" />
					View All Notes
				</Button>
			</CardContent>
		</Card>
	{:else}
		<!-- Notes grid -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredNotes as note (note.id)}
				{@const status = statusConfig[note.status] ?? statusConfig.pending}
				{@const MediaIcon = getMediaIcon(note.mediaType)}
				{@const firstFrame = note.frames?.[0]}
				<a
					href="/listings/{$page.params.id}/field-notes/{note.id}"
					class="group block"
				>
					<Card
						class="overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-border"
					>
						<!-- Thumbnail / Icon area -->
						<div
							class="relative flex h-36 items-center justify-center bg-muted"
						>
							{#if firstFrame?.storagePath}
								<img
									src={firstFrame.storagePath}
									alt="Frame thumbnail"
									class="h-full w-full object-cover"
								/>
							{:else}
								<MediaIcon class="size-10 text-muted-foreground/50" />
							{/if}

							<!-- Duration badge -->
							{#if note.duration}
								<div
									class="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white"
								>
									{formatDuration(note.duration)}
								</div>
							{/if}

							<!-- Media type badge -->
							<div
								class="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm"
							>
								<MediaIcon class="mr-1 inline size-3" />
								{note.mediaType === 'voice_memo' ? 'Voice' : note.mediaType}
							</div>
						</div>

						<CardContent class="p-3">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium">
										{note.author?.name ?? 'Unknown'}
									</p>
									<p class="text-xs text-muted-foreground">
										{timeAgo(note.createdAt)}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-1.5">
									<Badge
										variant="outline"
										class="text-[10px] {tagColors[note.tag] ?? tagColors.general}"
									>
										{note.tag}
									</Badge>
								</div>
							</div>

							{#if note.summary}
								<p
									class="mt-2 line-clamp-2 text-xs text-muted-foreground"
								>
									{note.summary}
								</p>
							{:else if note.textContent}
								<p
									class="mt-2 line-clamp-2 text-xs text-muted-foreground"
								>
									{note.textContent}
								</p>
							{/if}

							<div class="mt-3 flex items-center gap-2">
								<!-- Status -->
								<div
									class="flex items-center gap-1 {status.color}"
								>
									{#if note.status === 'processing'}
										<Loader2 class="size-3 animate-spin" />
									{:else}
										{@const Icon = status.icon}
										<Icon class="size-3" />
									{/if}
									<span class="text-[10px] font-medium"
										>{status.label}</span
									>
								</div>

								{#if note._counts?.actions > 0}
									<div
										class="flex items-center gap-1 text-muted-foreground"
									>
										<ListChecks class="size-3" />
										<span class="text-[10px]"
											>{note._counts.actions} actions</span
										>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
