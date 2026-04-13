<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Users, Upload, CheckCircle } from 'lucide-svelte';

	let name = $state('');
	let termsAccepted = $state(false);
</script>

<div class="space-y-6">
	<!-- Team invite header -->
	<div class="text-center">
		<div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
			<Users class="size-6 text-primary" />
		</div>
		<h2 class="text-xl font-semibold">You've been invited!</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Join <span class="font-medium text-foreground">your team</span> on HomeTrack
		</p>
	</div>

	<Separator />

	<!-- Invite details -->
	<div class="rounded-lg bg-muted/50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
				H
			</div>
			<div>
				<p class="text-sm font-medium">Team Invitation</p>
				<p class="text-xs text-muted-foreground">You've been invited to join a team</p>
			</div>
			<Badge variant="outline" class="ml-auto text-xs">Transaction Coordinator</Badge>
		</div>
	</div>

	<!-- Profile setup form -->
	<div class="space-y-4">
		<div class="space-y-2">
			<label for="name" class="text-sm font-medium">Your name</label>
			<Input id="name" type="text" placeholder="Enter your full name" bind:value={name} />
		</div>

		<div class="space-y-2">
			<label for="email" class="text-sm font-medium">Email</label>
			<Input
				id="email"
				type="email"
				value="priya.patel@gmail.com"
				disabled
				class="bg-muted/50"
			/>
			<p class="text-xs text-muted-foreground">This is the email your invitation was sent to.</p>
		</div>

		<div class="space-y-2">
			<label for="role" class="text-sm font-medium">Your role</label>
			<div class="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
				Transaction Coordinator
			</div>
			<p class="text-xs text-muted-foreground">Set by your team admin.</p>
		</div>

		<!-- Avatar upload -->
		<div class="space-y-2">
			<label class="text-sm font-medium">Profile photo</label>
			<div class="flex items-center gap-4">
				<Avatar class="size-16">
					<AvatarFallback class="bg-primary/10 text-primary text-lg">
						{name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
					</AvatarFallback>
				</Avatar>
				<Button variant="outline" size="sm" class="gap-1.5">
					<Upload class="size-3.5" />
					Upload photo
				</Button>
			</div>
		</div>

		<Separator />

		<!-- Terms -->
		<label class="flex items-start gap-3 cursor-pointer">
			<input
				type="checkbox"
				bind:checked={termsAccepted}
				class="mt-0.5 size-4 rounded border-border accent-primary"
			/>
			<span class="text-xs text-muted-foreground leading-relaxed">
				I agree to the <a href="/terms" class="text-primary hover:underline">Terms of Service</a>
				and <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
			</span>
		</label>

		<Button class="w-full gap-2" disabled={!name.trim() || !termsAccepted}>
			<CheckCircle class="size-4" />
			Accept & Join
		</Button>
	</div>
</div>
