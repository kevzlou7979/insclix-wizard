<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import SummaryCard from './SummaryCard.svelte';
	import MobileSummary from './MobileSummary.svelte';

	/**
	 * Content + summary side by side, close together (checkout pattern).
	 * ≥lg: fixed-width sticky summary directly to the right of the content.
	 * <lg: a collapsible summary bar above the content.
	 */
	let {
		children,
		summary,
		class: className = '',
		sticky = 'top-6',
		mobile = true,
		compact = false
	}: {
		children: Snippet;
		/** replace the default <SummaryCard/> */
		summary?: Snippet;
		class?: string;
		/** sticky offset class for the summary column */
		sticky?: string;
		/** show the collapsible summary bar below lg */
		mobile?: boolean;
		compact?: boolean;
	} = $props();
</script>

<div
	class={cn(
		'mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]',
		className
	)}
>
	{#if mobile}<MobileSummary class="lg:hidden" />{/if}
	<div class="min-w-0">{@render children()}</div>
	<div class={cn('hidden lg:sticky lg:block', sticky)}>
		{#if summary}{@render summary()}{:else}<SummaryCard {compact} />{/if}
	</div>
</div>
