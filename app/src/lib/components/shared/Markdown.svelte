<script lang="ts">
	import { marked } from 'marked';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	const html = $derived(() => {
		if (!content) return '';
		marked.setOptions({ breaks: true, gfm: true });
		return marked.parse(content) as string;
	});
</script>

<div class="markdown-content {className}">
	{@html html()}
</div>

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
</style>
