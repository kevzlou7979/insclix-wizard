<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import Save from '@lucide/svelte/icons/save';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import type { StepStatus } from '$lib/wizard';
	import { getWizard, DealerHeader, StepBody, StatusIcon, SuccessPanel, SummaryLayout, createOnePage } from '$lib/wizard';
	import { tr } from '$lib/i18n/index.svelte';

	/**
	 * Concept 1 — Sticky horizontal stepper.
	 * The legacy page wizard, modernised: labelled steps, top-aligned labels,
	 * grouped fields, every step stacked on one page (scroll-spy drives the
	 * stepper), sticky footer. Stepper collapses on its own width
	 * (container query), not the viewport.
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();
	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));
	const STATUS_TEXT: Record<StepStatus, string> = {
		complete: 'completed',
		current: 'current',
		error: 'has errors',
		upcoming: 'not started',
		locked: 'locked'
	};

	// every step is on one page; Next / tiles scroll to a section, scrolling moves the stepper
	const page = createOnePage(w, () => main);
	$effect(() => page.spy());
</script>

<div class="flex h-dvh flex-col">
	<!-- contract no. lives in the summary hero -->
	<DealerHeader />

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<!-- Stepper -->
		<nav aria-label={tr('Contract steps')} class="@container shrink-0 border-b bg-card">
			<div class="mx-auto max-w-[1168px] px-4 sm:px-6">
				<!-- wide: every step labelled -->
				<ol class="hidden items-center gap-1 py-3 @3xl:flex">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						<li class="flex min-w-0 flex-1 items-center gap-1 last:flex-none">
							<button
								type="button"
								onclick={() => page.jump(i)}
								disabled={st === 'locked'}
								aria-current={i === w.index ? 'step' : undefined}
								class={cn(
									'flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
									i === w.index && 'bg-primary-soft/60'
								)}
							>
								<StatusIcon status={st} n={i + 1} />
								<span class="min-w-0">
									<span class="block text-[11px] text-muted-foreground">{tr('Step {n}', { n: i + 1 })}</span>
									<span class={cn('block truncate text-sm', i === w.index ? 'font-semibold' : 'font-medium text-foreground/80')}>{s.short}</span>
									<span class="sr-only">, {tr(STATUS_TEXT[st])}</span>
								</span>
							</button>
							{#if i < w.steps.length - 1}
								<span class={cn('h-px min-w-4 flex-1', i < w.index ? 'bg-primary' : 'bg-border')}></span>
							{/if}
						</li>
					{/each}
				</ol>
				<!-- medium: numbers + current label -->
				<ol class="hidden items-center gap-2 py-3 @md:flex @3xl:hidden">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						<li class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => page.jump(i)}
								disabled={st === 'locked'}
								aria-label={tr('Step {n}: {title}, {status}', { n: i + 1, title: s.title, status: tr(STATUS_TEXT[st]) })}
								aria-current={i === w.index ? 'step' : undefined}
								class="-m-1.5 rounded-full p-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
							>
								<StatusIcon status={st} n={i + 1} />
							</button>
							{#if i === w.index}<span class="text-sm font-semibold">{s.short}</span>{/if}
						</li>
					{/each}
				</ol>
				<!-- narrow: Step X of N + bar -->
				<div class="flex flex-col gap-2 py-3 @md:hidden">
					<p class="text-sm"><span class="text-muted-foreground">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} ·</span> <span class="font-semibold">{w.current.short}</span></p>
					<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="h-1.5" />
				</div>
			</div>
		</nav>

		<!-- Every step on one page -->
		<main bind:this={main} class="flex-1 overflow-y-auto">
			<div class="px-4 py-6 sm:px-6 sm:py-8">
				<SummaryLayout>
					<div class="flex flex-col gap-4 sm:gap-6">
						{#each w.steps as s, i (s.id)}
							{@const active = i === w.index}
							<section
								data-section={i}
								aria-labelledby={`c01-sec-${s.id}`}
								class={cn(
									'rounded-2xl border bg-card p-5 shadow-soft transition-[box-shadow,border-color] duration-300 sm:p-8',
									active && 'border-primary/40 ring-1 ring-primary/20'
								)}
							>
								<header class="mb-6 flex items-start gap-4">
									<span
										class={cn(
											'hidden size-11 shrink-0 place-items-center rounded-xl transition-colors duration-300 sm:grid',
											active ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary dark:text-accent-foreground'
										)}
									>
										<s.icon class="size-5" />
									</span>
									<div>
										<p class="text-xs font-medium text-muted-foreground">{tr('Step {n}', { n: i + 1 })}</p>
										<h2 id={`c01-sec-${s.id}`} tabindex="-1" class="text-xl font-semibold tracking-tight outline-none sm:text-2xl">{s.title}</h2>
										<p class="mt-1 text-sm text-muted-foreground">{s.description}</p>
									</div>
								</header>
								<StepBody step={s} onedit={(id) => page.jump(w.steps.findIndex((x) => x.id === id))} />
							</section>
						{/each}
						<!-- room so the last section can reach the spy line -->
						<div class="h-[40vh] shrink-0" aria-hidden="true"></div>
					</div>
				</SummaryLayout>
			</div>
		</main>

		<!-- Sticky footer -->
		<footer class="pb-safe shrink-0 border-t bg-card/95 backdrop-blur">
			<div class="mx-auto flex max-w-[1168px] items-center gap-2 px-4 pt-3 sm:px-6">
				<Button variant="ghost" class="h-10 gap-1.5 pointer-coarse:h-11" aria-label={tr('Close')}><X class="size-4" /><span class="hidden sm:inline">{tr('Close')}</span></Button>
				<Button
					variant="outline"
					class="h-10 gap-1.5 pointer-coarse:h-11"
					aria-label={w.savedAt ? tr('Draft saved') : tr('Save draft')}
					onclick={() => w.saveDraft()}
				>
					{#if w.savedAt}<Check class="size-4 text-success-strong" />{:else}<Save class="size-4" />{/if}
					<span class="hidden sm:inline">{w.savedAt ? tr('Saved') : tr('Save draft')}</span>
				</Button>
				<span class="flex-1"></span>
				<Button variant="outline" class="h-10 gap-1 pointer-coarse:h-11" disabled={w.isFirst} onclick={page.prev}>
					<ChevronLeft class="size-4" /> {tr('Back')}
				</Button>
				<Button class="h-10 gap-1 px-4 pointer-coarse:h-11" onclick={page.next}>
					{nextLabel}
					{#if !w.isLast}<ChevronRight class="size-4" />{/if}
				</Button>
			</div>
		</footer>
	{/if}
</div>
