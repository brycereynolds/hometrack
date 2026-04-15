<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.valid) {
			localStorage.setItem('hometrack_preview', 'true');
			goto('/', { replaceState: true });
		}
	});
</script>

{#if !data.valid}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<h1 class="font-serif text-2xl text-foreground">Access Denied</h1>
			<p class="mt-2 text-sm text-muted-foreground">{data.message}</p>
		</div>
	</div>
{/if}
