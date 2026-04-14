<!--
  Sidebar.svelte — Main app sidebar navigation
  Collapsible to icons-only mode. Contains nav items, quick actions, AI alerts, user menu.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import Autocomplete from './Autocomplete.svelte';
  import type { Listing, AIInsight } from '$lib/types';

  interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
    activePath?: string;
    listings?: Listing[];
    aiInsights?: AIInsight[];
    teamName?: string;
    userName?: string;
    userInitials?: string;
    userRole?: string;
  }

  let { collapsed = false, onToggle, activePath = '/dashboard', listings = [], aiInsights = [], teamName = '', userName = '', userInitials = '?', userRole = '' }: Props = $props();

  type NavItem = {
    label: string;
    href?: string;
    icon: string;
    badge?: string;
    children?: { label: string; href: string }[];
  };

  const navItems: NavItem[] = $derived([
    { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Listings', href: '/listings', icon: 'home', badge: String(listings.length) },
    { label: 'Contacts', href: '/contacts', icon: 'users' },
    {
      label: 'Vendors',
      href: '/vendors',
      icon: 'wrench',
      children: [
        { label: 'Manage Quotes', href: '/vendors/quotes' },
      ],
    },
    { label: 'Analytics', href: '/analytics', icon: 'bar-chart-3' },
  ]);

  const activeAlerts = $derived(aiInsights.filter((a: any) => !a.dismissed).slice(0, 2));

  let expandedNavItems = $state<Set<string>>(new Set());
  let showVoiceMemoModal = $state(false);
  let showQuickNoteModal = $state(false);

  // Voice memo state
  let memoTitle = $state('');
  let memoRecording = $state(false);

  // Quick note state
  let noteTitle = $state('');
  let noteContent = $state('');
  let memoListingId = $state('');
  let noteListingId = $state('');

  function isActive(href: string): boolean {
    return activePath === href || activePath.startsWith(href + '/');
  }

  function toggleNavExpand(label: string) {
    const next = new Set(expandedNavItems);
    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }
    expandedNavItems = next;
  }

  function handleQuickAction(label: string) {
    if (label === 'New Listing') {
      goto('/listings/new');
    } else if (label === 'Voice Memo') {
      memoTitle = '';
      memoRecording = false;
      showVoiceMemoModal = true;
    } else if (label === 'Quick Note') {
      noteTitle = '';
      noteContent = '';
      showQuickNoteModal = true;
    }
  }
</script>

<nav
  class="flex h-full flex-col border-r border-border bg-background-secondary transition-[width] duration-200"
  class:w-64={!collapsed}
  class:w-16={collapsed}
