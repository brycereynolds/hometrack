<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Home, FileText, MessageSquare, CheckCircle, Menu, X, Mail, Lock } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	const teamName = $derived($page.data?.team?.name ?? '');
	const portalAuthenticated = $derived($page.data?.portalAuthenticated ?? false);
	const sections = $derived($page.data?.portalSettings?.sections ?? {});
	const sectionEnabled = (key: string) => sections[key] !== false;

	// Auth gate state
	let authEmail = $state('');
	let authError = $state('');
	let authSubmitting = $state(false);

	const allPortalNav = [
		{ href: '', label: 'Dashboard', icon: Home },
		{ href: '/approvals', label: 'Approvals', icon: CheckCircle, badge: '3' },
		{ href: '/messages', label: 'Messages', icon: MessageSquare, badge: '1', section: 'messages' },
		{ href: '/documents', label: 'Documents', icon: FileText, section: 'documents' }
	];

	const portalNav = $derived(allPortalNav.filter(item => !item.section || sectionEnabled(item.section)));
</script>

<div class="min-h-svh bg-background">
	{#if !portalAuthenticated}
		<!-- Portal Access Gate -->
		<div class="flex min-h-svh items-center justify-center p-4">
			<Card class="w-full max-w-md">
				<CardHeader class="text-center">
					<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
						<Lock class="size-6" />
					</div>
					<CardTitle class="font-serif text-xl">{teamName} Client Portal</CardTitle>
					<CardDescription>Enter your email address to access your portal</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						method="POST"
						action="/{$page.params.team}?/authenticate"
						use:enhance={() => {
							authSubmitting = true;
							authError = '';
							return async ({ result, update }) => {
								authSubmitting = false;
								if (result.type === 'success') {
									await update();
								} else if (result.type === 'failure') {
									authError = (result.data as any)?.error ?? 'Access denied.';
								}
							};
						}}
					>
						<div class="space-y-4">
							<div>
								<label for="portal-email" class="text-sm font-medium">Email address</label>
								<div class="relative mt-1">
									<Mail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<input
										id="portal-email"
										name="email"
										type="email"
										required
										bind:value={authEmail}
										placeholder="you@example.com"
										class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none ring-ring focus:ring-2"
									/>
								</div>
							</div>
							{#if authError}
								<p class="text-sm text-destructive">{authError}</p>
							{/if}
							<Button type="submit" class="w-full" disabled={authSubmitting}>
								{authSubmitting ? 'Verifying...' : 'Access Portal'}
							</Button>
						</div>
					</form>
					<p class="mt-4 text-center text-xs text-muted-foreground">
						Don't have access? Contact your agent for an invitation.
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- Footer -->
		<footer class="border-t border-border/50 py-6 text-center">
			<p class="text-xs text-muted-foreground">
				Powered by <span class="font-medium">HomeTrack</span> &middot; Secure client portal
			</p>
		</footer>
	{:else}
		<!-- Branded portal header -->
		<header class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
				<div class="flex items-center gap-3">
					<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
						C
					</div>
					<div>
						<span class="text-sm font-semibold">{teamName}</span>
						<span class="ml-2 text-xs text-muted-foreground">Client Portal</span>
					</div>
				</div>

				<!-- Desktop nav -->
				<nav class="hidden items-center gap-1 md:flex">
					{#each portalNav as item}
						<a
							href="{$page.params.team ? `/${$page.params.team}` : ''}{item.href}"
							class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						>
							<item.icon class="size-4" />
							{item.label}
							{#if item.badge}
								<span class="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
									{item.badge}
								</span>
							{/if}
						</a>
					{/each}
				</nav>

				<div class="flex items-center gap-2">
					<span class="hidden text-sm text-muted-foreground sm:block">David Nguyen</span>
					<Avatar class="size-8">
						<AvatarFallback class="bg-secondary text-secondary-foreground text-xs font-medium">DN</AvatarFallback>
					</Avatar>
					<!-- Mobile menu toggle -->
					<Button variant="ghost" size="icon" class="md:hidden" onclick={() => mobileMenuOpen = !mobileMenuOpen}>
						{#if mobileMenuOpen}
							<X class="size-5" />
						{:else}
							<Menu class="size-5" />
						{/if}
					</Button>
				</div>
			</div>

			<!-- Mobile nav -->
			{#if mobileMenuOpen}
				<nav class="border-t px-4 py-2 md:hidden">
					{#each portalNav as item}
						<a
							href="{$page.params.team ? `/${$page.params.team}` : ''}{item.href}"
							class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
							onclick={() => mobileMenuOpen = false}
						>
							<item.icon class="size-4" />
							{item.label}
							{#if item.badge}
								<span class="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
									{item.badge}
								</span>
							{/if}
						</a>
					{/each}
				</nav>
			{/if}
		</header>

		<main class="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-border/50 py-6 text-center">
			<p class="text-xs text-muted-foreground">
				Powered by <span class="font-medium">HomeTrack</span> &middot; Secure client portal
			</p>
		</footer>
	{/if}
</div>
