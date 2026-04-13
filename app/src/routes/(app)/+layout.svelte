<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		Home,
		Users,
		Wrench,
		BarChart3,
		Settings,
		LogOut,
		ChevronUp,
		Search,
		Bell,
		Plus,
		Mic,
		FileText,
		Sparkles,
		MapPin,
		User,
		CheckSquare
	} from 'lucide-svelte';
	let { children, data } = $props();

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<{ listings: any[]; contacts: any[]; tasks: any[] }>({ listings: [], contacts: [], tasks: [] });
	let showSearchResults = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let selectedIndex = $state(-1);

	const allResults = $derived([
		...searchResults.listings,
		...searchResults.contacts,
		...searchResults.tasks,
	]);

	async function performSearch(query: string) {
		if (query.length < 2) {
			searchResults = { listings: [], contacts: [], tasks: [] };
			showSearchResults = false;
			return;
		}
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			if (res.ok) {
				searchResults = await res.json();
				showSearchResults = allResults.length > 0 || query.length >= 2;
			}
		} catch {
			// silently fail
		}
	}

	function onSearchInput() {
		selectedIndex = -1;
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => performSearch(searchQuery), 250);
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, allResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0 && allResults[selectedIndex]) {
			e.preventDefault();
			navigateToResult(allResults[selectedIndex]);
		} else if (e.key === 'Escape') {
			showSearchResults = false;
			searchInputEl?.blur();
		}
	}

	function navigateToResult(result: any) {
		showSearchResults = false;
		searchQuery = '';
		selectedIndex = -1;
		goto(result.href);
	}

	function getResultIcon(type: string) {
		switch (type) {
			case 'listing': return MapPin;
			case 'contact': return User;
			case 'task': return CheckSquare;
			default: return Search;
		}
	}

	function getResultLabel(type: string) {
		switch (type) {
			case 'listing': return 'Listing';
			case 'contact': return 'Contact';
			case 'task': return 'Task';
			default: return type;
		}
	}

	const listings = $derived(data.listings ?? []);
	const aiInsights = $derived(data.aiInsights ?? []);
	const currentUser = $derived(data.currentUser);
	const teamName = $derived(data.team?.name ?? '');
	const userName = $derived(currentUser?.name ?? '');
	const userInitials = $derived(
		userName
			? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
			: '?'
	);
	const userRole = $derived(currentUser?.roleLabel ?? '');

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/listings', label: 'Listings', icon: Home, badge: String(listings.length) },
		{ href: '/contacts', label: 'Contacts', icon: Users },
		{ href: '/vendors', label: 'Vendors', icon: Wrench },
		{ href: '/analytics', label: 'Analytics', icon: BarChart3 }
	];

	const quickActions = [
		{ label: 'New Listing', icon: Plus, href: '/listings/new' },
		{ label: 'Voice Memo', icon: Mic, href: '/mobile/voice-memo' },
		{ label: 'Quick Note', icon: FileText, href: '/mobile/field-notes' }
	];

	const activeAlerts = $derived(aiInsights.filter((a: any) => !a.dismissed).slice(0, 2));
	const recentInsights = $derived(aiInsights.slice(0, 5));

	function timeAgo(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<Toaster richColors position="top-right" />

<Sidebar.SidebarProvider>
	<Sidebar.Sidebar collapsible="icon">
		<Sidebar.SidebarHeader>
			<Sidebar.SidebarMenu>
				<Sidebar.SidebarMenuItem>
					<Sidebar.SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
						<div class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold">
							H
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">HomeTrack</span>
							<span class="truncate text-xs text-muted-foreground">{teamName}</span>
						</div>
					</Sidebar.SidebarMenuButton>
				</Sidebar.SidebarMenuItem>
			</Sidebar.SidebarMenu>
		</Sidebar.SidebarHeader>

		<Sidebar.SidebarContent>
			<!-- Main navigation -->
			<Sidebar.SidebarGroup>
				<Sidebar.SidebarGroupLabel>Navigation</Sidebar.SidebarGroupLabel>
				<Sidebar.SidebarGroupContent>
					<Sidebar.SidebarMenu>
						{#each navItems as item}
							<Sidebar.SidebarMenuItem>
								<Sidebar.SidebarMenuButton asChild>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon class="size-4" />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.SidebarMenuButton>
								{#if item.badge}
									<Sidebar.SidebarMenuBadge>{item.badge}</Sidebar.SidebarMenuBadge>
								{/if}
							</Sidebar.SidebarMenuItem>
						{/each}
					</Sidebar.SidebarMenu>
				</Sidebar.SidebarGroupContent>
			</Sidebar.SidebarGroup>

			<!-- Quick actions -->
			<Sidebar.SidebarGroup>
				<Sidebar.SidebarGroupLabel>Quick Actions</Sidebar.SidebarGroupLabel>
				<Sidebar.SidebarGroupContent>
					<Sidebar.SidebarMenu>
						{#each quickActions as action}
							<Sidebar.SidebarMenuItem>
								<Sidebar.SidebarMenuButton asChild>
									{#snippet child({ props })}
										<a href={action.href} {...props}>
											<action.icon class="size-4" />
											<span>{action.label}</span>
										</a>
									{/snippet}
								</Sidebar.SidebarMenuButton>
							</Sidebar.SidebarMenuItem>
						{/each}
					</Sidebar.SidebarMenu>
				</Sidebar.SidebarGroupContent>
			</Sidebar.SidebarGroup>

			<!-- Alerts — hidden when sidebar is collapsed to icon mode -->
			{#if activeAlerts.length > 0}
				<Sidebar.SidebarGroup class="group-data-[collapsible=icon]:hidden">
					<Sidebar.SidebarGroupLabel>
						<Sparkles class="mr-1 size-3" />
						Alerts
					</Sidebar.SidebarGroupLabel>
					<Sidebar.SidebarGroupContent>
						<div class="space-y-2 px-2">
							{#each activeAlerts as alert}
								<a href={alert.actionUrl || '#'} class="block rounded-md border border-border/50 bg-muted/50 p-2.5 transition-colors hover:bg-muted">
									<p class="text-xs font-medium">{alert.title}</p>
									<p class="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
								</a>
							{/each}
						</div>
					</Sidebar.SidebarGroupContent>
				</Sidebar.SidebarGroup>
			{/if}
		</Sidebar.SidebarContent>

		<Sidebar.SidebarFooter>
			<Sidebar.SidebarMenu>
				<!-- Settings link -->
				<Sidebar.SidebarMenuItem>
					<Sidebar.SidebarMenuButton asChild>
						{#snippet child({ props })}
							<a href="/settings" {...props}>
								<Settings class="size-4" />
								<span>Settings</span>
							</a>
						{/snippet}
					</Sidebar.SidebarMenuButton>
				</Sidebar.SidebarMenuItem>

				<!-- User menu -->
				<Sidebar.SidebarMenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.SidebarMenuButton {...props} size="lg">
									<Avatar class="size-8">
										<AvatarFallback class="bg-primary/10 text-primary text-xs font-medium">{userInitials}</AvatarFallback>
									</Avatar>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-semibold">{userName}</span>
										<span class="truncate text-xs text-muted-foreground">{userRole}</span>
									</div>
									<ChevronUp class="ml-auto size-4" />
								</Sidebar.SidebarMenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content side="top" class="w-[--bits-dropdown-menu-anchor-width]">
							<a href="/settings">
								<DropdownMenu.Item>
									<Settings class="mr-2 size-4" />
									Settings
								</DropdownMenu.Item>
							</a>
							<DropdownMenu.Separator />
							<form method="POST" action="/logout">
								<button type="submit" class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
									<LogOut class="mr-2 size-4" />
									Sign out
								</button>
							</form>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.SidebarMenuItem>
			</Sidebar.SidebarMenu>
		</Sidebar.SidebarFooter>

		<Sidebar.SidebarRail />
	</Sidebar.Sidebar>

	<Sidebar.SidebarInset>
		<header class="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<Sidebar.SidebarTrigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<div class="flex flex-1 items-center gap-2">
				<div class="relative flex-1 max-w-sm">
					<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						bind:this={searchInputEl}
						bind:value={searchQuery}
						oninput={onSearchInput}
						onkeydown={onSearchKeydown}
						onfocus={() => { if (allResults.length > 0) showSearchResults = true; }}
						onblur={() => { setTimeout(() => showSearchResults = false, 200); }}
						type="search"
						placeholder="Search listings, contacts, tasks..."
						class="h-8 w-full rounded-md border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
					{#if showSearchResults}
						<div class="absolute top-full left-0 right-0 mt-1 rounded-md border bg-background shadow-lg z-50 max-h-80 overflow-y-auto">
							{#if searchResults.listings.length > 0}
								<div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Listings</div>
								{#each searchResults.listings as result, i}
									{@const globalIdx = i}
									{@const Icon = getResultIcon(result.type)}
									<button
										class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors {selectedIndex === globalIdx ? 'bg-muted' : ''}"
										onmousedown={() => navigateToResult(result)}
									>
										<Icon class="size-4 text-muted-foreground shrink-0" />
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{result.title}</p>
											<p class="truncate text-xs text-muted-foreground">{result.subtitle}</p>
										</div>
									</button>
								{/each}
							{/if}
							{#if searchResults.contacts.length > 0}
								<div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground {searchResults.listings.length > 0 ? 'border-t' : ''}">Contacts</div>
								{#each searchResults.contacts as result, i}
									{@const globalIdx = searchResults.listings.length + i}
									{@const Icon = getResultIcon(result.type)}
									<button
										class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors {selectedIndex === globalIdx ? 'bg-muted' : ''}"
										onmousedown={() => navigateToResult(result)}
									>
										<Icon class="size-4 text-muted-foreground shrink-0" />
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{result.title}</p>
											<p class="truncate text-xs text-muted-foreground capitalize">{result.subtitle}</p>
										</div>
									</button>
								{/each}
							{/if}
							{#if searchResults.tasks.length > 0}
								<div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground {(searchResults.listings.length + searchResults.contacts.length) > 0 ? 'border-t' : ''}">Tasks</div>
								{#each searchResults.tasks as result, i}
									{@const globalIdx = searchResults.listings.length + searchResults.contacts.length + i}
									{@const Icon = getResultIcon(result.type)}
									<button
										class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors {selectedIndex === globalIdx ? 'bg-muted' : ''}"
										onmousedown={() => navigateToResult(result)}
									>
										<Icon class="size-4 text-muted-foreground shrink-0" />
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{result.title}</p>
											<p class="truncate text-xs text-muted-foreground capitalize">{result.subtitle?.replace('_', ' ')}</p>
										</div>
									</button>
								{/each}
							{/if}
							{#if allResults.length === 0}
								<div class="px-3 py-4 text-center text-sm text-muted-foreground">No results found</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon" class="relative" {...props}>
							<Bell class="size-4" />
							{#if recentInsights.length > 0}
								<span class="absolute right-1 top-1 size-2 rounded-full bg-destructive"></span>
							{/if}
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-80 p-0" align="end">
					<div class="border-b px-4 py-3">
						<div class="flex items-center gap-2">
							<Sparkles class="size-4 text-amber-500" />
							<span class="text-sm font-semibold">Notifications</span>
						</div>
					</div>
					{#if recentInsights.length > 0}
						<div class="max-h-72 overflow-y-auto divide-y">
							{#each recentInsights as insight}
								<a
									href={insight.actionUrl || '#'}
									class="block px-4 py-3 transition-colors hover:bg-muted/50"
								>
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm font-medium line-clamp-1">{insight.title}</p>
										<span class="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(insight.timestamp)}</span>
									</div>
									<p class="mt-0.5 text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
								</a>
							{/each}
						</div>
					{:else}
						<div class="px-4 py-6 text-center text-sm text-muted-foreground">
							No notifications
						</div>
					{/if}
				</Popover.Content>
			</Popover.Root>
			<Avatar class="size-8">
				<AvatarFallback class="bg-primary text-primary-foreground text-xs font-medium">{userInitials}</AvatarFallback>
			</Avatar>
		</header>

		<main class="flex-1 p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</Sidebar.SidebarInset>
</Sidebar.SidebarProvider>
