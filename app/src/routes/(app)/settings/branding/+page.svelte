<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Upload, Palette, Globe, FileText, Eye } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	const teamName = $derived(data.team?.name ?? 'Your Team');

	// Initialize from team settings if available
	const brandingSettings = $derived((data.team?.settings as Record<string, any>)?.branding);
	let primaryColor = $state('#C4704B');
	let customDomain = $state('portal.chenrealtygroup.com');
	let welcomeMessage = $state('Welcome to your client portal. Here you can track the progress of your listing, view documents, and stay updated on showings and offers.');
	$effect(() => {
		if (brandingSettings) {
			if (brandingSettings.primaryColor) primaryColor = brandingSettings.primaryColor;
			if (brandingSettings.customDomain) customDomain = brandingSettings.customDomain;
			if (brandingSettings.welcomeMessage) welcomeMessage = brandingSettings.welcomeMessage;
		}
	});
	let saving = $state(false);
</script>

<div class="space-y-6">
	<div>
		<h2 class="font-serif text-lg font-semibold">Client Portal Branding</h2>
		<p class="text-sm text-muted-foreground">Customize how your client portal looks and feels</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Settings column -->
		<div class="space-y-6">
			<!-- Logo upload -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<Upload class="size-4" />
						Logo
					</CardTitle>
					<CardDescription>Upload your team or brokerage logo</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex items-center gap-4">
						<div class="flex size-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
							<div class="text-center">
								<div class="text-2xl font-bold text-primary">CR</div>
								<p class="text-[9px] text-muted-foreground">Preview</p>
							</div>
						</div>
						<div class="space-y-2">
							<Button variant="outline" size="sm" class="gap-1">
								<Upload class="size-3" />
								Upload Logo
							</Button>
							<p class="text-xs text-muted-foreground">PNG, SVG, or JPG. Max 2MB. Recommended 200x60px.</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Primary color -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<Palette class="size-4" />
						Primary Color
					</CardTitle>
					<CardDescription>Used for buttons, links, and accent elements</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex items-center gap-3">
						<input
							type="color"
							bind:value={primaryColor}
							class="size-10 cursor-pointer rounded-md border p-0.5"
						/>
						<input
							type="text"
							bind:value={primaryColor}
							class="w-28 rounded-md border bg-transparent px-3 py-1.5 text-sm font-mono"
						/>
						<div class="flex gap-1.5">
							{#each ['#C4704B', '#5B8BA5', '#7B8B6F', '#C49A3C', '#6B5B95', '#2C3E50'] as swatch}
								<button
									aria-label="Select color {swatch}"
									onclick={() => primaryColor = swatch}
									class="size-6 rounded-full border-2 transition-transform hover:scale-110 {primaryColor === swatch ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent'}"
									style="background-color: {swatch}"
								></button>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Custom domain -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<Globe class="size-4" />
						Custom Domain
					</CardTitle>
					<CardDescription>Use your own domain for the client portal</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={customDomain}
							class="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm"
							placeholder="portal.yourdomain.com"
						/>
						<Badge variant="outline" class="text-xs text-green-600">Verified</Badge>
					</div>
					<p class="mt-2 text-xs text-muted-foreground">Add a CNAME record pointing to portal.hometrack.co</p>
				</CardContent>
			</Card>

			<!-- Welcome message -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-base">
						<FileText class="size-4" />
						Welcome Message
					</CardTitle>
					<CardDescription>Displayed on the portal landing page</CardDescription>
				</CardHeader>
				<CardContent>
					<textarea
						bind:value={welcomeMessage}
						rows="4"
						class="w-full rounded-md border bg-transparent px-3 py-2 text-sm resize-none"
						placeholder="Welcome to your client portal..."
					></textarea>
				</CardContent>
			</Card>
		</div>

		<!-- Preview column -->
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<Eye class="size-4 text-muted-foreground" />
				<h3 class="text-sm font-medium">Portal Preview</h3>
			</div>
			<Card class="overflow-hidden">
				<div class="border-b p-0">
					<!-- Mock browser chrome -->
					<div class="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
						<div class="flex gap-1.5">
							<div class="size-2.5 rounded-full bg-red-400"></div>
							<div class="size-2.5 rounded-full bg-amber-400"></div>
							<div class="size-2.5 rounded-full bg-green-400"></div>
						</div>
						<div class="flex-1 rounded bg-background px-2 py-0.5 text-center text-[10px] text-muted-foreground">
							{customDomain}
						</div>
					</div>

					<!-- Portal header -->
					<div class="px-4 py-3" style="background-color: {primaryColor}">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div class="size-8 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">CR</div>
								<span class="text-sm font-semibold text-white">{teamName}</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="size-6 rounded-full bg-white/20"></div>
							</div>
						</div>
					</div>

					<!-- Portal body mock -->
					<div class="p-4 space-y-3">
						<h4 class="font-serif text-sm font-semibold">Welcome back.</h4>
						<p class="text-xs text-muted-foreground leading-relaxed">{welcomeMessage}</p>

						<Separator />

						<!-- Property hero -->
						<div class="rounded-md border overflow-hidden">
							<div class="h-20 bg-muted flex items-center justify-center">
								<div class="text-[10px] text-muted-foreground">Property Photo</div>
							</div>
							<div class="p-2.5">
								<div class="flex items-start justify-between">
									<div>
										<p class="text-xs font-medium">123 Main Street</p>
										<p class="text-[10px] text-muted-foreground">Los Gatos, CA 95030</p>
									</div>
									<div class="rounded px-1.5 py-0.5 text-[9px] font-medium text-white" style="background-color: {primaryColor}">Active</div>
								</div>
								<p class="mt-1 text-xs font-semibold" style="color: {primaryColor}">$1,895,000</p>
							</div>
						</div>

						<!-- Progress timeline -->
						<div class="space-y-1.5">
							<p class="text-[10px] font-medium text-muted-foreground">Listing Progress</p>
							<div class="flex items-center gap-1">
								{#each ['Pre-Market', 'Active', 'Closed'] as phase, i}
									<div class="flex items-center gap-1 flex-1">
										<div
											class="size-4 rounded-full border flex items-center justify-center text-[7px]"
											style={i < 2 ? `background-color: ${primaryColor}; border-color: ${primaryColor}; color: white` : ''}
										>
											{#if i < 1}&#10003;{/if}
										</div>
										<span class="text-[8px] {i === 1 ? 'font-semibold' : 'text-muted-foreground'}">{phase}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Recent activity -->
						<div class="space-y-1.5">
							<p class="text-[10px] font-medium text-muted-foreground">Recent Activity</p>
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<div class="size-1.5 rounded-full" style="background-color: {primaryColor}"></div>
									<p class="text-[10px]">Photography completed</p>
								</div>
								<div class="flex items-center gap-2">
									<div class="size-1.5 rounded-full" style="background-color: {primaryColor}"></div>
									<p class="text-[10px]">Listed on MLS</p>
								</div>
								<div class="flex items-center gap-2">
									<div class="size-1.5 rounded-full bg-muted-foreground/30"></div>
									<p class="text-[10px] text-muted-foreground">Open house scheduled</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
			<p class="text-xs text-muted-foreground text-center">Live preview updates as you change settings</p>
		</div>
	</div>

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					toast.success('Branding settings saved');
					await update();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.error ?? 'Failed to save'));
				}
			};
		}}
	>
		<input type="hidden" name="teamId" value={data.team?.id ?? ''} />
		<input type="hidden" name="primaryColor" value={primaryColor} />
		<input type="hidden" name="customDomain" value={customDomain} />
		<input type="hidden" name="welcomeMessage" value={welcomeMessage} />
		<div class="flex justify-end">
			<Button type="submit" disabled={saving}>
				{saving ? 'Saving...' : 'Save Branding'}
			</Button>
		</div>
	</form>
</div>
