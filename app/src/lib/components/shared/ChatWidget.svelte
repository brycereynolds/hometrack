<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Markdown } from '$lib/components/shared/index.js';
	import { MessageSquare, X, Maximize2, Minimize2, Send, Loader2, Sparkles, ChevronDown, Plus } from 'lucide-svelte';
	import { tick, onMount } from 'svelte';
	import { browser } from '$app/environment';

	const MIN_HEIGHT = 200;
	const DEFAULT_HEIGHT_VH = 40;
	const MAX_HEIGHT_VH = 80;

	interface RecentConversation {
		id: string;
		title: string | null;
		sourceContext?: { pathname: string; params: Record<string, string>; label: string } | null;
		createdAt: string;
		updatedAt: string;
	}

	let isOpen = $state(false);
	let messages = $state<{ id: string; role: string; content: string; createdAt: string }[]>([]);
	let input = $state('');
	let isStreaming = $state(false);
	let streamingContent = $state('');
	let conversationId = $state<string | null>(null);
	let chatContainer: HTMLDivElement | undefined = $state();
	let hasUnread = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();
	let recentConversations = $state<RecentConversation[]>([]);
	let showConversationPicker = $state(false);

	// Drawer height
	let drawerHeight = $state(browser ? Math.round(window.innerHeight * DEFAULT_HEIGHT_VH / 100) : 400);
	let isDragging = $state(false);
	let isMaximized = $state(false);
	let isMobile = $state(browser ? window.innerWidth < 768 : false);
	let dragStartY = 0;
	let dragStartHeight = 0;

	function clampHeight(h: number): number {
		const maxPx = Math.round(window.innerHeight * MAX_HEIGHT_VH / 100);
		return Math.max(MIN_HEIGHT, Math.min(h, maxPx));
	}

	function onPointerDown(e: PointerEvent) {
		if (isMobile) return;
		isDragging = true;
		dragStartY = e.clientY;
		dragStartHeight = drawerHeight;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || isMobile) return;
		const delta = dragStartY - e.clientY;
		drawerHeight = clampHeight(dragStartHeight + delta);
		isMaximized = false;
	}

	function onPointerUp() {
		isDragging = false;
	}

	function toggleMaximize() {
		if (isMaximized) {
			drawerHeight = Math.round(window.innerHeight * DEFAULT_HEIGHT_VH / 100);
			isMaximized = false;
		} else {
			isMaximized = true;
		}
	}

	$effect(() => {
		if (!browser) return;
		function onResize() {
			isMobile = window.innerWidth < 768;
		}
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		});
	}

	// Page context
	let currentPathname = $derived($page.url.pathname);
	let currentParams = $derived($page.params);

	function getContextLabel(): string {
		const p = currentPathname;
		if (p.startsWith('/notes/')) return `Field Note`;
		if (p.startsWith('/listings/') && p.includes('/field-notes/')) return `Field Note`;
		if (p.startsWith('/listings/')) return `Listing`;
		if (p === '/contacts') return 'Contacts';
		if (p === '/vendors') return 'Vendors';
		if (p === '/analytics') return 'Analytics';
		if (p === '/dashboard') return 'Dashboard';
		return '';
	}

	async function sendMessage() {
		const msg = input.trim();
		if (!msg || isStreaming) return;

		input = '';
		isStreaming = true;
		streamingContent = '';

		const userMsg = {
			id: crypto.randomUUID(),
			role: 'user',
			content: msg,
			createdAt: new Date().toISOString()
		};
		messages = [...messages, userMsg];
		await tick();
		scrollToBottom();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: msg,
					conversationId,
					context: {
						pathname: currentPathname,
						params: currentParams
					}
				})
			});

			if (!response.ok) {
				throw new Error('Chat request failed');
			}

			const reader = response.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					try {
						const data = JSON.parse(line.slice(6));

						if (data.type === 'text') {
							streamingContent += data.text;
							scrollToBottom();
						} else if (data.type === 'conversation_id') {
							conversationId = data.id;
						} else if (data.type === 'done') {
							const assistantMsg = {
								id: crypto.randomUUID(),
								role: 'assistant',
								content: streamingContent,
								createdAt: new Date().toISOString()
							};
							messages = [...messages, assistantMsg];
							streamingContent = '';
							await loadRecentConversations();

							if (!isOpen) {
								hasUnread = true;
							}
						} else if (data.type === 'error') {
							console.error('Stream error:', data.error);
						}
					} catch {
						// Ignore parse errors for partial chunks
					}
				}
			}
		} catch (err) {
			console.error('Send failed:', err);
			messages = [
				...messages,
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: 'Sorry, something went wrong. Please try again.',
					createdAt: new Date().toISOString()
				}
			];
		} finally {
			isStreaming = false;
			await tick();
			scrollToBottom();
		}
	}

	onMount(async () => {
		await loadRecentConversations();
	});

	async function loadRecentConversations() {
		try {
			const res = await fetch('/api/chat/conversations');
			if (res.ok) {
				const data = await res.json();
				recentConversations = data.conversations ?? [];
			}
		} catch (err) {
			console.error('Failed to load conversations:', err);
		}
	}

	async function selectConversation(conv: RecentConversation) {
		try {
			const res = await fetch(`/api/chat/conversations/${conv.id}`);
			if (res.ok) {
				const data = await res.json();
				conversationId = conv.id;
				messages = (data.conversation?.messages ?? []).map((m: any) => ({
					id: m.id,
					role: m.role,
					content: m.content,
					createdAt: m.createdAt,
				}));
				showConversationPicker = false;
				await tick();
				scrollToBottom();
			}
		} catch (err) {
			console.error('Failed to load conversation:', err);
		}
	}

	function startNewConversation() {
		conversationId = null;
		messages = [];
		streamingContent = '';
		showConversationPicker = false;
		inputEl?.focus();
	}

	function autoResumeForPage() {
		// Find a recent conversation started on this same page
		const match = recentConversations.find(
			(c) => c.sourceContext?.pathname === currentPathname
		);
		if (match) {
			selectConversation(match);
		} else {
			startNewConversation();
		}
	}

	function handleOpen() {
		isOpen = true;
		hasUnread = false;
		// If no active conversation, try to auto-resume one from this page
		if (!conversationId && messages.length === 0) {
			autoResumeForPage();
		}
		tick().then(() => inputEl?.focus());
	}

	function handleClose() {
		isOpen = false;
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString();
	}
