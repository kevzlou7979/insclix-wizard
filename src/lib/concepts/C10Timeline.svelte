<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Lock from '@lucide/svelte/icons/lock';
	import CloudCheck from '@lucide/svelte/icons/cloud-check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { cn } from '$lib/utils';
	import { tr, locale } from '$lib/i18n/index.svelte';
	import {
		getWizard,
		money,
		DealerHeader,
		StepBody,
		StatusIcon,
		SuccessPanel,
		SummaryLayout,
		MobileSummary,
		type ProductDef,
		type StepDef,
		type StepStatus
	} from '$lib/wizard';

	/**
	 * Concept 10 — Timeline, review as you go.
	 * One scrolling page: finished steps fold into summary cards with Change,
	 * the active step stays open, upcoming steps wait as muted headers.
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();

	const dur = $derived(prefersReducedMotion.current ? 0 : 260);

	const TONE: Record<ProductDef['tone'], string> = {
		primary: 'bg-primary-soft text-primary dark:text-accent-foreground',
		success: 'bg-success-soft text-success-strong',
		warning: 'bg-warning-soft text-warning-strong',
		accent: 'bg-brand-accent-soft text-brand-accent'
	};

	const STATUS_TEXT: Record<StepStatus, string> = {
		complete: 'completed',
		current: 'in progress',
		error: 'needs attention',
		upcoming: 'not started',
		locked: 'locked until earlier steps are done'
	};

	/** phone-only left border colour per status (replaces the timeline line) */
	const EDGE: Record<StepStatus, string> = {
		complete: 'border-l-primary',
		current: 'border-l-primary',
		error: 'border-l-destructive',
		upcoming: 'border-l-border',
		locked: 'border-l-border'
	};

	const summary = (s: StepDef) =>
		s.kind === 'product'
			? [
					{ id: 'product', label: tr('Product'), value: w.product.name },
					{ id: 'cover', label: tr('Covers'), value: w.product.tagline }
				]
			: w.answers(s);

	/** Scroll a step card into view and put focus on its heading (unless its error summary owns focus). */
	async function reveal(i: number) {
		await tick();
		const s = w.steps[i];
		if (!s) return;
		const el = document.getElementById(`c10-step-${s.id}`);
		el?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
		if (w.status(i) !== 'error') el?.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true });
	}

	function change(i: number) {
		if (w.goto(i)) reveal(i);
	}

	function cont() {
		const wasLast = w.isLast;
		if (!w.next()) {
			// failed submit jumps to the first invalid step; failed Next keeps focus on the error summary
			if (wasLast && !w.created) reveal(w.index);
			return;
		}
		if (w.created) {
			main?.scrollTo({ top: 0 });
			return;
		}
		// after a Change, skip steps that are still complete and resume where the dealer left off
		let j = w.index;
		while (j < w.maxVisited && w.steps[j].kind === 'fields' && w.isStepValid(j)) j++;
		if (j !== w.index) w.goto(j);
		reveal(w.index);
	}
</script>

