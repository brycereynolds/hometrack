<script lang="ts">
	import { Mic } from 'lucide-svelte';

	let { onclick }: { onclick: () => void } = $props();
</script>

<button
	class="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-xl active:scale-95 lg:bottom-8 lg:right-8"
	{onclick}
	title="Record voice memo"
	aria-label="Record voice memo"
>
	<Mic class="size-6" />
</button>
