<script lang="ts">
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Lock from '@lucide/svelte/icons/lock';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Check from '@lucide/svelte/icons/check';
	import CloudCheck from '@lucide/svelte/icons/cloud-check';
	import { cn } from '$lib/utils';
	import { getWizard, Wizard, DealerHeader, StepBody, SummaryCard, MobileSummary, SuccessPanel } from '$lib/wizard';
	import type { StepDef } from '$lib/wizard';
	import { tr, locale } from '$lib/i18n/index.svelte';

	/**
	 * Concept 7 — Task list hub (GOV.UK "complete multiple tasks").
	 * The contract home lists each section with a status tag. A section opens as
	 * a focused sub-page with "Save and return". Review unlocks when all are done.
	 * Every view (hub, section, review) keeps the checkout-style summary right
	 * beside the content at ≥lg; below lg it folds into a bar above the content.
	 */
	const w = getWizard();
	// GOV.UK task list: sections can be completed in any order
	w.freeNav = true;
	/** engine defaults (language, condition, usage) do not count as "started" */
	const defaults = $state.snapshot(new Wizard().values) as Record<string, unknown>;

	type View = 'hub' | 'task' | 'review';
	type Tag = 'done' | 'progress' | 'todo' | 'error' | 'blocked';

	let view = $state<View>('hub');
	let done = $state<string[]>([]);
	let opened = $state<string[]>([]);
	let heading = $state<HTMLElement>();

	const TAG: Record<Tag, { label: string; cls: string }> = {
		done: { label: 'Completed', cls: 'bg-success-soft text-success-strong' },
		progress: { label: 'In progress', cls: 'bg-primary-soft text-primary dark:text-accent-foreground' },
		todo: { label: 'Not started', cls: 'bg-muted text-muted-foreground ring-1 ring-border' },
		error: { label: 'Needs attention', cls: 'bg-danger-soft text-destructive' },
		blocked: { label: 'Cannot start yet', cls: 'bg-muted text-faint' }
	};
	const HINT: Record<string, string> = {
		applicant: 'Name, contact details and home address',
		vehicle: 'VIN, condition, odometer and sale date',
		coverage: 'Term, limits and add-ons',
		plan: 'Coverage level, term and deductible',
		options: 'Roadside, rental and surcharges',
		financing: 'Lender, amount financed and term'
	};

	function tagOf(s: StepDef, i: number): Tag {
		const fields = w.visibleFields(s);
		if (fields.some((f) => w.errors[f.id])) return 'error';
		const started = fields.some((f) => {
			const v = w.values[f.id];
			return v !== undefined && v !== null && v !== '' && v !== false && v !== defaults[f.id];
		});
		// a section with only optional fields (e.g. VSC options) is complete as soon as it is reachable
		const allOptional = fields.every((f) => !f.required);
		if (w.isStepValid(i) && (started || done.includes(s.id) || allOptional)) return 'done';
		if (!w.canGoto(i)) return 'blocked';
		if (started || opened.includes(s.id)) return 'progress';
		return 'todo';
	}

	function summaryOf(s: StepDef): string {
		if (s.id === 'applicant') return [w.customerName, w.values.city].filter(Boolean).join(' · ');
		if (s.id === 'vehicle') return [w.vehicleName, w.values.vin].filter(Boolean).join(' · ');
		return w
			.answers(s)
			.slice(0, 3)
			.map((a) => a.value)
			.join(' · ');
	}

	const tasks = $derived(
		w.steps
			.map((step, i) => ({ step, i }))
			.filter((t) => t.step.kind === 'fields')
			.map((t) => {
				const tag = tagOf(t.step, t.i);
				const hint = HINT[t.step.id] ? tr(HINT[t.step.id]) : t.step.description;
				return { ...t, tag, hint: tag === 'done' ? summaryOf(t.step) || hint : hint };
			})
	);
	const firstOpen = $derived(tasks.find((t) => t.tag !== 'blocked' && t.tag !== 'done'));
	const totalSections = $derived(tasks.length + 1); // + product
	const completed = $derived(tasks.filter((t) => t.tag === 'done').length + 1);
	const allDone = $derived(completed === totalSections);
	const reviewIndex = $derived(w.steps.findIndex((s) => s.kind === 'review'));
	/** "Vehicle Service Contract" / « Contrat de service véhicule » already say contract — don't double it */
	const contractTitle = $derived(/\bcontra(ct|t)\b/i.test(w.product.name) ? w.product.name : tr('{product} contract', { product: w.product.name }));
	const blockedHint = $derived.by(() => {
		const first = tasks.find((x) => x.tag !== 'done');
		return first ? tr('Finish {section} first', { section: first.step.short.toLowerCase() }) : tr('Finish earlier sections first');
	});
	const known = $derived(
		[w.values.firstName || w.values.lastName ? w.customerName : '', w.values.make ? w.vehicleName : ''].filter(Boolean)
	);

	const time = (d: Date) => d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });

	async function show(v: View) {
		view = v;
		await tick();
		window.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
		heading?.focus({ preventScroll: true });
	}

	function open(i: number) {
		if (!w.goto(i)) return;
		const s = w.steps[i];
		if (!opened.includes(s.id)) opened.push(s.id);
		show(s.kind === 'review' ? 'review' : 'task');
	}

	function saveAndReturn() {
		if (!w.validateStep(w.index)) {
			w.errorTick++;
			return;
		}
		const id = w.current.id;
		if (!done.includes(id)) done.push(id);
		w.saveDraft();
		show('hub');
	}

	function create() {
		if (w.submit()) {
			done = [];
			opened = [];
			view = 'hub';
			window.scrollTo({ top: 0 });
		} else {
			show(w.current.kind === 'review' ? 'review' : 'task');
		}
	}

	const dur = $derived(prefersReducedMotion.current ? 0 : 180);