</script>

<!-- FAB button -->
{#if !isOpen}
	<button
		class="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
		onclick={handleOpen}
	>
		<MessageSquare class="size-6" />
		{#if hasUnread}
			<span class="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-amber-500 ring-2 ring-background"></span>
		{/if}
	</button>
{/if}

<!-- Bottom drawer -->
{#if isOpen}
	<div
		class="fixed z-50 flex flex-col bg-background border-t shadow-[0_-4px_24px_rgba(0,0,0,0.12)] {(isMaximized || isMobile) ? '' : 'inset-x-0 bottom-0 rounded-t-xl'}"
		style={isMaximized || isMobile ? 'inset: 0; width: 100vw; height: 100vh;' : `height: ${drawerHeight}px;`}
	>
		<!-- Drag handle (hidden on mobile) -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		{#if !isMobile}
		<div
			class="flex items-center justify-center py-1.5 cursor-ns-resize select-none shrink-0"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
		>
			<div class="w-10 h-1 rounded-full bg-muted-foreground/30"></div>
		</div>
		{/if}

		<!-- Header -->
		<div class="flex items-center justify-between px-4 pb-2 shrink-0">
			<div class="flex items-center gap-2 min-w-0">
				<Sparkles class="size-4 text-amber-600 shrink-0" />
				<div class="relative">
					<button
						class="flex items-center gap-1 text-sm font-semibold hover:text-foreground/80 transition-colors"
						onclick={() => showConversationPicker = !showConversationPicker}
					>
						<span class="truncate max-w-[140px]">
							{#if conversationId}
								{recentConversations.find(c => c.id === conversationId)?.title?.slice(0, 30) || 'Chat'}
							{:else}
								New Chat
							{/if}
						</span>
						<ChevronDown class="size-3 shrink-0" />
					</button>
					{#if showConversationPicker}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="fixed inset-0 z-30" onclick={() => showConversationPicker = false} onkeydown={() => {}}></div>
						<div class="absolute left-0 top-full mt-1 z-[100] w-64 rounded-lg border bg-popover shadow-lg overflow-hidden">
							<div class="flex items-center justify-between px-3 py-2 border-b">
								<span class="text-xs font-semibold text-muted-foreground">Conversations</span>
								<button class="flex items-center gap-1 text-xs text-primary hover:underline" onclick={startNewConversation}>
									<Plus class="size-3" />
									New
								</button>
							</div>
							<div class="max-h-48 overflow-y-auto">
								{#if recentConversations.length === 0}
									<div class="p-3 text-center text-xs text-muted-foreground">No conversations yet</div>
								{:else}
									{#each recentConversations.slice(0, 10) as conv}
										<button
											class="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors {conv.id === conversationId ? 'bg-muted font-medium' : ''}"
											onclick={() => selectConversation(conv)}
										>
											<p class="truncate">{conv.title || 'New conversation'}</p>
											<div class="flex items-center gap-1.5 mt-0.5">
												<span class="text-[10px] text-muted-foreground">{formatDate(conv.updatedAt)}</span>
												{#if conv.sourceContext?.label}
													<span class="text-[10px] text-muted-foreground/60">· {conv.sourceContext.label}</span>
												{/if}
											</div>
										</button>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
				{#if getContextLabel()}
					<span class="text-xs text-muted-foreground truncate">
						· Viewing {getContextLabel()}
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-1 shrink-0">
				<button
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
					onclick={toggleMaximize}
					title={isMaximized ? 'Restore size' : 'Expand'}
				>
					{#if isMaximized}
						<Minimize2 class="size-4" />
					{:else}
						<Maximize2 class="size-4" />
					{/if}
				</button>
				<button
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
					onclick={handleClose}
					title="Close"
				>
					<X class="size-4" />
				</button>
			</div>
		</div>

		<!-- Messages -->
		<div bind:this={chatContainer} class="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
			{#if messages.length === 0 && !isStreaming}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div
						class="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500"
					>
						<Sparkles class="size-5" />
					</div>
					<p class="text-sm font-medium text-foreground">HomeTrack AI</p>
					<p class="mt-1 text-xs text-muted-foreground">Ask anything about your portfolio</p>
					{#if getContextLabel()}
						<p class="mt-2 text-xs text-muted-foreground/70">
							This agent has context about this page
						</p>
					{/if}
				</div>
			{/if}

			{#each messages as msg (msg.id)}
				{#if msg.role === 'user'}
					<div class="flex justify-end">
						<div
							class="max-w-[80%] rounded-2xl rounded-tr-md bg-primary/10 px-3 py-2 text-sm whitespace-pre-wrap"
						>
							{msg.content}
						</div>
					</div>
				{:else}
					<div class="flex items-start gap-2">
						<div
							class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600"
						>
							<Sparkles class="size-3" />
						</div>
						<div class="min-w-0 flex-1 text-sm prose-stone">
							<Markdown content={msg.content} />
						</div>
					</div>
				{/if}
			{/each}

			{#if isStreaming && streamingContent}
				<div class="flex items-start gap-2">
					<div
						class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600"
					>
						<Sparkles class="size-3" />
					</div>
					<div class="min-w-0 flex-1 text-sm prose-stone">
						<Markdown content={streamingContent} />
					</div>
				</div>
			{:else if isStreaming}
				<div class="flex items-start gap-2">
					<div
						class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600"
					>
						<Sparkles class="size-3" />
					</div>
					<div class="flex items-center gap-1.5 py-1 text-muted-foreground">
						<Loader2 class="size-3.5 animate-spin" />
						<span class="text-xs">Thinking...</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input -->
		<div class="border-t px-4 py-3 shrink-0">
			<div class="flex gap-2">
				<input
					bind:this={inputEl}
					bind:value={input}
					placeholder="Ask anything..."
					class="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					onkeydown={(e) => {
						if (e.key === 'Enter') sendMessage();
					}}
					disabled={isStreaming}
				/>
				<Button
					size="icon"
					class="size-9 shrink-0"
					onclick={sendMessage}
					disabled={!input.trim() || isStreaming}
				>
					{#if isStreaming}
						<Loader2 class="size-4 animate-spin" />
					{:else}
						<Send class="size-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}
