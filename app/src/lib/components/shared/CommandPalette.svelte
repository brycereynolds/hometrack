<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import { goto } from '$app/navigation';
	import {
		Home,
		Users,
		Wrench,
		CheckSquare,
		UserCircle,
		Plus,
		Mic,
		FileText
	} from 'lucide-svelte';
	import type { Component } from 'svelte';

	let {
		open = $bindable(false),
		onVoiceMemo,
		onQuickNote
	}: {
		open: boolean;
		onVoiceMemo?: () => void;
		onQuickNote?: () => void;
	} = $props();

	let searchQuery = $state('');
	let searchResults = $state<{
		listings: any[];
		contacts: any[];
		tasks: any[];
		vendors: any[];
		team: any[];
	}>({ listings: [], contacts: [], tasks: [], vendors: [], team: [] });
	let isLoading = $state(false);
	let hasSearched = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const categoryConfig: {
		key: keyof typeof searchResults;
		label: string;
		icon: Component;
	}[] = [
		{ key: 'listings', label: 'Listings', icon: Home },
		{ key: 'contacts', label: 'Contacts', icon: Users },
		{ key: 'vendors', label: 'Vendors', icon: Wrench },
		{ key: 'tasks', label: 'Tasks', icon: CheckSquare },
		{ key: 'team', label: 'Team', icon: UserCircle }
	];

	const quickActions: { label: string; icon: Component; href?: string; action?: () => void }[] = [
		{ label: 'New Listing', icon: Plus, href: '/listings/new' },
		{
			label: 'Voice Memo',
			icon: Mic,
			action: () => {
				open = false;
				onVoiceMemo?.();
			}
		},
		{
			label: 'Quick Note',
			icon: FileText,
			action: () => {
				open = false;
				onQuickNote?.();
			}
		}
	];

	const totalResults = $derived(
		searchResults.listings.length +
			searchResults.contacts.length +
			searchResults.tasks.length +
			searchResults.vendors.length +
			searchResults.team.length
	);

	async function performSearch(query: string) {
		if (query.length < 2) {
			searchResults = { listings: [], contacts: [], tasks: [], vendors: [], team: [] };
			hasSearched = false;
			return;
		}
		isLoading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			if (res.ok) {
				searchResults = await res.json();
				hasSearched = true;
			}
		} catch {
			// silently fail
		} finally {
			isLoading = false;
		}
	}

	function onInputChange(value: string) {
		searchQuery = value;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => performSearch(value), 250);
	}

	$effect(() => {
		if (!open) {
			searchQuery = '';
			searchResults = { listings: [], contacts: [], tasks: [], vendors: [], team: [] };
			hasSearched = false;
			isLoading = false;
		}
	});

	function selectResult(href: string) {
		open = false;
		goto(href);
	}
</script>

<Command.Dialog bind:open shouldFilter={false} title="Search" description="Search listings, contacts, vendors, and more">
	<Command.Input placeholder="Search listings, contacts, vendors..." oninput={(e) => onInputChange(e.currentTarget.value)} />
	<Command.List class="max-h-80">
		{#if isLoading}
			<Command.Loading>
				<div class="py-6 text-center text-sm text-muted-foreground">Searching...</div>
			</Command.Loading>
		{/if}

		{#if hasSearched && totalResults === 0 && searchQuery.length >= 2}
			<Command.Empty>No results for '{searchQuery}'</Command.Empty>
		{/if}

		{#each categoryConfig as category}
			{@const items = searchResults[category.key]}
			{#if items.length > 0}
				<Command.Group heading={category.label}>
					{#each items as result}
						<Command.Item
							value="{category.key}-{result.title}"
							onSelect={() => selectResult(result.href)}
							class="cursor-pointer"
						>
							<category.icon class="mr-2 size-4 text-muted-foreground" />
							<div class="min-w-0 flex-1">
								<span class="truncate">{result.title}</span>
								{#if result.subtitle}
									<span class="ml-2 text-xs text-muted-foreground">{result.subtitle}</span>
								{/if}
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		{/each}

		{#if !hasSearched || searchQuery.length < 2}
			<Command.Group heading="Quick Actions">
				{#each quickActions as action}
					<Command.Item
						value="quick-{action.label}"
						onSelect={() => {
							if (action.action) {
								action.action();
							} else if (action.href) {
								selectResult(action.href);
							}
						}}
						class="cursor-pointer"
					>
						<action.icon class="mr-2 size-4 text-muted-foreground" />
						<span>{action.label}</span>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
