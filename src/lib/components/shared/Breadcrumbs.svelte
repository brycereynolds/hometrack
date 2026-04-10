<!--
  Breadcrumbs.svelte — Configurable breadcrumb component
  Desktop: full trail. Mobile: back arrow with parent label.
-->
<script lang="ts">
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    items?: BreadcrumbItem[];
  }

  let { items = [] }: Props = $props();
</script>

{#if items.length > 0}
  <nav aria-label="Breadcrumb">
    <ol class="flex items-center gap-1.5 text-sm">
      {#each items as item, index}
        {#if index > 0}
          <li class="text-foreground-muted" aria-hidden="true">
            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </li>
        {/if}
        <li>
          {#if item.href && index < items.length - 1}
            <a
              href={item.href}
              class="text-foreground-secondary hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          {:else}
            <span class="font-medium text-foreground">{item.label}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}
