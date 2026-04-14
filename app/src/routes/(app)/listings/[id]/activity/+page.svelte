<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		Send,
		Paperclip,
		Mic,
		MessageSquare,
		Mail,
		StickyNote,
		AudioLines,
		Cpu,
		Sparkles,
		GitBranch,
		CheckCircle2,
		Filter,
		ArrowRight
	} from 'lucide-svelte';
	import ProcessingStatus from '$lib/components/shared/ProcessingStatus.svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const allActivity = $derived(data.activityItems ?? []);

	let activeFilter = $state('all');

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'message', label: 'Messages' },
		{ id: 'email', label: 'Emails' },
		{ id: 'note', label: 'Notes' },
		{ id: 'voice_memo', label: 'Voice Memos' },
		{ id: 'system', label: 'System' },
		{ id: 'ai_insight', label: 'Insights' }
	];

	const filteredActivity = $derived(
		activeFilter === 'all'
			? allActivity
			: allActivity.filter((a: any) => a.type === activeFilter)
	);

	let composeText = $state('');

	function timeAgo(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'message': return MessageSquare;
			case 'email': return Mail;
			case 'note': return StickyNote;
			case 'voice_memo': return AudioLines;
			case 'system': return Cpu;
			case 'ai_insight': return Sparkles;
			case 'phase_change': return GitBranch;
			case 'task_complete': return CheckCircle2;
			default: return MessageSquare;
		}
	}

	function getTypeColor(type: string) {
		switch (type) {
			case 'message': return 'bg-blue-100 text-blue-600';
			case 'email': return 'bg-violet-100 text-violet-600';
			case 'note': return 'bg-yellow-100 text-yellow-700';
			case 'voice_memo': return 'bg-rose-100 text-rose-600';
			case 'system': return 'bg-gray-100 text-gray-500';
			case 'ai_insight': return 'bg-amber-100 text-amber-600';
			case 'phase_change': return 'bg-emerald-100 text-emerald-600';
			case 'task_complete': return 'bg-green-100 text-green-600';
			default: return 'bg-gray-100 text-gray-500';
		}
	}

	function getAvatarColor(type: string) {
		switch (type) {
			case 'ai_insight': return 'bg-amber-100 text-amber-700';
			case 'system': case 'phase_change': return 'bg-muted text-muted-foreground';
			default: return 'bg-primary/10 text-primary';
		}
	}
</script>

