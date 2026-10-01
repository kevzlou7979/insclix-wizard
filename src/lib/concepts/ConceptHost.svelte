<script lang="ts">
	import { untrack } from 'svelte';
	import { Wizard, setWizard } from '$lib/wizard';
	import type { ProductId } from '$lib/wizard';
	import { i18n } from '$lib/i18n/index.svelte';
	import type { ConceptMeta } from './registry';

	/**
	 * Renders one concept directly in the page (no iframe) with its own wizard.
	 * Used by the gallery for the fluid desktop view so page tools that only see
	 * the top document (e.g. the Pinta element picker) can reach the concept.
	 */
	let {
		meta,
		product,
		density,
		summary
	}: { meta: ConceptMeta; product: string; density: string; summary: boolean } = $props();

	// initial product only; the effect below keeps it in sync
	const w = setWizard(new Wizard(untrack(() => product) as ProductId));

	// follow the drawer's product only — untracked so picking a product card
	// inside the concept doesn't re-run this and snap it back
	$effect(() => {
		const p = product as ProductId;
		untrack(() => w.setProduct(p));
	});
	$effect(() => {
		w.showSummary = summary;
	});
	// re-word visible validation errors when the language changes
	$effect(() => {
		void i18n.lang;
		untrack(() => {
			for (const id of Object.keys(w.errors)) w.touch(id);
		});
	});

	export function fill() {
		w.fillDemo();
	}
	export function reset() {
		w.reset();
	}
</script>

<div data-density={density} class="min-h-dvh">
	{#await meta.load() then m}
		<m.default />
	{/await}
</div>
