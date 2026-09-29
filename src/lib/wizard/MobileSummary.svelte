<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import SummaryCard from './SummaryCard.svelte';
	import { getWizard } from './wizard.svelte';
	import { money } from './products';

	/** Below lg the side summary folds into a tappable bar above the content. */
	let { class: className = '' }: { class?: string } = $props();
	const w = getWizard();
	let open = $state(false);
	const uid = $props.id();
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<button
		type="button"
		aria-expanded={open}
		aria-controls={`${uid}-panel`}
		onclick={() => (open = !open)}
		class="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-2.5 text-left shadow-soft outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
	>
		<span class="min-w-0">
			<span class="block text-sm font-semibold">{tr('Summary')}</span>
			<span class="block truncate text-xs text-muted-foreground">{w.product.name} · {w.customerName}</span>
		</span>
		<span class="flex shrink-0 items-center gap-2">
			<span class="font-semibold tabular-nums">{money(w.price)}</span>
			<ChevronDown class={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
		</span>
	</button>
	{#if open}
		<div id={`${uid}-panel`}><SummaryCard /></div>
	{/if}
</div>
