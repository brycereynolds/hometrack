<script lang="ts">
	let { children } = $props();
</script>

<div class="relative flex min-h-svh items-center justify-center bg-background p-4">
	<!-- Decorative background blobs -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -left-1/4 -top-1/4 size-[600px] rounded-full bg-primary-subtle/40 blur-3xl"></div>
		<div class="absolute -bottom-1/4 -right-1/4 size-[500px] rounded-full bg-secondary-subtle/40 blur-3xl"></div>
	</div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Logo & branding -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary shadow-sm">
				<span class="text-lg font-bold text-primary-foreground">H</span>
			</div>
			<h1 class="font-serif text-2xl font-bold text-foreground">HomeTrack</h1>
			<p class="mt-1 text-sm text-muted-foreground">Real estate back-office, simplified.</p>
		</div>

		<!-- Auth content card -->
		<div class="rounded-xl border border-border bg-card p-8 shadow-md">
			{@render children()}
		</div>

		<p class="mt-6 text-center text-xs text-muted-foreground">
			&copy; 2026 HomeTrack. All rights reserved.
		</p>
	</div>
</div>
