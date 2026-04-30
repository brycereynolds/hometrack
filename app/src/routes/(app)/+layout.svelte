<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { invalidateAll, goto } from '$app/navigation';
	import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
	import { onMount, onDestroy } from 'svelte';
	import CommandPalette from '$lib/components/shared/CommandPalette.svelte';
	import CaptureModal from '$lib/components/shared/CaptureModal.svelte';
	import SidebarCloseOnNav from '$lib/components/shared/SidebarCloseOnNav.svelte';
	import FloatingVoiceButton from '$lib/components/shared/FloatingVoiceButton.svelte';
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
		Sparkles,
		CheckCircle2
	} from 'lucide-svelte';
	let { children, data } = $props();

	// Supabase Realtime — subscribe to key tables and invalidate on changes
	let realtimeChannel: RealtimeChannel | null = null;

	onMount(() => {
		if (!data.supabaseUrl || !data.supabaseAnonKey) return;

		const supabase = createClient(data.supabaseUrl, data.supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		realtimeChannel = supabase
			.channel('app-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => invalidateAll())
			.on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => invalidateAll())
			.on('postgres_changes', { event: '*', schema: 'public', table: 'activity_items' }, () => invalidateAll())
			.subscribe();
	});

	onDestroy(() => {
		realtimeChannel?.unsubscribe();
	});

	// Command palette state
	let commandOpen = $state(false);
	let captureOpen = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			commandOpen = !commandOpen;
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

	const navItems = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/listings', label: 'Listings', icon: Home, badge: String(listings.length) },
		{ href: '/contacts', label: 'Contacts', icon: Users },
		{ href: '/vendors', label: 'Vendors', icon: Wrench },
		{ href: '/analytics', label: 'Analytics', icon: BarChart3 }
	]);

	// Callback ref set by SidebarCloseOnNav child component (has sidebar context access)
	let closeMobileSidebar: (() => void) | null = null;

	const quickActions: { label: string; icon: typeof Plus; href?: string; action?: () => void }[] = [
		{ label: 'New Listing', icon: Plus, href: '/listings/new' },
		{ label: 'Capture Note', icon: Mic, action: () => { openCaptureFromSidebar(); } }
	];

	function openCaptureFromSidebar() {
		// Close sidebar first, then open modal after a brief delay for the animation
		closeMobileSidebar?.();
		setTimeout(() => { captureOpen = true; }, 150);
	}

	let dismissedIds = $state<Set<string>>(new Set());
	const activeAlerts = $derived(aiInsights.filter((a: any) => !a.dismissed && !dismissedIds.has(a.id)).slice(0, 2));
	const recentInsights = $derived(aiInsights.slice(0, 5));

	async function acknowledgeAlert(id: string, event: Event) {
		event.preventDefault();
		event.stopPropagation();
		try {
			const res = await fetch(`/api/insights/${id}/acknowledge`, { method: 'POST' });
			if (res.ok) {
				dismissedIds = new Set([...dismissedIds, id]);
			}
		} catch (err) {
			console.error('Failed to acknowledge alert:', err);
		}
	}

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

<svelte:window onkeydown={handleKeydown} />
<CommandPalette
	bind:open={commandOpen}
	onCapture={() => { captureOpen = true; }}
/>
<CaptureModal bind:open={captureOpen} listings={listings} teamId={data.team?.id ?? ''} />
<!-- FloatingVoiceButton hidden — use Cmd+K or sidebar instead -->
<Toaster richColors position="top-right" />

<Sidebar.SidebarProvider>
	<SidebarCloseOnNav onReady={(fn) => { closeMobileSidebar = fn; }} />
	<Sidebar.Sidebar collapsible="icon">
		<Sidebar.SidebarHeader>
			<Sidebar.SidebarMenu>
				<Sidebar.SidebarMenuItem>
					<Sidebar.SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent" asChild>
						{#snippet child({ props })}
							<a href="/dashboard" {...props} class="{props.class} no-underline">
								<div class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold">
									H
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">HomeTrack</span>
									<span class="truncate text-xs text-muted-foreground">{teamName}</span>
								</div>
							</a>
						{/snippet}
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
								{#if action.href}
									<Sidebar.SidebarMenuButton asChild>
										{#snippet child({ props })}
											<a href={action.href} {...props}>
												<action.icon class="size-4" />
												<span>{action.label}</span>
											</a>
										{/snippet}
									</Sidebar.SidebarMenuButton>
								{:else if action.action}
									<Sidebar.SidebarMenuButton onclick={action.action}>
										<action.icon class="size-4" />
										<span>{action.label}</span>
									</Sidebar.SidebarMenuButton>
								{/if}
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
								<div class="relative rounded-md border border-border/50 bg-muted/50 transition-colors hover:bg-muted">
									<a href={alert.actionUrl || '#'} class="block p-2.5 pr-9">
										<p class="text-xs font-medium">{alert.title}</p>
										<p class="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
									</a>
									<button
										onclick={(e) => acknowledgeAlert(alert.id, e)}
										class="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
										title="Mark as handled"
									>
										<CheckCircle2 class="size-3.5" />
									</button>
								</div>
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
				<!-- Desktop: full search bar -->
				<button
					onclick={() => commandOpen = true}
					class="hidden md:flex items-center gap-2 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
				>
					<Search class="size-4" />
					<span>Search listings, contacts, vendors...</span>
					<kbd class="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
				</button>
			</div>
			<!-- Mobile: search icon button -->
			<Button variant="ghost" size="icon" class="md:hidden" onclick={() => commandOpen = true}>
				<Search class="size-4" />
				<span class="sr-only">Search</span>
			</Button>
			<!-- Mobile: mic/record button -->
			<Button variant="ghost" size="icon" class="md:hidden" onclick={() => { captureOpen = true; }}>
				<Mic class="size-4" />
				<span class="sr-only">Capture Note</span>
			</Button>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon" {...props}>
							<span class="relative inline-flex">
								<Bell class="size-4" />
								{#if recentInsights.length > 0}
									<span class="absolute -right-1 -top-1 size-2 rounded-full bg-primary ring-2 ring-background"></span>
								{/if}
							</span>
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
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<button {...props} class="rounded-full outline-none ring-ring focus-visible:ring-2">
							<Avatar class="size-8 cursor-pointer">
								<AvatarFallback class="bg-primary text-primary-foreground text-xs font-medium">{userInitials}</AvatarFallback>
							</Avatar>
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-48">
					<div class="px-2 py-1.5">
						<p class="text-sm font-medium">{userName}</p>
						<p class="text-xs text-muted-foreground">{userRole}</p>
					</div>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={() => goto('/settings')}>
						<Settings class="mr-2 size-4" />
						Settings
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<form method="POST" action="/logout">
						<DropdownMenu.Item>
							<button type="submit" class="flex w-full items-center">
								<LogOut class="mr-2 size-4" />
								Sign out
							</button>
						</DropdownMenu.Item>
					</form>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</header>

		<main class="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</Sidebar.SidebarInset>
</Sidebar.SidebarProvider>
