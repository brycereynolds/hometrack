<script lang="ts">
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { listings, documents } from '$lib/data/mock-data.js';
	import {
		FileText,
		Upload,
		Search,
		File,
		FileCheck,
		FileClock,
		FileEdit,
		FileWarning,
		Shield,
		Home,
		Scale,
		FileSignature,
		ImageIcon,
		Megaphone,
		FolderOpen,
		CheckCircle2,
		Circle,
		Clock
	} from 'lucide-svelte';

	const listing = $derived(listings.find((l) => l.id === $page.params.id));
	const listingDocs = $derived(documents.filter((d) => d.listingId === listing?.id));

	let activeCategory = $state('all');

	const categories = [
		{ id: 'all', label: 'All Documents', icon: FolderOpen },
		{ id: 'disclosures', label: 'Disclosures', icon: Shield },
		{ id: 'inspection', label: 'Inspection', icon: Search },
		{ id: 'title', label: 'Title', icon: Scale },
		{ id: 'contracts', label: 'Contracts', icon: FileSignature },
		{ id: 'marketing', label: 'Marketing', icon: Megaphone },
		{ id: 'photos', label: 'Photos', icon: ImageIcon }
	];

	const filteredDocs = $derived(
		activeCategory === 'all'
			? listingDocs
			: listingDocs.filter((d) => d.category === activeCategory)
	);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'signed': return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Signed' };
			case 'complete': return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Complete' };
			case 'pending_signature': return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending Signature' };
			case 'draft': return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Draft' };
			case 'expired': return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Expired' };
			default: return { color: 'bg-gray-100 text-gray-600', label: status };
		}
	}

	function getFileIcon(fileType: string) {
		switch (fileType) {
			case 'PDF': return FileText;
			case 'ZIP': return FolderOpen;
			default: return File;
		}
	}

	// Disclosure checklist for the listing
	const disclosureChecklist = [
		{ name: 'Transfer Disclosure Statement (TDS)', required: true, done: listingDocs.some((d) => d.name.includes('TDS') && (d.status === 'signed' || d.status === 'complete')) },
		{ name: 'Seller Property Questionnaire (SPQ)', required: true, done: listingDocs.some((d) => d.name.includes('SPQ') && (d.status === 'signed' || d.status === 'complete')) },
		{ name: 'Natural Hazard Disclosure (NHD)', required: true, done: listingDocs.some((d) => d.name.includes('NHD') && (d.status === 'signed' || d.status === 'complete')) },
		{ name: 'Lead-Based Paint Disclosure', required: true, done: false },
		{ name: 'Homeowners Association (HOA) Docs', required: false, done: false },
		{ name: 'Preliminary Title Report', required: true, done: listingDocs.some((d) => d.name.includes('Preliminary Title') && (d.status === 'signed' || d.status === 'complete')) },
	];

	const disclosuresDone = $derived(disclosureChecklist.filter((d) => d.done).length);
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="font-serif text-lg font-semibold">Documents</h2>
				<p class="text-sm text-muted-foreground">{listingDocs.length} documents</p>
			</div>
			<Button size="sm">
				<Upload class="mr-1.5 size-4" />
				Upload
			</Button>
		</div>

		<div class="grid gap-6 lg:grid-cols-4">
			<!-- Category Sidebar -->
			<div class="lg:col-span-1">
				<Card>
					<CardContent class="p-2">
						<nav class="space-y-0.5">
							{#each categories as cat}
								{@const Icon = cat.icon}
								{@const count = cat.id === 'all' ? listingDocs.length : listingDocs.filter((d) => d.category === cat.id).length}
								<button
									onclick={() => (activeCategory = cat.id)}
									class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors {activeCategory === cat.id
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
								>
									<Icon class="size-4" />
									<span class="flex-1 text-left">{cat.label}</span>
									{#if count > 0}
										<span class="text-xs {activeCategory === cat.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}">{count}</span>
									{/if}
								</button>
							{/each}
						</nav>
					</CardContent>
				</Card>

				<!-- Disclosure Checklist -->
				<Card class="mt-4">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-semibold">Disclosure Checklist</CardTitle>
						<p class="text-xs text-muted-foreground">{disclosuresDone}/{disclosureChecklist.length} complete</p>
					</CardHeader>
					<CardContent>
						<div class="h-1.5 rounded-full bg-muted mb-3">
							<div
								class="h-1.5 rounded-full bg-green-500 transition-all"
								style="width: {(disclosuresDone / disclosureChecklist.length) * 100}%"
							></div>
						</div>
						<div class="space-y-2">
							{#each disclosureChecklist as item}
								<div class="flex items-center gap-2">
									{#if item.done}
										<CheckCircle2 class="size-4 text-green-500 shrink-0" />
										<span class="text-xs text-muted-foreground line-through">{item.name}</span>
									{:else}
										<Circle class="size-4 text-muted-foreground/40 shrink-0" />
										<span class="text-xs">{item.name}</span>
										{#if item.required}
											<Badge variant="outline" class="text-[9px] px-1 py-0 h-3.5 border-red-200 text-red-600">Req</Badge>
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Document Grid -->
			<div class="lg:col-span-3 space-y-4">
				<!-- Upload Drop Zone -->
				<div class="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30 cursor-pointer">
					<Upload class="mx-auto size-8 text-muted-foreground/40" />
					<p class="mt-2 text-sm text-muted-foreground">
						Drag & drop files here, or <span class="text-primary font-medium">browse</span>
					</p>
					<p class="mt-1 text-xs text-muted-foreground/60">PDF, DOC, ZIP, JPG up to 50MB</p>
				</div>

				<!-- Document List -->
				{#if filteredDocs.length > 0}
					<div class="grid gap-3 sm:grid-cols-2">
						{#each filteredDocs as doc}
							{@const FileIcon = getFileIcon(doc.fileType)}
							{@const status = getStatusBadge(doc.status)}
							<Card class="transition-shadow hover:shadow-md cursor-pointer">
								<CardContent class="p-4">
									<div class="flex items-start gap-3">
										<div class="rounded-lg bg-muted p-2 shrink-0">
											<FileIcon class="size-5 text-muted-foreground" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium truncate">{doc.name}</p>
											<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
												<span>{doc.fileType}</span>
												<span>--</span>
												<span>{doc.fileSize}</span>
											</div>
											<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
												<span>{doc.uploadedBy}</span>
												<span>--</span>
												<span>{doc.uploadedDate}</span>
											</div>
										</div>
									</div>
									<div class="mt-3 flex items-center justify-between">
										<Badge variant="outline" class="text-[10px] {status.color}">
											{status.label}
										</Badge>
										{#if doc.version > 1}
											<span class="text-[10px] text-muted-foreground">v{doc.version}</span>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-12">
						<FileText class="size-10 text-muted-foreground/30 mb-3" />
						<p class="text-sm text-muted-foreground">No documents in this category.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
