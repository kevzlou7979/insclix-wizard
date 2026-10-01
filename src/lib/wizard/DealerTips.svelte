<script lang="ts">
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import { cn } from '$lib/utils';
	import { tr } from '$lib/i18n/index.svelte';
	import { getWizard } from './wizard.svelte';

	/** Short, step-aware coaching for F&I staff. English keys, translated via tr(). */
	let { class: className = '' }: { class?: string } = $props();
	const w = getWizard();

	const TIPS: Record<string, string[]> = {
		product: ['Leased vehicle? Wear Pass matches the lease term.', 'Financed with a lender? Offer GAP alongside a service contract.'],
		applicant: ['Use the name exactly as it appears on the bill of sale.', 'Type 2+ letters of the street to search Canada Post.'],
		vehicle: ['Paste or scan the VIN — year, make and model fill in.', 'Odometer is the reading on the delivery form, not today.'],
		coverage: ['Match the term to the lease or finance term.', 'Add-ons are priced flat and show in the summary.'],
		plan: ['Gold is the most-sold tier at Oakville Toyota.', 'A $0 deductible adds to retail price.'],
		options: ['Options are optional — skip if the customer declines.'],
		financing: ['Amount financed comes from the finance contract, not MSRP.'],
		review: ['Check the VIN and customer name — they print on the contract.', 'Change links take you back without losing entries.']
	};
	const tips = $derived(TIPS[w.current.id] ?? ['Required fields are marked in the checklist.']);
</script>

<section aria-label={tr('Dealer tips')} class={cn('rounded-2xl border border-primary/10 bg-primary-soft px-4 py-3', className)}>
	<h2 class="flex items-center gap-2 text-sm font-semibold">
		<Lightbulb class="size-4 text-primary dark:text-accent-foreground" aria-hidden="true" />
		{tr('Dealer tips')}
	</h2>
	<ul class="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
		{#each tips as t (t)}<li>{tr(t)}</li>{/each}
	</ul>
</section>
