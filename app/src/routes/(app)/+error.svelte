<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowLeft, AlertTriangle, LayoutDashboard } from 'lucide-svelte';
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4">
	<div class="mx-auto max-w-md text-center">
		<div class="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-muted">
			<AlertTriangle class="size-7 text-muted-foreground" />
		</div>
		<h1 class="font-serif text-3xl font-bold tracking-tight text-foreground">
			{$page.status === 404 ? 'Not Found' : 'Something went wrong'}
		</h1>
		<p class="mt-3 text-muted-foreground">
			{#if $page.status === 404}
				This listing, contact, or page doesn't exist or may have been removed.
			{:else if $page.status === 403}
				You don't have permission to view this page.
			{:else}
				{$page.error?.message ?? 'An unexpected error occurred. Please try again.'}
			{/if}
		</p>
		<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button variant="outline" onclick={() => history.back()}>
				<ArrowLeft class="mr-1.5 size-4" />
				Go Back
			</Button>
			<Button href="/dashboard">
				<LayoutDashboard class="mr-1.5 size-4" />
				Dashboard
			</Button>
		</div>
	</div>
</div>
