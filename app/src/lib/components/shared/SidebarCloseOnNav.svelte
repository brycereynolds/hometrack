<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

	let { onReady }: { onReady?: (closeFn: () => void) => void } = $props();

	const sidebar = useSidebar();

	function closeMobileSidebar() {
		if (sidebar.isMobile && sidebar.openMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	// Close sidebar on any navigation (link clicks)
	afterNavigate(() => {
		closeMobileSidebar();
	});

	// Expose the close function to the parent via callback
	$effect(() => {
		onReady?.(closeMobileSidebar);
	});
</script>
