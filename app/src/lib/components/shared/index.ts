// Shared component library — re-exports for easy imports
// Usage: import { AppLayout, PageHeader, MetricCard } from '../_shared';

// Layouts
export { default as AppLayout } from './AppLayout.svelte';
export { default as PortalLayout } from './PortalLayout.svelte';
export { default as AuthLayout } from './AuthLayout.svelte';

// Navigation
export { default as Sidebar } from './Sidebar.svelte';
export { default as MobileBottomNav } from './MobileBottomNav.svelte';
export { default as Breadcrumbs } from './Breadcrumbs.svelte';
export { default as ListingDetailTabs } from './ListingDetailTabs.svelte';

// Page patterns
export { default as PageHeader } from './PageHeader.svelte';
export { default as EmptyState } from './EmptyState.svelte';
export { default as MetricCard } from './MetricCard.svelte';
export { default as PhaseBadge } from './PhaseBadge.svelte';
export { default as StatusBadge } from './StatusBadge.svelte';
export { default as DataTable } from './DataTable.svelte';
export { default as ListingCard } from './ListingCard.svelte';
export { default as ContactCard } from './ContactCard.svelte';
export { default as ActivityFeedItem } from './ActivityFeedItem.svelte';
export { default as AIInsightCard } from './AIInsightCard.svelte';
export { default as ProcessingStatus } from './ProcessingStatus.svelte';
export { default as Autocomplete } from './Autocomplete.svelte';
export { default as VoiceMemoModal } from './VoiceMemoModal.svelte';
export { default as QuickNoteModal } from './QuickNoteModal.svelte';

// Config, types, and utilities (replaces mock-data re-export)
export * from '$lib/config';
export * from '$lib/utils';
export * from '$lib/types';
