<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import Save from '@lucide/svelte/icons/save';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import X from '@lucide/svelte/icons/x';
	import Camera from '@lucide/svelte/icons/camera';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import { cn } from '$lib/utils';
	import { getWizard, StepBody, StatusIcon, SuccessPanel, SummaryCard, MobileSummary } from '$lib/wizard';
	import { SAMPLE_VIN } from '$lib/wizard/products';
	import type { StepStatus } from '$lib/wizard';
	import { tr, locale } from '$lib/i18n/index.svelte';

	/**
	 * Concept 6 — Mobile native app.
	 * Phone-first shell: compact app bar with a tappable "Step X of N" title that
	 * opens a bottom-sheet step map, a segmented progress bar, a camera VIN scan
	 * tile and a sticky thumb-zone footer. On wider screens the same app is shown
	 * as a 420px column on the canvas; ≥lg the checkout-style summary sits right
	 * beside that column, below lg it folds into a bar at the top of the scroll area.
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();
	let mapOpen = $state(false);
	let notice = $state<string | null>(null);
	let scanning = $state(false);
	let timers: ReturnType<typeof setTimeout>[] = [];

	const nextStep = $derived(w.steps[w.index + 1]);
	const primaryLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: nextStep?.short ?? '' }));
	const doneCount = $derived(w.steps.filter((_, i) => w.status(i) === 'complete').length);

	const SEGMENT: Record<StepStatus, string> = {
		complete: 'bg-primary dark:bg-ring',
		current: 'bg-primary/45 dark:bg-ring/50',
		error: 'bg-destructive',
		upcoming: 'bg-muted-foreground/25',
		locked: 'bg-muted-foreground/12'
	};
	const STATUS_TEXT: Record<StepStatus, string> = {
		complete: 'Done',
		current: 'You are here',
		error: 'Needs attention',
		upcoming: 'Ready to start',
		locked: 'Finish earlier steps first'
	};

	function later(fn: () => void, ms: number) {
		timers.push(setTimeout(fn, ms));
	}
	onDestroy(() => timers.forEach(clearTimeout));

	function toast(msg: string) {
		notice = msg;
		later(() => (notice = null), 2600);
	}

	function scrollTop() {
		main?.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
	}

	function primary() {
		if (w.next()) scrollTop();
	}
	function back() {
		w.prev();
		scrollTop();
	}
	function jumpTo(i: number) {
		if (w.goto(i)) {
			mapOpen = false;
			scrollTop();
		}
	}

	function scanVin() {
		if (scanning) return;
		scanning = true;
		later(
			() => {
				w.set('vin', SAMPLE_VIN);
				w.touch('vin');
				scanning = false;
			},
			prefersReducedMotion.current ? 300 : 1600
		);
	}

	const time = (d: Date) => d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
</script>

<div class="flex min-h-dvh flex-col items-center md:justify-center md:gap-4 md:px-6 md:py-6">
	<p class="hidden items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur md:flex">
		<Smartphone class="size-3.5 shrink-0" /> {tr('Designed for phones · shown at app width')}
	</p>

	<!-- phone column + summary, one centred group (summary ≥lg only) -->
	<div class="flex w-full justify-center lg:items-start lg:gap-6">
		<div
			class={cn(
				'relative flex h-dvh w-full flex-col overflow-hidden bg-background',
				'md:h-[min(880px,calc(100dvh-6rem))] md:max-w-[420px] md:rounded-[1.75rem] md:border md:shadow-lift'
			)}
		>
			{#if w.created}
				<header class="flex h-14 shrink-0 items-center border-b bg-card px-4">
					<p class="text-base font-semibold">{tr('New contract')}</p>
				</header>
				<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
			{:else}
				<!-- App bar -->
				<header class="shrink-0 border-b bg-card">
					<div class="flex h-14 items-center gap-1 px-1.5 in-data-[density=compact]:h-12">
						<Button
							variant="ghost"
							size="icon"
							class="size-11 rounded-full"
							aria-label={w.isFirst ? tr('Close') : tr('Back')}
							onclick={() => (w.isFirst ? (w.saveDraft(), toast(tr('Draft saved. Closing returns you to Contracts.'))) : back())}
						>
							{#if w.isFirst}<X class="size-5" />{:else}<ChevronLeft class="size-6" />{/if}
						</Button>

						<button
							type="button"
							onclick={() => (mapOpen = true)}
							aria-haspopup="dialog"
							aria-label={tr('Step {n} of {total}: {title}. Show all steps', { n: w.index + 1, total: w.total, title: w.current.title })}
							class="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center rounded-lg px-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
						>
							<span class="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
								{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}
								<ChevronDown class="size-3.5" />
							</span>
							<span class="w-full truncate text-base leading-tight font-semibold">{w.current.title}</span>
						</button>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon" class="size-11 rounded-full" aria-label={tr('More actions')}>
										<EllipsisVertical class="size-5" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-auto min-w-52">
								<DropdownMenu.Item class="min-h-11 px-3" onSelect={() => (w.saveDraft(), toast(tr('Draft saved')))}>
									<Save class="size-4" /> {tr('Save draft')}
								</DropdownMenu.Item>
								<DropdownMenu.Item class="min-h-11 px-3" onSelect={() => (w.fillDemo(), toast(tr('Sample details filled in')))}>
									<WandSparkles class="size-4" /> {tr('Fill sample')}
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item class="min-h-11 px-3" onSelect={() => (w.saveDraft(), toast(tr('Draft saved. Closing returns you to Contracts.')))}>
									<X class="size-4" /> {tr('Close')}
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<!-- Segmented progress: one segment per step -->
					<div class="flex gap-1 px-4 pb-2.5" aria-hidden="true">
						{#each w.steps as s, i (s.id)}
							<span class={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', SEGMENT[w.status(i)])}></span>
						{/each}
					</div>
				</header>

				<!-- Content -->
				<main bind:this={main} class="relative flex-1 overflow-y-auto overscroll-contain">
					<div class="mn-body px-4 pt-5 pb-8 in-data-[density=compact]:pt-4">
						<MobileSummary class="mb-4 lg:hidden" />
						<p class="text-sm text-muted-foreground">{w.current.description}</p>

						{#if w.current.id === 'vehicle'}
							<!-- Camera VIN scan (simulated) -->
							<div class="mt-5">
								{#if scanning}
									<div
										class="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl bg-[#0c1a2b] text-white"
										role="status"
										aria-live="polite"
									>
										<div class="absolute inset-6 rounded-xl border-2 border-white/25"></div>
										<span class="mn-corner top-6 left-6 border-t-2 border-l-2"></span>
										<span class="mn-corner top-6 right-6 border-t-2 border-r-2"></span>
										<span class="mn-corner bottom-6 left-6 border-b-2 border-l-2"></span>
										<span class="mn-corner right-6 bottom-6 border-r-2 border-b-2"></span>
										<span class="mn-scanline absolute inset-x-8 h-0.5 rounded-full bg-brand-accent shadow-[0_0_12px_2px_var(--brand-accent)]"></span>
										<p class="relative font-mono text-sm tracking-[0.2em] text-white/80">{SAMPLE_VIN}</p>
										<p class="absolute bottom-2 text-xs text-white/70">{tr('Reading VIN barcode…')}</p>
									</div>
								{:else if w.vinDecoded && !w.errors.vin}
									<div class="flex items-center gap-3 rounded-2xl border bg-success-soft p-4" in:fade={{ duration: prefersReducedMotion.current ? 0 : 200 }}>
										<CircleCheck class="size-6 shrink-0 text-success-strong" />
										<div class="min-w-0 flex-1">
											<p class="text-sm font-semibold">{w.vehicleName} {w.values.trim ?? ''}</p>
											<p class="truncate font-mono text-xs text-muted-foreground">{w.values.vin}</p>
										</div>
										<Button variant="ghost" size="icon" class="size-11 rounded-full" aria-label={tr('Scan again')} onclick={scanVin}>
											<RotateCw class="size-4" />
										</Button>
									</div>
								{:else}
									<button
										type="button"
										onclick={scanVin}
										class="group flex w-full items-center gap-4 rounded-2xl bg-primary p-4 text-left text-primary-foreground shadow-soft transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
									>
										<span class="grid size-14 shrink-0 place-items-center rounded-xl bg-white/15">
											<Camera class="size-7" />
										</span>
										<span class="min-w-0 flex-1">
											<span class="block text-lg leading-snug font-semibold">{tr('Scan VIN')}</span>
											<span class="block text-sm opacity-80">{tr('Point the camera at the windshield or door-jamb barcode.')}</span>
										</span>
										<ChevronRight class="size-5 opacity-70" />
									</button>
								{/if}
							</div>
							<div class="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
								<span class="h-px flex-1 bg-border"></span> {tr('or enter it by hand')} <span class="h-px flex-1 bg-border"></span>
							</div>
						{:else}
							<div class="h-5"></div>
						{/if}

						<StepBody narrow />
					</div>
				</main>

				{#if notice}
					<div
						transition:fade={{ duration: prefersReducedMotion.current ? 0 : 150 }}
						role="status"
						class="pointer-events-none absolute inset-x-4 bottom-28 z-20 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lift"
					>
						{notice}
					</div>
				{/if}

				<!-- Thumb-zone footer -->
				<footer class="pb-safe shrink-0 border-t bg-card px-4 pt-3">
					{#if w.savedAt}
						<p class="mb-2 text-center text-[11px] text-faint">{tr('Autosaved {time}', { time: time(w.savedAt) })}</p>
					{/if}
					<div class="flex gap-2">
						{#if !w.isFirst}
							<Button variant="outline" class="h-12 gap-1 px-4 text-[15px]" onclick={back}>
								<ChevronLeft class="size-4" /> {tr('Back')}
							</Button>
						{/if}
						<Button class="h-12 flex-1 gap-1 text-[15px]" onclick={primary}>
							{primaryLabel}
							{#if !w.isLast}<ChevronRight class="size-4" />{/if}
						</Button>
					</div>
				</footer>
			{/if}
		</div>
		{#if !w.created}
			<div class="hidden w-[320px] shrink-0 lg:block xl:w-[340px]">
				<SummaryCard />
			</div>
		{/if}
	</div>
</div>

<!-- Step map -->
<Sheet.Root bind:open={mapOpen}>
	<Sheet.Content side="bottom" class="max-h-[85dvh] gap-0 rounded-t-3xl pb-safe md:mx-auto md:max-w-[420px] lg:right-[344px]! xl:right-[364px]!">
		<div class="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true"></div>
		<Sheet.Header class="px-5 pt-3 pb-3">
			<Sheet.Title class="text-lg font-semibold">{tr('Contract steps')}</Sheet.Title>
			<Sheet.Description>{tr('{product} · {n} of {total} done', { product: w.product.name, n: doneCount, total: w.total })}</Sheet.Description>
		</Sheet.Header>
		<ol class="overflow-y-auto px-2 pb-2">
			{#each w.steps as s, i (s.id)}
				{@const st = w.status(i)}
				<li>
					<button
						type="button"
						disabled={st === 'locked'}
						onclick={() => jumpTo(i)}
						aria-current={i === w.index ? 'step' : undefined}
						class={cn(
							'flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:hover:bg-transparent',
							i === w.index && 'bg-primary-soft/70 hover:bg-primary-soft'
						)}
					>
						<StatusIcon status={st} n={i + 1} class="size-8" />
						<span class="min-w-0 flex-1">
							<span class={cn('block truncate font-medium', st === 'locked' && 'text-muted-foreground')}>{s.title}</span>
							<span class={cn('block text-xs', st === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{tr(STATUS_TEXT[st])}</span>
						</span>
						{#if st !== 'locked' && i !== w.index}<ChevronRight class="size-4 text-muted-foreground" />{/if}
					</button>
				</li>
			{/each}
		</ol>
	</Sheet.Content>
</Sheet.Root>

<style>
	.mn-corner {
		position: absolute;
		width: 1.5rem;
		height: 1.5rem;
		border-color: var(--brand-accent);
		border-radius: 0.375rem;
	}
	.mn-scanline {
		animation: mn-scan 1.4s ease-in-out infinite alternate;
	}
	@keyframes mn-scan {
		from {
			top: 18%;
		}
		to {
			top: 82%;
		}
	}
	/* 48px touch targets inside the step body on this phone-first concept */
	.mn-body :global([data-slot='input']),
	.mn-body :global([data-slot='select-trigger']),
	.mn-body :global([data-field] [data-slot='button']) {
		height: 3rem;
		font-size: 1rem;
	}
	.mn-body :global([data-slot='toggle-group-item']) {
		min-height: 3rem;
	}
	:global([data-density='compact']) .mn-body :global([data-slot='input']),
	:global([data-density='compact']) .mn-body :global([data-slot='select-trigger']),
	:global([data-density='compact']) .mn-body :global([data-field] [data-slot='button']) {
		height: 2.75rem;
		font-size: 0.9375rem;
	}
	:global([data-density='compact']) .mn-body :global([data-slot='toggle-group-item']) {
		min-height: 2.75rem;
	}
</style>