<div class="flex h-dvh flex-col">
	<DealerHeader />

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<!-- Sticky mini header -->
		<div class="shrink-0 border-b bg-card/95 backdrop-blur">
			<div class="mx-auto flex max-w-[1168px] items-center gap-3 px-4 py-2.5 sm:px-6 in-data-[density=compact]:py-2">
				<span class={cn('grid size-9 shrink-0 place-items-center rounded-lg', TONE[w.product.tone])}>
					<w.product.icon class="size-[18px]" />
				</span>
				<div class="min-w-0 flex-1 leading-tight">
					<p class="truncate text-sm font-semibold">{w.product.name}</p>
					<p class="text-xs text-muted-foreground tabular-nums">
						{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} · {w.current.short}
					</p>
				</div>
				<!-- ≥lg the summary column carries the price -->
				<div class="text-right leading-tight lg:hidden">
					<p class="text-[11px] text-muted-foreground">{tr('Retail price')}</p>
					<p class="text-base font-semibold tabular-nums">{money(w.price)}</p>
				</div>
			</div>
			<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="h-1 rounded-none" />
		</div>

		<main bind:this={main} class="flex-1 overflow-y-auto">
			<div class="px-4 pt-6 pb-10 sm:px-6 sm:pt-10 sm:pb-16 in-data-[density=compact]:sm:pt-7">
				<SummaryLayout mobile={false}>
				<header class="mb-6 sm:mb-8 sm:pl-12">
					<h1 class="text-2xl font-semibold tracking-tight">{tr('Create a contract')}</h1>
					<p class="mt-1 text-sm text-muted-foreground">
						{tr('Finished steps fold into summaries as you go, so this page is your review. Use Change to fix anything.')}
					</p>
					<p class="mt-2 flex h-4 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
						{#if w.savedAt}
							<CloudCheck class="size-3.5 text-success-strong" />
							{tr('Draft saved at {time}', { time: w.savedAt.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }) })}
						{/if}
					</p>
				</header>

				<!-- below lg: the summary folds into a bar, aligned with the timeline cards -->
				<MobileSummary class="mb-6 sm:mb-8 sm:ml-12 lg:hidden" />

				<ol class="flex flex-col sm:pl-12" aria-label={tr('Contract steps')}>
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						{@const active = i === w.index}
						{@const folded = !active && (st === 'complete' || st === 'error')}
						{@const hid = `c10-h-${s.id}`}
						<li
							id={`c10-step-${s.id}`}
							aria-current={active ? 'step' : undefined}
							class={cn(
								'relative scroll-mt-4 border-l-2 pb-3 pl-3 last:pb-0 sm:border-l-0 sm:pl-0',
								EDGE[st]
							)}
							animate:flip={{ duration: dur, easing: cubicOut }}
							in:fade={{ duration: dur }}
						>
							<!-- timeline marker + segment (tablet / desktop) -->
							<span class="absolute top-3.5 -left-12 hidden sm:block">
								<StatusIcon status={st} n={i + 1} />
							</span>
							{#if i < w.steps.length - 1}
								<span
									aria-hidden="true"
									class={cn(
										'absolute top-12 -bottom-2 -left-[35px] hidden w-0.5 rounded-full transition-colors sm:block',
										i < w.index ? 'bg-primary' : 'bg-border'
									)}
								></span>
							{/if}

							{#if active}
								<!-- ===== active step ===== -->
								<article
									aria-labelledby={hid}
									class="rounded-2xl border border-primary/30 bg-card shadow-lift ring-1 ring-primary/15"
								>
									<div class="p-5 sm:p-7 in-data-[density=compact]:sm:p-5">
										<header class="mb-5 flex items-start gap-3.5">
											<span class="hidden size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid dark:text-accent-foreground">
												<s.icon class="size-5" />
											</span>
											<div class="min-w-0">
												<p class="text-xs font-medium text-primary dark:text-accent-foreground">{tr('Step {n} of {total}', { n: i + 1, total: w.total })}</p>
												<h2 id={hid} data-step-heading tabindex="-1" class="mt-0.5 text-lg font-semibold tracking-tight outline-none sm:text-xl">
													{s.title}
												</h2>
												<p class="mt-1 text-sm text-muted-foreground">{s.description}</p>
											</div>
										</header>

										{#if s.kind === 'review'}
											<div class="flex flex-col gap-4">
												<p class="text-sm">
													{tr('Everything above goes on the contract. Check it once more, then create it.')}
												</p>
												<section aria-label={tr('Price')} class="rounded-xl border bg-muted/40 p-4">
													{#each w.priceLines as l (l.label)}
														<div class="flex justify-between gap-3 py-0.5 text-sm">
															<span class="text-muted-foreground">{l.label}</span>
															<span class="tabular-nums">{money(l.amount)}</span>
														</div>
													{/each}
													<div class="mt-2 flex items-baseline justify-between gap-3 border-t pt-3">
														<span class="font-medium">{tr('Dealer retail price')}</span>
														<span class="text-2xl font-semibold tabular-nums">{money(w.price)}</span>
													</div>
												</section>
												<p class="text-xs text-muted-foreground">
													<span class="font-mono">{w.contractNo}</span> · {w.customerName} · {w.vehicleName}
												</p>
											</div>
										{:else}
											<StepBody step={s} />
										{/if}
									</div>

									<!-- stays in the thumb zone while the card is on screen -->
									<div
										class="pb-safe sticky bottom-0 z-10 flex items-center gap-3 rounded-b-2xl border-t bg-card/95 px-5 pt-3 backdrop-blur sm:px-7"
									>
										<p class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
											{#if w.isLast}
												{tr('Total')} <span class="font-semibold text-foreground tabular-nums">{money(w.price)}</span>
											{:else}
												{tr('Next: {step}', { step: w.steps[i + 1]?.title ?? '' })}
											{/if}
										</p>
										<Button class="h-11 shrink-0 gap-1.5 px-5 sm:h-10" onclick={cont}>
											{w.isLast ? tr('Create contract') : tr('Continue')}
											{#if !w.isLast}<ArrowRight class="size-4" />{/if}
										</Button>
									</div>
								</article>
							{:else if folded}
								<!-- ===== finished step: summary card ===== -->
								<article
									aria-labelledby={hid}
									class={cn(
										'rounded-xl border bg-card px-4 py-3 shadow-soft in-data-[density=compact]:py-2.5',
										st === 'error' && 'border-destructive/50'
									)}
								>
									<header class="flex items-center gap-3">
										<StatusIcon status={st} n={i + 1} class="size-6 sm:hidden" />
										<div class="min-w-0 flex-1">
											<h2 id={hid} data-step-heading tabindex="-1" class="truncate text-sm font-semibold outline-none">
												{s.title}<span class="sr-only">, {tr(STATUS_TEXT[st])}</span>
											</h2>
											{#if st === 'error'}
												<p class="flex items-center gap-1 text-xs font-medium text-destructive">
													<CircleAlert class="size-3.5" /> {tr('Needs attention')}
												</p>
											{/if}
										</div>
										<Button
											variant="ghost"
											class="-mr-2 h-9 shrink-0 gap-1.5 text-primary pointer-coarse:h-11 dark:text-accent-foreground"
											onclick={() => change(i)}
										>
											<Pencil class="size-3.5" /> {tr('Change')}<span class="sr-only"> {s.short.toLowerCase()}</span>
										</Button>
									</header>
									{#if summary(s).length}
										<dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
											{#each summary(s) as a (a.id)}
												<div class="min-w-0">
													<dt class="truncate text-xs text-muted-foreground">{a.label}</dt>
													<dd class="truncate font-medium" title={a.value}>{a.value}</dd>
												</div>
											{/each}
										</dl>
									{:else}
										<p class="mt-1 text-sm text-muted-foreground">{tr('Nothing entered yet.')}</p>
									{/if}
								</article>
							{:else}
								<!-- ===== upcoming step: muted, collapsed ===== -->
								<div
									class="flex min-h-12 items-center gap-3 rounded-xl border border-dashed bg-card/50 px-4 py-2.5 text-muted-foreground"
								>
									<StatusIcon status={st} n={i + 1} class="size-6 sm:hidden" />
									<h2 id={hid} class="min-w-0 flex-1 truncate text-sm font-medium">
										{s.title}<span class="sr-only">, {tr(STATUS_TEXT[st])}</span>
									</h2>
									{#if st === 'locked'}<Lock class="size-3.5 shrink-0" aria-hidden="true" />{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ol>
				</SummaryLayout>
			</div>
		</main>
	{/if}
</div>
