<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import X from '@lucide/svelte/icons/x';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Check from '@lucide/svelte/icons/check';
	import { prefersReducedMotion } from 'svelte/motion';
	import { slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import { tr } from '$lib/i18n/index.svelte';
	import { getWizard, DealerHeader, StepBody, SuccessPanel, SummaryLayout, SummaryCard, StepChecklist, DealerTips } from '$lib/wizard';

	/**
	 * Concept 0 — Default Insclix wizard.
	 * The legacy page-wizard LAYOUT and BEHAVIOUR (numbered step tiles where only the
	 * current one expands with its name (animated), segmented progress rail, every step stacked on one page as
	 * numbered cards (scroll-spy drives the stepper) and label-left rows, Lookup switch on the address, a
	 * split Save button that opens upward, joined Previous / Next) rebuilt with
	 * our tokens, components and content.
	 */
	const w = getWizard();
	// every section is on the page, so any section can be reached (review still
	// needs the earlier ones valid)
	w.freeNav = true;
	let main = $state<HTMLElement>();
	let justSaved = $state(false);
	let tiles = $state<HTMLOListElement>();
	const dur = $derived(prefersReducedMotion.current ? 0 : 1);
	/** true while we scroll programmatically, so scroll-spy doesn't fight it */
	let steering = false;

	// keep the active tile visible when the row scrolls sideways (phones)
	$effect(() => {
		const i = w.index;
		tiles?.children[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: dur ? 'smooth' : 'auto' });
	});

	function scrollToStep(i: number) {
		const el = main?.querySelector<HTMLElement>(`[data-section="${i}"]`);
		if (!el || !main) return;
		steering = true;
		main.scrollTo({ top: el.offsetTop - 24, behavior: dur ? 'smooth' : 'auto' });
		setTimeout(() => (steering = false), dur ? 700 : 50);
		el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
	}

	function jump(i: number) {
		if (w.goto(i)) scrollToStep(i);
	}

	function next() {
		const before = w.index;
		w.next(); // validates the current section; on the last one it creates the contract
		if (w.index !== before) scrollToStep(w.index);
		else if (!w.created) scrollToStep(w.index); // failed: bring the error summary into view
	}

	function prev() {
		w.prev();
		scrollToStep(w.index);
	}

	// scroll-spy: the section crossing the upper third of the viewport is current
	$effect(() => {
		// re-observe when the summary toggle re-renders the sections
		if (!main) return;
		void w.showSummary;
		const root = main;
		const io = new IntersectionObserver(
			(entries) => {
				if (steering) return;
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const i = Number((e.target as HTMLElement).dataset.section);
					if (i !== w.index) w.goto(i);
				}
			},
			{ root, rootMargin: '-25% 0px -70% 0px' }
		);
		root.querySelectorAll('[data-section]').forEach((el) => io.observe(el));
		return () => io.disconnect();
	});

	function save() {
		w.saveDraft();
		justSaved = true;
		setTimeout(() => (justSaved = false), 1800);
	}

	const tile = (i: number) => {
		const st = w.status(i);
		if (i === w.index) return st === 'error' ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground';
		if (st === 'error') return 'bg-danger-soft text-destructive';
		if (st === 'complete') return 'bg-primary-soft text-primary dark:text-accent-foreground';
		return 'bg-muted text-muted-foreground';
	};
</script>

