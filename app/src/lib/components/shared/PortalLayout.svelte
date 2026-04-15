<!--
  PortalLayout.svelte — Client portal layout
  Simpler nav, branded header, no sidebar. Horizontal top nav.
-->
<script lang="ts">
  import { type Snippet } from 'svelte';

  interface Props {
    teamName?: string;
    teamLogo?: string;
    activePath?: string;
    children: Snippet;
  }

  let { teamName = '', activePath = '/portal', children }: Props = $props();

  const navItems = [
    { label: 'Dashboard', href: '/portal' },
    { label: 'Approvals', href: '/portal/approvals', badge: '3' },
    { label: 'Messages', href: '/portal/messages', badge: '1' },
    { label: 'Documents', href: '/portal/documents' },
  ];
</script>

<div class="flex min-h-screen flex-col bg-background">
  <!-- Branded header -->
  <header class="border-b border-border bg-background-secondary">
    <div class="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
      <!-- Team branding -->
      <div class="flex items-center gap-3">
        <div class="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span class="text-sm font-bold text-primary-foreground">C</span>
        </div>
        <div>
          <p class="text-sm font-semibold text-foreground">{teamName}</p>
          <p class="text-xs text-foreground-muted">Client Portal</p>
        </div>
      </div>

      <div class="flex-1"></div>

      <!-- User / Client info -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-foreground-secondary">David Nguyen</span>
        <div class="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-white">
          DN
        </div>
      </div>
    </div>

    <!-- Portal nav tabs -->
    <div class="mx-auto max-w-5xl px-4">
      <nav class="flex gap-0 overflow-x-auto">
        {#each navItems as item}
          {@const active = activePath === item.href}
          <a
            href={item.href}
            class="relative flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors"
            class:border-primary={active}
            class:text-primary={active}
            class:border-transparent={!active}
            class:text-foreground-secondary={!active}
            class:hover:text-foreground={!active}
          >
            {item.label}
            {#if item.badge}
              <span class="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {item.badge}
              </span>
            {/if}
          </a>
        {/each}
      </nav>
    </div>
  </header>

  <!-- Page content -->
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="border-t border-border-subtle py-6 text-center">
    <p class="text-xs text-foreground-muted">
      Powered by <span class="font-medium">HomeTrack</span> &middot; Secure client portal
    </p>
  </footer>
</div>
