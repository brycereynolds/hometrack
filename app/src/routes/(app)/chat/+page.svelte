<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Markdown } from '$lib/components/shared/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Plus,
		Send,
		Copy,
		Check,
		ChevronDown,
		ChevronRight,
		MessageSquare,
		Sparkles,
		Menu,
		X,
		Brain,
		Loader2
	} from 'lucide-svelte';

	// Types
	interface ChatMessage {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		thinking?: string | null;
		toolCalls?: any;
		metadata?: any;
		createdAt: string;
	}

	interface Conversation {
		id: string;
		title: string | null;
		createdAt: string;
		updatedAt: string;
	}

	// State
	let conversations = $state<Conversation[]>([]);
	let currentConversationId = $state<string | null>(null);
	let messages = $state<ChatMessage[]>([]);
	let input = $state('');
	let isStreaming = $state(false);
	let streamingContent = $state('');
	let streamingThinking = $state('');
	let showSidebar = $state(false);
	let showThinking = $state<Record<string, boolean>>({});
	let copiedId = $state<string | null>(null);
	let messagesEndEl: HTMLDivElement | undefined = $state();
	let inputEl: HTMLTextAreaElement | undefined = $state();
	let chatContainerEl: HTMLDivElement | undefined = $state();

	// Load conversations on mount
	onMount(async () => {
		await loadConversations();
	});

	async function loadConversations() {
		try {
			const res = await fetch('/api/chat/conversations');
			if (res.ok) {
				const data = await res.json();
				conversations = data.conversations ?? [];
			}
		} catch (err) {
			console.error('Failed to load conversations:', err);
		}
	}

	async function loadConversation(id: string) {
		try {
			const res = await fetch(`/api/chat/conversations/${id}`);
			if (res.ok) {
				const data = await res.json();
				currentConversationId = id;
				messages = data.conversation?.messages ?? [];
				showSidebar = false;
				await tick();
				scrollToBottom();
			}
		} catch (err) {
			console.error('Failed to load conversation:', err);
		}
	}

	function newConversation() {
		currentConversationId = null;
		messages = [];
		streamingContent = '';
		streamingThinking = '';
		showSidebar = false;
		inputEl?.focus();
	}

	async function sendMessage() {
		const msg = input.trim();
		if (!msg || isStreaming) return;

		input = '';
		isStreaming = true;
		streamingContent = '';
		streamingThinking = '';

		// Optimistically add user message
		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: msg,
			createdAt: new Date().toISOString(),
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
					conversationId: currentConversationId,
				}),
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
						} else if (data.type === 'thinking') {
							streamingThinking += data.text;
						} else if (data.type === 'conversation_id') {
							currentConversationId = data.id;
						} else if (data.type === 'done') {
							// Finalize: add assistant message to messages array
							const assistantMsg: ChatMessage = {
								id: crypto.randomUUID(),
								role: 'assistant',
								content: streamingContent,
								thinking: streamingThinking || null,
								createdAt: new Date().toISOString(),
							};
							messages = [...messages, assistantMsg];
							streamingContent = '';
							streamingThinking = '';
							// Refresh conversation list
							await loadConversations();
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
			// Add error message
			messages = [...messages, {
				id: crypto.randomUUID(),
				role: 'assistant',
				content: 'Sorry, something went wrong. Please try again.',
				createdAt: new Date().toISOString(),
			}];
		} finally {
			isStreaming = false;
			await tick();
			scrollToBottom();
		}
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (chatContainerEl) {
				chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
			}
		});
	}

	async function copyMessage(content: string, id: string) {
		try {
			await navigator.clipboard.writeText(content);
			copiedId = id;
			setTimeout(() => { copiedId = null; }, 2000);
		} catch {
			// Fallback
		}
	}

	function toggleThinking(id: string) {
		showThinking = { ...showThinking, [id]: !showThinking[id] };
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
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

	// Auto-resize textarea
	function autoResize(el: HTMLTextAreaElement) {
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 200) + 'px';
	}
</script>

<svelte:head>
	<title>AI Agent - HomeTrack</title>
</svelte:head>

