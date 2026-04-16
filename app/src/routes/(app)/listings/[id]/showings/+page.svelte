<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Chart, registerables } from 'chart.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		Calendar,
		Clock,
		Star,
		Users,
		ThumbsUp,
		ThumbsDown,
		Minus,
		MessageSquare,
		Plus,
		TrendingUp,
		ArrowRight,
		Building2,
		Pencil,
		Trash2,
		XCircle
	} from 'lucide-svelte';

	Chart.register(...registerables);

	let { data } = $props();

	// Schedule Showing modal state
	let showShowingModal = $state(false);
	let showingDate = $state('');
	let showingTime = $state('');
	let showingAgentName = $state('');
	let showingAgentCompany = $state('');
	let showingBuyerType = $state('');

	// Edit Showing modal state
	let showEditModal = $state(false);
	let editShowingId = $state('');
	let editDate = $state('');
	let editTime = $state('');
	let editAgentName = $state('');
	let editAgentCompany = $state('');
	let editBuyerType = $state('');

	// Feedback state
	let feedbackShowingId = $state<string | null>(null);
	let feedbackRating = $state(0);
	let feedbackLevel = $state('');
	let feedbackNotes = $state('');

	// Cancel confirmation
	let cancelingShowingId = $state<string | null>(null);

	function resetShowingForm() {
		showingDate = '';
		showingTime = '';
		showingAgentName = '';
		showingAgentCompany = '';
		showingBuyerType = '';
	}

	function openEditShowing(showing: any) {
		editShowingId = showing.id;
		const d = showing.date instanceof Date ? showing.date : new Date(showing.date);
		editDate = d.toISOString().split('T')[0];
		editTime = showing.time ?? '';
		editAgentName = showing.agentName ?? '';
		editAgentCompany = showing.agentCompany ?? '';
		editBuyerType = showing.buyerType ?? '';
		showEditModal = true;
	}

	function openFeedback(showing: any) {
		feedbackShowingId = showing.id;
		feedbackRating = showing.rating ?? 0;
		feedbackLevel = showing.interestedLevel ?? '';
		feedbackNotes = showing.feedback ?? '';
	}

	const listing = $derived(data.listing);
	const listingShowings = $derived(data.showings ?? []);
	const showingsTimeSeries = $derived(data.showingsTimeSeries ?? { labels: [] as string[], showings: [] as number[], openHouseAttendees: [] as number[] });

	const upcomingShowings = $derived(
		listingShowings.filter((s: any) => new Date(s.date) >= new Date())
	);
	const pastShowings = $derived(
		listingShowings.filter((s: any) => new Date(s.date) < new Date())
	);

	const veryInterested = $derived(listingShowings.filter((s: any) => s.interestedLevel === 'very').length);
	const somewhatInterested = $derived(listingShowings.filter((s: any) => s.interestedLevel === 'somewhat').length);

	let funnelCanvas = $state<HTMLCanvasElement>(null!);
	let volumeCanvas = $state<HTMLCanvasElement>(null!);
	let funnelChart: Chart | null = null;
	let volumeChart: Chart | null = null;

	function formatDate(d: any): string {
		if (!d) return '';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(() => {
		funnelChart = new Chart(funnelCanvas, {
			type: 'bar',
			data: {
				labels: ['Showings', 'Very Interested', 'Offers'],
				datasets: [{ data: [listingShowings.length, veryInterested, listing?.offersCount ?? 0], backgroundColor: ['#C4704B', '#D4956B', '#5B8BA5'], borderWidth: 0, borderRadius: 6, barPercentage: 0.6 }]
			},
			options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 11 } } }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: 'bold' } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} total` } } } }
		});

		volumeChart = new Chart(volumeCanvas, {
			type: 'bar',
			data: {
				labels: showingsTimeSeries.labels,
				datasets: [
					{ label: 'Private Showings', data: showingsTimeSeries.showings, backgroundColor: '#C4704B', borderRadius: 4, barPercentage: 0.7 },
					{ label: 'Open House Attendees', data: showingsTimeSeries.openHouseAttendees, backgroundColor: '#D4956B80', borderRadius: 4, barPercentage: 0.7 }
				]
			},
			options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } }, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 16 } } } }
		});

		return () => { funnelChart?.destroy(); volumeChart?.destroy(); };
	});

	function getInterestBadge(level?: string) {
		switch (level) {
			case 'very': return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Very Interested', icon: ThumbsUp };
			case 'somewhat': return { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Somewhat', icon: Minus };
			case 'not': return { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Not Interested', icon: ThumbsDown };
			default: return { color: 'bg-gray-100 text-gray-500', label: 'No Feedback', icon: Minus };
		}
	}

	function getStars(rating?: number) {
		return Array(5).fill(0).map((_, i) => i < (rating || 0));
	}
</script>

{#if listing}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div><h2 class="font-serif text-lg font-semibold">Showings</h2><p class="text-sm text-muted-foreground">{listingShowings.length} total showings</p></div>
			<Button size="sm" onclick={() => { resetShowingForm(); showShowingModal = true; }}><Plus class="mr-1.5 size-4" />Schedule Showing</Button>
		</div>

		<!-- Charts Row -->
		<div class="grid gap-6 lg:grid-cols-2">
			<Card><CardHeader><CardTitle class="font-serif text-base">Conversion Funnel</CardTitle><CardDescription>Showings to offers pipeline</CardDescription></CardHeader><CardContent><div class="h-48"><canvas bind:this={funnelCanvas}></canvas></div></CardContent></Card>
			<Card><CardHeader><CardTitle class="font-serif text-base">Showing Volume</CardTitle><CardDescription>Weekly showing activity</CardDescription></CardHeader><CardContent><div class="h-48"><canvas bind:this={volumeCanvas}></canvas></div></CardContent></Card>
		</div>

		<!-- Upcoming Showings -->
		{#if upcomingShowings.length > 0}
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Upcoming Showings</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each upcomingShowings as showing}
							<div class="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
								<div class="rounded-lg bg-primary/10 p-2.5 shrink-0 text-center min-w-[56px]">
									<p class="text-xs text-primary/70 font-medium">{new Date(showing.date).toLocaleDateString('en-US', { month: 'short' })}</p>
									<p class="text-lg font-bold text-primary leading-tight">{new Date(showing.date).getDate()}</p>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm">{showing.agentName}</span>
										<span class="text-xs text-muted-foreground">-- {showing.agentCompany}</span>
									</div>
									<div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
										<span class="flex items-center gap-1"><Clock class="size-3" />{showing.time}</span>
										<span class="flex items-center gap-1"><Users class="size-3" />{showing.buyerType}</span>
									</div>
								</div>
								<div class="flex items-center gap-1 shrink-0">
									<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => openEditShowing(showing)}>
										<Pencil class="size-3.5 text-muted-foreground" />
									</Button>
									{#if cancelingShowingId === showing.id}
										<form
											method="POST"
											action="?/cancelShowing"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														toast.success('Showing canceled');
														cancelingShowingId = null;
														await update();
													} else {
														toast.error('Failed to cancel showing');
													}
												};
											}}
											class="inline-flex items-center gap-1"
										>
											<input type="hidden" name="showingId" value={showing.id} />
											<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs px-2">Confirm</Button>
											<Button type="button" size="sm" variant="ghost" class="h-7 text-xs px-2" onclick={() => cancelingShowingId = null}>No</Button>
										</form>
									{:else}
										<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => cancelingShowingId = showing.id}>
											<XCircle class="size-3.5 text-muted-foreground" />
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Past Showings with Feedback -->
		{#if pastShowings.length > 0}
			<Card>
				<CardHeader><CardTitle class="font-serif text-base">Past Showings & Feedback</CardTitle></CardHeader>
				<CardContent>
					<div class="divide-y">
						{#each pastShowings as showing}
							{@const interest = getInterestBadge(showing.interestedLevel ?? undefined)}
							{@const InterestIcon = interest.icon}
							<div class="py-4 first:pt-0 last:pb-0">
								<div class="flex items-start justify-between gap-4">
									<div class="flex items-start gap-3">
										<Avatar class="size-9 shrink-0"><AvatarFallback class="text-xs bg-muted">{(showing.agentName ?? '').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
										<div>
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium">{showing.agentName}</span>
												<span class="text-xs text-muted-foreground">{showing.agentCompany}</span>
											</div>
											<div class="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
												<span>{formatDate(showing.date)}</span>
												<span>{showing.time}</span>
												<Badge variant="secondary" class="text-[10px] font-normal">{showing.buyerType}</Badge>
											</div>
										</div>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										<Badge variant="outline" class="text-[10px] {interest.color}"><InterestIcon class="mr-1 size-3" />{interest.label}</Badge>
										<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => openEditShowing(showing)}>
											<Pencil class="size-3.5 text-muted-foreground" />
										</Button>
										<Button size="sm" variant="outline" class="h-7 text-xs" onclick={() => openFeedback(showing)}>
											<MessageSquare class="mr-1 size-3" />Feedback
										</Button>
										{#if cancelingShowingId === showing.id}
											<form
												method="POST"
												action="?/cancelShowing"
												use:enhance={() => {
													return async ({ result, update }) => {
														if (result.type === 'success') {
															toast.success('Showing canceled');
															cancelingShowingId = null;
															await update();
														} else {
															toast.error('Failed to cancel showing');
														}
													};
												}}
												class="inline-flex items-center gap-1"
											>
												<input type="hidden" name="showingId" value={showing.id} />
												<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs px-2">Confirm</Button>
												<Button type="button" size="sm" variant="ghost" class="h-7 text-xs px-2" onclick={() => cancelingShowingId = null}>No</Button>
											</form>
										{:else}
											<Button size="sm" variant="ghost" class="size-8 p-0" onclick={() => cancelingShowingId = showing.id}>
												<Trash2 class="size-3.5 text-muted-foreground" />
											</Button>
										{/if}
									</div>
								</div>
								{#if showing.rating}
									<div class="mt-2 ml-12 flex items-center gap-1">
										{#each getStars(showing.rating) as filled}<Star class="size-3.5 {filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}" />{/each}
										<span class="text-xs text-muted-foreground ml-1">{showing.rating}/5</span>
									</div>
								{/if}
								{#if showing.feedback}
									<div class="mt-2 ml-12 rounded-md bg-muted/50 p-3"><div class="flex items-start gap-2"><MessageSquare class="size-3.5 text-muted-foreground mt-0.5 shrink-0" /><p class="text-sm text-muted-foreground">{showing.feedback}</p></div></div>
								{/if}

								<!-- Inline Feedback Form -->
								{#if feedbackShowingId === showing.id}
									<div class="mt-3 ml-12 rounded-md border p-4">
										<form
											method="POST"
											action="?/saveFeedback"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														toast.success('Feedback saved');
														feedbackShowingId = null;
														await update();
													} else {
														toast.error('Failed to save feedback');
													}
												};
											}}
										>
											<input type="hidden" name="showingId" value={showing.id} />
											<div class="space-y-3">
												<div>
													<label class="text-sm font-medium">Rating</label>
													<div class="flex items-center gap-1 mt-1">
														{#each [1, 2, 3, 4, 5] as star}
															<button type="button" onclick={() => feedbackRating = star}>
																<Star class="size-5 {star <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} cursor-pointer hover:text-amber-400" />
															</button>
														{/each}
													</div>
													<input type="hidden" name="rating" value={feedbackRating} />
												</div>
												<div>
													<label for="feedback-level" class="text-sm font-medium">Interest Level</label>
													<select
														id="feedback-level"
														name="interestedLevel"
														bind:value={feedbackLevel}
														class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
													>
														<option value="">Select...</option>
														<option value="very">Very Interested</option>
														<option value="somewhat">Somewhat Interested</option>
														<option value="not">Not Interested</option>
													</select>
												</div>
												<div>
													<label for="feedback-notes" class="text-sm font-medium">Notes</label>
													<textarea
														id="feedback-notes"
														name="feedback"
														bind:value={feedbackNotes}
														rows="3"
														placeholder="Agent feedback notes..."
														class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
													></textarea>
												</div>
												<div class="flex items-center gap-2 justify-end">
													<Button type="button" variant="ghost" size="sm" onclick={() => feedbackShowingId = null}>Cancel</Button>
													<Button type="submit" size="sm">Save Feedback</Button>
												</div>
											</div>
										</form>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if listingShowings.length === 0}
			<Card><CardContent class="flex flex-col items-center justify-center py-12"><Calendar class="size-10 text-muted-foreground/30 mb-3" /><p class="text-sm text-muted-foreground">No showings scheduled yet.</p><Button variant="outline" size="sm" class="mt-3" onclick={() => { resetShowingForm(); showShowingModal = true; }}>Schedule First Showing</Button></CardContent></Card>
		{/if}
	</div>
{/if}

<!-- Schedule Showing Modal -->
<Dialog.Root bind:open={showShowingModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Schedule Showing</Dialog.Title>
			<Dialog.Description>Add a new showing for this listing.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/scheduleShowing"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Showing scheduled');
						showShowingModal = false;
						await update();
					} else {
						toast.error('Failed to schedule showing');
					}
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="showing-date" class="text-sm font-medium">Date</label>
						<input id="showing-date" name="date" type="date" bind:value={showingDate} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="showing-time" class="text-sm font-medium">Time</label>
						<input id="showing-time" name="time" type="time" bind:value={showingTime} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="showing-agent" class="text-sm font-medium">Agent Name</label>
						<input id="showing-agent" name="agentName" type="text" bind:value={showingAgentName} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="showing-company" class="text-sm font-medium">Company</label>
						<input id="showing-company" name="agentCompany" type="text" bind:value={showingAgentCompany} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div>
					<label for="showing-buyer-type" class="text-sm font-medium">Buyer Type</label>
					<select id="showing-buyer-type" name="buyerType" bind:value={showingBuyerType} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2">
						<option value="">Select...</option>
						<option value="First-time buyer">First-time buyer</option>
						<option value="Move-up buyer">Move-up buyer</option>
						<option value="Investor">Investor</option>
						<option value="Relocating">Relocating</option>
						<option value="Downsizing">Downsizing</option>
						<option value="Other">Other</option>
					</select>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showShowingModal = false}>Cancel</Button>
				<Button type="submit">Schedule Showing</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Showing Modal -->
<Dialog.Root bind:open={showEditModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif">Edit Showing</Dialog.Title>
			<Dialog.Description>Update showing details.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editShowing"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Showing updated');
						showEditModal = false;
						await update();
					} else {
						toast.error('Failed to update showing');
					}
				};
			}}
		>
			<input type="hidden" name="showingId" value={editShowingId} />
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-date" class="text-sm font-medium">Date</label>
						<input id="edit-date" name="date" type="date" bind:value={editDate} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="edit-time" class="text-sm font-medium">Time</label>
						<input id="edit-time" name="time" type="time" bind:value={editTime} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-agent" class="text-sm font-medium">Agent Name</label>
						<input id="edit-agent" name="agentName" type="text" bind:value={editAgentName} required class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
					<div>
						<label for="edit-company" class="text-sm font-medium">Company</label>
						<input id="edit-company" name="agentCompany" type="text" bind:value={editAgentCompany} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2" />
					</div>
				</div>
				<div>
					<label for="edit-buyer-type" class="text-sm font-medium">Buyer Type</label>
					<select id="edit-buyer-type" name="buyerType" bind:value={editBuyerType} class="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2">
						<option value="">Select...</option>
						<option value="First-time buyer">First-time buyer</option>
						<option value="Move-up buyer">Move-up buyer</option>
						<option value="Investor">Investor</option>
						<option value="Relocating">Relocating</option>
						<option value="Downsizing">Downsizing</option>
						<option value="Other">Other</option>
					</select>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => showEditModal = false}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
