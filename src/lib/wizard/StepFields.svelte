<script lang="ts">
	import { cn } from '$lib/utils';
	import Field from './Field.svelte';
	import { getWizard } from './wizard.svelte';
	import type { StepDef } from './types';

	let {
		step,
		grouped = true,
		columns = 6,
		layout = 'stacked',
		class: className = ''
	}: {
		step: StepDef;
		/** show sub-group headings when the step defines them */
		grouped?: boolean;
		/** 6 = honour field spans; 1 = single column (phones / narrow panes) */
		columns?: 1 | 6;
		layout?: 'stacked' | 'inline';
		class?: string;
	} = $props();

	const w = getWizard();
	const span: Record<number, string> = {
		2: 'sm:col-span-2',
		3: 'sm:col-span-3',
		4: 'sm:col-span-4',
		6: 'sm:col-span-6'
	};
	const fields = $derived(w.visibleFields(step));
	const groups = $derived(
		grouped && step.groups
			? step.groups
					.map((g) => ({ title: g.title, fields: fields.filter((f) => g.fields.includes(f.id)) }))
					.filter((g) => g.fields.length)
			: [{ title: '', fields }]
	);
</script>

<div class={cn('flex flex-col gap-7 in-data-[density=compact]:gap-5', className)}>
	{#each groups as g (g.title)}
		<fieldset class="min-w-0">
			{#if g.title}
				<legend class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">{g.title}</legend>
			{/if}
			<div
				class={cn(
					'grid grid-cols-1 gap-x-4 gap-y-4 in-data-[density=compact]:gap-y-3',
					columns === 6 && layout === 'stacked' && 'sm:grid-cols-6'
				)}
			>
				{#each g.fields as f (f.id)}
					<Field field={f} {layout} class={columns === 6 && layout === 'stacked' ? span[f.span ?? 6] : ''} />
				{/each}
			</div>
		</fieldset>
	{/each}
</div>
