<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import Save from '@lucide/svelte/icons/save';
	import Check from '@lucide/svelte/icons/check';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
	import type { StepStatus } from '$lib/wizard';
	import { getWizard, DealerHeader, StepBody, StatusIcon, SuccessPanel, SummaryLayout } from '$lib/wizard';
	import { tr } from '$lib/i18n/index.svelte';

	/**
	 * Concept 1 — Sticky horizontal stepper.
	 * The legacy page wizard, modernised: labelled steps, top-aligned labels,
	 * grouped fields, sticky footer. Stepper collapses on its own width
	 * (container query), not the viewport.
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();
	let heading = $state<HTMLElement>();
	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));
	const STATUS_TEXT: Record<StepStatus, string> = {
		complete: 'completed',
		current: 'current',
		error: 'has errors',
		upcoming: 'not started',
		locked: 'locked'
	};

	async function go(fn: () => unknown) {
		const before = w.index;
		fn();
		main?.scrollTo({ top: 0, behavior: 'smooth' });
		// a11y: announce the new step by moving focus to its heading (error summary keeps focus on errors)
		if (w.index === before || w.created) return;
		await tick();
		if (w.status(w.index) !== 'error') heading?.focus({ preventScroll: true });
	}
</script>

<div class="flex h-dvh flex-col">
	<DealerHeader>
		<div class="hidden text-right leading-tight sm:block">
			<p class="text-[11px] text-muted-foreground">{tr('Contract no.')}</p>
			<p class="font-mono text-xs font-semibold">{w.contractNo}</p>
		</div>
	</DealerHeader>

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
								onclick={() => go(() => w.goto(i))}
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
								onclick={() => go(() => w.goto(i))}
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

		<!-- Step content -->
		<main bind:this={main} class="flex-1 overflow-y-auto">
			<div class="px-4 py-6 sm:px-6 sm:py-8">
				<SummaryLayout>
				<section class="rounded-2xl border bg-card p-5 shadow-soft sm:p-8">
					<header class="mb-6 flex items-start gap-4">
						<span class="hidden size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid dark:text-accent-foreground">
							<w.current.icon class="size-5" />
						</span>
						<div>
							<h1 bind:this={heading} tabindex="-1" class="text-xl font-semibold tracking-tight outline-none sm:text-2xl">{w.current.title}</h1>
							<p class="mt-1 text-sm text-muted-foreground">{w.current.description}</p>
						</div>
					</header>
					<StepBody />
				</section>
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
				<Button variant="outline" class="h-10 gap-1 pointer-coarse:h-11" disabled={w.isFirst} onclick={() => go(() => w.prev())}>
					<ChevronLeft class="size-4" /> {tr('Back')}
				</Button>
				<Button class="h-10 gap-1 px-4 pointer-coarse:h-11" onclick={() => go(() => w.next())}>
					{nextLabel}
					{#if !w.isLast}<ChevronRight class="size-4" />{/if}
				</Button>
			</div>
		</footer>
	{/if}
</div>