>
  <!-- Logo / Team name -->
  <div class="flex h-14 items-center gap-3 border-b border-border px-4">
    {#if !collapsed}
      <div class="flex size-8 items-center justify-center rounded-lg bg-primary">
        <span class="text-sm font-bold text-primary-foreground">H</span>
      </div>
      <div class="flex-1 truncate">
        <p class="text-sm font-semibold text-foreground">HomeTrack</p>
        <p class="text-xs text-foreground-muted">{teamName}</p>
      </div>
    {:else}
      <div class="mx-auto flex size-8 items-center justify-center rounded-lg bg-primary">
        <span class="text-sm font-bold text-primary-foreground">H</span>
      </div>
    {/if}
  </div>

  <!-- Main nav items -->
  <div class="flex-1 overflow-y-auto px-2 py-3">
    <ul class="space-y-1">
      {#each navItems as item}
        {@const active = item.href ? isActive(item.href) : false}
        {@const hasChildren = item.children && item.children.length > 0}
        {@const isExpanded = expandedNavItems.has(item.label)}
        <li>
          {#if hasChildren}
            <button
              onclick={() => {
                toggleNavExpand(item.label);
                if (item.href) goto(item.href);
              }}
              class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              class:bg-primary-subtle={active}
              class:text-primary={active}
              class:text-foreground-secondary={!active}
              class:hover:bg-background-tertiary={!active}
              class:hover:text-foreground={!active}
              title={collapsed ? item.label : undefined}
            >
              <span class="flex size-5 shrink-0 items-center justify-center rounded text-current">
                <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  {#if item.icon === 'wrench'}
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  {/if}
                </svg>
              </span>
              {#if !collapsed}
                <span class="flex-1 truncate text-left">{item.label}</span>
                <svg
                  class="size-4 transition-transform {isExpanded ? 'rotate-90' : ''}"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
                >
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              {/if}
            </button>
            {#if !collapsed && isExpanded && item.children}
              <ul class="ml-8 mt-1 space-y-0.5">
                {#each item.children as child}
                  {@const childActive = isActive(child.href)}
                  <li>
                    <a
                      href={child.href}
                      class="block rounded-md px-3 py-1.5 text-sm transition-colors"
                      class:text-primary={childActive}
                      class:font-medium={childActive}
                      class:text-foreground-secondary={!childActive}
                      class:hover:text-foreground={!childActive}
                      class:hover:bg-background-tertiary={!childActive}
                    >
                      {child.label}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          {:else}
            <a
              href={item.href}
              class="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              class:bg-primary-subtle={active}
              class:text-primary={active}
              class:text-foreground-secondary={!active}
              class:hover:bg-background-tertiary={!active}
              class:hover:text-foreground={!active}
              title={collapsed ? item.label : undefined}
            >
              <span class="flex size-5 shrink-0 items-center justify-center rounded text-current">
                <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  {#if item.icon === 'layout-dashboard'}
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  {:else if item.icon === 'home'}
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
                  {:else if item.icon === 'users'}
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  {:else if item.icon === 'bar-chart-3'}
                    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                  {/if}
                </svg>
              </span>

              {#if !collapsed}
                <span class="flex-1 truncate">{item.label}</span>
                {#if item.badge}
                  <span class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                {/if}
              {/if}
            </a>
          {/if}
        </li>
      {/each}
    </ul>

    {#if !collapsed}
      <!-- Quick Actions -->
      <div class="mt-6 border-t border-border-subtle pt-4">
        <p class="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">Quick Actions</p>
        <ul class="space-y-0.5">
          <li>
            <button
              onclick={() => handleQuickAction('New Listing')}
              class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Listing</span>
            </button>
          </li>
          <li>
            <button
              onclick={() => handleQuickAction('Voice Memo')}
              class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span>Voice Memo</span>
            </button>
          </li>
          <li>
            <button
              onclick={() => handleQuickAction('Quick Note')}
              class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
              </svg>
              <span>Quick Note</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Alerts -->
      {#if activeAlerts.length > 0}
        <div class="mt-6 border-t border-border-subtle pt-4">
          <p class="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">Alerts</p>
          <ul class="space-y-2 px-2">
            {#each activeAlerts as alert}
              <li class="rounded-md border border-accent/20 bg-accent-subtle p-2.5">
                <p class="text-xs font-medium text-foreground">{alert.title}</p>
                <p class="mt-0.5 text-xs text-foreground-secondary line-clamp-2">{alert.description}</p>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Bottom: user + settings + collapse toggle -->
  <div class="border-t border-border p-2">
    {#if !collapsed}
      <a
        href="/settings"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
      >
        <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span>Settings</span>
      </a>

      <!-- User profile row -->
      <div class="mt-1 flex items-center gap-3 rounded-md px-3 py-2">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {userInitials}
        </div>
        <div class="flex-1 truncate">
          <p class="text-sm font-medium text-foreground">{userName}</p>
          <p class="text-xs text-foreground-muted">{userRole}</p>
        </div>
      </div>
    {/if}

    <!-- Collapse toggle (desktop only) -->
    <button
      class="mt-1 flex w-full items-center justify-center gap-3 rounded-md px-3 py-2 text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
      onclick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg class="size-4 transition-transform" class:rotate-180={collapsed} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <polyline points="11,17 6,12 11,7" /><polyline points="18,17 13,12 18,7" />
      </svg>
      {#if !collapsed}
        <span class="text-xs">Collapse</span>
      {/if}
    </button>
  </div>
</nav>

<!-- Voice Memo Modal -->
<Dialog.Root bind:open={showVoiceMemoModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="font-serif">Voice Memo</Dialog.Title>
      <Dialog.Description>Record a quick voice memo for your records.</Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div>
        <label for="memo-title" class="text-sm font-medium">Title</label>
        <input
          id="memo-title"
          type="text"
          bind:value={memoTitle}
          placeholder="e.g. Notes from showing at 42 Oak St"
          class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>
      <div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6">
        <button
          onclick={() => memoRecording = !memoRecording}
          class="flex size-16 items-center justify-center rounded-full transition-colors {memoRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20'}"
        >
          <svg class="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <p class="text-sm text-muted-foreground">
          {memoRecording ? 'Recording... tap to stop' : 'Tap to start recording'}
        </p>
      </div>
      <div>
        <label for="memo-listing" class="text-sm font-medium">Link to Listing (optional)</label>
        <div class="mt-1">
          <Autocomplete
            items={[{ value: '', label: 'None' }, ...listings.map((l) => ({ value: l.id, label: l.address }))]}
            bind:value={memoListingId}
            placeholder="Search listings..."
          />
        </div>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showVoiceMemoModal = false}>Cancel</Button>
      <Button onclick={() => showVoiceMemoModal = false}>Save Memo</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Quick Note Modal -->
<Dialog.Root bind:open={showQuickNoteModal}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="font-serif">Quick Note</Dialog.Title>
      <Dialog.Description>Jot down a quick note.</Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div>
        <label for="note-title" class="text-sm font-medium">Title</label>
        <input
          id="note-title"
          type="text"
          bind:value={noteTitle}
          placeholder="e.g. Follow up with buyer agent"
          class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>
      <div>
        <label for="note-content" class="text-sm font-medium">Note</label>
        <textarea
          id="note-content"
          bind:value={noteContent}
          placeholder="Write your note here..."
          rows="4"
          class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        ></textarea>
      </div>
      <div>
        <label for="note-listing" class="text-sm font-medium">Link to Listing (optional)</label>
        <div class="mt-1">
          <Autocomplete
            items={[{ value: '', label: 'None' }, ...listings.map((l) => ({ value: l.id, label: l.address }))]}
            bind:value={noteListingId}
            placeholder="Search listings..."
          />
        </div>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showQuickNoteModal = false}>Cancel</Button>
      <Button onclick={() => showQuickNoteModal = false}>Save Note</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
