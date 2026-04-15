<script lang="ts">
	import { onMount } from 'svelte';
	import {
		LayoutDashboard,
		Video,
		Users,
		ExternalLink,
		BarChart3,
		Wrench,
		ArrowRight,
		Check,
		Play,
		Star,
		Mic,
		Sparkles,
		Zap,
		Menu,
		X
	} from 'lucide-svelte';

	let mobileMenuOpen = $state(false);
	let observerTargets: HTMLElement[] = [];

	function addObserverTarget(node: HTMLElement) {
		observerTargets.push(node);
		return {
			destroy() {
				observerTargets = observerTargets.filter((t) => t !== node);
			}
		};
	}

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('animate-in');
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);

		const targets = document.querySelectorAll('.fade-up');
		targets.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});

	function scrollTo(id: string) {
		mobileMenuOpen = false;
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth' });
	}

	const features = [
		{
			icon: LayoutDashboard,
			title: 'Pipeline Management',
			description: 'Track every listing from pre-market to close with visual pipeline boards'
		},
		{
			icon: Video,
			title: 'Smart Field Notes',
			description:
				'Record video walkthroughs and let AI extract action items, quotes, and observations automatically'
		},
		{
			icon: Users,
			title: 'Team Collaboration',
			description: 'Assign tasks, share activity, and keep your entire team in sync in real-time'
		},
		{
			icon: ExternalLink,
			title: 'Client Portal',
			description:
				'Give clients their own branded portal to track progress, approve decisions, and review documents'
		},
		{
			icon: BarChart3,
			title: 'Analytics & Insights',
			description: 'AI-powered market insights, showing analytics, and performance tracking'
		},
		{
			icon: Wrench,
			title: 'Vendor Management',
			description: 'Manage vendors, request quotes, and track project budgets in one place'
		}
	];

	const steps = [
		{
			icon: Mic,
			number: '01',
			title: 'Capture in the field',
			description:
				'Record voice memos, take photos, shoot video walkthroughs — right from your phone'
		},
		{
			icon: Sparkles,
			number: '02',
			title: 'AI extracts the insights',
			description:
				'Automatic transcription, action items, vendor quotes, observations — all structured and searchable'
		},
		{
			icon: Zap,
			number: '03',
			title: 'Your team takes action',
			description:
				'Tasks created, quotes requested, clients updated — all from one recording'
		}
	];

	const plans = [
		{
			name: 'Free',
			price: '$0',
			period: 'forever',
			description: 'Try HomeTrack with zero commitment',
			features: [
				'Solo agent — 1 seat',
				'Up to 4 active listings',
				'AI field notes (5/month)',
				'Basic analytics',
				'Voice memo capture',
				'Email support'
			],
			highlighted: false,
			cta: 'Get Started Free'
		},
		{
			name: 'Starter',
			price: '$99',
			period: '/user/month',
			description: 'For teams ready to scale their listings',
			features: [
				'Team up to 5 users',
				'25 active listings',
				'Unlimited AI field notes',
				'Video walkthrough processing',
				'Standard analytics',
				'Gmail & Calendar sync',
				'Priority email support'
			],
			highlighted: true,
			cta: 'Start 14-Day Trial'
		},
		{
			name: 'Professional',
			price: '$299',
			period: '/user/month',
			description: 'Full power for high-production teams',
			features: [
				'Unlimited team size',
				'Unlimited listings',
				'Client portal (white-label)',
				'Advanced analytics & AI insights',
				'Vendor & financial management',
				'Open house digital check-in',
				'All integrations',
				'Onboarding & migration support',
				'Priority chat + phone support'
			],
			highlighted: false,
			cta: 'Start 14-Day Trial'
		}
	];
</script>

<svelte:head>
	<title>HomeTrack — The Operating System for Modern Real Estate Teams</title>
	<meta
		name="description"
		content="HomeTrack brings your listings, tasks, clients, and insights into one intelligent platform — so you can close more deals with less chaos."
	/>
</svelte:head>

