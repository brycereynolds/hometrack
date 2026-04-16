<script lang="ts">
	import { marked } from 'marked';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();
	let containerEl: HTMLDivElement | undefined = $state();
	let popover: {
		visible: boolean;
		x: number;
		y: number;
		data: {
			address: string;
			city: string;
			state: string;
			beds: number | null;
			baths: number | null;
			sqft: number | null;
			yearBuilt: number | null;
			price: number | null;
			zestimate: number | null;
			photoUrl: string | null;
		} | null;
		href: string;
	} = $state({ visible: false, x: 0, y: 0, data: null, href: '' });

	let hoverTimeout: ReturnType<typeof setTimeout> | undefined;
	let hideTimeout: ReturnType<typeof setTimeout> | undefined;
	const previewCache = new Map<string, any>();

	const html = $derived(() => {
		if (!content) return '';
		marked.setOptions({ breaks: true, gfm: true });
		return marked.parse(content) as string;
	});

	function formatPrice(n: number | null): string {
		if (n == null) return '—';
		return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	async function fetchPreview(propertyId: string) {
		if (previewCache.has(propertyId)) return previewCache.get(propertyId);
		try {
			const res = await fetch(`/api/properties/${propertyId}/preview`);
			if (!res.ok) return null;
			const data = await res.json();
			previewCache.set(propertyId, data);
			return data;
		} catch {
			return null;
		}
	}

	function showPopover(e: MouseEvent, href: string) {
		clearTimeout(hideTimeout);
		const propertyId = href.replace('/properties/', '');
		const rect = (e.target as HTMLElement).getBoundingClientRect();

		hoverTimeout = setTimeout(async () => {
			const data = await fetchPreview(propertyId);
			if (!data) return;
			popover = {
				visible: true,
				x: rect.left + rect.width / 2,
				y: rect.top,
				data,
				href,
			};
		}, 300);
	}

	function hidePopover() {
		clearTimeout(hoverTimeout);
		hideTimeout = setTimeout(() => {
			popover = { visible: false, x: 0, y: 0, data: null, href: '' };
		}, 200);
	}

	function keepPopoverOpen() {
		clearTimeout(hideTimeout);
	}

	$effect(() => {
		// Re-run when html changes
		html();

		if (!containerEl) return;

		const links = containerEl.querySelectorAll<HTMLAnchorElement>('a[href^="/properties/"]');

		const handlers = new Map<HTMLAnchorElement, { enter: (e: MouseEvent) => void; leave: () => void }>();

		for (const link of links) {
			const href = link.getAttribute('href')!;
			const enter = (e: MouseEvent) => showPopover(e, href);
			const leave = () => hidePopover();
			link.addEventListener('mouseenter', enter);
			link.addEventListener('mouseleave', leave);
			handlers.set(link, { enter, leave });
		}

		return () => {
			for (const [link, { enter, leave }] of handlers) {
				link.removeEventListener('mouseenter', enter);
				link.removeEventListener('mouseleave', leave);
			}
		};
	});
</script>

<div class="markdown-content {className}" bind:this={containerEl}>
	{@html html()}
</div>

{#if popover.visible && popover.data}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="property-popover"
		style="left: {popover.x}px; top: {popover.y}px;"
		onmouseenter={keepPopoverOpen}
		onmouseleave={hidePopover}
	>
		<a href={popover.href} class="popover-inner">
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
							<span class="popover-price">Sold {formatPrice(popover.data.price)}</span>
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
	:global(.markdown-content p) {
		margin-bottom: 1rem;
	}
	:global(.markdown-content p:last-child) {
		margin-bottom: 0;
	}
	:global(.markdown-content h1),
	:global(.markdown-content h2),
	:global(.markdown-content h3),
	:global(.markdown-content h4) {
		font-family: 'DM Serif Display', serif;
		color: var(--color-stone-900, #1c1917);
		font-weight: 600;
	}
	:global(.markdown-content h1) { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
	:global(.markdown-content h2) { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
	:global(.markdown-content h3) { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
	:global(.markdown-content h4) { font-size: 1rem; margin: 0.75rem 0 0.5rem; }
	:global(.markdown-content strong) {
		color: var(--color-stone-900, #1c1917);
		font-weight: 600;
	}
	:global(.markdown-content em) {
		font-style: italic;
	}
	:global(.markdown-content ul),
	:global(.markdown-content ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}
	:global(.markdown-content ul) { list-style-type: disc; }
	:global(.markdown-content ol) { list-style-type: decimal; }
	:global(.markdown-content li) {
		margin-bottom: 0.25rem;
		line-height: 1.75;
	}
	:global(.markdown-content blockquote) {
		border-left: 3px solid var(--color-stone-300, #d6d3d1);
		padding-left: 1rem;
		margin: 1rem 0;
		color: var(--color-stone-600, #57534e);
		font-style: italic;
	}
	:global(.markdown-content code) {
		background: var(--color-stone-100, #f5f5f4);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	:global(.markdown-content pre) {
		background: var(--color-stone-100, #f5f5f4);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}
	:global(.markdown-content pre code) {
		background: none;
		padding: 0;
	}
	:global(.markdown-content hr) {
		border: none;
		border-top: 1px solid var(--color-stone-200, #e7e5e4);
		margin: 1.5rem 0;
	}
	:global(.markdown-content a) {
		color: var(--color-primary, #C4704B);
		text-decoration: underline;
		cursor: pointer;
	}
	:global(.markdown-content a[href^="/properties/"]) {
		text-decoration-style: dotted;
		text-underline-offset: 2px;
	}
	:global(.markdown-content a[href^="/properties/"]:hover) {
		text-decoration-style: solid;
	}
	:global(.markdown-content table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}
	:global(.markdown-content th),
	:global(.markdown-content td) {
		border: 1px solid var(--color-stone-200, #e7e5e4);
		padding: 0.5rem 0.75rem;
		text-align: left;
	}
	:global(.markdown-content th) {
		background: var(--color-stone-50, #fafaf9);
		font-weight: 600;
	}

	/* Property popover */
	.property-popover {
		position: fixed;
		transform: translate(-50%, -100%);
		margin-top: -8px;
		z-index: 50;
		pointer-events: auto;
		animation: popover-in 0.15s ease-out;
	}

	@keyframes popover-in {
		from {
			opacity: 0;
			transform: translate(-50%, -100%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -100%) translateY(0);
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
