<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import { getWizard, DealerHeader, Field, ProductPicker, ReviewList, SuccessPanel, SummaryCard, MobileSummary } from '$lib/wizard';
	import type { StepDef } from '$lib/wizard';
	import { tr } from '$lib/i18n/index.svelte';

	/**
	 * Concept 5 — One thing per page.
	 * Every fields-step is split into one screen per field group. Big question
	 * heading, a Back link, one Continue button (thumb zone on phones, inline on
	 * desktop). Only the fields on the current screen are validated before moving on.
	 * ≥lg the checkout-style summary sits right beside the question column; below
	 * lg it folds into a quiet bar under the Back link.
	 */
	const w = getWizard();

	/** `qid` is language-neutral (step id, or the group's first field id) so copy lookups survive translation */
	type Screen = { key: string; qid: string; ids: string[] | null };

	function screensOf(step: StepDef): Screen[] {
		if (step.kind !== 'fields') return [{ key: step.id, qid: step.id, ids: null }];
		const visible = w.visibleFields(step).map((f) => f.id);
		const list: Screen[] = step.groups?.length
			? step.groups.map((g) => ({ key: `${step.id}:${g.fields[0]}`, qid: g.fields[0], ids: g.fields }))
			: [{ key: step.id, qid: step.id, ids: (step.fields ?? []).map((f) => f.id) }];
		const shown = list.filter((s) => s.ids!.some((id) => visible.includes(id)));
		return shown.length ? shown : [{ key: step.id, qid: step.id, ids: [] }];
	}

	/** screens per step, recomputed when the product (and so the steps) change */
	const all = $derived(w.steps.map((s) => screensOf(s)));

	// local position inside the current step; falls back to screen 0 if the
	// engine moved to another step on its own (gallery reset, submit error, ...)
	let pos = $state({ step: 0, sub: 0 });
	let dir = $state<1 | -1>(1);
	let fromReview = $state(false);
	let showErrors = $state(false);

	const screens = $derived(all[w.index] ?? []);
	const sub = $derived(pos.step === w.index ? Math.min(pos.sub, screens.length - 1) : 0);
	const screen = $derived(screens[sub]);
	const fields = $derived(screen?.ids ? w.visibleFields(w.current).filter((f) => screen.ids!.includes(f.id)) : []);
	const screenErrors = $derived(fields.filter((f) => w.errors[f.id]).map((f) => ({ id: f.id, message: w.errors[f.id] })));

	const flatTotal = $derived(all.reduce((n, s) => n + s.length, 0));
	const flatIndex = $derived(all.slice(0, w.index).reduce((n, s) => n + s.length, 0) + sub);
	const pct = $derived(((flatIndex + 1) / Math.max(1, flatTotal)) * 100);
	const reviewIndex = $derived(w.steps.findIndex((s) => s.kind === 'review'));
	const canBack = $derived(sub > 0 || !w.isFirst);

	const span: Record<number, string> = { 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 6: 'sm:col-span-6' };

	// ----- copy: turn group titles into questions ------------------------------
	// keyed by step id, or by a group's first field id (personal details, contact, address, co-buyer, identify, sale)
	const who = $derived(w.values.firstName ? String(w.values.firstName).trim() : tr('the customer'));
	const QUESTIONS: Record<string, (name: string) => string> = {
		product: () => tr('Which product are you selling?'),
		firstName: () => tr("What's the customer's name?"),
		phone: (name) => tr('How can we reach {name}?', { name }),
		address1: (name) => tr('Where does {name} live?', { name }),
		hasCoBuyer: () => tr('Is anyone buying with them?'),
		vin: () => tr('Which vehicle is it?'),
		condition: () => tr('Tell us about the sale'),
		coverage: (name) => tr('Which coverage does {name} want?', { name }),
		plan: () => tr('Which plan suits them best?'),
		options: () => tr('Would they like any options?'),
		financing: () => tr('How is the vehicle financed?'),
		review: () => tr('Check your answers')
	};
	const HINTS: Record<string, string> = {
		product: 'The questions that follow change to match it.',
		firstName: "Use the name on their driver's licence. We also need their date of birth and preferred language.",
		phone: 'We send the signed contract and renewal reminders here.',
		address1: 'Start typing to find a Canada Post match, or enter it by hand.',
		hasCoBuyer: 'Add them if they are on the loan or lease. Both names print on the contract.',
		condition: 'Copy these from the bill of sale.',
		review: 'Change anything before the contract is created.'
	};
	const question = $derived(screen ? (QUESTIONS[screen.qid] ?? QUESTIONS[w.current.id])?.(who) ?? w.current.title : '');
	const hintKey = $derived(screen ? (HINTS[screen.qid] ?? HINTS[w.current.id]) : undefined);
	const hint = $derived(screen ? (hintKey ? tr(hintKey) : sub === 0 ? w.current.description : '') : '');
	const context = $derived(
		screens.length > 1 ? tr('{step} · {n} of {total}', { step: w.current.short, n: sub + 1, total: screens.length }) : w.current.short
	);
	const cta = $derived(w.current.kind === 'review' ? tr('Create contract') : tr('Continue'));

	// ----- navigation -----------------------------------------------------------
	let heading = $state<HTMLElement>();
	let errorBox = $state<HTMLElement>();
	const duration = $derived(prefersReducedMotion.current ? 0 : 240);

	async function show(step: number, s: number, d: 1 | -1, errors = false) {
		dir = d;
		showErrors = errors;
		pos = { step, sub: s };
		await tick();
		window.scrollTo({ top: 0 });
		if (errors) errorBox?.focus();
		else heading?.focus({ preventScroll: true });
	}

	async function next() {
		const step = w.current;
		if (step.kind === 'fields') {
			for (const f of fields) w.touch(f.id);
			if (fields.some((f) => w.errors[f.id])) {
				showErrors = true;
				await tick();
				errorBox?.focus();
				return;
			}
			if (sub < screens.length - 1) return show(w.index, sub + 1, 1);
		}
		// GOV.UK: after a "Change" from Check your answers, go straight back to it
		if (fromReview && step.kind !== 'review' && w.validateStep(w.index) && w.goto(reviewIndex)) {
			fromReview = false;
			return show(w.index, 0, 1);
		}
		if (w.next()) {
			if (!w.created) show(w.index, 0, 1);
			return;
		}
		// the step (or the final submit) failed: land on the first screen with an error
		fromReview = false;
		const s = all[w.index].findIndex((sc) => sc.ids?.some((id) => w.errors[id]));
		show(w.index, Math.max(0, s), -1, true);
	}

	function back() {
		if (sub > 0) return show(w.index, sub - 1, -1);
		if (fromReview && w.goto(reviewIndex)) {
			fromReview = false;
			return show(w.index, 0, -1);
		}
		if (w.isFirst) return;
		w.prev();
		show(w.index, all[w.index].length - 1, -1);
	}

	function edit(stepId: string) {
		fromReview = true;
		w.gotoStepId(stepId);
		show(w.index, 0, -1);
	}

	function jump(id: string) {
		const el = document.getElementById(`f-${id}`);
		el?.focus();
		el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}
