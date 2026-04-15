<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Users, Bed, Bath, Ruler, MapPin } from 'lucide-svelte';

	let { data } = $props();
	const listing = $derived(data.listing);
	const registerUrl = $derived(data.registerUrl);
	let visitorCount = $state(0);
	$effect(() => { visitorCount = data.visitorCount; });
	let qrDataUrl = $state('');

	onMount(() => {
		// Generate QR code client-side to avoid SSR issues with canvas
		import('qrcode').then((QRCode) => {
			QRCode.toDataURL(registerUrl, {
				width: 280,
				margin: 2,
				color: { dark: '#18181b', light: '#ffffff' },
			}).then((url) => {
				qrDataUrl = url;
			});
		});

		// Poll for visitor count updates every 15 seconds
		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/open-house/visitor-count?listingId=${listing.id}`);
				if (res.ok) {
					const result = await res.json();
					visitorCount = result.count;
				}
			} catch { /* ignore */ }
		}, 15000);

		return () => clearInterval(interval);
	});

	function formatPrice(price: number | null) {
		if (!price) return '';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price);
	}
</script>

<svelte:head>
	<title>Open House — {listing.address}</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
	<div class="w-full max-w-2xl text-center">
		<!-- Live indicator -->
		<Badge class="mb-6 bg-emerald-500/10 text-emerald-700 border-emerald-200 text-sm px-4 py-1.5">
			<div class="mr-2 size-2.5 animate-pulse rounded-full bg-emerald-500"></div>
			Open House
		</Badge>

		<!-- Listing photo -->
		{#if listing.photoUrl}
			<div class="mx-auto mb-6 overflow-hidden rounded-2xl shadow-lg" style="max-width: 500px">
				<img
					src={listing.photoUrl}
					alt={listing.address}
					class="aspect-[16/10] w-full object-cover"
				/>
			</div>
		{/if}

		<!-- Address and price -->
		<h1 class="font-serif text-3xl font-bold md:text-4xl">{listing.address}</h1>
		<p class="mt-1 text-lg text-muted-foreground">
			{listing.city}, {listing.state} {listing.zip}
		</p>

		{#if listing.price}
			<p class="mt-3 text-3xl font-bold text-primary md:text-4xl">{formatPrice(listing.price)}</p>
		{/if}

		<!-- Property stats -->
		<div class="mt-4 flex items-center justify-center gap-6 text-muted-foreground">
			{#if listing.beds}
				<div class="flex items-center gap-1.5">
					<Bed class="size-4" />
					<span class="text-sm font-medium">{listing.beds} Beds</span>
				</div>
			{/if}
			{#if listing.baths}
				<div class="flex items-center gap-1.5">
					<Bath class="size-4" />
					<span class="text-sm font-medium">{listing.baths} Baths</span>
				</div>
			{/if}
			{#if listing.sqft}
				<div class="flex items-center gap-1.5">
					<Ruler class="size-4" />
					<span class="text-sm font-medium">{listing.sqft.toLocaleString()} Sq Ft</span>
				</div>
			{/if}
		</div>

		<!-- QR Code -->
		<div class="mx-auto mt-10 rounded-2xl border bg-white p-6 shadow-sm" style="max-width: 340px">
			{#if qrDataUrl}
				<img src={qrDataUrl} alt="QR Code" class="mx-auto size-[280px]" />
			{:else}
				<div class="mx-auto flex size-[280px] items-center justify-center">
					<div class="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
				</div>
			{/if}
			<p class="mt-4 text-sm font-medium text-muted-foreground">Scan to register your visit</p>
		</div>

		<!-- Visitor count -->
		<div class="mt-8 flex items-center justify-center gap-3">
			<Users class="size-6 text-primary" />
			<span class="text-4xl font-bold text-primary">{visitorCount}</span>
			<span class="text-lg text-muted-foreground">visitors today</span>
		</div>
	</div>
</div>
