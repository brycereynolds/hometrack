<!--
  Sidebar.svelte — Main app sidebar navigation
  Collapsible to icons-only mode. Contains nav items, quick actions, AI alerts, user menu.
-->
<script lang="ts">
  import { aiInsights, listings } from './mock-data';

  interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
    activePath?: string;
  }

  let { collapsed = false, onToggle, activePath = '/dashboard' }: Props = $props();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Listings', href: '/listings', icon: 'home', badge: String(listings.length) },
    { label: 'Contacts', href: '/contacts', icon: 'users' },
    { label: 'Vendors', href: '/vendors', icon: 'wrench' },
    { label: 'Analytics', href: '/analytics', icon: 'bar-chart-3' },
  ];

  const quickActions = [
    { label: 'New Listing', icon: 'plus' },
    { label: 'Voice Memo', icon: 'mic' },
    { label: 'Quick Note', icon: 'file-text' },
  ];

  const activeAlerts = aiInsights.filter((a) => !a.dismissed).slice(0, 2);

  function isActive(href: string): boolean {
    return activePath === href || activePath.startsWith(href + '/');
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
        <p class="text-xs text-foreground-muted">Chen Realty Group</p>
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
        {@const active = isActive(item.href)}
        <li>
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
            <!-- Icon placeholder (Lucide icons would be imported in real implementation) -->
            <span class="flex size-5 shrink-0 items-center justify-center rounded text-current">
              <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                {#if item.icon === 'layout-dashboard'}
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                {:else if item.icon === 'home'}
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
                {:else if item.icon === 'users'}
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                {:else if item.icon === 'wrench'}
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
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
        </li>
      {/each}
    </ul>

    {#if !collapsed}
      <!-- Quick Actions -->
      <div class="mt-6 border-t border-border-subtle pt-4">
        <p class="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">Quick Actions</p>
        <ul class="space-y-0.5">
          {#each quickActions as action}
            <li>
              <button class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground">
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  {#if action.icon === 'plus'}
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  {:else if action.icon === 'mic'}
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                  {:else if action.icon === 'file-text'}
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
                  {/if}
                </svg>
                <span>{action.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <!-- AI Alerts -->
      {#if activeAlerts.length > 0}
        <div class="mt-6 border-t border-border-subtle pt-4">
          <p class="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted">AI Alerts</p>
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
          LC
        </div>
        <div class="flex-1 truncate">
          <p class="text-sm font-medium text-foreground">Lauren Chen</p>
          <p class="text-xs text-foreground-muted">Team Lead</p>
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
