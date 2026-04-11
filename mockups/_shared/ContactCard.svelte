<!--
  ContactCard.svelte — Card for contact/agent displays
  Shows avatar/initials, name, type badge, last interaction, key details.
-->
<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import type { Contact } from './mock-data';

  interface Props {
    contact: Contact;
    variant?: 'card' | 'row';
  }

  let { contact, variant = 'card' }: Props = $props();

  const typeVariant: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'neutral'> = {
    client: 'primary',
    agent: 'info',
    vendor: 'success',
    lender: 'warning',
    inspector: 'neutral',
    title: 'neutral',
  };
</script>

{#if variant === 'card'}
  <a
    href="/contacts/{contact.id}"
    class="group block rounded-lg border border-border bg-background-secondary p-4 shadow-xs transition-shadow hover:shadow-md"
  >
    <div class="flex items-start gap-3">
      <!-- Avatar -->
      <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {contact.initials}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {contact.name}
          </p>
          <StatusBadge status={contact.typeLabel} variant={typeVariant[contact.type]} size="sm" />
        </div>

        {#if contact.company}
          <p class="text-xs text-foreground-secondary">{contact.company}</p>
        {/if}

        <!-- Contact details -->
        <div class="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
          <span class="flex items-center gap-1">
            <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            {contact.email}
          </span>
        </div>

        <!-- Last interaction -->
        <p class="mt-2 text-xs text-foreground-secondary">
          <span class="text-foreground-muted">Last:</span> {contact.lastInteraction}
        </p>

        <!-- Agent-specific: buyer needs -->
        {#if contact.type === 'agent' && contact.buyerNeeds}
          <div class="mt-2 rounded-md bg-accent-subtle p-2">
            <p class="text-xs text-foreground-secondary">
              <span class="font-medium text-accent">Looking for:</span> {contact.buyerNeeds}
            </p>
          </div>
        {/if}

        <!-- Relationship strength for agents -->
        {#if contact.type === 'agent' && contact.relationshipStrength}
          <div class="mt-2 flex items-center gap-1">
            {#each Array(5) as _, i}
              <div
                class="size-1.5 rounded-full"
                class:bg-primary={i < (contact.relationshipStrength ?? 0)}
                class:bg-border={i >= (contact.relationshipStrength ?? 0)}
              ></div>
            {/each}
            <span class="ml-1 text-[10px] text-foreground-muted">Relationship</span>
          </div>
        {/if}
      </div>
    </div>
  </a>

{:else}
  <!-- Row variant for tables/lists -->
  <a
    href="/contacts/{contact.id}"
    class="group flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-background-tertiary transition-colors"
  >
    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {contact.initials}
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-foreground truncate group-hover:text-primary">{contact.name}</p>
      <p class="text-xs text-foreground-muted truncate">{contact.company ?? contact.email}</p>
    </div>
    <StatusBadge status={contact.typeLabel} variant={typeVariant[contact.type]} size="sm" />
  </a>
{/if}
