<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { cn } from '$lib/utils';
	import { tr } from '$lib/i18n/index.svelte';
	import { getWizard } from './wizard.svelte';

	/**
	 * What the current step still needs: required fields (click to focus) or,
	 * on the review step, the earlier steps (click to go back to one).
	 */
	let {
		ongoto,
		class: className = ''
	}: {
		/** override step navigation (e.g. scroll to a section); default w.goto */
		ongoto?: (index: number) => void;
		class?: string;
	} = $props();

	const w = getWizard();
	type Item = { id: string; label: string; state: 'done' | 'todo' | 'error'; action?: () => void };

	function focusField(id: string) {
		const el = document.getElementById(`f-${id}`);
		el?.focus({ preventScroll: true });
		el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}

	const items = $derived.by<Item[]>(() => {
		const s = w.current;
		if (s.kind === 'product') {
			return [{ id: 'product', label: tr('Product: {name}', { name: w.product.name }), state: 'done' }];
		}
		if (s.kind === 'review') {
			return w.steps.slice(0, w.index).map((st, i) => ({
				id: st.id,
				label: st.title,
				state: w.errorSteps.includes(st.id) ? 'error' : w.isStepValid(i) ? 'done' : 'todo',
				action: () => (ongoto ? ongoto(i) : w.goto(i))
			}));
		}
		return w
			.visibleFields(s)
			.filter((f) => f.required || w.errors[f.id])
			.map((f) => ({
				id: f.id,
				label: f.label.replace(/ \(.*\)/, ''),
				state: w.errors[f.id] ? 'error' : w.fieldError(f) ? 'todo' : 'done',
				action: () => focusField(f.id)
			}));
	});
	const ready = $derived(items.filter((c) => c.state === 'done').length);
</script>

<section aria-label={tr('Checklist')} class={cn('rounded-2xl border bg-card shadow-soft', className)}>
	<header class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<ListChecks class="size-4 text-muted-foreground" aria-hidden="true" />
			{tr('Checklist')}
		</h2>
		<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{tr('{ready} of {total} ready', { ready, total: items.length })}</span>
	</header>
	<ul class="p-1.5">
		{#each items as c (c.id)}
			<li>
				<button
					type="button"
					onclick={c.action}
					disabled={!c.action}
					class="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:hover:bg-transparent"
				>
					{#if c.state === 'done'}
						<CircleCheck class="size-4 shrink-0 text-success-strong" aria-hidden="true" />
					{:else if c.state === 'error'}
						<CircleAlert class="size-4 shrink-0 text-destructive" aria-hidden="true" />
					{:else}
						<CircleDashed class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					{/if}
					<span
						class={cn(
							'min-w-0 flex-1 truncate',
							c.state === 'done' && 'text-muted-foreground',
							c.state === 'error' && 'font-medium text-destructive'
						)}>{c.label}</span
					>
					{#if c.state === 'error'}<span class="shrink-0 text-[11px] text-destructive">{tr('Fix')}</span>{/if}
				</button>
			</li>
		{/each}
	</ul>
</section>
