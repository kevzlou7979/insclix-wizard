<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import X from '@lucide/svelte/icons/x';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Check from '@lucide/svelte/icons/check';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cn } from '$lib/utils';
	import { tr } from '$lib/i18n/index.svelte';
	import { getWizard, DealerHeader, StepBody, SuccessPanel } from '$lib/wizard';

	/**
	 * Concept 0 — Default Insclix wizard.
	 * The legacy page-wizard LAYOUT and BEHAVIOUR (numbered step tiles where only
	 * the current one shows its label, segmented progress rail, one wide card with
	 * a numbered heading and label-left rows, Lookup switch on the address, a
	 * split Save button that opens upward, joined Previous / Next) rebuilt with
	 * our tokens, components and content.
	 */
	const w = getWizard();
	let main = $state<HTMLElement>();
	let heading = $state<HTMLElement>();
	let dir = $state(1);
	let justSaved = $state(false);
	const dur = $derived(prefersReducedMotion.current ? 0 : 1);

	function go(fn: () => unknown, d: number) {
		const before = w.index;
		fn();
		if (w.index !== before) {
			dir = d;
			main?.scrollTo({ top: 0 });
			queueMicrotask(() => heading?.focus({ preventScroll: true }));
		}
	}

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
	<DealerHeader />

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<!-- Step tiles + contract number, over a segmented progress rail -->
		<nav aria-label={tr('Contract steps')} class="shrink-0 border-b bg-card">
			<div class="mx-auto flex w-full max-w-[1168px] items-center gap-4 px-4 pt-3 sm:px-6">
				<ol class="flex min-w-0 flex-1 items-center gap-2">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						<li class="min-w-0">
							<button
								type="button"
								onclick={() => go(() => w.goto(i), i > w.index ? 1 : -1)}
								disabled={st === 'locked'}
								aria-current={i === w.index ? 'step' : undefined}
								aria-label={tr('Step {n}: {title}', { n: i + 1, title: s.title })}
								class="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
							>
								<span
									class={cn(
										'grid size-9 shrink-0 place-items-center rounded-md text-base font-semibold tabular-nums transition-colors duration-300',
										tile(i),
										st !== 'locked' && i !== w.index && 'hover:ring-2 hover:ring-primary/30'
									)}
								>
									{#if st === 'complete' && i !== w.index}<Check class="size-4" />{:else}{i + 1}{/if}
								</span>
								{#if i === w.index}
									<span
										transition:slide={{ axis: 'x', duration: 280 * dur, easing: cubicOut }}
										class="hidden truncate pr-2 text-[15px] font-medium whitespace-nowrap sm:block"
									>
										{s.title}
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ol>
				<div class="shrink-0 text-right leading-tight">
					<p class="text-xs text-muted-foreground">{tr('Contract no.')}</p>
					<p class="font-mono text-sm font-semibold">{w.savedAt ? w.contractNo : '—'}</p>
				</div>
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

		<!-- One wide card per step -->
		<main bind:this={main} class="flex-1 overflow-x-hidden overflow-y-auto">
			<div class="mx-auto w-full max-w-[1168px] px-4 py-6 sm:px-6 sm:py-10">
				{#key w.index}
					<section
						in:fly={{ x: 32 * dir * dur, duration: 320 * dur, easing: cubicOut }}
						class="legacy-form rounded-2xl border bg-card p-5 shadow-soft sm:p-8"
					>
						<header class="mb-8 flex items-start gap-4">
							<span class="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-lg font-semibold text-muted-foreground tabular-nums">
								{w.index + 1}
							</span>
							<div class="min-w-0">
								<h1 bind:this={heading} tabindex="-1" class="text-2xl font-semibold tracking-tight outline-none sm:text-[28px]">
									{w.current.title}
								</h1>
								<p class="mt-2 max-w-3xl text-[15px] text-muted-foreground">{w.current.description}</p>
							</div>
						</header>
						<div class="sm:pl-14">
							<StepBody layout="inline" grouped={false} />
						</div>
					</section>
				{/key}
			</div>
		</main>

		<!-- Sticky action bar: split Save (opens upward) and joined Previous / Next -->
		<footer class="pb-safe shrink-0 border-t bg-card/95 shadow-[0_-4px_16px_rgb(0_0_0/4%)] backdrop-blur">
			<div class="mx-auto flex w-full max-w-[1168px] items-center gap-3 px-4 pt-3 sm:px-6">
				<div class="flex items-center overflow-hidden rounded-full border bg-card shadow-soft">
					<Button variant="ghost" class="h-11 gap-2 rounded-none px-4 text-primary hover:text-primary dark:text-accent-foreground" aria-label={tr('Close')}>
						<X class="size-4" /><span class="hidden sm:inline">{tr('Close')}</span>
					</Button>
					<Button class="h-11 gap-2 rounded-none px-4" onclick={save}>
						{#if justSaved}<Check class="size-4" />{/if}
						<span>{justSaved ? tr('Saved') : tr('Save draft')}</span>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} class="h-11 rounded-none border-l border-primary-foreground/25 px-3" aria-label={tr('More save options')}>
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

				<div class="flex items-center overflow-hidden rounded-full border bg-card shadow-soft">
					<Button
						variant="ghost"
						class="h-11 gap-1 rounded-none bg-muted/60 px-4 text-muted-foreground"
						disabled={w.isFirst}
						onclick={() => go(() => w.prev(), -1)}
					>
						<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Previous')}</span>
					</Button>
					<Button class="h-11 gap-1 rounded-none px-5" onclick={() => go(() => w.next(), 1)}>
						{w.isLast ? tr('Create contract') : tr('Next')}
						{#if !w.isLast}<ChevronRight class="size-4" />{/if}
					</Button>
				</div>
			</div>
		</footer>
	{/if}
</div>

<style>
	/* Legacy rhythm: roomy label-left rows, inputs sized to their content */
	.legacy-form :global([data-field]) {
		row-gap: 0.25rem;
	}
	.legacy-form :global([data-field] > div:last-child) {
		max-width: 460px;
	}
	.legacy-form :global([data-span='2'] > div:last-child),
	.legacy-form :global([data-span='3'] > div:last-child) {
		max-width: 240px;
	}
	.legacy-form :global([data-span='4'] > div:last-child) {
		max-width: 340px;
	}
	.legacy-form :global([data-field='address1'] > div:last-child) {
		max-width: 600px;
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
