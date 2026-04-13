<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { MessageSquare } from 'lucide-svelte';
</script>

<div class="space-y-4">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Messages</h1>
		<p class="text-muted-foreground">Communicate with your team.</p>
	</div>

	<Card>
		<CardContent class="flex flex-col items-center justify-center py-16">
			<MessageSquare class="size-12 text-muted-foreground/30" />
			<h3 class="mt-4 text-lg font-semibold">Messages coming soon</h3>
			<p class="mt-1 max-w-sm text-center text-sm text-muted-foreground">
				Secure messaging with your team is currently in development. You'll be notified when it's available.
			</p>
		</CardContent>
	</Card>
</div>