<div class="flex h-dvh flex-col">
	<DealerHeader menu />

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<!-- Step tiles + contract number, over a segmented progress rail -->
		<nav aria-label={tr('Contract steps')} class="shrink-0 border-b bg-card">
			<div class="mx-auto flex w-full max-w-[1168px] items-center gap-4 px-4 pt-3 sm:px-6">
				<ol bind:this={tiles} class="-my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] sm:gap-3">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						<li class={cn('shrink-0', i !== w.index && 'hidden sm:block')}>
							<button
								type="button"
								onclick={() => jump(i)}
								disabled={st === 'locked'}
								aria-current={i === w.index ? 'step' : undefined}
								aria-label={tr('Step {n}: {title}', { n: i + 1, title: s.title })}
								class="flex min-w-0 items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
							>
								<span
									class={cn(
										'grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300',
										tile(i),
										i === w.index && 'tile-pop shadow-[0_4px_14px_-4px_var(--primary)]',
										st !== 'locked' && i !== w.index && 'hover:ring-2 hover:ring-primary/30'
									)}
								>
									{#if st === 'complete' && i !== w.index}<Check class="size-4" />{:else}{i + 1}{/if}
								</span>
									<!-- only the current step shows its name; it slides open as you move -->
									{#if i === w.index}
										<span
											transition:slide={{ axis: 'x', duration: 360 * dur, easing: cubicOut }}
											class="overflow-hidden whitespace-nowrap"
										>
											<span in:fly={{ x: -8, duration: 300 * dur, delay: 120 * dur, easing: cubicOut }} class="block pr-2 pl-3 text-sm font-semibold">
												{s.short}
											</span>
										</span>
									{/if}
							</button>
						</li>
					{/each}
				</ol>
				<div class="hidden shrink-0 text-right leading-tight sm:block">
					<p class="text-xs text-muted-foreground">{tr('Contract no.')}</p>
					<p class="font-mono text-lg font-semibold">{w.contractNo}</p>
				</div>
				<!-- phones: the legacy app bar closes from the step bar -->
				<Button variant="ghost" size="icon" class="size-9 shrink-0 text-primary sm:hidden dark:text-accent-foreground" aria-label={tr('Close')}>
					<X class="size-5" />
				</Button>
			</div>
			<div class="mx-auto mt-3 grid w-full max-w-[1168px] gap-1 px-4 sm:px-6" style={`grid-template-columns: repeat(${w.total}, minmax(0, 1fr))`} aria-hidden="true">
				{#each w.steps as s, i (s.id)}
					<span class="relative h-1 overflow-hidden rounded-full bg-muted">
						<span
							class={cn(
								'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out',
								w.status(i) === 'error' ? 'bg-destructive' : 'bg-primary'
							)}
							style={`width:${i < w.index || w.status(i) === 'complete' ? 100 : i === w.index ? 100 : 0}%; opacity:${i === w.index ? 1 : 0.45}`}
						></span>
					</span>
				{/each}
			</div>
		</nav>

		<!-- Every step on one page, stacked as cards (legacy behaviour) -->
		<main bind:this={main} class="relative flex-1 overflow-x-hidden overflow-y-auto scroll-smooth">
			<div class="mx-auto w-full max-w-[1168px] px-4 py-6 sm:px-6 sm:py-8">
				{#if w.showSummary}
					<SummaryLayout class="max-w-none">
						{#snippet summary()}
							<!-- own scroll area: the column is pinned and can be taller than the viewport -->
							<div class="-mx-2 -mt-1 flex max-h-[calc(100dvh-16rem)] flex-col gap-4 overflow-y-auto overscroll-contain px-2 pt-1 pb-3 [scrollbar-width:thin]">
								<SummaryCard showContract={false} />
								<StepChecklist ongoto={jump} />
								<DealerTips />
							</div>
						{/snippet}
						{@render sections()}
					</SummaryLayout>
				{:else}
					{@render sections()}
				{/if}
			</div>
		</main>

		<!-- Sticky action bar: split Save (opens upward) and joined Previous / Next -->
		<footer class="pb-safe shrink-0 border-t bg-card/95 shadow-[0_-4px_16px_rgb(0_0_0/4%)] backdrop-blur">
			<div class="mx-auto flex w-full max-w-[1168px] items-center gap-3 px-4 pt-3 sm:px-6">
				<div class="flex items-center overflow-hidden rounded-lg border bg-card shadow-soft">
					<Button variant="ghost" class="hidden h-9 gap-2 rounded-none px-4 text-primary hover:text-primary sm:inline-flex dark:text-accent-foreground" aria-label={tr('Close')}>
						<X class="size-4" />{tr('Close')}
					</Button>
					<Button class="h-9 gap-2 rounded-none px-4" onclick={save}>
						{#if justSaved}<Check class="size-4" />{/if}
						<span>{justSaved ? tr('Saved') : tr('Save draft')}</span>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} class="h-9 rounded-none border-l border-primary-foreground/25 px-3" aria-label={tr('More save options')}>
									<ChevronUp class="size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content side="top" align="start" class="min-w-48">
							<DropdownMenu.Item onclick={save}>{tr('Save draft')}</DropdownMenu.Item>
							<DropdownMenu.Item onclick={save}>{tr('Save and close')}</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onclick={() => w.reset()}>{tr('Discard draft')}</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<span class="flex-1"></span>

				<div class="flex items-center overflow-hidden rounded-lg border bg-card shadow-soft">
					<Button
						variant="ghost"
						class="h-9 gap-1 rounded-none bg-muted/60 px-4 text-muted-foreground"
						disabled={w.isFirst}
						onclick={prev}
					>
						<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Previous')}</span>
					</Button>
					<Button class="h-9 gap-1 rounded-none px-4 sm:px-5" onclick={next} aria-label={w.isLast ? tr('Create contract') : tr('Next')}>
						<span class={cn(!w.isLast && 'hidden sm:inline')}>{w.isLast ? tr('Create contract') : tr('Next')}</span>
						{#if !w.isLast}<ChevronRight class="size-4" />{/if}
					</Button>
				</div>
			</div>
		</footer>
	{/if}
</div>

{#snippet sections()}
			<div class="flex flex-col gap-4 sm:gap-6">
				{#each w.steps as s, i (s.id)}
					{@const active = i === w.index}
					<section
						data-section={i}
						aria-labelledby={`sec-${s.id}`}
						class={cn(
							'legacy-form rounded-2xl border bg-card p-5 shadow-soft sm:p-8'
							)}
					>
						<header class="mb-7 flex items-start gap-4">
							<span
								class={cn(
									'grid size-10 shrink-0 place-items-center rounded-lg text-base font-semibold tabular-nums transition-colors duration-300',
									active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
								)}
							>
								{i + 1}
							</span>
							<div class="min-w-0">
								<h2 id={`sec-${s.id}`} tabindex="-1" class="text-xl font-bold tracking-tight outline-none sm:text-[26px]">{s.title}</h2>
								<p class="mt-1.5 max-w-3xl text-sm text-muted-foreground">{s.description}</p>
							</div>
						</header>
						<div class="sm:pl-14">
							<StepBody step={s} layout="inline" grouped={false} reviewVariant="rows" onedit={(id) => jump(w.steps.findIndex((x) => x.id === id))} />
						</div>
					</section>
				{/each}
				<!-- room so the last section can scroll up to the spy line -->
				<div class="h-[40vh] shrink-0" aria-hidden="true"></div>
			</div>
{/snippet}

<style>
	/* the newly active step tile pops in */
	.tile-pop {
		animation: tile-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes tile-pop {
		0% {
			transform: scale(0.82);
		}
		60% {
			transform: scale(1.08);
		}
		100% {
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile-pop {
			animation: none;
		}
	}
	/* Legacy rhythm: roomy label-left rows */
	.legacy-form :global([data-field]) {
		row-gap: 0.25rem;
	}
	/* one consistent field width = the street-address input (its row minus the
	   Lookup switch), capped at 480px; phones keep full width */
	/* phones: outlined fields with the label floating on the top border, like the legacy mobile form */
	@media (max-width: 639px) {
		.legacy-form :global([data-field]:not([data-type='switch'])) {
			position: relative;
			padding-top: 0.45rem;
			row-gap: 0;
		}
		.legacy-form :global([data-field]:not([data-type='switch']) > label) {
			position: absolute;
			top: 0;
			left: 0.75rem;
			z-index: 1;
			padding: 0 0.25rem;
			background: var(--card);
			font-size: 0.75rem;
			line-height: 0.9rem;
			color: var(--muted-foreground);
		}
		.legacy-form :global([data-field]:not([data-type='switch']) input),
		.legacy-form :global([data-field]:not([data-type='switch']) [data-slot='select-trigger']),
		.legacy-form :global([data-field]:not([data-type='switch']) textarea) {
			border-radius: 0.5rem;
			border-color: var(--input);
		}
		.legacy-form :global([data-field]:not([data-type='switch']) > div:last-child) {
			gap: 0.35rem;
		}
	}
	@media (min-width: 640px) {
		.legacy-form :global([data-field] > div:last-child) {
			width: 100%;
			max-width: min(480px, calc(100% - 7rem));
		}
		.legacy-form :global([data-field='address1'] > div:last-child) {
			max-width: none;
		}
		/* switch rows (add-ons) span label + control, ending on the same edge as the inputs */
		.legacy-form :global([data-type='switch'] > div:last-child) {
			max-width: calc(224px + min(480px, calc(100% - 224px - 7rem)));
		}
		.legacy-form :global([data-field='address1'] > div:last-child > div > .relative) {
			flex: 0 1 min(480px, calc(100% - 7rem));
		}
	}
	.legacy-form :global([data-field] input),
	.legacy-form :global([data-field] [data-slot='select-trigger']) {
		height: 2.75rem;
	}
	@media (min-width: 640px) {
		.legacy-form :global([data-field]) {
			grid-template-columns: 200px 1fr;
		}
	}
</style>
