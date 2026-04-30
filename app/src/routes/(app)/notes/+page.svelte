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
		Paperclip,
		Plus
	} from 'lucide-svelte';

	let { data } = $props();
	const notes = $derived(data.notes ?? []);

	let activeFilter = $state('all');
	let activeListingFilter = $state('all');

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'video', label: 'Videos' },
		{ id: 'voice_memo', label: 'Voice' },
		{ id: 'text', label: 'Text' },
		{ id: 'photo', label: 'Photos' }
	];

	// Unique listings from notes for the property filter dropdown
	const uniqueListings = $derived(() => {
		const map = new Map<string, string>();
		for (const note of notes) {
			if (note.listingId && note.listing?.property?.address) {
				map.set(note.listingId, note.listing.property.address);
			}
		}
		return Array.from(map.entries()).map(([id, address]) => ({ id, address }));
	});

	const filteredNotes = $derived.by(() => {
		let result = notes;
		if (activeFilter !== 'all') {
			result = result.filter((n: any) => n.mediaType === activeFilter);
		}
		if (activeListingFilter !== 'all') {
			if (activeListingFilter === 'general') {
				result = result.filter((n: any) => !n.listingId);
			} else {
				result = result.filter((n: any) => n.listingId === activeListingFilter);
			}
		}
		return result;
	});

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

	function getNoteHref(note: any): string {
		return `/notes/${note.id}`;
	}

	function getListingLabel(note: any): string {
		return note.listing?.property?.address ?? 'General';
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
		<div class="flex items-center gap-3">
			<h2 class="font-serif text-xl font-bold">Notes</h2>
			<Badge variant="outline" class="text-xs">
				{notes.length}
			</Badge>
		</div>
		<Button href="/mobile/field-notes" size="sm">
			<Plus class="mr-1.5 size-4" />
			Capture Note
		</Button>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
		<!-- Media type filter chips -->
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

		<!-- Property filter dropdown -->
		{#if uniqueListings().length > 0}
			<select
				class="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
				bind:value={activeListingFilter}
			>
				<option value="all">All Properties</option>
				<option value="general">General (no property)</option>
				{#each uniqueListings() as listing}
					<option value={listing.id}>{listing.address}</option>
				{/each}
			</select>
		{/if}
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
				<h3 class="font-serif text-lg font-semibold">No notes yet</h3>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					Capture your first note — record video, voice memos, or text
					notes from the field.
				</p>
				<Button href="/mobile/field-notes" class="mt-4" size="sm">
					<Plus class="mr-1.5 size-4" />
					Capture Note
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
					href={getNoteHref(note)}
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

							<!-- Media type badge (skip for text) -->
							{#if note.mediaType !== 'text'}
								<div
									class="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm"
								>
									<MediaIcon class="mr-1 inline size-3" />
									{note.mediaType === 'voice_memo' ? 'Voice' : note.mediaType}
								</div>
							{/if}

							<!-- Processing overlay -->
							{#if note.status === 'pending' || note.status === 'processing'}
								<div class="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
									<div class="rounded-full bg-amber-100/90 p-2">
										<Loader2 class="size-5 text-amber-600 animate-spin" />
									</div>
								</div>
							{/if}
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
							{:else if note.textContent && note.textContent !== '(attachment)'}
								<p
									class="mt-2 line-clamp-2 text-xs text-muted-foreground"
								>
									{note.textContent}
								</p>
							{/if}

							<div class="mt-3 flex items-center gap-2">
								<!-- Status -->
								{#if note.status === 'pending' || note.status === 'processing'}
									<div class="flex items-center gap-1.5">
										<span class="relative flex size-2.5">
											<span class="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
											<span class="relative inline-flex size-2.5 rounded-full bg-amber-500"></span>
										</span>
										<span class="text-[10px] font-medium text-amber-700">
											{note.status === 'pending' ? 'Queued' : 'Processing'}
										</span>
									</div>
								{:else}
									{@const Icon = status.icon}
									<div
										class="flex items-center gap-1 {status.color}"
									>
										<Icon class="size-3" />
										<span class="text-[10px] font-medium"
											>{status.label}</span
										>
									</div>
								{/if}

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

								{#if (note._counts as any)?.attachments > 0}
									<div
										class="flex items-center gap-1 text-muted-foreground"
									>
										<Paperclip class="size-3" />
										<span class="text-[10px]"
											>{(note._counts as any).attachments} {(note._counts as any).attachments === 1 ? 'file' : 'files'}</span
										>
									</div>
								{/if}
							</div>

							<!-- Listing label -->
							<p class="mt-2 truncate text-[11px] text-muted-foreground">
								{getListingLabel(note)}
							</p>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
