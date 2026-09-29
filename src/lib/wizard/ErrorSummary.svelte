<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { prefersReducedMotion } from 'svelte/motion';
	import { getWizard } from './wizard.svelte';

	let { stepIndex }: { stepIndex?: number } = $props();
	const w = getWizard();
	const list = $derived(w.stepErrors(stepIndex ?? w.index));
	let box = $state<HTMLDivElement>();
	const uid = $props.id();

	// GOV.UK pattern: move focus to the summary after a failed Next.
	// Only react to a NEW errorTick — otherwise fixing a field (which shrinks the
	// list) would pull focus out of the input the dealer is typing in.
	let handledTick = 0;
	$effect(() => {
		const t = w.errorTick;
		if (t === handledTick || !box) return;
		if ((stepIndex ?? w.index) !== w.index || !list.length) return;
		handledTick = t;
		box.focus();
	});

	/** Focus the field; group controls (segmented) get their selected or first option. */
	function jump(id: string) {
		const el = document.getElementById(`f-${id}`) ?? document.querySelector<HTMLElement>(`[data-field="${id}"]`);
		if (!el) return;
		const focusable = el.matches('input, select, textarea, button, [tabindex]')
			? el
			: (el.querySelector<HTMLElement>('[aria-checked="true"], [data-state="on"]') ??
				el.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]:not([tabindex="-1"])'));
		(focusable ?? el).focus({ preventScroll: true });
		el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
	}
</script>

{#if list.length}
	<!-- text uses foreground: destructive red on danger-soft is only ~4.2:1 in light mode -->
	<div
		bind:this={box}
		tabindex="-1"
		role="alert"
		aria-labelledby={`${uid}-title`}
		class="rounded-xl border border-destructive/40 bg-danger-soft p-4 outline-none focus-visible:ring-3 focus-visible:ring-destructive/40"
	>
		<p id={`${uid}-title`} class="flex items-center gap-2 text-sm font-semibold text-foreground">
			<CircleAlert class="size-4 shrink-0 text-destructive" aria-hidden="true" /> {tr(list.length === 1 ? 'Fix {n} thing to continue' : 'Fix {n} things to continue', { n: list.length })}
		</p>
		<ul class="mt-2 ml-6 list-disc space-y-0.5 text-sm marker:text-destructive">
			{#each list as e (e.id)}
				<li>
					<button
						type="button"
						class="rounded-sm py-0.5 text-left text-foreground underline decoration-destructive underline-offset-2 outline-none hover:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50"
						onclick={() => jump(e.id)}>{e.message}</button
					>
				</li>
			{/each}
		</ul>
	</div>
{/if}