{#if listing}
	<div class="space-y-4">
		<!-- Compose Bar -->
		<Card>
			<CardContent class="p-4">
				<form
					method="POST"
					action="?/postNote"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success('Note posted');
								composeText = '';
								await update();
							} else {
								toast.error('Failed to post note');
							}
						};
					}}
				>
					<div class="flex gap-3">
						<Avatar class="size-8 shrink-0">
							<AvatarFallback class="bg-primary text-primary-foreground text-xs">LC</AvatarFallback>
						</Avatar>
						<div class="flex-1">
							<div class="relative">
								<textarea
									name="content"
									bind:value={composeText}
									placeholder="Add a note, message, or update..."
									class="w-full resize-none rounded-lg border bg-transparent p-3 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
									rows="2"
								></textarea>
								<div class="absolute bottom-2 right-2 flex items-center gap-1">
									<Button variant="ghost" size="icon" type="button" class="size-8">
										<Paperclip class="size-4 text-muted-foreground" />
									</Button>
									<Button variant="ghost" size="icon" type="button" class="size-8">
										<Mic class="size-4 text-muted-foreground" />
									</Button>
									<Button type="submit" size="sm" class="h-7" disabled={!composeText.trim()}>
										<Send class="mr-1 size-3.5" />
										Send
									</Button>
								</div>
							</div>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>

		<!-- Filter Chips -->
		<div class="flex flex-wrap gap-2">
			{#each filters as filter}
				<button
					onclick={() => (activeFilter = filter.id)}
					class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {activeFilter === filter.id
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
				>
					{filter.label}
				</button>
			{/each}
		</div>

		<!-- Activity Feed -->
		<div class="space-y-0">
			{#each filteredActivity as activity, i}
				{@const Icon = getTypeIcon(activity.type)}
				{@const isSystem = activity.type === 'system' || activity.type === 'phase_change'}
				{@const isAI = activity.type === 'ai_insight'}

				{#if isSystem}
					<!-- System event: centered, muted -->
					<div class="flex items-center gap-3 py-4 {i > 0 ? 'border-t border-dashed' : ''}">
						<div class="flex-1 h-px bg-border"></div>
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							<div class="rounded-full p-1 {getTypeColor(activity.type)}">
								<Icon class="size-3" />
							</div>
							<span>{activity.content}</span>
							<span class="text-muted-foreground/60">-- {timeAgo(activity.timestamp)}</span>
						</div>
						<div class="flex-1 h-px bg-border"></div>
					</div>
				{:else}
					<!-- Regular activity item -->
					<div class="flex gap-3 py-4 {i > 0 ? 'border-t' : ''} {isAI ? 'border-l-2 border-l-amber-400 pl-3 bg-amber-50/30 -mx-3 px-6 rounded-r-lg' : ''}">
						<div class="relative shrink-0">
							<Avatar class="size-9">
								<AvatarFallback class="text-xs {getAvatarColor(activity.type)}">
									{activity.authorInitials ?? '?'}
								</AvatarFallback>
							</Avatar>
							<div class="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 bg-background">
								<div class="rounded-full p-0.5 {getTypeColor(activity.type)}">
									<Icon class="size-2.5" />
								</div>
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium">{activity.authorName ?? 'System'}</span>
								<Badge variant="outline" class="text-[10px] font-normal px-1.5 py-0 h-4">
									{activity.type === 'voice_memo' ? 'Voice Memo' :
									 activity.type === 'ai_insight' ? 'Insight' :
									 activity.type === 'task_complete' ? 'Task' :
									 activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
								</Badge>
								<span class="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</span>
							</div>

							{#if activity.type === 'email' && (activity.metadata as any)?.subject}
								<p class="mt-1 text-sm font-medium text-violet-700">{(activity.metadata as any).subject}</p>
								<p class="mt-0.5 text-sm text-muted-foreground">{activity.content}</p>
							{:else if activity.type === 'voice_memo'}
								<div class="mt-2 rounded-lg border bg-muted/50 p-3">
									<div class="flex items-center gap-2">
										<button class="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<svg class="size-3 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
												<polygon points="5,3 19,12 5,21" />
											</svg>
										</button>
										<div class="flex flex-1 items-center gap-0.5">
											{#each Array(32) as _, j}
												{@const height = 8 + Math.sin(j * 0.5) * 12 + Math.random() * 8}
												<div
													class="w-1 rounded-full bg-primary/40"
													style="height: {height}px"
												></div>
											{/each}
										</div>
										{#if (activity.metadata as any)?.duration}
											<span class="text-xs text-muted-foreground shrink-0">{(activity.metadata as any).duration}</span>
										{/if}
									</div>
									<p class="mt-2 text-xs text-muted-foreground italic">{activity.content}</p>
								</div>
							{:else}
								<p class="mt-1 text-sm text-muted-foreground">{activity.content}</p>
							{/if}

							{#if (activity.type === 'voice_memo' || activity.type === 'note') && (activity.metadata as any)?.fieldNoteId}
								{@const fieldNoteId = (activity.metadata as any).fieldNoteId}
								{@const fieldNoteStatus = (activity.metadata as any)?.fieldNoteStatus}
								<div class="mt-2 flex items-center gap-3">
									{#if fieldNoteStatus && fieldNoteStatus !== 'completed'}
										<ProcessingStatus {fieldNoteId} initialStatus={fieldNoteStatus} />
									{/if}
									<a
										href="/listings/{listing?.id}/field-notes/{fieldNoteId}"
										class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
									>
										View full note
										<ArrowRight class="size-3" />
									</a>
								</div>
							{/if}

							{#if isAI}
								<div class="mt-2">
									<Button variant="outline" size="sm" class="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50">
										Take Action
									</Button>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/each}

			{#if filteredActivity.length === 0}
				<div class="flex flex-col items-center justify-center py-12">
					<Filter class="size-8 text-muted-foreground/40 mb-3" />
					<p class="text-sm text-muted-foreground">No activity matching this filter.</p>
					<Button variant="ghost" size="sm" class="mt-2" onclick={() => (activeFilter = 'all')}>
						Show All
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
