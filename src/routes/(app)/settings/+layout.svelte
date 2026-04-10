<script lang="ts">
	import { page } from '$app/stores';
	import {
		Users,
		Puzzle,
		Workflow,
		Bell,
		CreditCard,
		Palette,
		Database,
		Settings
	} from 'lucide-svelte';

	let { children } = $props();

	const settingsNav = [
		{ href: '/settings', label: 'Team', icon: Users, exact: true },
		{ href: '/settings/integrations', label: 'Integrations', icon: Puzzle },
		{ href: '/settings/workflows', label: 'Workflows', icon: Workflow },
		{ href: '/settings/notifications', label: 'Notifications', icon: Bell },
		{ href: '/settings/billing', label: 'Billing', icon: CreditCard },
		{ href: '/settings/branding', label: 'Branding', icon: Palette },
		{ href: '/settings/data', label: 'Data', icon: Database }
	];
</script>

<div class="space-y-6">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Settings</h1>
		<p class="text-muted-foreground">Manage your team, integrations, and preferences</p>
	</div>

	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- Settings sidebar nav -->
		<nav class="flex lg:w-56 lg:flex-shrink-0 lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r lg:pr-6">
			{#each settingsNav as item}
				{@const isActive = item.exact
					? $page.url.pathname === item.href
					: $page.url.pathname.startsWith(item.href) && item.href !== '/settings'}
				{@const isExactActive = $page.url.pathname === item.href && item.exact}
				<a
					href={item.href}
					class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap
						{isActive || isExactActive
							? 'bg-muted text-foreground'
							: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
				>
					<item.icon class="size-4 flex-shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Settings content -->
		<div class="flex-1 min-w-0">
			{@render children()}
		</div>
	</div>
</div>
