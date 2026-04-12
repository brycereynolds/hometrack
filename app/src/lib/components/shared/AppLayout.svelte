<!--
  AppLayout.svelte — Main authenticated app layout
  Used by all (app)/ routes: sidebar + topbar + main content area
-->
<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import MobileBottomNav from './MobileBottomNav.svelte';
  import Breadcrumbs from './Breadcrumbs.svelte';
  import { type Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Listing, Contact, AIInsight } from '$lib/types';
  import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandLinkItem,
  } from '$lib/components/ui/command/index.js';

  interface Props {
    breadcrumbs?: { label: string; href?: string }[];
    title?: string;
    children: Snippet;
    listings?: Listing[];
    contacts?: Contact[];
    aiInsights?: AIInsight[];
  }

  let { breadcrumbs = [], title = '', children, listings = [], contacts = [], aiInsights = [] }: Props = $props();

  let sidebarCollapsed = $state(false);
  let mobileMenuOpen = $state(false);
  let commandOpen = $state(false);

  // Listen for Cmd+K / Ctrl+K
  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      commandOpen = !commandOpen;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-screen overflow-hidden bg-background">
  <!-- Desktop Sidebar -->
  <div class="hidden lg:flex">
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => (sidebarCollapsed = !sidebarCollapsed)} {listings} {aiInsights} />
  </div>

  <!-- Mobile Sidebar Overlay -->
  {#if mobileMenuOpen}
    <div class="fixed inset-0 z-50 lg:hidden">
      <!-- Backdrop -->
      <button
        class="absolute inset-0 bg-background-inverse/40"
        onclick={() => (mobileMenuOpen = false)}
        aria-label="Close menu"
      ></button>
      <!-- Sidebar panel -->
      <div class="absolute inset-y-0 left-0 w-72 shadow-xl">
        <Sidebar collapsed={false} onToggle={() => (mobileMenuOpen = false)} />
      </div>
    </div>
  {/if}

  <!-- Main content area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="flex h-14 items-center gap-4 border-b border-border bg-background-secondary px-4 lg:px-6">
      <!-- Mobile hamburger -->
      <button
        class="flex size-9 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-tertiary lg:hidden"
        onclick={() => (mobileMenuOpen = true)}
        aria-label="Open menu"
      >
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Breadcrumbs (desktop only) -->
      <div class="hidden lg:block">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div class="flex-1"></div>

      <!-- Right side: search + notifications + user -->
      <div class="flex items-center gap-2">
        <!-- Search trigger -->
        <button
          class="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-background-tertiary transition-colors"
          onclick={() => (commandOpen = true)}
          aria-label="Search"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="hidden sm:inline">Search...</span>
          <kbd class="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span class="text-xs">{navigator?.platform?.includes('Mac') ? '\u2318' : 'Ctrl+'}</span>K
          </kbd>
        </button>

        <!-- Notifications -->
        <button class="relative flex size-9 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-tertiary" aria-label="Notifications">
          <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <!-- Unread dot -->
          <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-error"></span>
        </button>

        <!-- User avatar -->
        <button class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground" aria-label="User menu">
          LC
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
      {@render children()}
    </main>

    <!-- Mobile bottom nav -->
    <div class="lg:hidden">
      <MobileBottomNav />
    </div>
  </div>
</div>

<!-- Command Palette -->
<CommandDialog bind:open={commandOpen} title="Command Palette" description="Search for listings, contacts, tasks, and more...">
  <CommandInput placeholder="Type to search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>

    <CommandGroup heading="Listings">
      {#each listings.slice(0, 5) as listing}
        <CommandLinkItem
          href="/listings/{listing.id}"
          onSelect={() => { commandOpen = false; }}
        >
          <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <span>{listing.address}</span>
          <span class="ml-auto text-xs text-muted-foreground">{listing.phase}</span>
        </CommandLinkItem>
      {/each}
    </CommandGroup>

    <CommandSeparator />

    <CommandGroup heading="Contacts">
      {#each contacts.slice(0, 5) as contact}
        <CommandLinkItem
          href="/contacts/{contact.id}"
          onSelect={() => { commandOpen = false; }}
        >
          <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          <span>{contact.name}</span>
          <span class="ml-auto text-xs text-muted-foreground">{contact.type}</span>
        </CommandLinkItem>
      {/each}
    </CommandGroup>

    <CommandSeparator />

    <CommandGroup heading="Quick Actions">
      <CommandItem
        onSelect={() => { commandOpen = false; goto('/listings/new'); }}
      >
        <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Listing</span>
      </CommandItem>
      <CommandItem
        onSelect={() => { commandOpen = false; goto('/contacts'); }}
      >
        <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
        <span>Go to Contacts</span>
      </CommandItem>
      <CommandItem
        onSelect={() => { commandOpen = false; goto('/vendors'); }}
      >
        <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
        <span>Go to Vendors</span>
      </CommandItem>
      <CommandItem
        onSelect={() => { commandOpen = false; goto('/vendors/quotes'); }}
      >
        <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
        <span>Manage Quotes</span>
      </CommandItem>
      <CommandItem
        onSelect={() => { commandOpen = false; goto('/analytics'); }}
      >
        <svg class="mr-2 size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
        <span>Go to Analytics</span>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
