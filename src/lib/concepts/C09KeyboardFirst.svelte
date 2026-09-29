<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import * as Command from '$lib/components/ui/command';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CommandIcon from '@lucide/svelte/icons/command';
	import Search from '@lucide/svelte/icons/search';
	import Save from '@lucide/svelte/icons/save';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Lock from '@lucide/svelte/icons/lock';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import { getWizard, money, DealerHeader, StepBody, StatusIcon, SummaryCard, SuccessPanel, SummaryLayout } from '$lib/wizard';
	import { tr } from '$lib/i18n/index.svelte';

	/**
	 * Concept 9 — Keyboard-first power mode.
	 * Always compact. Ctrl/Cmd+K palette, Alt+1..9 jumps, Alt+←/→ and
	 * Ctrl/Cmd+Enter move, Ctrl/Cmd+S saves. On touch the hints disappear and
	 * it behaves like a normal dense wizard. Form and the summary + shortcut
	 * column sit side by side as one centred group (checkout pattern).
	 */
	const w = getWizard();
	let form = $state<HTMLElement>();
	let paletteOpen = $state(false);
	let isMac = $state(false);
	let toast = $state<{ id: number; text: string; tone: 'ok' | 'warn' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	const mod = $derived(isMac ? '⌘' : 'Ctrl');
	const alt = $derived(isMac ? '⌥' : 'Alt');
	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));

	onMount(() => {
		isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
	});

	function flash(text: string, tone: 'ok' | 'warn' = 'ok') {
		toast = { id: Date.now(), text, tone };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 1900);
	}

	async function focusFirst() {
		await tick();
		form?.scrollTo({ top: 0 });
		const el = form?.querySelector<HTMLElement>('[id^="f-"]:not([disabled]), [role="radio"]');
		el?.focus({ preventScroll: true });
	}

	function doNext() {
		const wasLast = w.isLast;
		if (w.next()) {
			if (!wasLast) {
				flash(tr('Saved · {step}', { step: w.current.title }));
				focusFirst();
			}
		}
	}
	function doPrev() {
		if (w.isFirst) return;
		w.prev();
		focusFirst();
	}
	function jump(i: number) {
		if (i >= w.total) return;
		if (i === w.index) return;
		if (w.goto(i)) focusFirst();
		else flash(tr('Finish earlier steps to open {step}', { step: w.steps[i].short }), 'warn');
	}
	function save() {
		w.saveDraft();
		flash(tr('Draft saved'));
	}

	function onKey(e: KeyboardEvent) {
		const m = e.ctrlKey || e.metaKey;
		if (m && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			paletteOpen = !paletteOpen;
			return;
		}
		if (paletteOpen || w.created) return;
		if (m && e.key === 'Enter') {
			e.preventDefault();
			doNext();
		} else if (m && e.key.toLowerCase() === 's') {
			e.preventDefault();
			save();
		} else if (e.altKey && !m) {
			if (e.key === 'ArrowRight') {
				e.preventDefault();
				doNext();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				doPrev();
			} else if (/^Digit[1-9]$/.test(e.code)) {
				e.preventDefault();
				jump(Number(e.code.slice(5)) - 1);
			}
		}
	}

	function run(fn: () => void) {
		paletteOpen = false;
		fn();
	}

	const legend = $derived([
				{ keys: [mod, 'K'], label: tr('Command menu') },
		{ keys: [mod, '↵'], label: tr('Next step') },
		{ keys: [alt, '←'], label: tr('Previous step') },
		{ keys: [alt, '→'], label: tr('Next step') },
		{ keys: [alt, `1–${Math.min(w.total, 9)}`], label: tr('Jump to step') },
		{ keys: [mod, 'S'], label: tr('Save draft') },
		{ keys: [tr('Tab')], label: tr('Next field') }
	]);
</script>

<svelte:window onkeydown={onKey} />

