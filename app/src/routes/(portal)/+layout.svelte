<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Home, FileText, MessageSquare, CheckCircle, Menu, X } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	const portalNav = [
		{ href: '', label: 'Dashboard', icon: Home },
		{ href: '/approvals', label: 'Approvals', icon: CheckCircle, badge: '3' },
		{ href: '/messages', label: 'Messages', icon: MessageSquare, badge: '1' },
		{ href: '/documents', label: 'Documents', icon: FileText }
	];
</script>

<div class="min-h-svh bg-background">
	<!-- Branded portal header -->
	<header class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
			<div class="flex items-center gap-3">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
					C
				</div>
				<div>
					<span class="text-sm font-semibold">Chen Realty Group</span>
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
</div>
