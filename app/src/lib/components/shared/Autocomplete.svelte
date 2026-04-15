<script lang="ts">
	import { Check, ChevronsUpDown } from 'lucide-svelte';

	interface Item {
		value: string;
		label: string;
		subtitle?: string;
	}

	interface Props {
		items: Item[];
		value: string;
		placeholder?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		autofocus?: boolean;
		class?: string;
	}

	let {
		items,
		value = $bindable(''),
		placeholder = 'Search...',
		name,
		required = false,
		disabled = false,
		autofocus = false,
		class: className = '',
	}: Props = $props();

	let query = $state('');
	let open = $state(false);
	let highlightedIndex = $state(-1);
	let inputEl = $state<HTMLInputElement>(undefined!);
	let listEl = $state<HTMLUListElement>(undefined!);

	const sortedItems = $derived(
		[...items].sort((a, b) => a.label.localeCompare(b.label))
	);

	const filtered = $derived(
		query.trim() === ''
			? sortedItems
			: sortedItems.filter((item) => {
					const q = query.toLowerCase();
					return (
						item.label.toLowerCase().includes(q) ||
						(item.subtitle?.toLowerCase().includes(q) ?? false)
					);
				})
	);

	const selectedItem = $derived(items.find((i) => i.value === value));

	// Keep display text in sync with selection
	$effect(() => {
		if (!open) {
			query = selectedItem?.label ?? '';
		}
	});

	function openDropdown() {
		if (disabled) return;
		open = true;
		query = '';
		highlightedIndex = -1;
	}

	function closeDropdown() {
		open = false;
		query = selectedItem?.label ?? '';
		highlightedIndex = -1;
	}

	function select(item: Item) {
		value = item.value;
		closeDropdown();
		inputEl?.blur();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
				e.preventDefault();
				openDropdown();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = (highlightedIndex + 1) % filtered.length;
				scrollToHighlighted();
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = highlightedIndex <= 0 ? filtered.length - 1 : highlightedIndex - 1;
				scrollToHighlighted();
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
					select(filtered[highlightedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				closeDropdown();
				break;
			case 'Tab':
				closeDropdown();
				break;
		}
	}

	function scrollToHighlighted() {
		requestAnimationFrame(() => {
			const el = listEl?.querySelector('[data-highlighted="true"]');
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	function handleBlur(e: FocusEvent) {
		const related = e.relatedTarget as HTMLElement | null;
		if (related && listEl?.contains(related)) return;
		closeDropdown();
	}
</script>

<div class="relative {className}">
	{#if name}
		<input type="hidden" {name} value={value} {required} />
	{/if}

	<div class="relative">
		<input
			bind:this={inputEl}
			type="text"
			bind:value={query}
			{placeholder}
			{disabled}
			{required}
			autocomplete="off"
			class="h-10 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
			onfocus={openDropdown}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			role="combobox"
			aria-expanded={open}
			aria-autocomplete="list"
			aria-controls="autocomplete-list"
		/>
		<button
			type="button"
			tabindex={-1}
			class="absolute right-0 top-0 flex h-10 w-8 items-center justify-center text-muted-foreground"
			onclick={() => { if (open) closeDropdown(); else { inputEl?.focus(); openDropdown(); } }}
		>
			<ChevronsUpDown class="size-4" />
		</button>
	</div>

	{#if open && filtered.length > 0}
		<ul
			bind:this={listEl}
			id="autocomplete-list"
			role="listbox"
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg"
		>
			{#each filtered as item, i}
				<li
					role="option"
					aria-selected={item.value === value}
					data-highlighted={i === highlightedIndex}
					tabindex={-1}
					class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none
						{i === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}
					"
					onmousedown={(e) => { e.preventDefault(); select(item); }}
					onmouseenter={() => { highlightedIndex = i; }}
				>
					<span class="flex min-w-0 flex-1 flex-col">
						<span class="truncate">{item.label}</span>
						{#if item.subtitle}
							<span class="truncate text-xs text-muted-foreground">{item.subtitle}</span>
						{/if}
					</span>
					{#if item.value === value}
						<Check class="ml-2 size-4 shrink-0" />
					{/if}
				</li>
			{/each}
		</ul>
	{:else if open && filtered.length === 0}
		<div class="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-lg">
			No results found.
		</div>
	{/if}
</div>
