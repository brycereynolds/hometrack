<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
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
		Sparkles
	} from 'lucide-svelte';
	import { listings, aiInsights } from '$lib/data/mock-data';

	let { children } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/listings', label: 'Listings', icon: Home, badge: String(listings.length) },
		{ href: '/contacts', label: 'Contacts', icon: Users },
		{ href: '/vendors', label: 'Vendors', icon: Wrench },
		{ href: '/analytics', label: 'Analytics', icon: BarChart3 }
	];

	const quickActions = [
		{ label: 'New Listing', icon: Plus },
		{ label: 'Voice Memo', icon: Mic },
		{ label: 'Quick Note', icon: FileText }
	];

	const activeAlerts = aiInsights.filter((a) => !a.dismissed).slice(0, 2);
</script>

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
							<span class="truncate text-xs text-muted-foreground">Chen Realty Group</span>
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
								<Sidebar.SidebarMenuButton>
									<action.icon class="size-4" />
									<span>{action.label}</span>
								</Sidebar.SidebarMenuButton>
							</Sidebar.SidebarMenuItem>
						{/each}
					</Sidebar.SidebarMenu>
				</Sidebar.SidebarGroupContent>
			</Sidebar.SidebarGroup>

			<!-- AI Alerts — hidden when sidebar is collapsed to icon mode -->
			{#if activeAlerts.length > 0}
				<Sidebar.SidebarGroup class="group-data-[collapsible=icon]:hidden">
					<Sidebar.SidebarGroupLabel>
						<Sparkles class="mr-1 size-3" />
						AI Alerts
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
										<AvatarFallback class="bg-primary/10 text-primary text-xs font-medium">LC</AvatarFallback>
									</Avatar>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-semibold">Lauren Chen</span>
										<span class="truncate text-xs text-muted-foreground">Team Lead</span>
									</div>
									<ChevronUp class="ml-auto size-4" />
								</Sidebar.SidebarMenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content side="top" class="w-[--bits-dropdown-menu-anchor-width]">
							<DropdownMenu.Item>
								<Settings class="mr-2 size-4" />
								Settings
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<LogOut class="mr-2 size-4" />
								Sign out
							</DropdownMenu.Item>
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
						type="search"
						placeholder="Search listings, contacts, tasks..."
						class="h-8 w-full rounded-md border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
				</div>
			</div>
			<Button variant="ghost" size="icon" class="relative">
				<Bell class="size-4" />
				<span class="absolute right-1 top-1 size-2 rounded-full bg-destructive"></span>
			</Button>
			<Avatar class="size-8">
				<AvatarFallback class="bg-primary text-primary-foreground text-xs font-medium">LC</AvatarFallback>
			</Avatar>
		</header>

		<main class="flex-1 p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</Sidebar.SidebarInset>
</Sidebar.SidebarProvider>
