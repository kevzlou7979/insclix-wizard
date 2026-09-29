<script lang="ts">
	import ProductPicker from './ProductPicker.svelte';
	import StepFields from './StepFields.svelte';
	import ReviewList from './ReviewList.svelte';
	import ErrorSummary from './ErrorSummary.svelte';
	import { getWizard } from './wizard.svelte';
	import type { StepDef } from './types';

	/** Renders the content of one step. Concepts own the chrome around it. */
	let {
		step,
		narrow = false,
		layout = 'stacked',
		grouped = true,
		onedit
	}: {
		step?: StepDef;
		narrow?: boolean;
		layout?: 'stacked' | 'inline';
		grouped?: boolean;
		onedit?: (stepId: string) => void;
	} = $props();

	const w = getWizard();
	const s = $derived(step ?? w.current);
	const idx = $derived(w.steps.indexOf(s));
</script>

<div class="flex flex-col gap-5">
	<ErrorSummary stepIndex={idx} />
	{#if s.kind === 'product'}
		<ProductPicker variant={narrow ? 'list' : 'cards'} />
	{:else if s.kind === 'fields'}
		<StepFields step={s} columns={narrow ? 1 : 6} {layout} {grouped} />
	{:else}
		<ReviewList dense={narrow} {onedit} />
	{/if}
</div>
