<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import Tag from '@lucide/svelte/icons/tag';
	import type { Snippet } from 'svelte';
	import { getWizard } from './wizard.svelte';
	import { money } from './products';

	/**
	 * Checkout-style contract summary (label left, value right), grouped as
	 * Summary → Price details → Total. Sits beside the step content.
	 */
	let {
		class: className = '',
		compact = false,
		title,
		showContract = true,
		children
	}: {
		class?: string;
		/** hides the price breakdown and secondary rows */
		compact?: boolean;
		title?: string;
		/** hero contract number; off when the page shows it elsewhere */
		showContract?: boolean;
		/** optional footer (e.g. a terms checkbox + primary action) */
		children?: Snippet;
	} = $props();

	const w = getWizard();
	const dash = '—';

	/** the product-specific step (coverage / plan / financing) feeds 2 extra rows */
	const coverage = $derived(
		w.steps
			.filter((s) => s.kind === 'fields' && !['applicant', 'vehicle'].includes(s.id))
			.flatMap((s) => w.answers(s))
			.filter((a) => a.id !== 'notes')
			.slice(0, compact ? 1 : 3)
	);
	const rows = $derived([
		{ label: tr('Product'), value: w.product.name },
		{ label: tr('Customer'), value: w.values.firstName ? w.customerName : dash },
		...(compact ? [] : [{ label: tr('Location'), value: [w.values.city, w.values.province].filter(Boolean).join(', ') || dash }]),
		{ label: tr('Vehicle'), value: w.values.model ? w.vehicleName : dash },
		...(compact ? [] : [{ label: tr('VIN'), value: w.values.vin || dash, mono: true }]),
		...coverage.map((a) => ({ label: a.label, value: a.value }))
	]);
</script>

<aside class={cn('flex flex-col gap-3', className)} aria-label={tr('Contract summary')}>
	<section class="rounded-2xl border bg-card p-5 shadow-soft in-data-[density=compact]:p-4">
		<!-- hero: contract number first, then the summary title -->
		<header>
			{#if showContract}
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs text-muted-foreground">{tr('Contract no.')}</p>
						<p class="font-mono text-lg font-semibold tracking-tight">{w.contractNo}</p>
					</div>
					<span class="mt-0.5 shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong">
						{tr(w.created ? 'Active' : 'Draft')}
					</span>
				</div>
				<h2 class="mt-4 text-base font-semibold">{title ?? tr('Summary')}</h2>
			{:else}
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-base font-semibold">{title ?? tr('Summary')}</h2>
					<span class="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong">
						{tr(w.created ? 'Active' : 'Draft')}
					</span>
				</div>
			{/if}
		</header>

		<dl class="mt-2 border-t pt-2 text-sm">
			{#each rows as r (r.label)}
				<div class="flex items-baseline justify-between gap-4 py-1.5 in-data-[density=compact]:py-1">
					<dt class="shrink-0 text-muted-foreground">{r.label}</dt>
					<dd class={cn('min-w-0 truncate text-right font-medium', r.mono && 'font-mono text-xs', r.value === dash && 'text-faint')}>
						{r.value}
					</dd>
				</div>
			{/each}
		</dl>

		{#if !compact}
			<h3 class="mt-4 border-t pt-4 text-sm font-semibold">{tr('Price details')}</h3>
			<dl class="mt-2 text-sm">
				{#each w.priceLines as l (l.label)}
					<div class="flex items-baseline justify-between gap-4 py-1">
						<dt class="min-w-0 truncate text-muted-foreground">{l.label}</dt>
						<dd class="font-medium tabular-nums">{money(l.amount)}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		<div class="mt-3 flex items-center justify-between gap-3 border-t pt-4">
			<span class="text-sm font-semibold">{tr('Total')}</span>
			<span class="flex items-center gap-2 text-lg font-semibold tabular-nums">
				<Tag class="size-4 text-primary dark:text-accent-foreground" aria-hidden="true" />{money(w.price)}
			</span>
		</div>
	</section>

	{#if children}
		<section class="rounded-2xl border bg-card p-5 shadow-soft in-data-[density=compact]:p-4">
			{@render children()}
		</section>
	{/if}

</aside>
