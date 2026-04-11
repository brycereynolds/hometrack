<!--
  ListingDetailTabs.svelte — Tab navigation for listing detail pages
  Horizontal tab bar. Scrollable on mobile.
-->
<script lang="ts">
  interface Props {
    listingId: string;
    activeTab?: string;
  }

  let { listingId, activeTab = 'overview' }: Props = $props();

  const tabs = [
    { key: 'overview', label: 'Overview', href: `/listings/${listingId}` },
    { key: 'activity', label: 'Activity', href: `/listings/${listingId}/activity` },
    { key: 'tasks', label: 'Tasks', href: `/listings/${listingId}/tasks` },
    { key: 'documents', label: 'Documents', href: `/listings/${listingId}/documents` },
    { key: 'financials', label: 'Financials', href: `/listings/${listingId}/financials` },
    { key: 'marketing', label: 'Marketing', href: `/listings/${listingId}/marketing` },
    { key: 'showings', label: 'Showings', href: `/listings/${listingId}/showings` },
    { key: 'offers', label: 'Offers', href: `/listings/${listingId}/offers` },
    { key: 'analytics', label: 'Analytics', href: `/listings/${listingId}/analytics` },
    { key: 'portal', label: 'Portal', href: `/listings/${listingId}/portal-settings` },
  ];
</script>

<div class="border-b border-border">
  <nav class="-mb-px flex gap-0 overflow-x-auto scrollbar-none" aria-label="Listing tabs">
    {#each tabs as tab}
      {@const active = activeTab === tab.key}
      <a
        href={tab.href}
        class="relative whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors"
        class:border-primary={active}
        class:text-primary={active}
        class:border-transparent={!active}
        class:text-foreground-secondary={!active}
        class:hover:text-foreground={!active}
        class:hover:border-border-strong={!active}
        aria-current={active ? 'page' : undefined}
      >
        {tab.label}
      </a>
    {/each}
  </nav>
</div>
