<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { conceptBySlug } from '$lib/concepts/registry';
	import { Wizard, setWizard } from '$lib/wizard';
	import type { ProductId } from '$lib/wizard';
	import { setLang, type Lang } from '$lib/i18n/index.svelte';

	/**
	 * Full-bleed render of one concept. The gallery embeds this in an iframe so
	 * real media / container queries apply at phone, tablet and desktop widths.
	 * The parent drives it with postMessage (product, theme, density, fill, reset).
	 */
	const q = page.url.searchParams;
	const meta = $derived(conceptBySlug(page.params.slug ?? ''));
	const w = setWizard(new Wizard((q.get('product') as ProductId) ?? 'wearpass'));
	let density = $state(q.get('density') ?? 'comfortable');

	function applyTheme(t: string | null) {
		document.documentElement.classList.toggle('dark', t === 'dark');
	}
	function applyTokens(t: string | null) {
		if (t && t !== 'clean') document.documentElement.dataset.tokens = t;
		else delete document.documentElement.dataset.tokens;
	}
	applyTheme(q.get('theme'));
	applyTokens(q.get('tokens'));
	setLang((q.get('lang') as Lang) ?? 'en');
	/** re-word any visible validation errors in the new language */
	function applyLang(l: Lang) {
		setLang(l);
		for (const id of Object.keys(w.errors)) w.touch(id);
	}
	if (q.get('demo') === '1') w.fillDemo();

	onMount(() => {
		const onMsg = (e: MessageEvent) => {
			if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
			const d = e.data as { type: string; value?: string };
			if (d.type === 'product' && d.value) w.setProduct(d.value as ProductId);
			if (d.type === 'theme') applyTheme(d.value ?? null);
			if (d.type === 'tokens') applyTokens(d.value ?? null);
			if (d.type === 'lang' && d.value) applyLang(d.value as Lang);
			if (d.type === 'density' && d.value) density = d.value;
			if (d.type === 'fill') w.fillDemo();
			if (d.type === 'reset') w.reset();
		};
		window.addEventListener('message', onMsg);
		return () => window.removeEventListener('message', onMsg);
	});
</script>

<svelte:head><title>{meta.n}. {meta.name} · Insclix wizard concepts</title></svelte:head>

<div data-density={density} class="min-h-dvh">
	{#key meta.slug}
		{#await meta.load() then m}
			<m.default />
		{/await}
	{/key}
</div>
