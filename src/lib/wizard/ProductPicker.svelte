<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import { getWizard } from './wizard.svelte';

	let {
		variant = 'cards',
		class: className = ''
	}: {
		/** cards = 2x2 visual tiles; list = compact rows (phones, drawers) */
		variant?: 'cards' | 'list';
		class?: string;
	} = $props();

	const w = getWizard();
	const tone: Record<string, string> = {
		primary: 'bg-primary-soft text-primary dark:text-accent-foreground',
		success: 'bg-success-soft text-success-strong',
		warning: 'bg-warning-soft text-warning-strong',
		accent: 'bg-brand-accent-soft text-brand-accent'
	};

	/** WAI-ARIA radio group: one tab stop, arrow keys move and select */
	function onKey(e: KeyboardEvent) {
		const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
		const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
		if (!fwd && !back) return;
		e.preventDefault();
		const n = w.products.length;
		const i = w.products.findIndex((p) => p.id === w.productId);
		const j = fwd ? (i + 1) % n : (i - 1 + n) % n;
		w.setProduct(w.products[j].id);
		(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
	}
</script>

<div
	role="radiogroup"
	aria-label={tr('Protection product')}
	tabindex="-1"
	onkeydown={onKey}
	class={cn('grid gap-3', variant === 'cards' ? 'sm:grid-cols-2' : 'grid-cols-1', className)}
>
	{#each w.products as p (p.id)}
		{@const on = w.productId === p.id}
		<button
			type="button"
			role="radio"
			aria-checked={on}
			tabindex={on ? 0 : -1}
			onclick={() => w.setProduct(p.id)}
			class={cn(
				'group relative flex items-start gap-3 rounded-xl border bg-card text-left transition-all hover:border-primary/50 hover:shadow-soft focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
				variant === 'cards' ? 'p-4' : 'p-3',
				on && 'border-primary ring-1 ring-primary'
			)}
		>
			<span aria-hidden="true" class={cn('grid shrink-0 place-items-center rounded-lg', tone[p.tone], variant === 'cards' ? 'size-11' : 'size-9')}>
				<p.icon class="size-5" />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block font-semibold">{p.name}</span>
				<span class="block text-xs font-medium text-muted-foreground">{tr('{tagline} · {n} steps', { tagline: p.tagline, n: p.steps.length })}</span>
				{#if variant === 'cards'}
					<span class="mt-1.5 block text-sm text-muted-foreground">{p.description}</span>
				{/if}
			</span>
			<span
				aria-hidden="true"
				class={cn(
					'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
					on ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
				)}
			>
				{#if on}<Check class="size-3.5" />{/if}
			</span>
		</button>
	{/each}
</div>
