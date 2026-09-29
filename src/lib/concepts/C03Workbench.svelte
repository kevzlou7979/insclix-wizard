<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import Save from '@lucide/svelte/icons/save';
	import Check from '@lucide/svelte/icons/check';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Lock from '@lucide/svelte/icons/lock';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { cn } from '$lib/utils';
	import { getWizard, DealerHeader, StepBody, SummaryCard, SuccessPanel, SummaryLayout } from '$lib/wizard';
	import type { StepStatus } from '$lib/wizard';
	import { tr } from '$lib/i18n/index.svelte';

	/**
	 * Concept 3 — Three-pane workbench.
	 * Step rail | form + sticky live summary/checklist/tips as one centred
	 * group (checkout pattern, ~24px apart). ≥1280px: labelled rail;
	 * 768–1279px: icon rail. ≥1024px the summary column sits beside the form;
	 * below that it folds into the shared summary bar above the form and the
	 * checklist + tips follow the form. <768px: rail becomes "Step X of N".
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

	type Item = { id: string; label: string; state: 'done' | 'todo' | 'error' | 'locked'; action?: () => void };

	const checklist = $derived.by<Item[]>(() => {
		const s = w.current;
		if (s.kind === 'product') {
			return [{ id: 'product', label: tr('Product: {name}', { name: w.product.name }), state: 'done' }];
		}
		if (s.kind === 'review') {
			return w.steps.slice(0, w.index).map((st, i) => ({
				id: st.id,
				label: st.title,
				state: w.errorSteps.includes(st.id) ? 'error' : w.isStepValid(i) ? 'done' : 'todo',
				action: () => w.goto(i)
			}));
		}
		return w
			.visibleFields(s)
			.filter((f) => f.required || w.errors[f.id])
			.map((f) => ({
				id: f.id,
				label: f.label.replace(/ \(.*\)/, ''),
				state: w.errors[f.id] ? 'error' : w.fieldError(f) ? 'todo' : 'done',
				action: () => focusField(f.id)
			}));
	});
	const ready = $derived(checklist.filter((c) => c.state === 'done').length);

	// English keys; translated at render via tr()
	const TIPS: Record<string, string[]> = {
		product: ['Leased vehicle? Wear Pass matches the lease term.', 'Financed with a lender? Offer GAP alongside a service contract.'],
		applicant: ['Use the name exactly as it appears on the bill of sale.', 'Type 2+ letters of the street to search Canada Post.'],
		vehicle: ['Paste or scan the VIN — year, make and model fill in.', 'Odometer is the reading on the delivery form, not today.'],
		coverage: ['Match the term to the lease or finance term.', 'Add-ons are priced flat and show in the summary.'],
		plan: ['Gold is the most-sold tier at Oakville Toyota.', 'A $0 deductible adds to retail price.'],
		options: ['Options are optional — skip if the customer declines.'],
		financing: ['Amount financed comes from the finance contract, not MSRP.'],
		review: ['Check the VIN and customer name — they print on the contract.', 'Change links take you back without losing entries.']
	};
	const tips = $derived(TIPS[w.current.id] ?? ['Required fields are marked in the checklist.']);

	function focusField(id: string) {
		const el = document.getElementById(`f-${id}`);
		el?.focus();
		el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}

	function go(fn: () => unknown) {
		fn();
		main?.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#snippet checklistBlock()}
	<section aria-label={tr('Checklist')} class="rounded-2xl border bg-card shadow-soft">
		<header class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
			<h2 class="flex items-center gap-2 text-sm font-semibold"><ListChecks class="size-4 text-muted-foreground" /> {tr('Checklist')}</h2>
			<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{tr('{ready} of {total} ready', { ready, total: checklist.length })}</span>
		</header>
		<ul class="p-1.5">
			{#each checklist as c (c.id)}
				<li>
					<button
						type="button"
						onclick={c.action}
						disabled={!c.action}
						class="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:hover:bg-transparent"
					>
						{#if c.state === 'done'}
							<CircleCheck class="size-4 shrink-0 text-success-strong" />
						{:else if c.state === 'error'}
							<CircleAlert class="size-4 shrink-0 text-destructive" />
						{:else if c.state === 'locked'}
							<Lock class="size-4 shrink-0 text-faint" />
						{:else}
							<CircleDashed class="size-4 shrink-0 text-muted-foreground" />
						{/if}
						<span
							class={cn(
								'min-w-0 flex-1 truncate',
								c.state === 'done' && 'text-muted-foreground',
								c.state === 'error' && 'font-medium text-destructive'
							)}>{c.label}</span
						>
						{#if c.state === 'error'}<span class="shrink-0 text-[11px] text-destructive">{tr('Fix')}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

{#snippet tipsBlock()}
	<section aria-label={tr('Dealer tips')} class="rounded-2xl bg-brand-accent-soft/60 px-4 py-3">
		<h2 class="flex items-center gap-2 text-sm font-semibold"><Lightbulb class="size-4 text-brand-accent" /> {tr('Dealer tips')}</h2>
		<ul class="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
			{#each tips as t (t)}<li>{tr(t)}</li>{/each}
		</ul>
	</section>
{/snippet}

{#snippet sidePanel()}
	<div class="flex flex-col gap-4">
		<SummaryCard />
		{@render checklistBlock()}
		{@render tipsBlock()}
	</div>
{/snippet}

<div class="flex h-dvh flex-col">
	<!-- offset by the rail so the header lines up with the content column -->
	<DealerHeader class="md:pl-16 xl:pl-[220px]">
		<div class="hidden text-right leading-tight sm:block">
			<p class="text-[11px] text-muted-foreground">{tr('Contract no.')}</p>
			<p class="font-mono text-xs font-semibold">{w.contractNo}</p>
		</div>
	</DealerHeader>

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<div class="flex min-h-0 flex-1">
			<!-- Pane 1: step rail (icons 768–1279px, labelled ≥1280px) -->
			<nav aria-label={tr('Contract steps')} class="hidden w-16 shrink-0 flex-col border-r bg-card md:flex xl:w-[220px]">
				<div class="hidden px-4 pt-5 pb-3 xl:block">
					<p class="text-[11px] text-muted-foreground">{tr('New contract')}</p>
					<p class="truncate text-sm font-semibold">{w.product.name}</p>
				</div>
				<ol class="flex-1 space-y-0.5 overflow-y-auto px-2 pt-3 xl:pt-0">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						{@const active = i === w.index}
						<li>
							<button
								type="button"
								onclick={() => go(() => w.goto(i))}
								disabled={st === 'locked'}
								aria-current={active ? 'step' : undefined}
								title={s.title}
								class={cn(
									'relative flex h-11 w-full items-center justify-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:hover:bg-transparent xl:h-10 xl:justify-start',
									active && 'bg-primary-soft font-semibold text-primary hover:bg-primary-soft dark:text-accent-foreground',
									!active && 'text-foreground/80',
									st === 'locked' && 'text-faint'
								)}
							>
								{#if active}<span class="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"></span>{/if}
								<s.icon class="size-4 shrink-0" />
								<span class="sr-only min-w-0 flex-1 truncate xl:not-sr-only">{s.short}</span>
								<span class="sr-only">, {tr(STATUS_TEXT[st])}</span>
								<span class="absolute top-1 right-1 xl:static" aria-hidden="true">
									{#if st === 'complete'}
										<Check class="size-3 text-success-strong xl:size-3.5" />
									{:else if st === 'error'}
										<CircleAlert class="size-3 text-destructive xl:size-3.5" />
									{:else if st === 'locked'}
										<Lock class="size-2.5 xl:size-3" />
									{/if}
								</span>
							</button>
						</li>
					{/each}
				</ol>
				<div class="border-t px-3 py-3 xl:px-4">
					<div class="hidden justify-between text-[11px] text-muted-foreground xl:flex">
						<span>{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}</span>
						<span>{w.savedAt ? tr('Saved') : tr('Not saved')}</span>
					</div>
					<p class="text-center text-[11px] text-muted-foreground tabular-nums xl:hidden">{w.index + 1}/{w.total}</p>
					<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="mt-1.5 h-1" />
				</div>
			</nav>

			<!-- Pane 2: form + summary as one centred group, footer -->
			<div class="flex min-w-0 flex-1 flex-col">
				<!-- phones: compact step bar -->
				<div class="shrink-0 border-b bg-card px-4 py-3 md:hidden">
					<p class="text-sm"><span class="text-muted-foreground">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} ·</span> <span class="font-semibold">{w.current.short}</span></p>
					<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="mt-2 h-1.5" />
				</div>

				<main bind:this={main} class="flex-1 overflow-y-auto">
					<div class="px-4 py-6 sm:px-6 sm:py-8">
						<SummaryLayout summary={sidePanel}>
							<section class="rounded-2xl border bg-card p-5 shadow-soft sm:p-8">
								<header class="mb-6">
									<p class="flex items-center gap-2 text-xs font-medium text-primary dark:text-accent-foreground">
										<w.current.icon class="size-3.5" /> {tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}
									</p>
									<h1 class="mt-1.5 text-2xl font-semibold tracking-tight">{w.current.title}</h1>
									<p class="mt-1 text-sm text-muted-foreground">{w.current.description}</p>
								</header>
								<StepBody />
							</section>
							<!-- below lg the checklist + tips follow the form -->
							<div class="mt-4 grid gap-4 sm:grid-cols-2 sm:items-start lg:hidden">
								{@render checklistBlock()}
								{@render tipsBlock()}
							</div>
						</SummaryLayout>
					</div>
				</main>

				<footer class="pb-safe shrink-0 border-t bg-card/95 backdrop-blur">
					<div class="mx-auto flex w-full max-w-[1168px] items-center gap-2 px-4 pt-3 sm:px-6">
						<Button variant="ghost" class="hidden h-10 gap-1.5 md:inline-flex" aria-label={tr('Close')}><X class="size-4" /><span class="hidden lg:inline">{tr('Close')}</span></Button>
						<Button variant="outline" class="h-11 gap-1.5 md:h-10" onclick={() => w.saveDraft()} aria-label={w.savedAt ? tr('Draft saved') : tr('Save draft')}>
							{#if w.savedAt}<Check class="size-4 text-success-strong" />{:else}<Save class="size-4" />{/if}
							<span class="hidden lg:inline">{w.savedAt ? tr('Saved') : tr('Save draft')}</span>
						</Button>
						<span class="flex-1"></span>
						<Button variant="outline" class="h-11 gap-1 md:h-10" disabled={w.isFirst} onclick={() => go(() => w.prev())} aria-label={tr('Back')}>
							<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Back')}</span>
						</Button>
						<Button class="h-11 gap-1 px-4 md:h-10" onclick={() => go(() => w.next())}>
							{nextLabel}
							{#if !w.isLast}<ChevronRight class="size-4" />{/if}
						</Button>
					</div>
				</footer>
			</div>
		</div>
	{/if}
</div>
