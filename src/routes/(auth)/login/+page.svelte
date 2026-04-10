<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Mail, ArrowLeft, Sparkles, Shield } from 'lucide-svelte';

	let email = $state('');
	let sent = $state(false);

	function handleSend() {
		if (email.trim()) {
			sent = true;
		}
	}
</script>

{#if !sent}
	<!-- Login form -->
	<div class="space-y-6">
		<div class="text-center">
			<h2 class="text-xl font-semibold">Welcome back</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Sign in with a magic link — no password needed.
			</p>
		</div>

		<div class="space-y-4">
			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Email address</label>
				<Input
					id="email"
					type="email"
					placeholder="you@example.com"
					bind:value={email}
					onkeydown={(e) => { if (e.key === 'Enter') handleSend(); }}
				/>
			</div>

			<Button class="w-full gap-2" onclick={handleSend} disabled={!email.trim()}>
				<Sparkles class="size-4" />
				Send Magic Link
			</Button>
		</div>

		<div class="relative">
			<Separator />
			<span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
				secure & passwordless
			</span>
		</div>

		<div class="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
			<Shield class="size-5 shrink-0 text-primary" />
			<p class="text-xs text-muted-foreground">
				We'll send a secure link to your email. Click it to sign in instantly — no password to remember.
			</p>
		</div>

		<div class="flex items-center justify-between text-xs">
			<a href="#" class="text-primary hover:underline">Create an account</a>
			<a href="#" class="text-muted-foreground hover:underline">Need help?</a>
		</div>
	</div>
{:else}
	<!-- Confirmation state -->
	<div class="space-y-6 text-center">
		<div class="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
			<Mail class="size-8 text-primary" />
		</div>

		<div>
			<h2 class="text-xl font-semibold">Check your inbox</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				We sent a magic link to
			</p>
			<p class="mt-1 text-sm font-medium">{email}</p>
		</div>

		<div class="rounded-lg bg-muted/50 p-4">
			<p class="text-xs text-muted-foreground">
				Click the link in the email to sign in. The link will expire in 15 minutes. Check your spam folder if you don't see it.
			</p>
		</div>

		<div class="space-y-3">
			<Button variant="outline" class="w-full gap-2" onclick={handleSend}>
				<Mail class="size-4" />
				Resend magic link
			</Button>

			<button
				class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
				onclick={() => { sent = false; }}
			>
				<ArrowLeft class="size-3" />
				Use a different email
			</button>
		</div>
	</div>
{/if}
