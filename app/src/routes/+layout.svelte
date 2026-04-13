<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
	<title>HomeTrack</title>
</svelte:head>

{#if $navigating}
	<div class="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/20">
		<div class="h-full w-1/3 animate-slide-x rounded-full bg-primary"></div>
	</div>
{/if}

{@render children()}

<style>
	@keyframes slide-x {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(400%); }
	}
	:global(.animate-slide-x) {
		animation: slide-x 1.2s ease-in-out infinite;
	}
</style>
