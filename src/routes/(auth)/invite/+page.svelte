<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { AlertCircle } from 'lucide-svelte';
</script>

<div class="space-y-6 text-center">
	<div class="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
		<AlertCircle class="size-7 text-muted-foreground" />
	</div>
	<div>
		<h2 class="text-lg font-semibold">Invalid Invitation Link</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			This invitation link appears to be missing or expired. Please check the link in your email and try again.
		</p>
	</div>
	<div class="space-y-2">
		<Button variant="outline" class="w-full" href="/login">Go to Login</Button>
	</div>
	<p class="text-xs text-muted-foreground">
		If you continue to have issues, contact your team admin.
	</p>
</div>