</script>

<div class="flex min-h-dvh flex-col">
	<div class="sticky top-0 z-30">
		<DealerHeader compact>
			{#if w.savedAt && !w.created}
				<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Check class="size-3.5 text-success-strong" /> {tr('Draft saved')}
				</span>
			{/if}
		</DealerHeader>
		{#if !w.created}
			<Progress value={pct} aria-label={tr('Question {n} of {total}', { n: flatIndex + 1, total: flatTotal })} class="h-1 rounded-none bg-border/70" />
		{/if}
	</div>

	{#if w.created}
		<main class="flex-1"><SuccessPanel /></main>
	{:else if screen}
		<!-- question column + summary, one centred group (summary ≥lg only) -->
		<div
			class="mx-auto flex w-full flex-1 justify-center lg:grid lg:max-w-[1008px] lg:grid-cols-[minmax(0,600px)_320px] lg:items-start lg:gap-6 lg:px-8 xl:grid-cols-[minmax(0,620px)_340px]"
		>
			<form
				class="flex w-full max-w-[560px] flex-1 flex-col px-4 pt-3 sm:px-6 sm:pt-10 sm:pb-16 lg:max-w-none lg:px-0"
				novalidate
				onsubmit={(e) => {
					e.preventDefault();
					next();
				}}
			>
				<div class="flex h-11 items-center">
					{#if canBack}
						<button
							type="button"
							onclick={back}
							class="-ml-2 inline-flex h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:text-accent-foreground"
						>
							<ChevronLeft class="size-4" /> {tr('Back')}
						</button>
					{/if}
				</div>
				<MobileSummary class="mb-2 lg:hidden" />

				{#key screen.key}
					<section
						in:fly={{ x: 28 * dir, duration, easing: cubicOut }}
						class="flex flex-col pt-2 sm:pt-4"
						aria-labelledby="oq-question"
					>
						{#if showErrors && screenErrors.length}
							<div
								bind:this={errorBox}
								tabindex="-1"
								role="alert"
								class="mb-6 rounded-xl border border-destructive/40 bg-danger-soft p-4 outline-none focus-visible:ring-3 focus-visible:ring-destructive/30"
							>
								<p class="flex items-center gap-2 text-sm font-semibold text-destructive">
									<CircleAlert class="size-4 shrink-0" /> {tr('There is a problem')}
								</p>
								<ul class="mt-2 ml-6 list-disc space-y-0.5 text-sm">
									{#each screenErrors as e (e.id)}
										<li>
											<button type="button" class="text-left text-destructive underline underline-offset-2" onclick={() => jump(e.id)}>{e.message}</button>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						<p class="text-sm font-medium text-muted-foreground">{context}</p>
						<h1
							id="oq-question"
							bind:this={heading}
							tabindex="-1"
							class="mt-1.5 text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-balance outline-none sm:text-[2.25rem] in-data-[density=compact]:text-2xl"
						>
							{question}
						</h1>
						{#if hint}
							<p class="mt-3 text-[15px] text-muted-foreground sm:text-base in-data-[density=compact]:text-sm">{hint}</p>
						{/if}

						<div class="mt-7 in-data-[density=compact]:mt-5">
							{#if w.current.kind === 'product'}
								<ProductPicker variant="list" />
							{:else if w.current.kind === 'review'}
								<ReviewList dense onedit={edit} />
								<p class="mt-5 text-sm text-muted-foreground">
									{tr('By creating this contract you confirm these details are correct and the customer has agreed to the terms.')}
								</p>
							{:else}
								<div class="oq-fields grid grid-cols-1 gap-5 sm:grid-cols-6 in-data-[density=compact]:gap-4">
									{#each fields as f (f.id)}
										<Field field={f} class={span[f.span ?? 6]} />
									{/each}
								</div>
							{/if}
						</div>
					</section>
				{/key}

				<!-- pushes the action into the thumb zone on phones -->
				<div class="min-h-6 flex-1 sm:hidden"></div>

				<div
					class={cn(
						'pb-safe sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/92 px-4 pt-3 backdrop-blur',
						'sm:static sm:mx-0 sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none'
					)}
				>
					<Button type="submit" class="h-12 w-full gap-2 text-base in-data-[density=compact]:h-11">
						{cta}
						{#if w.current.kind !== 'review'}<ArrowRight class="size-4" />{/if}
					</Button>
					<p class="mt-3 hidden text-center text-xs text-faint sm:block">{tr('Your answers save as you go.')}</p>
				</div>
			</form>
			<div class="hidden lg:sticky lg:top-20 lg:mt-[6.25rem] lg:block">
				<SummaryCard />
			</div>
		</div>
	{/if}
</div>

<style>
	/* big, calm controls: 48px targets for a one-question-per-page flow */
	.oq-fields :global([data-slot='input']),
	.oq-fields :global([data-slot='select-trigger']),
	.oq-fields :global([data-slot='button']) {
		height: 3rem;
	}
	.oq-fields :global([data-slot='input']),
	.oq-fields :global([data-slot='select-trigger']) {
		font-size: 1rem;
	}
	.oq-fields :global([data-slot='toggle-group-item']) {
		min-height: 3rem;
	}
	:global([data-density='compact']) .oq-fields :global([data-slot='input']),
	:global([data-density='compact']) .oq-fields :global([data-slot='select-trigger']),
	:global([data-density='compact']) .oq-fields :global([data-slot='button']) {
		height: 2.75rem;
		font-size: 0.9375rem;
	}
	:global([data-density='compact']) .oq-fields :global([data-slot='toggle-group-item']) {
		min-height: 2.75rem;
	}
</style>
