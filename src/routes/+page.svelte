<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Kbd } from '$lib/components/ui/kbd';
	import { Switch } from '$lib/components/ui/switch';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Wand from '@lucide/svelte/icons/wand-sparkles';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Maximize from '@lucide/svelte/icons/maximize-2';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Tablet from '@lucide/svelte/icons/tablet';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import Laptop from '@lucide/svelte/icons/laptop';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Settings from '@lucide/svelte/icons/settings';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/utils';
	import { CONCEPTS, RULES } from '$lib/concepts/registry';
	import ConceptHost from '$lib/concepts/ConceptHost.svelte';
	import { PRODUCTS } from '$lib/wizard/products';
	import { tr, setLang } from '$lib/i18n/index.svelte';

	const VIEWPORTS = [
		{ value: 'desktop', label: 'Desktop · fluid', w: 0, icon: Monitor },
		{ value: 'laptop', label: 'Laptop · 1280', w: 1280, icon: Laptop },
		{ value: 'tablet', label: 'Tablet · 820', w: 820, icon: Tablet },
		{ value: 'mobile', label: 'Phone · 390', w: 390, icon: Smartphone }
	];
	const THEMES = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];
	const TOKENS = [
		{ value: 'clean', label: 'Clean blue' },
		{ value: 'insclix', label: 'Insclix navy' }
	];
	const LANGS = [
		{ value: 'en', label: 'English' },
		{ value: 'fr', label: 'Français (Canada)' }
	];
	const DENSITIES = [
		{ value: 'comfortable', label: 'Comfortable' },
		{ value: 'compact', label: 'Compact' }
	];

	const q = page.url.searchParams;
	let concept = $state(q.get('c') ?? CONCEPTS[0].slug);
	let product = $state(q.get('product') ?? 'wearpass');
	let viewport = $state(q.get('vp') ?? 'desktop');
	let theme = $state(q.get('theme') ?? 'light');
	let density = $state(q.get('density') ?? 'comfortable');
	let tokens = $state(q.get('tokens') ?? 'clean');
	let lang = $state(q.get('lang') ?? 'en');
	/** concept 0 only: side summary on / off (on by default) */
	let summary = $state(q.get('summary') !== 'off');
	let frame = $state<HTMLIFrameElement>();
	let settingsOpen = $state(false);

	const meta = $derived(CONCEPTS.find((c) => c.slug === concept) ?? CONCEPTS[0]);
	const idx = $derived(CONCEPTS.indexOf(meta));
	const vp = $derived(VIEWPORTS.find((v) => v.value === viewport) ?? VIEWPORTS[0]);
	// the iframe only reloads when the concept changes; everything else is posted in
	const src = $derived(`/concept/${meta.slug}?product=${product}&theme=${theme}&density=${density}&tokens=${tokens}&lang=${lang}&summary=${summary ? 'on' : 'off'}`);
	let frameSrc = $state('');
	$effect(() => {
		const slug = meta.slug;
		frameSrc = untrack(() => src) || slug;
	});

	/** fluid desktop renders the concept inline (no iframe) so page tools like Pinta can pick elements */
	const inline = $derived(viewport === 'desktop');
	let host = $state<{ fill: () => void; reset: () => void }>();
	const post = (type: string, value?: string) => {
		if (inline) {
			if (type === 'fill') host?.fill();
			if (type === 'reset') host?.reset();
			return;
		}
		frame?.contentWindow?.postMessage({ type, value }, location.origin);
	};

	$effect(() => post('product', product));
	$effect(() => post('theme', theme));
	$effect(() => post('density', density));
	$effect(() => post('tokens', tokens));
	$effect(() => post('lang', lang));
	$effect(() => post('summary', summary ? 'on' : 'off'));
	// the drawer's own copy follows the Language dropdown
	$effect(() => setLang(lang === 'fr' ? 'fr' : 'en'));
	$effect(() => {
		if (tokens === 'clean') delete document.documentElement.dataset.tokens;
		else document.documentElement.dataset.tokens = tokens;
	});
	$effect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
	});
	$effect(() => {
		const u = new URL(page.url);
		u.searchParams.set('c', concept);
		u.searchParams.set('product', product);
		u.searchParams.set('vp', viewport);
		u.searchParams.set('theme', theme);
		u.searchParams.set('density', density);
		u.searchParams.set('tokens', tokens);
		u.searchParams.set('lang', lang);
		u.searchParams.set('summary', summary ? 'on' : 'off');
		try {
			replaceState(u, {});
		} catch {
			/* router not ready on first tick */
		}
	});

	function step(d: number) {
		concept = CONCEPTS[(idx + d + CONCEPTS.length) % CONCEPTS.length].slug;
	}

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.target as HTMLElement)?.closest('input,textarea,[role=combobox],[role=listbox]')) return;
			if (e.key === '[') step(-1);
			if (e.key === ']') step(1);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const deviceIcon = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
	const deviceLabel = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };
	const stepsLabel = (n: number) => tr(n === 1 ? '1 step' : '{n} steps', { n });
</script>

<svelte:head><title>{tr('Wizard concepts · Insclix Dealer')}</title></svelte:head>

