<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: any } = $props();

	let loading = $state(false);

	const hasPreviewAccess = browser && localStorage.getItem('hometrack_preview') === 'true';
	const isComingSoon = $derived(data?.launchMode === 'coming_soon' && !hasPreviewAccess);
</script>

{#if isComingSoon}
<div class="space-y-6 text-center">
	<h2 class="text-xl font-semibold">Signups are not yet available</h2>
	<p class="text-sm text-muted-foreground">
		HomeTrack is launching soon. Join the waitlist to be the first to know.
	</p>
	<a
		href="/"
		class="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
	>
		Join the Waitlist
	</a>
</div>
{:else}
<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-xl font-semibold">Create your account</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Get started with HomeTrack today.
		</p>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-error/30 bg-error-subtle p-3 text-sm text-error">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
		class="space-y-4"
	>
		<div class="space-y-2">
			<label for="email" class="text-sm font-medium">Email address</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				placeholder="you@example.com"
				value={form?.email ?? ''}
				class="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</div>

		<div class="space-y-2">
			<label for="password" class="text-sm font-medium">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				required
				placeholder="Create a password"
				minlength="8"
				class="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</div>

		<div class="space-y-2">
			<label for="password_confirm" class="text-sm font-medium">Confirm password</label>
			<input
				id="password_confirm"
				name="password_confirm"
				type="password"
				autocomplete="new-password"
				required
				placeholder="Confirm your password"
				minlength="8"
				class="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
		>
			{#if loading}
				<svg class="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Creating account...
			{:else}
				Create account
			{/if}
		</button>
	</form>

	<div class="text-center text-sm text-muted-foreground">
		Already have an account?
		<a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
	</div>
</div>
{/if}