<!-- Navigation -->
<nav class="fixed top-0 right-0 left-0 z-50 border-b border-transparent bg-white/80 backdrop-blur-lg transition-all duration-300">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<a href="/" class="font-serif text-2xl text-foreground">HomeTrack</a>

		<!-- Desktop nav -->
		<div class="hidden items-center gap-8 md:flex">
			<button onclick={() => scrollTo('features')} class="text-sm font-medium text-foreground-secondary transition-colors hover:text-primary">Features</button>
			<button onclick={() => scrollTo('how-it-works')} class="text-sm font-medium text-foreground-secondary transition-colors hover:text-primary">How It Works</button>
			<button onclick={() => scrollTo('pricing')} class="text-sm font-medium text-foreground-secondary transition-colors hover:text-primary">Pricing</button>
			<a href="/login" class="text-sm font-medium text-foreground-secondary transition-colors hover:text-primary">Sign In</a>
			<a href="/signup" class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">Start Free Trial</a>
		</div>

		<!-- Mobile menu button -->
		<button class="md:hidden" onclick={() => (mobileMenuOpen = !mobileMenuOpen)}>
			{#if mobileMenuOpen}
				<X class="h-6 w-6 text-foreground" />
			{:else}
				<Menu class="h-6 w-6 text-foreground" />
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-border bg-white px-6 pb-6 pt-4 md:hidden">
			<div class="flex flex-col gap-4">
				<button onclick={() => scrollTo('features')} class="text-left text-sm font-medium text-foreground-secondary">Features</button>
				<button onclick={() => scrollTo('how-it-works')} class="text-left text-sm font-medium text-foreground-secondary">How It Works</button>
				<button onclick={() => scrollTo('pricing')} class="text-left text-sm font-medium text-foreground-secondary">Pricing</button>
				<a href="/login" class="text-sm font-medium text-foreground-secondary">Sign In</a>
				<a href="/signup" class="rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground">Start Free Trial</a>
			</div>
		</div>
	{/if}
</nav>

<!-- Hero Section -->
<section class="relative flex min-h-screen items-center overflow-hidden pt-20">
	<!-- Background image with overlay -->
	<div class="absolute inset-0">
		<img
			src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
			alt="Luxury home exterior"
			class="h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/60 to-stone-900/40"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
		<div class="max-w-3xl mx-auto text-center">
			<div>
				<h1 class="font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
					The Operating System for Modern Real Estate Teams
				</h1>
			</div>

			<div class="mt-8">
				<p class="mx-auto max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
					HomeTrack brings your listings, tasks, clients, and insights into one intelligent
					platform — so you can close more deals with less chaos.
				</p>
			</div>

			<div class="mt-10 flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					class="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-lg"
				>
					Start Free Trial
					<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</a>
				<button
					class="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10"
				>
					<Play class="h-4 w-4" />
					Watch Demo
				</button>
			</div>

			<div class="mt-12 flex items-center justify-center gap-3">
				<div class="flex -space-x-2">
					{#each [1, 2, 3, 4, 5] as i}
						<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-primary/80 text-xs font-semibold text-white">
							{String.fromCharCode(64 + i)}
						</div>
					{/each}
				</div>
				<div class="flex items-center gap-1">
					{#each [1, 2, 3, 4, 5] as _}
						<Star class="h-4 w-4 fill-amber-400 text-amber-400" />
					{/each}
				</div>
				<p class="text-sm text-white/70">Trusted by 200+ real estate teams</p>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section id="features" class="bg-background py-24 sm:py-32 lg:py-40">
	<div class="mx-auto max-w-7xl px-6">
		<div class="fade-up mx-auto max-w-2xl text-center opacity-0">
			<p class="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
			<h2 class="mt-3 font-serif text-3xl text-foreground sm:text-4xl lg:text-5xl">
				Everything your team needs, in one place
			</h2>
			<p class="mt-5 text-lg text-foreground-secondary">
				From first showing to final close, HomeTrack keeps every detail organized and every
				team member informed.
			</p>
		</div>

		<div class="mt-16 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-12">
			{#each features as feature, i}
				{@const Icon = feature.icon}
				<div
					class="fade-up group rounded-2xl border border-border bg-card p-8 opacity-0 transition-all duration-300 hover:border-primary/30 hover:shadow-lg lg:p-10"
					style="transition-delay: {i * 100}ms;"
				>
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
						<Icon class="h-6 w-6" />
					</div>
					<h3 class="mt-6 font-serif text-xl text-foreground">{feature.title}</h3>
					<p class="mt-3 leading-relaxed text-foreground-secondary">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Social Proof / Testimonial -->
<section class="relative overflow-hidden py-24 sm:py-32">
	<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
	<div class="relative mx-auto max-w-4xl px-6 text-center">
		<div class="fade-up opacity-0">
			<img
				src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80"
				alt="Sarah Mitchell"
				class="mx-auto h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
			/>
			<blockquote class="mt-8 font-serif text-2xl leading-relaxed text-foreground sm:text-3xl">
				"HomeTrack transformed how our team operates. We went from juggling spreadsheets
				and group chats to having a single source of truth for every listing. Our time to
				close dropped by 30% in the first quarter."
			</blockquote>
			<div class="mt-8">
				<p class="font-semibold text-foreground">Sarah Mitchell</p>
				<p class="text-foreground-secondary">Team Lead, Prestige Realty Group</p>
			</div>
			<div class="mt-4 flex items-center justify-center gap-1">
				{#each [1, 2, 3, 4, 5] as _}
					<Star class="h-5 w-5 fill-amber-400 text-amber-400" />
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- How It Works -->
<section id="how-it-works" class="bg-card py-24 sm:py-32 lg:py-40">
	<div class="mx-auto max-w-7xl px-6">
		<div class="fade-up mx-auto max-w-2xl text-center opacity-0">
			<p class="text-sm font-semibold uppercase tracking-widest text-primary">How It Works</p>
			<h2 class="mt-3 font-serif text-3xl text-foreground sm:text-4xl lg:text-5xl">
				From field to action in three steps
			</h2>
			<p class="mt-5 text-lg text-foreground-secondary">
				Capture once, and let HomeTrack do the rest.
			</p>
		</div>

		<div class="mt-16 grid gap-8 lg:mt-24 lg:grid-cols-3 lg:gap-16">
			{#each steps as step, i}
				{@const StepIcon = step.icon}
				<div
					class="fade-up relative text-center opacity-0"
					style="transition-delay: {i * 150}ms;"
				>
					<!-- Connector line (desktop only) -->
					{#if i < steps.length - 1}
						<div class="absolute top-10 left-[calc(50%+3rem)] hidden h-0.5 w-[calc(100%-6rem)] bg-gradient-to-r from-primary/40 to-primary/10 lg:block"></div>
					{/if}

					<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<StepIcon class="h-8 w-8" />
					</div>
					<p class="mt-4 text-sm font-bold tracking-widest text-primary/60">{step.number}</p>
					<h3 class="mt-2 font-serif text-2xl text-foreground">{step.title}</h3>
					<p class="mt-3 leading-relaxed text-foreground-secondary">{step.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="bg-background py-24 sm:py-32 lg:py-40">
	<div class="mx-auto max-w-7xl px-6">
		<div class="fade-up mx-auto max-w-2xl text-center opacity-0">
			<p class="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
			<h2 class="mt-3 font-serif text-3xl text-foreground sm:text-4xl lg:text-5xl">
				Plans that grow with your team
			</h2>
			<p class="mt-5 text-lg text-foreground-secondary">
				Free forever for solo agents. 14-day trial on paid plans. No credit card required.
			</p>
		</div>

		<div class="mx-auto mt-16 grid max-w-5xl gap-8 lg:mt-24 lg:grid-cols-3">
			{#each plans as plan, i}
				<div
					class="fade-up relative flex flex-col rounded-2xl border p-8 opacity-0 transition-all lg:p-10 {plan.highlighted
						? 'border-primary bg-white shadow-xl shadow-primary/10 ring-1 ring-primary/20'
						: 'border-border bg-card hover:border-primary/20 hover:shadow-md'}"
					style="transition-delay: {i * 100}ms;"
				>
					{#if plan.highlighted}
						<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
							Most Popular
						</div>
					{/if}

					<h3 class="font-serif text-xl text-foreground">{plan.name}</h3>
					<p class="mt-2 text-sm text-foreground-secondary">{plan.description}</p>

					<div class="mt-6">
						<span class="font-serif text-4xl text-foreground">{plan.price}</span>
						{#if plan.period}
							<span class="text-sm text-foreground-secondary">{plan.period}</span>
						{/if}
					</div>

					<ul class="mt-8 flex-1 space-y-3">
						{#each plan.features as feature}
							<li class="flex items-start gap-3 text-sm text-foreground-secondary">
								<Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
								{feature}
							</li>
						{/each}
					</ul>

					<a
						href="/signup"
						class="mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-all {plan.highlighted
							? 'bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg'
							: 'bg-muted text-foreground hover:bg-primary hover:text-primary-foreground'}"
					>
						{plan.cta ?? 'Get Started'}
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="relative overflow-hidden py-24 sm:py-32">
	<div class="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900/95 to-stone-900"></div>
	<div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80')] bg-cover bg-center opacity-10"></div>
	<div class="relative mx-auto max-w-3xl px-6 text-center">
		<div class="fade-up opacity-0">
			<h2 class="font-serif text-3xl text-white sm:text-4xl lg:text-5xl">
				Ready to streamline your real estate operations?
			</h2>
			<p class="mt-6 text-lg text-white/70">
				Join 200+ teams already using HomeTrack to close more deals with less stress.
			</p>
			<div class="mt-10 flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					class="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-lg"
				>
					Start Your Free Trial
					<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
				</a>
				<a
					href="mailto:hello@hometrack.app"
					class="inline-flex items-center rounded-lg border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10"
				>
					Contact Sales
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-border bg-card py-16">
	<div class="mx-auto max-w-7xl px-6">
		<div class="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Brand -->
			<div class="sm:col-span-2 lg:col-span-1">
				<a href="/" class="font-serif text-2xl text-foreground">HomeTrack</a>
				<p class="mt-3 max-w-xs text-sm leading-relaxed text-foreground-secondary">
					The operating system for modern real estate teams. Listings, tasks, clients, and
					insights — all in one place.
				</p>
			</div>

			<!-- Product -->
			<div>
				<h4 class="text-sm font-semibold text-foreground">Product</h4>
				<ul class="mt-4 space-y-3">
					<li><button onclick={() => scrollTo('features')} class="text-sm text-foreground-secondary transition-colors hover:text-primary">Features</button></li>
					<li><button onclick={() => scrollTo('pricing')} class="text-sm text-foreground-secondary transition-colors hover:text-primary">Pricing</button></li>
					<li><a href="/about" class="text-sm text-foreground-secondary transition-colors hover:text-primary">About</a></li>
					<li><a href="/blog" class="text-sm text-foreground-secondary transition-colors hover:text-primary">Blog</a></li>
					<li><a href="/careers" class="text-sm text-foreground-secondary transition-colors hover:text-primary">Careers</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h4 class="text-sm font-semibold text-foreground">Legal</h4>
				<ul class="mt-4 space-y-3">
					<li><a href="/privacy" class="text-sm text-foreground-secondary transition-colors hover:text-primary">Privacy Policy</a></li>
					<li><a href="/terms" class="text-sm text-foreground-secondary transition-colors hover:text-primary">Terms of Service</a></li>
					<li><a href="mailto:hello@hometrack.app" class="text-sm text-foreground-secondary transition-colors hover:text-primary">Contact</a></li>
				</ul>
			</div>

			<!-- Social -->
			<div>
				<h4 class="text-sm font-semibold text-foreground">Connect</h4>
				<ul class="mt-4 space-y-3">
					<li><span class="cursor-pointer text-sm text-foreground-secondary transition-colors hover:text-primary">Twitter</span></li>
					<li><span class="cursor-pointer text-sm text-foreground-secondary transition-colors hover:text-primary">LinkedIn</span></li>
				</ul>
			</div>
		</div>

		<div class="mt-12 border-t border-border pt-8">
			<p class="text-center text-sm text-foreground-muted">
				&copy; 2026 HomeTrack. All rights reserved.
			</p>
		</div>
	</div>
</footer>

<style>
	/* Scroll animation */
	.fade-up {
		transform: translateY(24px);
		transition:
			opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.fade-up.animate-in) {
		opacity: 1 !important;
		transform: translateY(0);
	}

	/* Smooth scroll for entire page */
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
