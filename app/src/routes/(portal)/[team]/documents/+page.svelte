<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		FileText,
		Download,
		Eye,
		PenTool,
		Shield,
		Camera,
		ClipboardList,
		Search as SearchIcon,
		FileCheck
	} from 'lucide-svelte';
	let { data } = $props();

	const clientDocs = $derived(data.documents ?? []);

	// Group by category
	const categories = [
		{ key: 'contracts', label: 'Contracts', icon: FileText },
		{ key: 'disclosures', label: 'Disclosures', icon: Shield },
		{ key: 'inspection', label: 'Inspection Reports', icon: ClipboardList },
		{ key: 'marketing', label: 'Marketing Materials', icon: Camera },
		{ key: 'photos', label: 'Photos & Media', icon: Camera }
	] as const;

	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending_signature':
				return { label: 'Awaiting your signature', class: 'bg-amber-500/10 text-amber-700 border-amber-200' };
			case 'signed':
				return { label: 'Signed', class: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' };
			case 'complete':
				return { label: 'Complete', class: 'bg-blue-500/10 text-blue-700 border-blue-200' };
			case 'draft':
				return { label: 'Draft', class: 'bg-muted text-muted-foreground' };
			default:
				return { label: status, class: 'bg-muted text-muted-foreground' };
		}
	}

	let searchQuery = $state('');
	let filteredDocs = $derived(
		searchQuery
			? clientDocs.filter(
					(d: any) =>
						d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(d.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
				)
			: clientDocs
	);
	let pendingSig = $derived(filteredDocs.filter((d) => d.status === 'pending_signature'));
</script>

<div class="space-y-6">
	<div>
		<h1 class="font-serif text-2xl font-bold tracking-tight">Documents</h1>
		<p class="text-muted-foreground">All documents shared with you for 123 Main Street.</p>
	</div>

	<!-- Search -->
	<div class="relative max-w-sm">
		<SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search documents..."
			class="h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
		/>
	</div>

	<!-- Signature needed alert -->
	{#if pendingSig.length > 0}
		<Card class="border-amber-200 bg-amber-50/50">
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
						<PenTool class="size-5 text-amber-600" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-amber-900">
							{pendingSig.length} document{pendingSig.length > 1 ? 's' : ''} awaiting your signature
						</p>
						<p class="text-xs text-amber-700">
							{pendingSig.map((d) => d.name).join(', ')}
						</p>
					</div>
					<Button size="sm" class="shrink-0 gap-1.5 bg-amber-600 hover:bg-amber-700">
						<PenTool class="size-3.5" />
						Sign Now
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Documents by category -->
	{#each categories as category}
		{@const categoryDocs = filteredDocs.filter((d) => d.category === category.key)}
		{#if categoryDocs.length > 0}
			<div class="space-y-2">
				<h2 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<category.icon class="size-4" />
					{category.label}
					<Badge variant="outline" class="text-[10px]">{categoryDocs.length}</Badge>
				</h2>

				<div class="space-y-1.5">
					{#each categoryDocs as doc}
						{@const badge = getStatusBadge(doc.status)}
						<Card class="transition-colors hover:bg-muted/30">
							<CardContent class="flex items-center gap-4 p-3 sm:p-4">
								<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
									{#if doc.status === 'pending_signature'}
										<PenTool class="size-4 text-amber-600" />
									{:else if doc.status === 'signed'}
										<FileCheck class="size-4 text-emerald-600" />
									{:else}
										<FileText class="size-4 text-muted-foreground" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium leading-tight">{doc.name}</p>
									<p class="text-xs text-muted-foreground">
										{doc.fileType} &middot; {doc.fileSize} &middot; Shared {doc.uploadedDate}
										{#if doc.version > 1}
											&middot; v{doc.version}
										{/if}
									</p>
								</div>
								<Badge variant="outline" class="hidden shrink-0 text-xs sm:flex {badge.class}">
									{badge.label}
								</Badge>
								<div class="flex gap-1">
									{#if doc.status === 'pending_signature'}
										<Button size="sm" variant="default" class="gap-1 text-xs">
											<PenTool class="size-3" />
											Sign
										</Button>
									{:else}
										<Button variant="ghost" size="icon" class="size-8">
											<Eye class="size-3.5" />
										</Button>
										<Button variant="ghost" size="icon" class="size-8">
											<Download class="size-3.5" />
										</Button>
									{/if}
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