<div class="relative flex h-dvh flex-col">
	<!-- Stage -->
	{#if inline}
		{#key meta.slug}
			<ConceptHost bind:this={host} {meta} {product} {density} {summary} />
		{/key}
	{:else}
	<main class="canvas relative min-h-0 flex-1 overflow-auto">
		<div class={cn('flex h-full justify-center', vp.w ? 'p-4 sm:p-6' : '')}>
			<div
				class={cn(
					'h-full overflow-hidden bg-background transition-[width] duration-300',
					vp.w ? 'shrink-0 rounded-[28px] border-[6px] border-foreground/85 shadow-lift' : 'w-full',
					viewport === 'mobile' && 'max-h-[844px]',
					viewport === 'tablet' && 'max-h-[1180px] rounded-[22px]',
					viewport === 'laptop' && 'rounded-xl border-4'
				)}
				style={vp.w ? `width:${vp.w + 12}px` : ''}
			>
				<iframe
					bind:this={frame}
					src={frameSrc}
					title={tr('Concept {n}: {name}', { n: meta.n, name: tr(meta.name) })}
					class="size-full border-0"
				></iframe>
			</div>
		</div>
	</main>
	{/if}

	<!-- Settings FAB: prototype chrome lives in a right-edge drawer so the concept gets the whole page -->
	<Button
		onclick={() => (settingsOpen = true)}
		aria-label={tr('Prototype settings')}
		title={tr('Prototype settings')}
		class="fixed right-5 bottom-24 z-40 size-14 rounded-full p-0 shadow-lift sm:right-6"
	>
		<Settings class="size-6" />
		<span class="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-background bg-brand-accent text-[11px] font-semibold text-white tabular-nums">{meta.n}</span>
	</Button>

	<Sheet.Root bind:open={settingsOpen}>
		<Sheet.Content side="right" class="w-full gap-0 p-0 sm:max-w-[420px]">
			<Sheet.Header class="border-b px-5 py-4">
				<div class="flex items-center gap-2.5">
					<svg viewBox="0 0 32 32" class="size-7" aria-hidden="true">
						<rect x="2" y="2" width="12" height="12" rx="3" fill="var(--primary)" />
						<rect x="18" y="2" width="12" height="12" rx="3" fill="var(--primary)" opacity=".55" />
						<rect x="2" y="18" width="12" height="12" rx="3" fill="var(--primary)" opacity=".55" />
						<rect x="18" y="18" width="12" height="12" rx="6" fill="var(--brand-accent)" />
					</svg>
					<div>
						<Sheet.Title>{tr('Wizard concepts')}</Sheet.Title>
						<Sheet.Description>{tr('Insclix Dealer · Core systems prototype')}</Sheet.Description>
					</div>
				</div>
			</Sheet.Header>

			<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
				<section class="space-y-3">
					<p class="text-xs font-semibold text-muted-foreground">{tr('Concept')}</p>
					<div class="flex items-center gap-1">
						<Button variant="outline" size="icon" class="size-10 shrink-0" aria-label={tr('Previous concept')} onclick={() => step(-1)}><ChevronLeft /></Button>
						<Select.Root type="single" bind:value={concept}>
							<Select.Trigger class="h-10 min-w-0 flex-1" aria-label={tr('Concept')}>
								<span class="truncate"><span class="text-muted-foreground">{meta.n}.</span> {tr(meta.name)}</span>
							</Select.Trigger>
							<Select.Content class="max-h-96">
								{#each CONCEPTS as c (c.slug)}
									<Select.Item value={c.slug} label={tr(c.name)}>
										<span class="w-5 text-muted-foreground tabular-nums">{c.n}.</span>{tr(c.name)}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<Button variant="outline" size="icon" class="size-10 shrink-0" aria-label={tr('Next concept')} onclick={() => step(1)}><ChevronRight /></Button>
					</div>
					<div class="rounded-xl border bg-muted/40 p-4">
						<p class="text-sm">{tr(meta.summary)}</p>
						<p class="mt-2 text-xs text-muted-foreground"><span class="font-medium text-foreground/80">{tr('Why it fits:')}</span> {tr(meta.why)}</p>
						<div class="mt-3 flex flex-wrap items-center gap-1.5">
							{#each meta.bestFor as d (d)}
								{@const I = deviceIcon[d]}
								<Badge variant="secondary" class="gap-1"><I class="size-3" />{tr(deviceLabel[d])}</Badge>
							{/each}
							<Badge variant="outline">{tr(meta.designer)}</Badge>
						</div>
						<ul class="mt-3 space-y-1">
							{#each meta.sources as s (s.url)}
								<li>
									<a href={s.url} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs text-primary hover:underline">{s.label}<ExternalLink class="size-3" /></a>
								</li>
							{/each}
						</ul>
					</div>
				</section>

				<section class="space-y-3">
					<p class="text-xs font-semibold text-muted-foreground">{tr('Preview')}</p>
					<div class="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 text-sm">
						<span class="text-muted-foreground">{tr('Product')}</span>
						<Select.Root type="single" bind:value={product}>
							<Select.Trigger class="h-10 w-full" aria-label={tr('Product')}>{tr(PRODUCTS.find((p) => p.id === product)?.name)}</Select.Trigger>
							<Select.Content>
								{#each PRODUCTS as p (p.id)}
									<Select.Item value={p.id} label={tr(p.name)}>{tr(p.name)} <span class="ml-auto text-xs text-muted-foreground">{stepsLabel(p.steps.length)}</span></Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<span class="text-muted-foreground">{tr('Viewport')}</span>
						<Select.Root type="single" bind:value={viewport}>
							<Select.Trigger class="h-10 w-full" aria-label={tr('Viewport')}>
								<span class="flex min-w-0 items-center gap-2"><vp.icon class="size-4 shrink-0 text-muted-foreground" /><span class="truncate">{tr(vp.label)}</span></span>
							</Select.Trigger>
							<Select.Content>
								{#each VIEWPORTS as v (v.value)}
									<Select.Item value={v.value} label={tr(v.label)}><v.icon class="size-4" />{tr(v.label)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<span class="text-muted-foreground">Language / Langue</span>
						<Select.Root type="single" bind:value={lang}>
							<Select.Trigger class="h-10 w-full" aria-label="Language / Langue">{LANGS.find((l) => l.value === lang)?.label}</Select.Trigger>
							<Select.Content>
								{#each LANGS as l (l.value)}<Select.Item value={l.value} label={l.label}>{l.label}</Select.Item>{/each}
							</Select.Content>
						</Select.Root>

						<span class="text-muted-foreground">{tr('Tokens')}</span>
						<Select.Root type="single" bind:value={tokens}>
							<Select.Trigger class="h-10 w-full" aria-label={tr('Design tokens')}>{tr(TOKENS.find((t) => t.value === tokens)?.label)}</Select.Trigger>
							<Select.Content>
								{#each TOKENS as t (t.value)}<Select.Item value={t.value} label={tr(t.label)}>{tr(t.label)}</Select.Item>{/each}
							</Select.Content>
						</Select.Root>

						<span class="text-muted-foreground">{tr('Theme')}</span>
						<Select.Root type="single" bind:value={theme}>
							<Select.Trigger class="h-10 w-full" aria-label={tr('Theme')}>{tr(THEMES.find((t) => t.value === theme)?.label)}</Select.Trigger>
							<Select.Content>
								{#each THEMES as t (t.value)}<Select.Item value={t.value} label={tr(t.label)}>{tr(t.label)}</Select.Item>{/each}
							</Select.Content>
						</Select.Root>

						<span class="text-muted-foreground">{tr('Density')}</span>
						<Select.Root type="single" bind:value={density}>
							<Select.Trigger class="h-10 w-full" aria-label={tr('Density')}>{tr(DENSITIES.find((d) => d.value === density)?.label)}</Select.Trigger>
							<Select.Content>
								{#each DENSITIES as d (d.value)}<Select.Item value={d.value} label={tr(d.label)}>{tr(d.label)}</Select.Item>{/each}
							</Select.Content>
						</Select.Root>

						{#if meta.slug === 'default'}
							<label for="set-summary" class="text-muted-foreground">{tr('Summary')}</label>
							<div class="flex h-10 items-center gap-3">
								<Switch id="set-summary" bind:checked={summary} />
								<span class="text-sm">{summary ? tr('Shown beside the steps') : tr('Hidden')}</span>
							</div>
						{/if}
					</div>
				</section>

				<section class="space-y-3">
					<p class="text-xs font-semibold text-muted-foreground">{tr('Actions')}</p>
					<div class="grid grid-cols-2 gap-2">
						<Button variant="outline" class="h-10 gap-1.5" onclick={() => { post('fill'); settingsOpen = false; }}><Wand class="size-4" />{tr('Fill sample data')}</Button>
						<Button variant="outline" class="h-10 gap-1.5" onclick={() => { post('reset'); settingsOpen = false; }}><RotateCcw class="size-4" />{tr('Reset wizard')}</Button>
						<Button href={src} target="_blank" variant="outline" class="col-span-2 h-10 gap-1.5"><Maximize class="size-4" />{tr('Open concept full screen')}</Button>
					</div>
				</section>

				<details class="group rounded-xl border">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
						<span class="flex items-center gap-2"><BookOpen class="size-4" />{tr('UX rules every concept follows')}</span>
						<ChevronDown class="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
					</summary>
					<ol class="space-y-2.5 border-t px-4 py-3 text-sm">
						{#each RULES as r, i (r.rule)}
							<li class="flex gap-2.5">
								<span class="w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
								<span>{tr(r.rule)} <a href={r.url} target="_blank" rel="noreferrer" class="text-xs text-primary underline underline-offset-2">{r.source}</a></span>
							</li>
						{/each}
					</ol>
				</details>
			</div>

			<p class="border-t px-5 py-3 text-xs text-muted-foreground">
				{tr('Shortcuts:')} <Kbd>[</Kbd> <Kbd>]</Kbd> {tr('switch concept')}
			</p>
		</Sheet.Content>
	</Sheet.Root>
</div>