</script>

{#snippet tagPill(tag: Tag)}
	<span class={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap', TAG[tag].cls)}>
		{tr(TAG[tag].label)}
	</span>
{/snippet}

{#snippet backLink()}
	<button
		type="button"
		onclick={() => show('hub')}
		class="-ml-2 inline-flex h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:text-accent-foreground"
	>
		<ChevronLeft class="size-4" /> {tr('Back to contract')}
	</button>
{/snippet}

<div class="flex min-h-dvh flex-col">
	<DealerHeader>
		<div class="hidden text-right leading-tight sm:block">
			<p class="text-[11px] text-muted-foreground">{tr('Contract no.')}</p>
			<p class="font-mono text-xs font-semibold">{w.contractNo}</p>
		</div>
	</DealerHeader>

	{#if w.created}
		<main class="flex-1"><SuccessPanel /></main>
	{:else}
		<!-- content + summary, one centred group (same grid as SummaryLayout; flex below lg keeps the thumb-zone CTA) -->
		<div
			class="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pt-4 sm:px-6 sm:pt-8 lg:grid lg:max-w-[1120px] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
		>
			<MobileSummary class="mb-4 lg:hidden" />
			<main class="tl-main flex min-w-0 flex-1 flex-col pb-10">
				{#key view}
					<div in:fade={{ duration: dur }} class="flex flex-1 flex-col">
						{#if view === 'hub'}
							<!-- ============ HUB ============ -->
							<header class="pt-2">
								<p class="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
									<span class="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong">{tr('Draft')}</span>
									<span class="font-mono text-xs sm:hidden">{w.contractNo}</span>
								</p>
								<h1 bind:this={heading} tabindex="-1" class="mt-2 text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
									{contractTitle}
								</h1>
								<p class="mt-1 text-sm text-muted-foreground">
									{known.length ? known.join(' · ') : tr('Complete each section. You can stop and come back at any time.')}
								</p>
							</header>

							<section class="mt-6 rounded-2xl border bg-card p-4 shadow-soft sm:p-5 in-data-[density=compact]:p-3.5" aria-label={tr('Progress')}>
								<p class="font-medium">
									{completed === 1
										? tr('You have completed 1 of {total} sections.', { total: totalSections })
										: tr('You have completed {n} of {total} sections.', { n: completed, total: totalSections })}
								</p>
								<Progress value={(completed / totalSections) * 100} class="mt-3 h-2" aria-label={tr('Sections completed')} />
								<p class="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
									{#if w.savedAt}
										<CloudCheck class="size-3.5 shrink-0 text-success-strong" /> {tr('Draft saved at {time}', { time: time(w.savedAt) })}
									{:else}
										{tr('The draft saves each time you finish a section.')}
									{/if}
								</p>
							</section>

							<h2 class="mt-8 mb-3 text-base font-semibold">{tr('Prepare the contract')}</h2>
							<ol class="divide-y overflow-hidden rounded-2xl border bg-card shadow-soft">
								<!-- product -->
								<li class="flex items-center gap-4 px-4 py-3.5 in-data-[density=compact]:py-2.5">
									<span class="hidden size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid dark:text-accent-foreground">
										<w.product.icon class="size-5" />
									</span>
									<span class="min-w-0 flex-1">
										<span class="block font-semibold">{tr('Choose product')}</span>
										<span class="block truncate text-sm text-muted-foreground">{w.product.name} · {w.product.tagline}</span>
									</span>
									{@render tagPill('done')}
									<Button variant="ghost" class="-mr-2 h-11 px-3 text-primary dark:text-accent-foreground" onclick={() => open(0)} aria-label={tr('Change product')}>
										{tr('Change')}
									</Button>
								</li>

								{#each tasks as t (t.step.id)}
									<li>
										<button
											type="button"
											onclick={() => open(t.i)}
											disabled={t.tag === 'blocked'}
											class={cn(
												'group flex min-h-[4.5rem] w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:bg-transparent in-data-[density=compact]:min-h-14 in-data-[density=compact]:py-2.5',
												firstOpen?.i === t.i && 'bg-primary-soft/35'
											)}
										>
											<span
												class={cn(
													'hidden size-10 shrink-0 place-items-center rounded-xl sm:grid',
													t.tag === 'blocked' ? 'bg-muted text-faint' : 'bg-primary-soft text-primary dark:text-accent-foreground'
												)}
											>
												<t.step.icon class="size-5" />
											</span>
											<span class="min-w-0 flex-1">
												<span
													class={cn(
														'block font-semibold underline-offset-4 group-enabled:group-hover:underline',
														t.tag === 'blocked' ? 'text-muted-foreground' : 'text-primary dark:text-accent-foreground'
													)}
												>
													{t.step.title}
												</span>
												<span class="line-clamp-1 text-sm text-muted-foreground">
													{t.tag === 'blocked' ? blockedHint : t.hint}
												</span>
												<span class="mt-1.5 block sm:hidden">{@render tagPill(t.tag)}</span>
											</span>
											<span class="hidden sm:block">{@render tagPill(t.tag)}</span>
											<ChevronRight class={cn('hidden size-4 shrink-0 text-muted-foreground sm:block', t.tag === 'blocked' && 'invisible')} />
										</button>
									</li>
								{/each}
							</ol>

							<h2 class="mt-8 mb-3 text-base font-semibold">{tr('Create the contract')}</h2>
							{#if allDone}
								<button
									type="button"
									onclick={() => open(reviewIndex)}
									class="group flex w-full items-center gap-4 rounded-2xl border border-primary/40 bg-card px-4 py-4 text-left shadow-soft ring-1 ring-primary/20 transition-colors hover:bg-primary-soft/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
								>
									<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
										<ClipboardCheck class="size-5" />
									</span>
									<span class="min-w-0 flex-1">
										<span class="block font-semibold text-primary group-hover:underline dark:text-accent-foreground">{tr('Review and create')}</span>
										<span class="block text-sm text-muted-foreground">{tr('Check your answers, then create the contract.')}</span>
									</span>
									<ChevronRight class="size-5 shrink-0 text-primary dark:text-accent-foreground" />
								</button>
							{:else}
								<div class="flex items-center gap-4 rounded-2xl border border-dashed bg-card/60 px-4 py-4" aria-disabled="true">
									<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-faint"><Lock class="size-4" /></span>
									<span class="min-w-0 flex-1">
										<span class="block font-semibold text-muted-foreground">{tr('Review and create')}</span>
										<span class="block text-sm text-muted-foreground">
											{totalSections - completed === 1
												? tr('Complete all {total} sections to review the contract. 1 left.', { total: totalSections })
												: tr('Complete all {total} sections to review the contract. {n} left.', { total: totalSections, n: totalSections - completed })}
										</span>
										<span class="mt-1.5 block sm:hidden">{@render tagPill('blocked')}</span>
									</span>
									<span class="hidden sm:block">{@render tagPill('blocked')}</span>
								</div>
							{/if}
						{:else if view === 'task'}
							<!-- ============ SECTION SUB-PAGE ============ -->
							<div>{@render backLink()}</div>
							<section class="mt-2 rounded-2xl border bg-card p-5 shadow-soft sm:p-8 in-data-[density=compact]:p-4 in-data-[density=compact]:sm:p-6">
								<p class="text-sm text-muted-foreground">{contractTitle}</p>
								<h1 bind:this={heading} tabindex="-1" class="mt-1 text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
									{w.current.title}
								</h1>
								<p class="mt-2 mb-6 text-sm text-muted-foreground">{w.current.description}</p>
								<StepBody />
							</section>
							<div class="min-h-6 flex-1 sm:hidden"></div>
							<div
								class="pb-safe sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/92 px-4 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
							>
								<Button class="h-12 w-full gap-2 text-[15px] sm:h-11 sm:w-auto sm:px-6" onclick={saveAndReturn}>
									<Check class="size-4" /> {tr('Save and return')}
								</Button>
							</div>
						{:else}
							<!-- ============ REVIEW ============ -->
							<div>{@render backLink()}</div>
							<header class="mt-2 mb-5">
								<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold tracking-tight outline-none sm:text-3xl">{tr('Check your answers')}</h1>
								<p class="mt-2 text-sm text-muted-foreground">{tr('Change anything before the contract is created.')}</p>
							</header>
							<StepBody onedit={(id) => open(w.steps.findIndex((s) => s.id === id))} />
							<p class="mt-6 text-sm text-muted-foreground">
								{tr('By creating this contract you confirm these details are correct and the customer has agreed to the terms.')}
							</p>
							<div class="min-h-6 flex-1 sm:hidden"></div>
							<div
								class="pb-safe sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/92 px-4 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
							>
								<Button class="h-12 w-full text-[15px] sm:h-11 sm:w-auto sm:px-6" onclick={create}>{tr('Create contract')}</Button>
							</div>
						{/if}
					</div>
				{/key}
			</main>

			<!-- summary ≥1024px, right next to every view -->
			<div class="hidden lg:sticky lg:top-8 lg:block">
				<SummaryCard>
					<p class="text-xs text-muted-foreground">
						{tr('Waiting on a VIN or a signature? Leave now — the draft stays in Contracts and opens right here.')}
					</p>
				</SummaryCard>
			</div>
		</div>
	{/if}
</div>

<style>
	/* 44px+ targets on phones */
	@media (max-width: 639px) {
		.tl-main :global([data-slot='input']),
		.tl-main :global([data-slot='select-trigger']),
		.tl-main :global([data-field] [data-slot='button']) {
			height: 2.75rem;
			font-size: 1rem;
		}
		.tl-main :global([data-slot='toggle-group-item']) {
			min-height: 2.75rem;
		}
	}
</style>
