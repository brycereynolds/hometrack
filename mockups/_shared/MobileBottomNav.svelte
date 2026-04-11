<!--
  MobileBottomNav.svelte — Bottom tab bar for mobile
  5 items: Dashboard, Listings, Capture (center, prominent), Contacts, More
-->
<script lang="ts">
  interface Props {
    activePath?: string;
  }

  let { activePath = '/dashboard' }: Props = $props();

  let captureOpen = $state(false);

  const tabs = [
    { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    { label: 'Listings', href: '/listings', icon: 'grid' },
    { label: 'Capture', href: '#capture', icon: 'plus-mic', isCapture: true },
    { label: 'Contacts', href: '/contacts', icon: 'users' },
    { label: 'More', href: '#more', icon: 'menu' },
  ];

  const captureActions = [
    { label: 'Voice Memo', icon: 'mic', description: 'Record a voice note' },
    { label: 'Field Note', icon: 'edit', description: 'Quick text note' },
    { label: 'Photo', icon: 'camera', description: 'Capture a photo' },
    { label: 'Showing Feedback', icon: 'message', description: 'Log showing feedback' },
    { label: 'Open House Check-In', icon: 'clipboard', description: 'Start sign-in sheet' },
  ];
</script>

<!-- Capture sheet overlay -->
{#if captureOpen}
  <div class="fixed inset-0 z-50">
    <button
      class="absolute inset-0 bg-background-inverse/40"
      onclick={() => (captureOpen = false)}
      aria-label="Close capture menu"
    ></button>
    <div class="absolute inset-x-0 bottom-0 rounded-t-xl bg-background p-4 pb-8 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-foreground">Quick Capture</h3>
        <button
          class="flex size-8 items-center justify-center rounded-full text-foreground-muted hover:bg-background-tertiary"
          onclick={() => (captureOpen = false)}
          aria-label="Close"
        >
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-3 gap-3">
        {#each captureActions as action}
          <button class="flex flex-col items-center gap-2 rounded-lg border border-border bg-background-secondary p-4 hover:bg-background-tertiary active:scale-95">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                {#if action.icon === 'mic'}
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
                {:else if action.icon === 'edit'}
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                {:else if action.icon === 'camera'}
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                {:else if action.icon === 'message'}
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                {:else if action.icon === 'clipboard'}
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                {/if}
              </svg>
            </div>
            <span class="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Bottom tab bar -->
<nav class="flex items-end border-t border-border bg-background-secondary px-2 pb-safe">
  {#each tabs as tab}
    {@const active = !tab.isCapture && activePath.startsWith(tab.href)}
    {#if tab.isCapture}
      <!-- Capture button (center, prominent) -->
      <button
        class="relative -top-3 mx-1 flex flex-1 flex-col items-center"
        onclick={() => (captureOpen = true)}
        aria-label="Capture"
      >
        <div class="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95">
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span class="mt-0.5 text-[10px] font-medium text-primary">Capture</span>
      </button>
    {:else}
      <a
        href={tab.href}
        class="flex flex-1 flex-col items-center gap-0.5 py-2"
        class:text-primary={active}
        class:text-foreground-muted={!active}
      >
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width={active ? '2.5' : '2'}>
          {#if tab.icon === 'home'}
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
          {:else if tab.icon === 'grid'}
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          {:else if tab.icon === 'users'}
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          {:else if tab.icon === 'menu'}
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          {/if}
        </svg>
        <span class="text-[10px] font-medium">{tab.label}</span>
      </a>
    {/if}
  {/each}
</nav>
