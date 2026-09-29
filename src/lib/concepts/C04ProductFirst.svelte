<script lang="ts">
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import * as Sheet from '$lib/components/ui/sheet';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import Lock from '@lucide/svelte/icons/lock';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CloudCheck from '@lucide/svelte/icons/cloud-check';
	import { cn } from '$lib/utils';
	import { tr, locale } from '$lib/i18n/index.svelte';
	import {
		getWizard,
		DealerHeader,
		StepBody,
		StatusIcon,
		SuccessPanel,
		SummaryCard,
		SummaryLayout,
		type ProductDef,
		type ProductId,
		type StepStatus
	} from '$lib/wizard';

	/**
	 * Concept 4 — Product-first launcher.
	 * Settle the product on a full-page gallery, show the tailored path
	 * (Salesforce-style chevrons), then run the flow with that path as the stepper.
	 */
	const w = getWizard();

	let main = $state<HTMLElement>();
	let heading = $state<HTMLElement>();
	let mapOpen = $state(false);

	const dur = $derived(prefersReducedMotion.current ? 0 : 280);
	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));

	const TONE: Record<ProductDef['tone'], string> = {
		primary: 'bg-primary-soft text-primary dark:text-accent-foreground',
		success: 'bg-success-soft text-success-strong',
		warning: 'bg-warning-soft text-warning-strong',
		accent: 'bg-brand-accent-soft text-brand-accent'
	};

	/** Rough effort estimate: ~12 s per always-visible field + 30 s per step. */
	function minutes(p: ProductDef) {
		const fields = p.steps.reduce((n, s) => n + (s.fields?.filter((f) => !f.showIf).length ?? 0), 0);
		return Math.max(2, Math.round((fields * 12 + p.steps.length * 30) / 60));
	}

	/** "5 steps · about 4 min" — singular and plural are separate keys */
	const effort = (p: ProductDef) =>
		tr(p.steps.length === 1 ? '1 step · about {m} min' : '{n} steps · about {m} min', { n: p.steps.length, m: minutes(p) });

	const STATUS_TEXT: Record<StepStatus, string> = {
		complete: 'completed',
		current: 'current step',
		error: 'has errors',
		upcoming: 'not started',
		locked: 'locked until earlier steps are done'
	};

	/** Run a navigation action; if the step changed, reset scroll and move focus to the new heading. */
	async function go(fn: () => unknown) {
		const before = w.index;
		fn();
		if (w.index === before || w.created) return;
		await tick();
		main?.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
		// a step with errors has its error summary focused instead
		if (w.status(w.index) !== 'error') heading?.focus({ preventScroll: true });
	}

	// ----- product gallery: radio group with roving focus ---------------------
	function pick(id: ProductId) {
		w.setProduct(id);
	}

	function onGalleryKey(e: KeyboardEvent) {
		const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
		if (!keys.includes(e.key)) return;
		e.preventDefault();
		const i = w.products.findIndex((p) => p.id === w.productId);
		const n = w.products.length;
		const j =
			e.key === 'Home'
				? 0
				: e.key === 'End'
					? n - 1
					: e.key === 'ArrowRight' || e.key === 'ArrowDown'
						? (i + 1) % n
						: (i - 1 + n) % n;
		pick(w.products[j].id);
		const radios = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]');
		radios[j]?.focus();
	}

	/** chevron colours per status (text colours all pass 4.5:1 on their fill) */
	const CHEV_BG: Record<StepStatus, string> = {
		complete: 'bg-primary-soft',
		current: 'bg-primary',
		error: 'bg-danger-soft',
		upcoming: 'bg-muted',
		locked: 'bg-muted'
	};
	const CHEV_TEXT: Record<StepStatus, string> = {
		complete: 'text-primary dark:text-accent-foreground',
		current: 'text-primary-foreground font-semibold',
		error: 'text-foreground',
		upcoming: 'text-muted-foreground',
		locked: 'text-muted-foreground'
	};

	/** On the launcher the path is a preview: product is settled, the rest is ahead. */
	const previewStatus = (i: number): StepStatus => (i === 0 ? 'complete' : 'upcoming');
</script>

