<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Markdown } from '$lib/components/shared/index.js';
	import { MessageSquare, X, Maximize2, Send, Loader2, Sparkles } from 'lucide-svelte';
	import { tick } from 'svelte';

	let isOpen = $state(false);
	let messages = $state<{ id: string; role: string; content: string; createdAt: string }[]>([]);
	let input = $state('');
	let isStreaming = $state(false);
	let streamingContent = $state('');
	let conversationId = $state<string | null>(null);
	let chatContainer: HTMLDivElement | undefined = $state();
	let hasUnread = $state(false);

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		});
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
					conversationId
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

	function handleOpen() {
		isOpen = true;
		hasUnread = false;
	}
</script>

<!-- FAB -->
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

<!-- Chat panel -->
{#if isOpen}
	<div
		class="fixed bottom-6 right-6 z-50 flex h-[32rem] w-96 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
			<div class="flex items-center gap-2">
				<Sparkles class="size-4 text-amber-600" />
				<span class="text-sm font-semibold">Chat</span>
			</div>
			<div class="flex items-center gap-1">
				<a
					href="/chat"
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
					title="Open full chat"
				>
					<Maximize2 class="size-4" />
				</a>
				<button
					class="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
					onclick={() => (isOpen = false)}
					title="Close"
				>
					<X class="size-4" />
				</button>
			</div>
		</div>

		<!-- Messages -->
		<div bind:this={chatContainer} class="flex-1 space-y-3 overflow-y-auto p-3">
			{#if messages.length === 0 && !isStreaming}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div
						class="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500"
					>
						<Sparkles class="size-5" />
					</div>
					<p class="text-sm font-medium text-foreground">HomeTrack AI</p>
					<p class="mt-1 text-xs text-muted-foreground">Ask anything about your portfolio</p>
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
		<div class="border-t p-3">
			<div class="flex gap-2">
				<input
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
