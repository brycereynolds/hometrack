<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { MessageSquare, Send, Home } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let messageContent = $state('');
	let sending = $state(false);

	const listing = $derived(data.listing);
	const clientName = $derived(listing?.client?.name ?? 'Client');

	// Messages sorted oldest first for chat view
	const messages = $derived(
		[...(data.messages ?? [])].reverse()
	);

	function isPortalMessage(msg: any): boolean {
		return msg.metadata && (msg.metadata as Record<string, any>).source === 'portal';
	}

	function formatTime(d: string | Date | null): string {
		if (!d) return '';
		const date = typeof d === 'string' ? new Date(d) : d;
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}

	function getInitials(name: string): string {
		return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
	}
</script>

<div class="space-y-4">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Messages</h1>
		<p class="text-muted-foreground">
			{#if listing}
				Communication about {listing.property?.address ?? 'your property'}
			{:else}
				Communicate with your team.
			{/if}
		</p>
	</div>

	{#if listing}
		<!-- Property context bar -->
		<Card>
			<CardContent class="flex items-center gap-3 p-3">
				<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<Home class="size-5 text-primary" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{listing.property?.address ?? ''}</p>
					<p class="text-xs text-muted-foreground">{listing.property?.city ?? ''}, {listing.property?.state ?? ''}</p>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Chat area -->
	<Card class="flex flex-col" style="min-height: 400px;">
		<CardHeader class="border-b pb-3">
			<CardTitle class="flex items-center gap-2 text-sm">
				<MessageSquare class="size-4" />
				Activity & Messages
			</CardTitle>
		</CardHeader>
		<CardContent class="flex-1 overflow-y-auto p-4">
			{#if messages.length > 0}
				<div class="space-y-4">
					{#each messages as msg}
						{@const fromPortal = isPortalMessage(msg)}
						<div class="flex gap-3 {fromPortal ? 'flex-row-reverse' : ''}">
							<Avatar class="size-8 shrink-0">
								<AvatarFallback class="text-[10px] font-medium {fromPortal ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}">
									{getInitials(msg.authorName ?? 'SY')}
								</AvatarFallback>
							</Avatar>
							<div class="max-w-[75%] {fromPortal ? 'items-end' : 'items-start'}">
								<div class="flex items-center gap-2 {fromPortal ? 'flex-row-reverse' : ''}">
									<span class="text-xs font-medium">{msg.authorName ?? 'System'}</span>
									<span class="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
									{#if fromPortal}
										<span class="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">You</span>
									{/if}
								</div>
								<div
									class="mt-1 rounded-lg px-3 py-2 text-sm {fromPortal
										? 'bg-primary text-primary-foreground'
										: 'bg-muted'}"
								>
									{msg.content ?? ''}
								</div>
								{#if msg.type === 'note' && !fromPortal}
									<span class="mt-0.5 text-[10px] text-muted-foreground">Note from your agent</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-12">
					<MessageSquare class="size-10 text-muted-foreground/30" />
					<p class="mt-3 text-sm text-muted-foreground">No messages yet</p>
					<p class="mt-1 text-xs text-muted-foreground">Send a message to get started</p>
				</div>
			{/if}
		</CardContent>

		<!-- Message input -->
		<div class="border-t p-4">
			<form
				method="POST"
				action="?/sendMessage"
				use:enhance={() => {
					sending = true;
					return async ({ result, update }) => {
						sending = false;
						if (result.type === 'success') {
							messageContent = '';
							toast.success('Message sent');
							await update();
						} else if (result.type === 'failure') {
							toast.error(String(result.data?.error ?? 'Failed to send message'));
						}
					};
				}}
				class="flex gap-2"
			>
				<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
				<input type="hidden" name="listingId" value={listing?.id ?? ''} />
				<input type="hidden" name="clientName" value={clientName} />
				<input
					type="text"
					name="content"
					bind:value={messageContent}
					placeholder="Type a message..."
					class="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
				/>
				<Button type="submit" size="sm" class="h-10 px-4" disabled={!messageContent.trim() || sending}>
					<Send class="mr-1.5 size-4" />
					{sending ? 'Sending...' : 'Send'}
				</Button>
			</form>
		</div>
	</Card>
</div>
