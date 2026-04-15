<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Home, ArrowLeft, AlertTriangle } from 'lucide-svelte';
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="mx-auto max-w-md text-center">
		<div class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
			<AlertTriangle class="size-8 text-muted-foreground" />
		</div>
		<h1 class="font-serif text-4xl font-bold tracking-tight text-foreground">
			{$page.status}
		</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			{#if $page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else if $page.status === 500}
				Something went wrong on our end. Please try again.
			{:else}
				{$page.error?.message ?? 'An unexpected error occurred.'}
			{/if}
		</p>
		<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button variant="outline" onclick={() => history.back()}>
				<ArrowLeft class="mr-1.5 size-4" />
				Go Back
			</Button>
			<Button href="/">
				<Home class="mr-1.5 size-4" />
				Home
			</Button>
		</div>
	</div>
</div>
