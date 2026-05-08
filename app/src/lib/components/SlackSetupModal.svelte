<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { CheckCircle, Loader2, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-svelte';

	interface Props {
		open: boolean;
		integrationId: string;
	}

	let { open = $bindable(false), integrationId }: Props = $props();

	let step = $state(1);
	let webhookUrl = $state('');
	let testing = $state(false);
	let testSuccess = $state(false);
	let testError = $state('');
	let saving = $state(false);

	$effect(() => {
		if (open) {
			step = 1;
			webhookUrl = '';
			testing = false;
			testSuccess = false;
			testError = '';
			saving = false;
		}
	});

	const isValidUrl = $derived(
		webhookUrl.trim().startsWith('https://hooks.slack.com/')
	);

	async function sendTestMessage() {
		testing = true;
		testSuccess = false;
		testError = '';

		try {
			const res = await fetch('/api/integrations/slack/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
			});

			if (res.ok) {
				testSuccess = true;
			} else {
				const data = await res.json();
				testError = data.error || 'Failed to send test message';
			}
		} catch {
			testError = 'Network error — check your connection';
		} finally {
			testing = false;
		}
	}

	async function saveAndActivate() {
		saving = true;

		try {
			const form = new FormData();
			form.set('integrationId', integrationId);
			form.set('webhookUrl', webhookUrl.trim());

			const res = await fetch('?/connectSlack', {
				method: 'POST',
				body: form,
			});

			if (res.ok) {
				toast.success('Slack connected successfully');
				await invalidateAll();
				open = false;
			} else {
				toast.error('Failed to save Slack configuration');
			}
		} catch {
			toast.error('Failed to save Slack configuration');
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Connect Slack</Dialog.Title>
			<Dialog.Description>
				Get HomeTrack notifications in your Slack channel
			</Dialog.Description>
		</Dialog.Header>

		<!-- Step indicator -->
		<div class="flex items-center gap-2 mb-4">
			{#each [1, 2, 3] as s}
				<div
					class="h-1.5 flex-1 rounded-full transition-colors {s <= step
						? 'bg-primary'
						: 'bg-muted'}"
				></div>
			{/each}
		</div>

		{#if step === 1}
			<!-- Step 1: Choose Method -->
			<div class="space-y-4">
				<div class="rounded-lg border p-4 ring-2 ring-primary">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-sm">Incoming Webhook</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Paste a Slack webhook URL to receive notifications
							</p>
						</div>
						<div class="size-4 rounded-full border-2 border-primary flex items-center justify-center">
							<div class="size-2 rounded-full bg-primary"></div>
						</div>
					</div>
				</div>

				<div class="rounded-lg border p-4 opacity-50">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-sm">Add to Slack (OAuth)</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								One-click install with richer features
							</p>
						</div>
						<Badge variant="secondary" class="text-xs">Coming Soon</Badge>
					</div>
				</div>
			</div>

			<Dialog.Footer class="mt-6">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button onclick={() => (step = 2)} class="gap-1">
					Next <ArrowRight class="size-4" />
				</Button>
			</Dialog.Footer>

		{:else if step === 2}
			<!-- Step 2: Webhook Setup Instructions -->
			<div class="space-y-4">
				<ol class="space-y-3 text-sm">
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">1.</span>
						<span>Open your Slack workspace</span>
					</li>
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">2.</span>
						<span>Go to <strong>Settings & Administration</strong> &rarr; <strong>Manage Apps</strong></span>
					</li>
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">3.</span>
						<span>Search for <strong>Incoming Webhooks</strong> and add it</span>
					</li>
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">4.</span>
						<span>Click <strong>Add New Webhook to Workspace</strong></span>
					</li>
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">5.</span>
						<span>Choose the channel you want HomeTrack notifications in</span>
					</li>
					<li class="flex gap-2">
						<span class="font-medium text-muted-foreground shrink-0">6.</span>
						<span>Copy the Webhook URL (starts with <code class="text-xs bg-muted px-1 py-0.5 rounded">https://hooks.slack.com/...</code>)</span>
					</li>
				</ol>

				<div class="space-y-1.5">
					<label for="webhook-url" class="text-sm font-medium">Webhook URL</label>
					<input
						id="webhook-url"
						type="url"
						bind:value={webhookUrl}
						placeholder="https://hooks.slack.com/services/T.../B.../..."
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
					{#if webhookUrl && !isValidUrl}
						<p class="text-xs text-red-500">URL must start with https://hooks.slack.com/</p>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="mt-6">
				<Button variant="outline" onclick={() => (step = 1)} class="gap-1">
					<ArrowLeft class="size-4" /> Back
				</Button>
				<Button onclick={() => (step = 3)} disabled={!isValidUrl} class="gap-1">
					Next <ArrowRight class="size-4" />
				</Button>
			</Dialog.Footer>

		{:else if step === 3}
			<!-- Step 3: Test & Confirm -->
			<div class="space-y-4">
				<div class="rounded-lg border p-3 bg-muted/50">
					<p class="text-xs text-muted-foreground">Webhook URL</p>
					<p class="text-sm font-mono truncate mt-0.5">{webhookUrl}</p>
				</div>

				{#if testSuccess}
					<div class="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
						<CheckCircle class="size-5 text-green-600 shrink-0" />
						<div>
							<p class="text-sm font-medium text-green-800">Message sent!</p>
							<p class="text-xs text-green-700">Check your Slack channel to confirm</p>
						</div>
					</div>
				{:else if testError}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="text-sm text-red-800">{testError}</p>
					</div>
				{/if}

				<Button
					variant="outline"
					onclick={sendTestMessage}
					disabled={testing}
					class="w-full gap-2"
				>
					{#if testing}
						<Loader2 class="size-4 animate-spin" />
						Sending...
					{:else}
						Send Test Message
					{/if}
				</Button>
			</div>

			<Dialog.Footer class="mt-6">
				<Button variant="outline" onclick={() => (step = 2)} class="gap-1">
					<ArrowLeft class="size-4" /> Back
				</Button>
				<Button
					onclick={saveAndActivate}
					disabled={!testSuccess || saving}
					class="gap-1"
				>
					{#if saving}
						<Loader2 class="size-4 animate-spin" />
						Saving...
					{:else}
						Save & Activate
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
