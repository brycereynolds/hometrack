<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		propertyId: string;
		href?: string;
		class?: string;
		children?: Snippet;
	}

	let { propertyId, href, class: className = '', children }: Props = $props();

	const resolvedHref = $derived(href ?? `/properties/${propertyId}`);

	let linkEl: HTMLAnchorElement | undefined = $state();
	let popover: {
		visible: boolean;
		x: number;
		y: number;
		above: boolean;
		data: {
			address: string;
			city: string;
			state: string;
			beds: number | null;
			baths: number | null;
			sqft: number | null;
			yearBuilt: number | null;
			price: number | null;
			lastSoldDate: string | null;
			zestimate: number | null;
			photoUrl: string | null;
		} | null;
	} = $state({ visible: false, x: 0, y: 0, above: true, data: null });

	let hoverTimeout: ReturnType<typeof setTimeout> | undefined;
	let hideTimeout: ReturnType<typeof setTimeout> | undefined;

	// Module-level cache shared across all PropertyLink instances
	const previewCache = new Map<string, any>();

	function formatPrice(n: number | null): string {
		if (n == null) return '\u2014';
		return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	function formatSoldTime(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays < 0) return '';
		if (diffDays <= 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		const diffMonths = Math.round(diffDays / 30.44);
		if (diffMonths <= 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
		return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}

	async function fetchPreview(id: string) {
		if (previewCache.has(id)) return previewCache.get(id);
		try {
			const res = await fetch(`/api/properties/${id}/preview`);
			if (!res.ok) return null;
			const data = await res.json();
			previewCache.set(id, data);
			return data;
		} catch {
			return null;
		}
	}

	function showPopover(e: MouseEvent) {
		clearTimeout(hideTimeout);
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		hoverTimeout = setTimeout(async () => {
			const data = await fetchPreview(propertyId);
			if (!data) return;

			const spaceAbove = rect.top;
			const spaceBelow = window.innerHeight - rect.bottom;
			// Popover is roughly 260px tall (photo 140 + details ~120)
			const popoverHeight = 260;
			const above = spaceAbove >= popoverHeight || spaceAbove > spaceBelow;

			let x = rect.left + rect.width / 2;
			// Clamp horizontally so popover (280px wide) stays on screen
			const halfWidth = 140;
			if (x - halfWidth < 8) x = halfWidth + 8;
			if (x + halfWidth > window.innerWidth - 8) x = window.innerWidth - halfWidth - 8;

			popover = {
				visible: true,
				x,
				y: above ? rect.top : rect.bottom,
				above,
				data,
			};
		}, 300);
	}

	function hidePopover() {
		clearTimeout(hoverTimeout);
		hideTimeout = setTimeout(() => {
			popover = { visible: false, x: 0, y: 0, above: true, data: null };
		}, 200);
	}

	function keepPopoverOpen() {
		clearTimeout(hideTimeout);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<a
	bind:this={linkEl}
	href={resolvedHref}
	class="property-link {className}"
	onmouseenter={showPopover}
	onmouseleave={hidePopover}
>
	{#if children}
		{@render children()}
	{:else}
		{propertyId}
	{/if}
</a>

{#if popover.visible && popover.data}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="property-popover"
		class:popover-below={!popover.above}
		style="left: {popover.x}px; top: {popover.y}px;"
		onmouseenter={keepPopoverOpen}
		onmouseleave={hidePopover}
	>
		<a href={resolvedHref} class="popover-inner">
			{#if popover.data.photoUrl}
				<img
					src={popover.data.photoUrl}
					alt={popover.data.address}
					class="popover-photo"
				/>
			{/if}
			<div class="popover-details">
				<div class="popover-address">{popover.data.address}</div>
				<div class="popover-city">{popover.data.city}, {popover.data.state}</div>
				<div class="popover-stats">
					{#if popover.data.beds != null}<span>{popover.data.beds} bd</span>{/if}
					{#if popover.data.baths != null}<span>{popover.data.baths} ba</span>{/if}
					{#if popover.data.sqft != null}<span>{popover.data.sqft.toLocaleString()} sqft</span>{/if}
					{#if popover.data.yearBuilt != null}<span>Built {popover.data.yearBuilt}</span>{/if}
				</div>
				{#if popover.data.price || popover.data.zestimate}
					<div class="popover-prices">
						{#if popover.data.price}
							<span class="popover-price">Sold {formatPrice(popover.data.price)}{#if popover.data.lastSoldDate}{' '}&middot; {formatSoldTime(popover.data.lastSoldDate)}{/if}</span>
						{/if}
						{#if popover.data.zestimate}
							<span class="popover-zestimate">Zestimate {formatPrice(popover.data.zestimate)}</span>
						{/if}
					</div>
				{/if}
			</div>
		</a>
	</div>
{/if}

<style>
	.property-link {
		color: var(--color-primary, #C4704B);
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.property-link:hover {
		text-decoration-style: solid;
	}

	/* Property popover — above the link (default) */
	.property-popover {
		position: fixed;
		transform: translate(-50%, -100%);
		margin-top: -8px;
		z-index: 50;
		pointer-events: auto;
		animation: popover-in-above 0.15s ease-out;
	}

	/* Property popover — below the link */
	.property-popover.popover-below {
		transform: translate(-50%, 0%);
		margin-top: 8px;
		animation: popover-in-below 0.15s ease-out;
	}

	@keyframes popover-in-above {
		from {
			opacity: 0;
			transform: translate(-50%, -100%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -100%) translateY(0);
		}
	}

	@keyframes popover-in-below {
		from {
			opacity: 0;
			transform: translate(-50%, 0%) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0%) translateY(0);
		}
	}

	.popover-inner {
		display: block;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -5px rgba(0, 0, 0, 0.08);
		border: 1px solid var(--color-stone-200, #e7e5e4);
		overflow: hidden;
		width: 280px;
		text-decoration: none;
		color: inherit;
	}

	.popover-inner:hover {
		text-decoration: none;
	}

	.popover-photo {
		width: 100%;
		height: 140px;
		object-fit: cover;
		display: block;
	}

	.popover-details {
		padding: 0.75rem;
	}

	.popover-address {
		font-weight: 600;
		color: var(--color-stone-900, #1c1917);
		font-size: 0.875rem;
		line-height: 1.25;
	}

	.popover-city {
		color: var(--color-stone-500, #78716c);
		font-size: 0.8125rem;
		margin-top: 0.125rem;
	}

	.popover-stats {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-stone-600, #57534e);
		flex-wrap: wrap;
	}

	.popover-stats span:not(:last-child)::after {
		content: '\00b7';
		margin-left: 0.5rem;
		color: var(--color-stone-300, #d6d3d1);
	}

	.popover-prices {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
		font-size: 0.8125rem;
	}

	.popover-price {
		font-weight: 600;
		color: var(--color-stone-900, #1c1917);
	}

	.popover-zestimate {
		color: var(--color-stone-500, #78716c);
	}
</style>