{#snippet sidePanel()}
	<div class="flex flex-col gap-3">
		<SummaryCard compact />
		<section class="rounded-2xl border bg-card shadow-soft pointer-coarse:hidden">
			<h2 class="flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold">
				<Keyboard class="size-3.5 text-muted-foreground" /> {tr('Shortcuts')}
			</h2>
			<ul class="divide-y text-xs">
				{#each legend as l (l.label + l.keys.join())}
					<li class="flex items-center justify-between gap-2 px-4 py-1.5">
						<span class="text-muted-foreground">{l.label}</span>
						<KbdGroup>{#each l.keys as k (k)}<Kbd>{k}</Kbd>{/each}</KbdGroup>
					</li>
				{/each}
			</ul>
		</section>
	</div>
{/snippet}

<div data-density="compact" class="flex h-dvh flex-col bg-background">
	<DealerHeader class="h-12">
		<button
			type="button"
			onclick={() => (paletteOpen = true)}
			aria-label={tr('Jump to step or run a command')}
			class="flex h-9 min-w-0 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-64 lg:w-80"
		>
			<Search class="size-4 shrink-0" />
			<span class="hidden flex-1 truncate text-left sm:inline">{tr('Jump to step or run a command')}</span>
			<KbdGroup class="hidden md:pointer-fine:inline-flex"><Kbd>{mod}</Kbd><Kbd>K</Kbd></KbdGroup>
		</button>
	</DealerHeader>

	{#if w.created}
		<main class="flex-1 overflow-y-auto"><SuccessPanel /></main>
	{:else}
		<!-- Step tabs -->
		<nav aria-label={tr('Contract steps')} class="shrink-0 border-b bg-card">
			<div class="mx-auto hidden max-w-[1168px] items-center gap-3 px-4 py-2 md:flex lg:px-6">
				<ol class="flex min-w-0 flex-1 items-center gap-0.5 rounded-lg bg-muted p-0.5">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						{@const active = i === w.index}
						<li class="min-w-0 flex-1">
							<button
								type="button"
								onclick={() => jump(i)}
								disabled={st === 'locked'}
								aria-current={active ? 'step' : undefined}
								aria-keyshortcuts={i < 9 ? `Alt+${i + 1}` : undefined}
								class={cn(
									'flex h-8 w-full min-w-0 items-center gap-1.5 rounded-md px-2 text-left text-xs transition-colors',
									'hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
									active ? 'bg-card font-semibold text-foreground shadow-sm' : 'font-medium text-muted-foreground'
								)}
							>
								{#if st === 'complete'}
									<Check class="size-3.5 shrink-0 text-success-strong" />
								{:else if st === 'locked'}
									<Lock class="size-3 shrink-0" />
								{:else}
									<span class={cn('shrink-0 tabular-nums', st === 'error' && 'text-destructive')}>{i + 1}</span>
								{/if}
								<span class={cn('min-w-0 flex-1 truncate', st === 'error' && 'text-destructive')}>{s.short}</span>
								{#if i < 9}<Kbd class="hidden h-4 min-w-4 px-0.5 text-[10px] xl:pointer-fine:inline-flex">{alt}{i + 1}</Kbd>{/if}
							</button>
						</li>
					{/each}
				</ol>
				<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{money(w.price)}</span>
			</div>
			<!-- phones -->
			<div class="flex items-center gap-3 px-4 py-2.5 md:hidden">
				<StatusIcon status={w.status(w.index)} n={w.index + 1} />
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm"><span class="text-muted-foreground">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} ·</span> <span class="font-semibold">{w.current.short}</span></p>
					<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="mt-1.5 h-1" />
				</div>
				<Button variant="outline" size="sm" class="h-11 gap-1.5" onclick={() => (paletteOpen = true)}>
					<CommandIcon class="size-3.5" /> {tr('Jump')}
				</Button>
			</div>
		</nav>

		<!-- Form + summary column, one centred group -->
		<main bind:this={form} class="min-h-0 flex-1 overflow-y-auto">
			<div class="px-4 py-4 lg:px-6 lg:py-5">
				<SummaryLayout summary={sidePanel} sticky="top-5">
					<section class="rounded-2xl border bg-card shadow-soft">
						<header class="flex items-center gap-3 border-b px-4 py-3">
							<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
								<w.current.icon class="size-4" />
							</span>
							<div class="min-w-0 flex-1">
								<h1 class="truncate text-base font-semibold tracking-tight">{w.current.title}</h1>
								<p class="truncate text-xs text-muted-foreground">{w.current.description}</p>
							</div>
							<span class="hidden text-xs text-muted-foreground tabular-nums sm:inline">{w.index + 1}/{w.total}</span>
						</header>
						<div class="px-4 py-4">
							<StepBody />
						</div>
					</section>
				</SummaryLayout>
			</div>
		</main>

		<!-- Footer -->
		<footer class="pb-safe shrink-0 border-t bg-card/95 backdrop-blur">
			<div class="mx-auto flex max-w-[1168px] items-center gap-2 px-4 pt-3 lg:px-6">
				<Button variant="ghost" class="h-11 gap-1.5 md:h-8" onclick={save} aria-label={tr('Save draft')} aria-keyshortcuts="Control+S">
					<Save class="size-4" /><span class="hidden sm:inline">{tr('Save draft')}</span>
					<KbdGroup class="hidden md:pointer-fine:inline-flex"><Kbd>{mod}</Kbd><Kbd>S</Kbd></KbdGroup>
				</Button>
				<span class="flex-1"></span>
				<Button variant="outline" class="h-11 gap-1.5 md:h-8" disabled={w.isFirst} onclick={doPrev} aria-label={tr('Back')} aria-keyshortcuts="Alt+ArrowLeft">
					<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Back')}</span>
					<KbdGroup class="hidden md:pointer-fine:inline-flex"><Kbd>{alt}</Kbd><Kbd>←</Kbd></KbdGroup>
				</Button>
				<Button class="h-11 gap-1.5 px-3 md:h-8" onclick={doNext} aria-keyshortcuts="Control+Enter">
					{nextLabel}
					{#if !w.isLast}<ChevronRight class="size-4" />{/if}
					<KbdGroup class="hidden md:pointer-fine:inline-flex">
						<Kbd class="bg-primary-foreground/15 text-primary-foreground">{mod}</Kbd><Kbd class="bg-primary-foreground/15 text-primary-foreground">↵</Kbd>
					</KbdGroup>
				</Button>
			</div>
		</footer>
	{/if}
</div>

<!-- Transient hint -->
{#if toast}
	{#key toast.id}
		<div
			role="status"
			class={cn(
				'fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lift animate-in fade-in-0 slide-in-from-bottom-2 md:right-6 md:left-auto md:translate-x-0',
				toast.tone === 'ok' ? 'bg-card text-foreground' : 'bg-warning-soft text-warning-strong'
			)}
		>
			{#if toast.tone === 'ok'}<CircleCheck class="size-3.5 text-success-strong" />{:else}<Lock class="size-3.5" />{/if}
			{toast.text}
		</div>
	{/key}
{/if}

<!-- Command palette -->
<Command.Dialog
	bind:open={paletteOpen}
	title={tr('Command menu')}
	description={tr('Jump to a step or run an action')}
	class="sm:max-w-lg"
>
	<Command.Input placeholder={tr('Type a step, product or action…')} />
	<Command.List class="max-h-[min(60dvh,420px)]">
		<Command.Empty>{tr('No matching command.')}</Command.Empty>
		<Command.Group heading={tr('Go to step')}>
			{#each w.steps as s, i (s.id)}
				{@const st = w.status(i)}
				<Command.Item value={`step ${tr('Step {n}', { n: i + 1 })} ${s.title} ${s.short}`} disabled={st === 'locked'} onSelect={() => run(() => jump(i))}>
					<StatusIcon status={st} n={i + 1} class="size-5 text-[10px]" />
					<span>{s.title}</span>
					{#if i === w.index}<span class="text-xs text-muted-foreground">{tr('Current')}</span>{/if}
					{#if i < 9}<Command.Shortcut>{alt}{i + 1}</Command.Shortcut>{/if}
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group heading={tr('Actions')}>
			<Command.Item value={`next step continue ${nextLabel}`} onSelect={() => run(doNext)}>
				<ArrowRight /> <span>{nextLabel}</span><Command.Shortcut>{mod}↵</Command.Shortcut>
			</Command.Item>
			<Command.Item value={`fill sample data demo ${tr('Fill sample data')}`} onSelect={() => run(() => (w.fillDemo(), flash(tr('Sample data filled'))))}>
				<Sparkles /> <span>{tr('Fill sample data')}</span>
			</Command.Item>
			<Command.Item value={`save draft ${tr('Save draft')}`} onSelect={() => run(save)}>
				<Save /> <span>{tr('Save draft')}</span><Command.Shortcut>{mod}S</Command.Shortcut>
			</Command.Item>
			<Command.Item value={`reset start over new contract ${tr('Reset and start over')}`} onSelect={() => run(() => (w.reset(), flash(tr('Started a new contract')), focusFirst()))}>
				<RotateCcw /> <span>{tr('Reset and start over')}</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading={tr('Switch product')}>
			{#each w.products as p (p.id)}
				<Command.Item
					value={`product ${p.name} ${p.tagline}`}
					onSelect={() => run(() => (w.setProduct(p.id), flash(tr('Product: {name}', { name: p.name }))))}
				>
					<p.icon />
					<span>{p.name}</span>
					<span class="text-xs text-muted-foreground">{tr('{n} steps', { n: p.steps.length })}</span>
					{#if p.id === w.productId}<Check class="ml-auto size-4 text-primary" />{/if}
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
