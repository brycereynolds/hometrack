<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Send, Paperclip, Image, Check, CheckCheck } from 'lucide-svelte';

	let newMessage = $state('');

	const messages = [
		{
			id: 'm-1',
			from: 'Lauren Chen',
			initials: 'LC',
			role: 'Your Listing Agent',
			isAgent: true,
			time: '9:15 AM',
			content:
				"Hi David! Quick update — we've had 2 showings this week and the feedback has been very positive. Brian Foster's clients especially loved the kitchen remodel. I'm putting together a showing summary for you.",
			read: true
		},
		{
			id: 'm-2',
			from: 'David Nguyen',
			initials: 'DN',
			role: 'You',
			isAgent: false,
			time: '9:32 AM',
			content:
				"That's great to hear! Can we discuss the open house schedule for this weekend? We had some feedback from the neighbors about parking — is there a way to manage that?",
			read: true
		},
		{
			id: 'm-3',
			from: 'Lauren Chen',
			initials: 'LC',
			role: 'Your Listing Agent',
			isAgent: true,
			time: '10:05 AM',
			content:
				"Absolutely. I'll coordinate with Jordan on parking signage and we can set up directional signs on the cross streets. Open house is confirmed for Saturday 1-4 PM. I'll also have Sofia do a quick staging touch-up Friday afternoon.",
			read: true
		},
		{
			id: 'm-4',
			from: 'David Nguyen',
			initials: 'DN',
			role: 'You',
			isAgent: false,
			time: '10:12 AM',
			content:
				"Perfect. Also, Emily noticed the staging photos in the primary bedroom look slightly different from how it's currently set up. Can we get those refreshed?",
			read: true
		},
		{
			id: 'm-5',
			from: 'Lauren Chen',
			initials: 'LC',
			role: 'Your Listing Agent',
			isAgent: true,
			time: '10:30 AM',
			content:
				"Good catch! Sofia adjusted the bedding last week. I'll have Kevin reshoot that room this Thursday when he comes for the twilight exterior photos. No extra charge since he'll already be there.",
			read: true
		},
		{
			id: 'm-6',
			from: 'Priya Patel',
			initials: 'PP',
			role: 'Transaction Coordinator',
			isAgent: true,
			time: '11:45 AM',
			content:
				"Hi David, just a heads up — I've uploaded the Chen-Williams purchase agreement to your documents section. It needs your review and signature when you have a moment. The offer expires Apr 13.",
			read: false
		}
	];
</script>

<div class="flex h-[calc(100svh-12rem)] flex-col">
	<div class="mb-4">
		<div class="flex items-center gap-3">
			<h1 class="font-serif text-2xl font-bold tracking-tight">Messages</h1>
			<Badge variant="outline" class="text-xs">1 unread</Badge>
		</div>
		<p class="text-muted-foreground">Chat with your Chen Realty Group team.</p>
	</div>

	<Card class="flex flex-1 flex-col overflow-hidden">
		<!-- Thread header -->
		<div class="flex items-center gap-3 border-b p-4">
			<div class="flex -space-x-2">
				<Avatar class="size-8 border-2 border-background">
					<AvatarFallback class="bg-primary/10 text-primary text-xs">LC</AvatarFallback>
				</Avatar>
				<Avatar class="size-8 border-2 border-background">
					<AvatarFallback class="bg-violet-500/10 text-violet-600 text-xs">PP</AvatarFallback>
				</Avatar>
			</div>
			<div>
				<p class="text-sm font-medium">123 Main Street — Your Team</p>
				<p class="text-xs text-muted-foreground">Lauren Chen, Priya Patel, Jordan Nakamura</p>
			</div>
		</div>

		<!-- Messages -->
		<div class="flex-1 overflow-y-auto p-4">
			<div class="mx-auto max-w-2xl space-y-4">
				{#each messages as msg}
					<div class="flex gap-3 {msg.isAgent ? '' : 'flex-row-reverse'}">
						<Avatar class="size-8 shrink-0">
							<AvatarFallback
								class="text-xs {msg.isAgent
									? 'bg-primary/10 text-primary'
									: 'bg-secondary text-secondary-foreground'}"
							>
								{msg.initials}
							</AvatarFallback>
						</Avatar>
						<div class="max-w-[75%]">
							<div class="flex items-baseline gap-2 {msg.isAgent ? '' : 'justify-end'}">
								<span class="text-xs font-medium">{msg.from}</span>
								{#if msg.isAgent}
									<span class="text-[10px] text-muted-foreground">{msg.role}</span>
								{/if}
							</div>
							<div
								class="mt-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed {msg.isAgent
									? 'rounded-tl-sm bg-muted'
									: 'rounded-tr-sm bg-primary text-primary-foreground'}"
							>
								{msg.content}
							</div>
							<div class="mt-1 flex items-center gap-1 {msg.isAgent ? '' : 'justify-end'}">
								<span class="text-[10px] text-muted-foreground">{msg.time}</span>
								{#if !msg.isAgent}
									{#if msg.read}
										<CheckCheck class="size-3 text-blue-500" />
									{:else}
										<Check class="size-3 text-muted-foreground" />
									{/if}
								{/if}
								{#if !msg.read && msg.isAgent}
									<Badge class="h-4 bg-primary px-1.5 text-[9px] text-primary-foreground">New</Badge>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Compose -->
		<div class="border-t p-4">
			<div class="mx-auto flex max-w-2xl items-end gap-2">
				<div class="flex gap-1">
					<Button variant="ghost" size="icon" class="size-9 shrink-0 text-muted-foreground">
						<Paperclip class="size-4" />
					</Button>
					<Button variant="ghost" size="icon" class="size-9 shrink-0 text-muted-foreground">
						<Image class="size-4" />
					</Button>
				</div>
				<div class="flex-1">
					<textarea
						bind:value={newMessage}
						placeholder="Type a message..."
						rows="1"
						class="w-full resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					></textarea>
				</div>
				<Button size="icon" class="size-9 shrink-0 rounded-full" disabled={!newMessage.trim()}>
					<Send class="size-4" />
				</Button>
			</div>
		</div>
	</Card>
</div>
