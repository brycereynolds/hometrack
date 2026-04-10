<!--
  AppLayout.svelte — Main authenticated app layout
  Used by all (app)/ routes: sidebar + topbar + main content area
-->
<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import MobileBottomNav from './MobileBottomNav.svelte';
  import Breadcrumbs from './Breadcrumbs.svelte';
  import { type Snippet } from 'svelte';

  interface Props {
    breadcrumbs?: { label: string; href?: string }[];
    title?: string;
    children: Snippet;
  }

  let { breadcrumbs = [], title = '', children }: Props = $props();

  let sidebarCollapsed = $state(false);
  let mobileMenuOpen = $state(false);
</script>

<div class="flex h-screen overflow-hidden bg-background">
  <!-- Desktop Sidebar -->
  <div class="hidden lg:flex">
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => (sidebarCollapsed = !sidebarCollapsed)} />
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
        <button class="flex size-9 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-tertiary" aria-label="Search">
          <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
