<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { getWizard } from './wizard.svelte';
	import { money } from './products';

	let {
		dense = false,
		showPrice = true,
		onedit,
		class: className = ''
	}: {
		dense?: boolean;
		showPrice?: boolean;
		/** override edit behaviour (e.g. scroll to a section); default: w.gotoStepId */
		onedit?: (stepId: string) => void;
		class?: string;
	} = $props();

	const w = getWizard();
	const sections = $derived(w.steps.filter((s) => s.kind === 'fields'));
	const edit = (id: string) => (onedit ? onedit(id) : w.gotoStepId(id));
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<section class="rounded-xl border bg-card">
		<header class="flex items-center justify-between gap-3 border-b px-4 py-2">
			<h3 class="text-sm font-semibold">{tr('Product')}</h3>
			<Button variant="ghost" size="sm" class="relative gap-1 text-primary after:absolute after:-inset-x-1 after:-inset-y-2 dark:text-accent-foreground" onclick={() => edit('product')}>
				<Pencil class="size-3.5" aria-hidden="true" /> {tr('Change')}<span class="sr-only"> {tr('Product').toLowerCase()}</span>
			</Button>
		</header>
		<p class="px-4 py-3 text-sm">{w.product.name} <span class="text-muted-foreground">· {w.product.tagline}</span></p>
	</section>
	{#each sections as s (s.id)}
		{@const answers = w.answers(s)}
		<section class="rounded-xl border bg-card">
			<header class="flex items-center justify-between gap-3 border-b px-4 py-2">
				<h3 class="text-sm font-semibold">{s.short}</h3>
				<Button variant="ghost" size="sm" class="relative gap-1 text-primary after:absolute after:-inset-x-1 after:-inset-y-2 dark:text-accent-foreground" onclick={() => edit(s.id)}>
					<Pencil class="size-3.5" aria-hidden="true" /> {tr('Change')}<span class="sr-only"> {s.short.toLowerCase()}</span>
				</Button>
			</header>
			{#if answers.length}
				<dl class={cn('grid gap-x-6 px-4 py-3 text-sm', dense ? 'grid-cols-1 gap-y-1.5' : 'gap-y-2 sm:grid-cols-2')}>
					{#each answers as a (a.id)}
						<div class={cn('flex min-w-0 justify-between gap-3', !dense && 'sm:block')}>
							<dt class="text-xs text-muted-foreground">{a.label}</dt>
							<dd class="truncate font-medium">{a.value}</dd>
						</div>
					{/each}
				</dl>
			{:else}
				<p class="px-4 py-3 text-sm text-muted-foreground">{tr('Nothing entered yet.')}</p>
			{/if}
		</section>
	{/each}
	{#if showPrice}
		<section class="rounded-xl border bg-card px-4 py-3">
			{#each w.priceLines as l (l.label)}
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{l.label}</span><span class="tabular-nums">{money(l.amount)}</span>
				</div>
			{/each}
			<div class="mt-2 flex justify-between border-t pt-2 font-semibold">
				<span>{tr('Dealer retail price')}</span><span class="tabular-nums">{money(w.price)}</span>
			</div>
		</section>
	{/if}
</div>
