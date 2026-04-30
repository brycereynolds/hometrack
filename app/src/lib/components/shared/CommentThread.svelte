<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { onMount } from 'svelte';

	interface TeamMember {
		id: string;
		name: string;
		initials: string | null;
	}

	interface Comment {
		id: string;
		content: string;
		createdAt: string;
		parentId: string | null;
		actionId: string | null;
		mentions: { memberId: string; name: string }[] | null;
		author: { id: string; name: string; initials: string | null } | null;
		replies: Comment[];
	}

	let {
		noteId,
		actionId,
		teamMembers: members = []
	}: {
		noteId: string;
		actionId?: string;
		teamMembers: TeamMember[];
	} = $props();

	let comments = $state<Comment[]>([]);
	let loading = $state(true);
	let newComment = $state('');
	let posting = $state(false);
	let replyTo = $state<string | null>(null);
	let replyContent = $state('');

	// @mention state
	let showMentionDropdown = $state(false);
	let mentionQuery = $state('');
	let mentionStartIndex = $state(-1);
	let trackedMentions = $state<{ memberId: string; name: string }[]>([]);
	let textareaEl = $state<HTMLTextAreaElement>();
	let replyTextareaEl = $state<HTMLTextAreaElement>();

	// Which textarea is active for mentions
	let activeMentionTarget = $state<'new' | 'reply'>('new');
	let replyMentions = $state<{ memberId: string; name: string }[]>([]);

	const filteredMembers = $derived(
		members.filter((m) =>
			m.name.toLowerCase().includes(mentionQuery.toLowerCase())
		)
	);

	const currentUserInitials = $derived(
		members.length > 0 ? (members[0]?.initials ?? '?') : '?'
	);

	function timeAgo(dateStr: string): string {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diffMs = now - then;
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `${diffHr}h ago`;
		const diffDay = Math.floor(diffHr / 24);
		if (diffDay < 30) return `${diffDay}d ago`;
		return new Date(dateStr).toLocaleDateString();
	}

	function renderMentions(text: string): string {
		return text.replace(
			/@(\w+(?:\s\w+)?)/g,
			'<span class="font-medium text-primary">@$1</span>'
		);
	}

	async function loadComments() {
		try {
			const res = await fetch(`/api/notes/${noteId}/comments`);
			if (res.ok) {
				const data = await res.json();
				comments = data.comments ?? [];
			}
		} catch (err) {
			console.error('Failed to load comments:', err);
		} finally {
			loading = false;
		}
	}

	async function postComment() {
		if (!newComment.trim() || posting) return;
		posting = true;
		try {
			const res = await fetch(`/api/notes/${noteId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: newComment.trim(),
					actionId: actionId || null,
					mentions: trackedMentions.length > 0 ? trackedMentions : null
				})
			});
			if (res.ok) {
				newComment = '';
				trackedMentions = [];
				await loadComments();
			}
		} catch (err) {
			console.error('Failed to post comment:', err);
		} finally {
			posting = false;
		}
	}

	async function postReply(parentId: string) {
		if (!replyContent.trim() || posting) return;
		posting = true;
		try {
			const res = await fetch(`/api/notes/${noteId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: replyContent.trim(),
					parentId,
					actionId: actionId || null,
					mentions: replyMentions.length > 0 ? replyMentions : null
				})
			});
			if (res.ok) {
				replyContent = '';
				replyTo = null;
				replyMentions = [];
				await loadComments();
			}
		} catch (err) {
			console.error('Failed to post reply:', err);
		} finally {
			posting = false;
		}
	}

	function handleInput(e: Event, target: 'new' | 'reply') {
		const textarea = e.target as HTMLTextAreaElement;
		const value = textarea.value;
		const cursorPos = textarea.selectionStart;

		// Look backward from cursor for an @ that starts a mention
		const textBeforeCursor = value.slice(0, cursorPos);
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');

		if (lastAtIndex >= 0) {
			const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
			// Only show dropdown if no space-then-space pattern (allow one space for multi-word names)
			if (/^[\w]*\s?[\w]*$/.test(textAfterAt)) {
				mentionQuery = textAfterAt;
				mentionStartIndex = lastAtIndex;
				showMentionDropdown = true;
				activeMentionTarget = target;
				return;
			}
		}

		showMentionDropdown = false;
	}

	function insertMention(member: TeamMember) {
		const isReply = activeMentionTarget === 'reply';
		const currentValue = isReply ? replyContent : newComment;
		const textarea = isReply ? replyTextareaEl : textareaEl;

		const before = currentValue.slice(0, mentionStartIndex);
		const after = currentValue.slice(mentionStartIndex + 1 + mentionQuery.length);
		const updated = `${before}@${member.name} ${after}`;

		if (isReply) {
			replyContent = updated;
			replyMentions = [...replyMentions, { memberId: member.id, name: member.name }];
		} else {
			newComment = updated;
			trackedMentions = [...trackedMentions, { memberId: member.id, name: member.name }];
		}

		showMentionDropdown = false;
		mentionQuery = '';

		// Restore focus
		setTimeout(() => textarea?.focus(), 0);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (showMentionDropdown && e.key === 'Escape') {
			showMentionDropdown = false;
			e.preventDefault();
		}
	}

	onMount(() => {
		loadComments();
	});
