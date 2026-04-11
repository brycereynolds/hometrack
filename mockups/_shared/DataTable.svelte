<!--
  DataTable.svelte — Wrapper table component with header, sorting indicators,
  filter area, and pagination. Uses Svelte 5 snippets for cell rendering.
-->
<script lang="ts">
  import { type Snippet } from 'svelte';

  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }

  interface Props {
    columns: Column[];
    data: Record<string, any>[];
    /** Total rows (for pagination display) */
    totalRows?: number;
    /** Current page (1-indexed) */
    page?: number;
    pageSize?: number;
    /** Snippet for rendering a row */
    row: Snippet<[Record<string, any>, number]>;
    /** Optional snippet for the filter/search bar area */
    filters?: Snippet;
    /** Optional snippet for bulk action toolbar */
    bulkActions?: Snippet;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (column: string) => void;
    selectable?: boolean;
  }

  let {
    columns,
    data,
    totalRows,
    page = 1,
    pageSize = 10,
    row,
    filters,
    bulkActions,
    sortColumn,
    sortDirection = 'asc',
    onSort,
    selectable = false,
  }: Props = $props();

  const total = $derived(totalRows ?? data.length);
  const pageCount = $derived(Math.ceil(total / pageSize));
  const startRow = $derived((page - 1) * pageSize + 1);
  const endRow = $derived(Math.min(page * pageSize, total));
</script>

<div class="rounded-lg border border-border bg-background-secondary shadow-xs">
  <!-- Filter area -->
  {#if filters}
    <div class="border-b border-border-subtle px-4 py-3">
      {@render filters()}
    </div>
  {/if}

  <!-- Bulk actions toolbar -->
  {#if bulkActions}
    <div class="border-b border-border-subtle bg-primary-subtle/50 px-4 py-2">
      {@render bulkActions()}
    </div>
  {/if}

  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border-subtle">
          {#if selectable}
            <th class="w-10 px-4 py-3">
              <input type="checkbox" class="size-4 rounded border-border text-primary" />
            </th>
          {/if}
          {#each columns as col}
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-muted"
              class:text-center={col.align === 'center'}
              class:text-right={col.align === 'right'}
              style={col.width ? `width: ${col.width}` : ''}
            >
              {#if col.sortable && onSort}
                <button
                  class="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onclick={() => onSort(col.key)}
                >
                  {col.label}
                  {#if sortColumn === col.key}
                    <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      {#if sortDirection === 'asc'}
                        <polyline points="18,15 12,9 6,15" />
                      {:else}
                        <polyline points="6,9 12,15 18,9" />
                      {/if}
                    </svg>
                  {:else}
                    <svg class="size-3.5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M7 15l5 5 5-5" /><path d="M7 9l5-5 5 5" />
                    </svg>
                  {/if}
                </button>
              {:else}
                {col.label}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-border-subtle">
        {#each data as item, index}
          {@render row(item, index)}
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="flex items-center justify-between border-t border-border-subtle px-4 py-3">
    <p class="text-sm text-foreground-muted">
      Showing {startRow}-{endRow} of {total}
    </p>
    <div class="flex items-center gap-1">
      <button
        class="rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary disabled:opacity-40"
        disabled={page <= 1}
      >
        Previous
      </button>
      {#each Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1) as p}
        <button
          class="flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors"
          class:bg-primary={p === page}
          class:text-primary-foreground={p === page}
          class:text-foreground-secondary={p !== page}
          class:hover:bg-background-tertiary={p !== page}
        >
          {p}
        </button>
      {/each}
      <button
        class="rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary disabled:opacity-40"
        disabled={page >= pageCount}
      >
        Next
      </button>
    </div>
  </div>
</div>