<div class="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6 lg:-m-8">
	<!-- Conversation sidebar -->
	<!-- Mobile overlay -->
	{#if showSidebar}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-30 bg-black/40 md:hidden"
			onclick={() => showSidebar = false}
			onkeydown={() => {}}
		></div>
	{/if}

	<aside
		class="
			{showSidebar ? 'translate-x-0' : '-translate-x-full'}
			md:translate-x-0
			fixed md:relative z-40 md:z-auto
			w-72 h-full
			border-r bg-muted/30
			flex flex-col
			transition-transform duration-200 ease-in-out
		"
	>
		<div class="flex items-center justify-between p-3 border-b">
			<h2 class="text-sm font-semibold text-muted-foreground">Conversations</h2>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="icon" class="h-7 w-7" onclick={newConversation} title="New conversation">
					<Plus class="size-4" />
				</Button>
				<Button variant="ghost" size="icon" class="h-7 w-7 md:hidden" onclick={() => showSidebar = false}>
					<X class="size-4" />
				</Button>
			</div>
		</div>
		<div class="flex-1 overflow-y-auto">
			{#if conversations.length === 0}
				<div class="p-4 text-center text-sm text-muted-foreground">
					No conversations yet
				</div>
			{:else}
				<div class="p-1.5 space-y-0.5">
					{#each conversations as conv}
						<button
							class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-muted {conv.id === currentConversationId ? 'bg-muted font-medium' : ''}"
							onclick={() => loadConversation(conv.id)}
						>
							<p class="truncate text-foreground">{conv.title || 'New conversation'}</p>
							<p class="text-xs text-muted-foreground mt-0.5">{formatDate(conv.updatedAt)}</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main chat area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Chat header -->
		<div class="flex items-center gap-2 px-4 py-2.5 border-b bg-background/80 backdrop-blur">
			<Button variant="ghost" size="icon" class="h-8 w-8 md:hidden" onclick={() => showSidebar = true}>
				<Menu class="size-4" />
			</Button>
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<div class="flex items-center justify-center size-7 rounded-lg bg-amber-100 text-amber-600">
					<Sparkles class="size-3.5" />
				</div>
				<div class="min-w-0">
					<h1 class="text-sm font-semibold truncate">HomeTrack AI</h1>
					<p class="text-xs text-muted-foreground">Ask anything about your portfolio</p>
				</div>
			</div>
			<Button variant="ghost" size="sm" onclick={newConversation} class="hidden md:flex gap-1.5">
				<Plus class="size-3.5" />
				New Chat
			</Button>
		</div>

		<!-- Messages area -->
		<div class="flex-1 overflow-y-auto" bind:this={chatContainerEl}>
			{#if messages.length === 0 && !isStreaming}
				<!-- Empty state -->
				<div class="flex flex-col items-center justify-center h-full px-4 text-center">
					<div class="flex items-center justify-center size-16 rounded-2xl bg-amber-50 text-amber-500 mb-6">
						<Sparkles class="size-8" />
					</div>
					<h2 class="font-serif text-2xl font-semibold text-foreground mb-2">HomeTrack AI</h2>
					<p class="text-muted-foreground max-w-md mb-8">
						Ask me anything about your listings, contacts, tasks, and field notes. I have full context on your portfolio.
					</p>
					<div class="grid gap-2 w-full max-w-md">
						{#each [
							'How are my active listings performing?',
							'What tasks are overdue this week?',
							'Summarize recent field notes',
							'Which contacts need follow-up?'
						] as suggestion}
							<button
								class="text-left px-4 py-3 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border transition-colors"
								onclick={() => { input = suggestion; sendMessage(); }}
							>
								{suggestion}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Messages list -->
				<div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
					{#each messages as msg (msg.id)}
						<div class="group {msg.role === 'user' ? 'flex justify-end' : ''}">
							{#if msg.role === 'user'}
								<!-- User message -->
								<div class="max-w-[85%] relative">
									<div class="bg-primary/10 rounded-2xl rounded-tr-md px-4 py-3 text-sm whitespace-pre-wrap">
										{msg.content}
									</div>
									<button
										class="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
										onclick={() => copyMessage(msg.content, msg.id)}
										title="Copy message"
									>
										{#if copiedId === msg.id}
											<Check class="size-3.5 text-emerald-500" />
										{:else}
											<Copy class="size-3.5 text-muted-foreground" />
										{/if}
									</button>
								</div>
							{:else}
								<!-- Assistant message -->
								<div class="relative">
									<div class="flex items-start gap-3">
										<div class="flex-shrink-0 flex items-center justify-center size-7 rounded-lg bg-amber-100 text-amber-600 mt-0.5">
											<Sparkles class="size-3.5" />
										</div>
										<div class="flex-1 min-w-0">
											{#if msg.thinking}
												<button
													class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
													onclick={() => toggleThinking(msg.id)}
												>
													{#if showThinking[msg.id]}
														<ChevronDown class="size-3" />
													{:else}
														<ChevronRight class="size-3" />
													{/if}
													<Brain class="size-3" />
													<span>Thinking</span>
												</button>
												{#if showThinking[msg.id]}
													<div class="mb-3 pl-3 border-l-2 border-amber-200 text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
														{msg.thinking}
													</div>
												{/if}
											{/if}
											<div class="text-sm prose-stone">
												<Markdown content={msg.content} />
											</div>
										</div>
									</div>
									<button
										class="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
										onclick={() => copyMessage(msg.content, msg.id)}
										title="Copy message"
									>
										{#if copiedId === msg.id}
											<Check class="size-3.5 text-emerald-500" />
										{:else}
											<Copy class="size-3.5 text-muted-foreground" />
										{/if}
									</button>
								</div>
							{/if}
						</div>
					{/each}

					<!-- Streaming message -->
					{#if isStreaming && (streamingContent || streamingThinking)}
						<div class="group">
							<div class="flex items-start gap-3">
								<div class="flex-shrink-0 flex items-center justify-center size-7 rounded-lg bg-amber-100 text-amber-600 mt-0.5">
									<Sparkles class="size-3.5" />
								</div>
								<div class="flex-1 min-w-0">
									{#if streamingThinking}
										<button
											class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
											onclick={() => showThinking = { ...showThinking, streaming: !showThinking['streaming'] }}
										>
											{#if showThinking['streaming']}
												<ChevronDown class="size-3" />
											{:else}
												<ChevronRight class="size-3" />
											{/if}
											<Brain class="size-3" />
											<span>Thinking...</span>
										</button>
										{#if showThinking['streaming']}
											<div class="mb-3 pl-3 border-l-2 border-amber-200 text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
												{streamingThinking}
											</div>
										{/if}
									{/if}
									{#if streamingContent}
										<div class="text-sm prose-stone">
											<Markdown content={streamingContent} />
										</div>
									{:else}
										<div class="flex items-center gap-1.5 text-muted-foreground">
											<Loader2 class="size-4 animate-spin" />
											<span class="text-xs">Thinking...</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{:else if isStreaming}
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 flex items-center justify-center size-7 rounded-lg bg-amber-100 text-amber-600 mt-0.5">
								<Sparkles class="size-3.5" />
							</div>
							<div class="flex items-center gap-1.5 text-muted-foreground py-2">
								<Loader2 class="size-4 animate-spin" />
								<span class="text-xs">Thinking...</span>
							</div>
						</div>
					{/if}

					<div bind:this={messagesEndEl}></div>
				</div>
			{/if}
		</div>

		<!-- Input area -->
		<div class="border-t bg-background px-4 py-3">
			<div class="max-w-3xl mx-auto">
				<div class="flex items-end gap-2 bg-muted/40 rounded-2xl border border-border/60 px-4 py-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
					<textarea
						bind:this={inputEl}
						bind:value={input}
						onkeydown={handleKeydown}
						oninput={(e) => autoResize(e.currentTarget)}
						placeholder="Ask about your listings, tasks, contacts..."
						class="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/60 min-h-[24px] max-h-[200px] py-1"
						rows={1}
						disabled={isStreaming}
					></textarea>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 shrink-0 {input.trim() && !isStreaming ? 'text-primary hover:text-primary' : 'text-muted-foreground'}"
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
				<p class="text-[10px] text-muted-foreground text-center mt-2">
					HomeTrack AI has context on your team's listings, notes, contacts, and tasks.
				</p>
			</div>
		</div>
	</div>
</div>