</script>

<div class="space-y-4">
	{#if loading}
		<p class="text-sm text-muted-foreground">Loading comments...</p>
	{:else if comments.length === 0}
		<p class="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
	{:else}
		<div class="space-y-4">
			{#each comments as comment}
				<div class="flex gap-3">
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
					>
						{comment.author?.initials ?? '?'}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">{comment.author?.name ?? 'Unknown'}</span>
							<span class="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
						</div>
						<p class="mt-0.5 text-sm text-foreground">{@html renderMentions(comment.content)}</p>
						<button
							class="mt-1 text-xs text-muted-foreground hover:text-foreground"
							onclick={() => {
								replyTo = replyTo === comment.id ? null : comment.id;
								replyContent = '';
								replyMentions = [];
							}}
						>
							Reply
						</button>

						<!-- Nested replies -->
						{#if comment.replies?.length}
							<div class="mt-2 space-y-3 border-l-2 border-muted pl-4">
								{#each comment.replies as reply}
									<div class="flex gap-3">
										<div
											class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
										>
											{reply.author?.initials ?? '?'}
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium"
													>{reply.author?.name ?? 'Unknown'}</span
												>
												<span class="text-xs text-muted-foreground"
													>{timeAgo(reply.createdAt)}</span
												>
											</div>
											<p class="mt-0.5 text-sm text-foreground">
												{@html renderMentions(reply.content)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Reply input -->
						{#if replyTo === comment.id}
							<div class="mt-2 flex gap-2 items-start">
								<div class="flex-1 relative">
									<textarea
										bind:this={replyTextareaEl}
										bind:value={replyContent}
										placeholder="Write a reply..."
										class="w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
										rows="2"
										oninput={(e) => handleInput(e, 'reply')}
										onkeydown={handleKeydown}
									></textarea>
									{#if showMentionDropdown && activeMentionTarget === 'reply'}
										<div
											class="absolute left-0 bottom-full mb-1 w-56 rounded-lg border bg-popover shadow-lg z-50 py-1 max-h-48 overflow-y-auto"
										>
											{#each filteredMembers as member}
												<button
													class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
													onclick={() => insertMention(member)}
												>
													<span
														class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
													>
														{member.initials}
													</span>
													{member.name}
												</button>
											{/each}
										</div>
									{/if}
									{#if replyContent.trim()}
										<div class="flex justify-end mt-1">
											<Button
												size="sm"
												onclick={() => postReply(comment.id)}
												disabled={posting}
											>
												{posting ? 'Posting...' : 'Reply'}
											</Button>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- New comment input -->
	<div class="flex gap-2 items-start">
		<div
			class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
		>
			{currentUserInitials}
		</div>
		<div class="relative flex-1">
			<textarea
				bind:this={textareaEl}
				bind:value={newComment}
				placeholder="Add a comment... Use @ to mention"
				class="w-full rounded-lg border bg-background p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
				rows="2"
				oninput={(e) => handleInput(e, 'new')}
				onkeydown={handleKeydown}
			></textarea>
			{#if showMentionDropdown && activeMentionTarget === 'new'}
				<div
					class="absolute left-0 bottom-full mb-1 w-56 rounded-lg border bg-popover shadow-lg z-50 py-1 max-h-48 overflow-y-auto"
				>
					{#each filteredMembers as member}
						<button
							class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
							onclick={() => insertMention(member)}
						>
							<span
								class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
							>
								{member.initials}
							</span>
							{member.name}
						</button>
					{/each}
				</div>
			{/if}
			{#if newComment.trim()}
				<div class="flex justify-end mt-1.5">
					<Button size="sm" onclick={postComment} disabled={posting}>
						{posting ? 'Posting...' : 'Comment'}
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
