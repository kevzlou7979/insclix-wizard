<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Printer from '@lucide/svelte/icons/printer';
	import Plus from '@lucide/svelte/icons/plus';
	import { getWizard } from './wizard.svelte';
	import { money } from './products';

	const w = getWizard();
	let heading = $state<HTMLElement>();
	// the Create button that had focus is gone: land keyboard / screen-reader users on the result
	$effect(() => {
		heading?.focus();
	});
</script>

<div class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-10 text-center">
	<span class="grid size-14 place-items-center rounded-full bg-success-soft text-success-strong"><CircleCheck class="size-7" aria-hidden="true" /></span>
	<div>
		<h2 bind:this={heading} tabindex="-1" class="text-xl font-semibold outline-none">{tr('Contract created')}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{tr('{product} for {customer} · {vehicle}', { product: w.product.name, customer: w.customerName, vehicle: w.vehicleName })}</p>
	</div>
	<div class="w-full rounded-xl border bg-card p-4 text-left">
		<div class="flex justify-between text-sm"><span class="text-muted-foreground">{tr('Contract no.')}</span><span class="font-mono font-semibold">{w.contractNo}</span></div>
		<div class="mt-1 flex justify-between text-sm"><span class="text-muted-foreground">{tr('Retail price')}</span><span class="font-semibold tabular-nums">{money(w.price)}</span></div>
	</div>
	<div class="flex w-full flex-col gap-2 sm:flex-row">
		<Button variant="outline" class="h-10 flex-1 gap-2"><Printer class="size-4" /> {tr('Print contract')}</Button>
		<Button class="h-10 flex-1 gap-2" onclick={() => w.reset()}><Plus class="size-4" /> {tr('New contract')}</Button>
	</div>
</div>
