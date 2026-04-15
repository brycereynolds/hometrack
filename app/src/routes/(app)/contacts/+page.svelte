<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { ContactType } from '$lib/config.js';
	import { Plus, Search, Mail, Phone, Users, Star, ArrowUpDown } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button as Btn } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	const contacts = $derived(data.contacts);

	type FilterType = 'all' | ContactType;

	let search = $state('');
	let activeFilter = $state<FilterType>('all');
	let sortBy = $state<'name' | 'lastInteraction' | 'type'>('name');

	// Add Contact modal state
	let showAddContact = $state(false);
	let newContactName = $state('');
	let newContactEmail = $state('');
	let newContactPhone = $state('');
	let newContactType = $state<ContactType>('client');
	let newContactCompany = $state('');
	let submittingContact = $state(false);

	const filters: { label: string; value: FilterType }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'Clients', value: 'client' },
		{ label: 'Agents', value: 'agent' },
		{ label: 'Vendors', value: 'vendor' },
		{ label: 'Lenders', value: 'lender' },
		{ label: 'Inspectors', value: 'inspector' },
	];

	const typeLabels: Record<string, string> = {
		client: 'Client',
		agent: 'Agent',
		vendor: 'Vendor',
		lender: 'Lender',
		inspector: 'Inspector',
		title: 'Title',
	};

	const typeColors: Record<string, string> = {
		client: 'bg-primary/10 text-primary',
		agent: 'bg-blue-100 text-blue-700',
		vendor: 'bg-emerald-100 text-emerald-700',
		lender: 'bg-amber-100 text-amber-700',
		inspector: 'bg-slate-100 text-slate-600',
		title: 'bg-slate-100 text-slate-600',
	};

	const filtered = $derived(() => {
		let result = contacts;
		if (activeFilter !== 'all') {
			result = result.filter((c) => c.type === activeFilter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					(c.company && c.company.toLowerCase().includes(q)) ||
					(c.email && c.email.toLowerCase().includes(q))
			);
		}
		result = [...result].sort((a, b) => {
			if (sortBy === 'name') return a.name.localeCompare(b.name);
			if (sortBy === 'lastInteraction') {
				const aDate = a.lastInteractionDate ? new Date(a.lastInteractionDate).getTime() : 0;
				const bDate = b.lastInteractionDate ? new Date(b.lastInteractionDate).getTime() : 0;
				return bDate - aDate;
			}
			return a.type.localeCompare(b.type);
		});
		return result;
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-serif text-3xl font-bold">Contacts</h1>
			<p class="mt-1 text-sm text-muted-foreground">{contacts.length} contacts in your network</p>
		</div>
		<Button onclick={() => {
			newContactName = '';
			newContactEmail = '';
			newContactPhone = '';
			newContactType = 'client';
			newContactCompany = '';
			showAddContact = true;
		}}>
			<Plus class="mr-1.5 size-4" />
			Add Contact
		</Button>
	</div>

	<!-- Search & Filters -->
	<div class="space-y-3">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				bind:value={search}
				placeholder="Search contacts by name, company, or email..."
				class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#each filters as f}
				<button
					onclick={() => (activeFilter = f.value)}
					class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors {activeFilter ===
					f.value
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				>
					{f.label}
				</button>
			{/each}
			<Separator orientation="vertical" class="mx-1 h-6" />
			<div class="flex items-center gap-1">
				<ArrowUpDown class="size-3.5 text-muted-foreground" />
				<select
					bind:value={sortBy}
					class="border-none bg-transparent text-sm text-muted-foreground outline-none"
				>
					<option value="name">Name</option>
					<option value="lastInteraction">Last Interaction</option>
					<option value="type">Type</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Results count -->
	<p class="text-sm text-muted-foreground">
		Showing {filtered().length} contact{filtered().length !== 1 ? 's' : ''}
	</p>

	<!-- Contact List -->
	<div class="space-y-2">
		{#each filtered() as contact (contact.id)}
			<a href="/contacts/{contact.id}" class="block">
				<Card class="transition-all hover:bg-muted/50 hover:shadow-sm">
					<CardContent class="flex items-center gap-4 p-4">
						<Avatar class="size-10">
							<AvatarFallback class="bg-primary/10 text-sm font-semibold text-primary"
								>{contact.initials ?? contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback
							>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="font-medium">{contact.name}</p>
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {typeColors[
										contact.type
									]}"
								>
									{typeLabels[contact.type] ?? contact.type}
								</span>
							</div>
							<div class="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
								{#if contact.company}
									<span>{contact.company}</span>
									<span class="text-border">|</span>
								{/if}
								<span class="truncate">{contact.lastInteraction ?? ''}</span>
							</div>
						</div>

						<!-- Listing count placeholder -->

						<!-- Agent relationship strength -->
						{#if contact.type === 'agent' && contact.relationshipStrength}
							<div class="hidden items-center gap-0.5 sm:flex">
								{#each Array(5) as _, i}
									<Star
										class="size-3.5 {i < (contact.relationshipStrength ?? 0)
											? 'fill-amber-400 text-amber-400'
											: 'text-muted-foreground/30'}"
									/>
								{/each}
							</div>
						{/if}

						<!-- Actions -->
						<div class="hidden items-center gap-1 sm:flex">
							<Button variant="ghost" size="icon" class="size-8" href="mailto:{contact.email ?? ''}">
								<Mail class="size-3.5" />
							</Button>
							<Button variant="ghost" size="icon" class="size-8" href="tel:{contact.phone ?? ''}">
								<Phone class="size-3.5" />
							</Button>
						</div>
					</CardContent>
				</Card>
			</a>
		{:else}
			<div class="py-12 text-center">
				<Users class="mx-auto size-10 text-muted-foreground/40" />
				<p class="mt-3 font-medium text-muted-foreground">No contacts found</p>
				<p class="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
			</div>
		{/each}
	</div>
</div>

<!-- Add Contact Modal -->
<Dialog.Root bind:open={showAddContact}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Add Contact</Dialog.Title>
			<Dialog.Description>Add a new contact to your network.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				submittingContact = true;
				return async ({ result, update }) => {
					submittingContact = false;
					if (result.type === 'success') {
						showAddContact = false;
						toast.success('Contact added successfully');
						await update();
					} else if (result.type === 'failure') {
						toast.error(String(result.data?.error ?? 'Failed to add contact'));
					}
				};
			}}
		>
			<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
			<div class="space-y-4 py-4">
				<div>
					<label for="contact-name" class="text-sm font-medium">Full Name</label>
					<input
						id="contact-name"
						name="name"
						type="text"
						bind:value={newContactName}
						placeholder="e.g. Jane Smith"
						required
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="contact-email" class="text-sm font-medium">Email</label>
					<input
						id="contact-email"
						name="email"
						type="email"
						bind:value={newContactEmail}
						placeholder="jane@example.com"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div>
					<label for="contact-phone" class="text-sm font-medium">Phone</label>
					<input
						id="contact-phone"
						name="phone"
						type="tel"
						bind:value={newContactPhone}
						placeholder="(555) 123-4567"
						class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="contact-type" class="text-sm font-medium">Type</label>
						<select
							id="contact-type"
							name="type"
							bind:value={newContactType}
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						>
							<option value="client">Client</option>
							<option value="agent">Agent</option>
							<option value="vendor">Vendor</option>
							<option value="lender">Lender</option>
							<option value="inspector">Inspector</option>
						</select>
					</div>
					<div>
						<label for="contact-company" class="text-sm font-medium">Company</label>
						<input
							id="contact-company"
							name="company"
							type="text"
							bind:value={newContactCompany}
							placeholder="Optional"
							class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
						/>
					</div>
				</div>
			</div>
			<Dialog.Footer>
				<Btn variant="outline" type="button" onclick={() => showAddContact = false}>Cancel</Btn>
				<Btn type="submit" disabled={submittingContact || !newContactName.trim()}>
					{submittingContact ? 'Adding...' : 'Add Contact'}
				</Btn>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
