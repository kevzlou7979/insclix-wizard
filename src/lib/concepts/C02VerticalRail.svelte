<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';
	import Save from '@lucide/svelte/icons/save';
	import Check from '@lucide/svelte/icons/check';
	import CloudCheck from '@lucide/svelte/icons/cloud-check';
	import { cn } from '$lib/utils';
	import { getWizard, DealerHeader, StepBody, StatusIcon, SuccessPanel, SummaryLayout } from '$lib/wizard';
	import type { StepStatus } from '$lib/wizard';
	import { tr, locale } from '$lib/i18n/index.svelte';

	/**
	 * Concept 2 — Vertical step rail.
	 * A left rail lists every step with status + description, so a 6-step
	 * product grows downward instead of cramping a top bar. The form card and
	 * a checkout-style summary sit side by side as one centred group. Below
	 * 1280px the rail folds into a "Step X of N" bar that opens the same list
	 * in a sheet (so form + summary keep their width at 1024px).
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();
	let mapOpen = $state(false);

	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));
	const doneCount = $derived(w.steps.filter((_, i) => w.status(i) === 'complete').length);
	const savedLabel = $derived(
		w.savedAt ? w.savedAt.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }) : null
	);

	const statusText: Record<StepStatus, string> = {
		complete: 'Done',
		current: 'In progress',
		error: 'Needs attention',
		upcoming: 'Not started',
		locked: 'Locked'
	};

	function go(fn: () => unknown) {
		fn();
		main?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function pick(i: number) {
		if (w.goto(i)) {
			mapOpen = false;
			main?.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

{#snippet stepList()}
	<ol class="relative flex flex-col">
		{#each w.steps as s, i (s.id)}
			{@const st = w.status(i)}
			{@const active = i === w.index}
			<li class="relative">
				{#if i < w.steps.length - 1}
					<span
						aria-hidden="true"
						class={cn(
							'absolute top-11 bottom-0 left-[calc(1.625rem-0.5px)] w-px',
							st === 'complete' ? 'bg-primary' : 'bg-border'
						)}
					></span>
				{/if}
				<button
					type="button"
					onclick={() => pick(i)}
					disabled={st === 'locked'}
					aria-current={active ? 'step' : undefined}
					class={cn(
						'group relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
						'hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
						'disabled:cursor-not-allowed disabled:hover:bg-transparent',
						active && 'bg-primary-soft/70 hover:bg-primary-soft/70'
					)}
				>
					<StatusIcon status={st} n={i + 1} class="mt-0.5" />
					<span class="min-w-0 flex-1 pb-3">
						<span class="flex items-baseline justify-between gap-2">
							<span
								class={cn(
									'min-w-0 text-sm',
									active ? 'font-semibold text-foreground' : 'font-medium text-foreground/85',
									st === 'locked' && 'text-muted-foreground'
								)}>{s.title}</span
							>
							<span
								class={cn(
									'shrink-0 text-[11px]',
									st === 'complete' && 'text-success-strong',
									st === 'error' && 'font-medium text-destructive',
									st === 'current' && 'text-primary dark:text-accent-foreground',
									(st === 'upcoming' || st === 'locked') && 'text-faint'
								)}>{tr(statusText[st])}</span
							>
						</span>
						<span class="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">{s.description}</span>
					</span>
				</button>
			</li>
		{/each}
	</ol>
{/snippet}

{#snippet progressSummary()}
	<div class="rounded-xl border bg-background/60 p-3">
		<div class="flex items-baseline justify-between">
			<p class="text-sm font-semibold">{tr('{done} of {total} done', { done: doneCount, total: w.total })}</p>
			<p class="text-xs text-muted-foreground tabular-nums">{(doneCount / w.total).toLocaleString(locale(), { style: 'percent', maximumFractionDigits: 0 })}</p>
		</div>
		<div class="mt-2 flex gap-1" aria-hidden="true">
			{#each w.steps as s, i (s.id)}
				{@const st = w.status(i)}
				<span
					class={cn(
						'h-1.5 flex-1 rounded-full',
						st === 'complete' && 'bg-primary',
						st === 'current' && 'bg-primary/40',
						st === 'error' && 'bg-destructive',
						(st === 'upcoming' || st === 'locked') && 'bg-muted'
					)}
				></span>
			{/each}
		</div>
		<p class="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
			<CloudCheck class="size-3.5" />
			{savedLabel ? tr('Autosaved at {time}', { time: savedLabel }) : tr('Autosaves when you move on')}
		</p>
	</div>
{/snippet}

<div class="flex h-dvh flex-col">
	<!-- offset by the rail so the header lines up with the content column -->
	<!-- contract no. lives in the summary hero -->
	<!-- logo sits above the rail, flush to the page edge -->
	<DealerHeader innerClass="max-w-none" />

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<div class="flex min-h-0 flex-1">
			<!-- Rail (desktop) -->
			<aside aria-label={tr('Contract steps')} class="hidden w-72 shrink-0 flex-col border-r bg-card xl:flex 2xl:w-80">
				<div class="border-b px-6 py-5">
					<p class="text-xs text-muted-foreground">{tr('New contract')}</p>
					<p class="mt-0.5 text-base font-semibold tracking-tight">{w.product.name}</p>
					<p class="text-xs text-muted-foreground">{tr('{tagline} · {n} steps', { tagline: w.product.tagline, n: w.total })}</p>
				</div>
				<nav class="flex-1 overflow-y-auto px-3 py-4">
					{@render stepList()}
				</nav>
				<div class="border-t p-4">
					{@render progressSummary()}
				</div>
			</aside>

			<!-- Form column -->
			<div class="flex min-w-0 flex-1 flex-col">
				<!-- Compact bar (<1280px) -->
				<div class="shrink-0 border-b bg-card xl:hidden">
					<Sheet.Root bind:open={mapOpen}>
						<Sheet.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									class="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left sm:px-6"
								>
									<StatusIcon status={w.status(w.index)} n={w.index + 1} />
									<span class="min-w-0 flex-1">
										<span class="block text-[11px] text-muted-foreground">{tr('Step {n} of {total} · {done} done', { n: w.index + 1, total: w.total, done: doneCount })}</span>
										<span class="block truncate text-sm font-semibold">{w.current.title}</span>
									</span>
									<span class="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium">
										{tr('All steps')} <ChevronDown class="size-3.5" />
									</span>
								</button>
							{/snippet}
						</Sheet.Trigger>
						<Sheet.Content side="bottom" class="max-h-[85dvh] gap-0 rounded-t-2xl p-0">
							<Sheet.Header class="border-b px-5 pt-5 pb-4">
								<Sheet.Title>{tr('Contract steps')}</Sheet.Title>
								<Sheet.Description>{tr('{product} · {n} steps. Locked steps open once earlier ones are complete.', { product: w.product.name, n: w.total })}</Sheet.Description>
							</Sheet.Header>
							<div class="overflow-y-auto px-3 py-3">
								{@render stepList()}
							</div>
							<div class="pb-safe border-t px-4 pt-3">
								{@render progressSummary()}
							</div>
						</Sheet.Content>
					</Sheet.Root>
					<div class="flex gap-1 px-4 pb-2 sm:px-6" aria-hidden="true">
						{#each w.steps as s, i (s.id)}
							<span class={cn('h-1 flex-1 rounded-full', i <= w.index ? 'bg-primary' : 'bg-muted')}></span>
						{/each}
					</div>
				</div>

				<main bind:this={main} class="flex-1 overflow-y-auto">
					<div class="px-4 py-6 sm:px-6 sm:py-10">
						<SummaryLayout>
						<section class="rounded-2xl border bg-card shadow-soft">
							<header class="flex items-start gap-4 border-b px-5 py-5 sm:px-8 sm:py-6">
								<span class="hidden size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid dark:text-accent-foreground">
									<w.current.icon class="size-5" />
								</span>
								<div class="min-w-0">
									<p class="mb-0.5 hidden text-xs font-medium text-muted-foreground xl:block">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}</p>
									<h1 class="text-xl font-semibold tracking-tight sm:text-2xl">{w.current.title}</h1>
									<p class="mt-1 text-sm text-muted-foreground">{w.current.description}</p>
								</div>
							</header>
							<div class="px-5 py-6 sm:px-8 sm:py-7">
								<StepBody />
							</div>
						</section>
						</SummaryLayout>
					</div>
				</main>

				<footer class="pb-safe shrink-0 border-t bg-card/95 backdrop-blur">
					<div class="mx-auto flex w-full max-w-[1168px] items-center gap-2 px-4 pt-3 sm:px-6">
						<Button variant="ghost" class="h-11 gap-1.5 sm:h-10" aria-label={tr('Close')}><X class="size-4" /><span class="hidden sm:inline">{tr('Close')}</span></Button>
						<Button variant="outline" class="h-11 gap-1.5 sm:h-10" onclick={() => w.saveDraft()} aria-label={w.savedAt ? tr('Draft saved') : tr('Save draft')}>
							{#if w.savedAt}<Check class="size-4 text-success-strong" />{:else}<Save class="size-4" />{/if}
							<span class="hidden sm:inline">{w.savedAt ? tr('Saved') : tr('Save draft')}</span>
						</Button>
						<span class="flex-1"></span>
						<Button variant="outline" class="h-11 gap-1 sm:h-10" disabled={w.isFirst} onclick={() => go(() => w.prev())} aria-label={tr('Back')}>
							<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Back')}</span>
						</Button>
						<Button class="h-11 gap-1 px-4 sm:h-10" onclick={() => go(() => w.next())}>
							{nextLabel}
							{#if !w.isLast}<ChevronRight class="size-4" />{/if}
						</Button>
					</div>
				</footer>
			</div>
		</div>
	{/if}
</div>