<!-- Salesforce-style chevron path. `live` = interactive stepper; otherwise a preview. -->
{#snippet path(live: boolean)}
	<ol class="flex w-full min-w-0 items-stretch" aria-label={live ? undefined : tr('Steps for {product}', { product: w.product.name })}>
		{#each w.steps as s, i (s.id)}
			{@const st = live ? w.status(i) : previewStatus(i)}
			{@const first = i === 0}
			{@const last = i === w.steps.length - 1}
			<li
				class={cn('relative flex min-w-0 flex-1', !first && '-ml-2.5')}
				animate:flip={{ duration: dur, easing: cubicOut }}
				in:fade={{ duration: dur, delay: dur ? 60 : 0 }}
			>
				{#if live}
					<button
						type="button"
						onclick={() => go(() => w.goto(i))}
						disabled={st === 'locked'}
						aria-current={i === w.index ? 'step' : undefined}
						class="group/chev relative flex h-10 w-full min-w-0 items-center rounded-lg outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/60 disabled:cursor-not-allowed in-data-[density=compact]:h-9"
					>
						<span
							aria-hidden="true"
							class={cn(
								'chev absolute inset-0 transition-colors duration-200',
								first && 'chev-first rounded-l-lg',
								last && 'chev-last rounded-r-lg',
								CHEV_BG[st],
								st !== 'current' && st !== 'locked' && 'group-hover/chev:brightness-95 dark:group-hover/chev:brightness-125'
							)}
						></span>
						<span
							class={cn(
								'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 text-sm font-medium',
								first ? 'pr-5 pl-3' : last ? 'pr-3 pl-5' : 'px-5',
								CHEV_TEXT[st]
							)}
						>
							<span class="sr-only">{tr('Step {n} of {total}', { n: i + 1, total: w.total })}:</span>
							{#if st === 'complete'}<Check class="size-3.5 shrink-0" />
							{:else if st === 'error'}<CircleAlert class="size-3.5 shrink-0 text-destructive" />
							{:else if st === 'locked'}<Lock class="size-3 shrink-0" />{/if}
							<span class="truncate">{s.short}</span>
							<span class="sr-only">, {tr(STATUS_TEXT[st])}</span>
						</span>
					</button>
				{:else}
					<span class="relative flex h-9 w-full min-w-0 items-center">
						<span
							aria-hidden="true"
							class={cn('chev absolute inset-0', first && 'chev-first rounded-l-lg', last && 'chev-last rounded-r-lg', CHEV_BG[st])}
						></span>
						<span
							class={cn(
								'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 text-[13px] font-medium',
								first ? 'pr-5 pl-3' : last ? 'pr-3 pl-5' : 'px-5',
								CHEV_TEXT[st]
							)}
						>
							{#if st === 'complete'}<Check class="size-3.5 shrink-0" />{:else}<span class="tabular-nums opacity-80" aria-hidden="true">{i + 1}</span>{/if}
							<span class="truncate">{s.short}</span>
						</span>
					</span>
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<!-- Launcher summary (≥lg): the selected product, priced, beside the gallery -->
{#snippet launcherSummary()}
	<SummaryCard title={tr('Summary')}>
		<div class="flex items-center gap-3">
			<span class={cn('grid size-10 shrink-0 place-items-center rounded-xl', TONE[w.product.tone])}>
				<w.product.icon class="size-5" />
			</span>
			<div class="min-w-0 leading-tight">
				<p class="truncate text-sm font-semibold">{w.product.name}</p>
				<p class="truncate text-xs text-muted-foreground">{w.product.tagline}</p>
			</div>
		</div>
		<p class="mt-3 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
			<Clock class="size-3.5 text-muted-foreground" />
			{effort(w.product)}
		</p>
	</SummaryCard>
{/snippet}

<div class="flex h-dvh flex-col">
	<DealerHeader>
		{#if w.index > 0 && !w.created}
			<div class="hidden text-right leading-tight sm:block">
				<p class="text-[11px] text-muted-foreground">{tr('Contract no.')}</p>
				<p class="font-mono text-xs font-semibold">{w.contractNo}</p>
			</div>
		{/if}
	</DealerHeader>

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else if w.index === 0}
		<!-- ================= Launcher ================= -->
		<main bind:this={main} class="flex-1 overflow-y-auto">
			<div class="mx-auto max-w-[1168px] px-4 py-7 sm:px-6 sm:py-12 in-data-[density=compact]:py-6">
				<header class="mx-auto max-w-[1120px]">
					<p class="text-sm font-medium text-primary dark:text-accent-foreground">{tr('New contract')}</p>
					<h1 bind:this={heading} tabindex="-1" class="mt-1 text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
						{tr('Create a contract')}
					</h1>
					<p class="mt-2 max-w-2xl text-[15px] text-muted-foreground">
						{tr('Choose the protection product first. We shape the steps around it, so you only answer what that contract needs.')}
					</p>
				</header>

				<SummaryLayout mobile={false} summary={launcherSummary} class="mt-7 sm:mt-9">
				<div
					role="radiogroup"
					aria-label={tr('Protection product')}
					tabindex="-1"
					onkeydown={onGalleryKey}
					class="grid gap-4 outline-none sm:grid-cols-2 in-data-[density=compact]:gap-3"
				>
					{#each w.products as p (p.id)}
						{@const on = w.productId === p.id}
						{@const shorts = p.steps.map((s) => s.short)}
						<button
							type="button"
							role="radio"
							aria-checked={on}
							tabindex={on ? 0 : -1}
							aria-labelledby={`c04-${p.id}-name`}
							aria-describedby={`c04-${p.id}-tag c04-${p.id}-meta c04-${p.id}-path`}
							onclick={() => pick(p.id)}
							class={cn(
								'group relative flex flex-col rounded-2xl border bg-card p-5 text-left shadow-soft transition-[border-color,box-shadow,transform] duration-200 outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0 in-data-[density=compact]:p-4',
								on && 'border-primary ring-2 ring-primary hover:border-primary'
							)}
						>
							<span class="flex items-start justify-between gap-3">
								<span class={cn('grid size-12 shrink-0 place-items-center rounded-xl', TONE[p.tone])}>
									<p.icon class="size-6" />
								</span>
								<span
									aria-hidden="true"
									class={cn(
										'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
										on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card'
									)}
								>
									{#if on}<Check class="size-3.5" />{/if}
								</span>
							</span>

							<span id={`c04-${p.id}-name`} class="mt-4 block text-lg leading-snug font-semibold">{p.name}</span>
							<span id={`c04-${p.id}-tag`} class="block text-sm font-medium text-muted-foreground">{p.tagline}</span>
							<span class="mt-3 block flex-1 text-sm text-muted-foreground">{p.description}</span>

							<span id={`c04-${p.id}-meta`} class="mt-4 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
								<Clock class="size-3.5 text-muted-foreground" />
								{effort(p)}
							</span>
							<span id={`c04-${p.id}-path`} class="mt-2.5 flex flex-wrap items-center gap-1">
								<span class="sr-only">{tr('Path:')}</span>
								{#each shorts as short, i (short)}
									<span
										class={cn(
											'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
											on ? 'bg-primary-soft text-primary dark:text-accent-foreground' : 'bg-muted text-muted-foreground'
										)}>{short}</span
									>
									{#if i < shorts.length - 1}<ChevronRight aria-hidden="true" class="size-3 text-faint" />{/if}
								{/each}
							</span>
						</button>
					{/each}
				</div>
				</SummaryLayout>
			</div>
		</main>

		<!-- "Your path" strip: docked so Start stays in the thumb zone on phones -->
		<footer class="pb-safe shrink-0 border-t bg-card/95 shadow-[0_-8px_24px_rgb(0_0_0/0.06)] backdrop-blur">
			<section aria-labelledby="c04-path-h" class="mx-auto flex max-w-[1168px] items-end gap-4 px-4 pt-3 sm:px-6">
				<div class="min-w-0 flex-1">
					<h2 id="c04-path-h" class="flex flex-wrap items-baseline gap-x-2 text-sm">
						<span class="font-semibold">{tr('Your path')}</span>
						<span class="text-muted-foreground" aria-live="polite">
							{w.product.name} · {effort(w.product)}
						</span>
					</h2>
					<div class="mt-2 hidden md:block">{@render path(false)}</div>
				</div>
				<Button class="h-11 shrink-0 gap-1.5 px-5 text-[15px]" onclick={() => go(() => w.next())}>
					{tr('Start')} <ArrowRight class="size-4" />
				</Button>
			</section>
		</footer>
	{:else}
		<!-- ================= In the flow ================= -->
		<div class="shrink-0 border-b bg-card">
			<div class="mx-auto flex max-w-[1168px] flex-col gap-3 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:gap-5">
				<div class="flex items-center justify-between gap-3">
					<button
						type="button"
						onclick={() => go(() => w.goto(0))}
						class="inline-flex h-10 max-w-full min-w-0 items-center gap-2 rounded-full border bg-background pr-3 pl-1.5 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 in-data-[density=compact]:h-9"
					>
						<span class={cn('grid size-7 shrink-0 place-items-center rounded-full', TONE[w.product.tone])}>
							<w.product.icon class="size-4" />
						</span>
						<span class="truncate">{w.product.name}</span>
						<ArrowLeftRight class="size-3.5 shrink-0 text-muted-foreground" />
						<span class="sr-only">{tr(', change product')}</span>
					</button>

					<!-- phones: Step X of N opens a step map -->
					<Sheet.Root bind:open={mapOpen}>
						<Sheet.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									class="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
								>
									<span class="text-muted-foreground">{tr('Step')}</span>
									<span class="font-semibold tabular-nums">{tr('{n} of {total}', { n: w.index + 1, total: w.total })}</span>
									<ChevronDown class="size-4 text-muted-foreground" />
									<span class="sr-only">{tr(', show all steps')}</span>
								</button>
							{/snippet}
						</Sheet.Trigger>
						<Sheet.Content side="bottom" class="pb-safe rounded-t-2xl">
							<Sheet.Header>
								<Sheet.Title>{w.product.name}</Sheet.Title>
								<Sheet.Description>{effort(w.product)}</Sheet.Description>
							</Sheet.Header>
							<ol class="flex flex-col gap-1 px-4 pb-4">
								{#each w.steps as s, i (s.id)}
									{@const st = w.status(i)}
									<li>
										<button
											type="button"
											disabled={st === 'locked'}
											aria-current={i === w.index ? 'step' : undefined}
											onclick={() => {
												mapOpen = false;
												go(() => w.goto(i));
											}}
											class={cn(
												'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
												i === w.index && 'bg-primary-soft/60'
											)}
										>
											<StatusIcon status={st} n={i + 1} />
											<span class="min-w-0 flex-1">
												<span class={cn('block text-sm', i === w.index ? 'font-semibold' : 'font-medium')}>{s.title}</span>
												<span class="block text-xs text-muted-foreground capitalize-first">{tr(STATUS_TEXT[st])}</span>
											</span>
										</button>
									</li>
								{/each}
							</ol>
						</Sheet.Content>
					</Sheet.Root>
				</div>

				<nav aria-label={tr('Contract steps')} class="hidden min-w-0 flex-1 md:block">{@render path(true)}</nav>
				<Progress
					value={((w.index + 1) / w.total) * 100}
					aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}
					class="h-1.5 md:hidden"
				/>
			</div>
		</div>

		<main bind:this={main} class="flex-1 overflow-y-auto">
			<div class="px-4 py-6 sm:px-6 sm:py-8 in-data-[density=compact]:py-5">
				<SummaryLayout>
				{#key w.current.id}
					<section
						in:fade={{ duration: dur ? 180 : 0 }}
						class="rounded-2xl border bg-card p-5 shadow-soft sm:p-8 in-data-[density=compact]:sm:p-6"
					>
						<header class="mb-6 flex items-start gap-4">
							<span class="hidden size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid dark:text-accent-foreground">
								<w.current.icon class="size-5" />
							</span>
							<div>
								<p class="text-xs font-medium text-muted-foreground">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })}</p>
								<h1 bind:this={heading} tabindex="-1" class="mt-0.5 text-xl font-semibold tracking-tight outline-none sm:text-2xl">
									{w.current.title}
								</h1>
								<p class="mt-1 text-sm text-muted-foreground">{w.current.description}</p>
							</div>
						</header>
						<StepBody onedit={(id) => go(() => w.gotoStepId(id))} />
					</section>
				{/key}
				</SummaryLayout>
			</div>
		</main>

		<footer class="pb-safe shrink-0 border-t bg-card/95 backdrop-blur">
			<div class="mx-auto flex max-w-[1168px] items-center gap-2 px-4 pt-3 sm:px-6">
				<Button variant="outline" class="h-11 gap-1 sm:h-10" onclick={() => go(() => w.prev())}>
					<ChevronLeft class="size-4" /> {tr('Back')}
				</Button>
				<p class="hidden flex-1 items-center justify-center gap-1.5 text-xs text-muted-foreground sm:flex" aria-live="polite">
					{#if w.savedAt}
						<CloudCheck class="size-3.5 text-success-strong" />
						{tr('Draft saved at {time}', { time: w.savedAt.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }) })}
					{/if}
				</p>
				<span class="flex-1 sm:hidden"></span>
				<Button class="h-11 min-w-0 gap-1 px-4 sm:h-10" onclick={() => go(() => w.next())}>
					<span class="truncate">{nextLabel}</span>
					{#if !w.isLast}<ChevronRight class="size-4" />{/if}
				</Button>
			</div>
		</footer>
	{/if}
</div>

<style>
	/* arrow depth 14px; neighbours overlap by 10px (-ml-2.5) leaving a 4px seam */
	.chev {
		clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
	}
	.chev.chev-first {
		clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
	}
	.chev.chev-last {
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%);
	}
	.chev.chev-first.chev-last {
		clip-path: none;
	}
	.capitalize-first::first-letter {
		text-transform: uppercase;
	}
</style>
