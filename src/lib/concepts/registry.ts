import type { Component } from 'svelte';

export type Device = 'desktop' | 'tablet' | 'mobile';

export interface ConceptMeta {
	n: number;
	slug: string;
	name: string;
	summary: string;
	why: string;
	bestFor: Device[];
	designer: 'UI/UX engineer' | 'Desktop designer' | 'Mobile designer';
	sources: { label: string; url: string }[];
	load: () => Promise<{ default: Component }>;
}

export const CONCEPTS: ConceptMeta[] = [
	{
		n: 0,
		slug: 'default',
		name: 'Default Insclix wizard',
		summary:
			'The current Insclix page wizard, kept as-is in layout and behaviour: every step stacked on one page as numbered cards, labelled step tiles that follow your scroll, a segmented progress rail, label-left rows with an address Lookup switch, a split Save button and joined Previous / Next — rebuilt on the new design tokens and content, with an optional side summary.',
		why: 'The baseline every other concept is measured against. Zero retraining for dealers who already use BCP / Wear Pass today.',
		bestFor: ['desktop', 'tablet'],
		designer: 'UI/UX engineer',
		sources: [
			{ label: 'NN/g · Wizards', url: 'https://www.nngroup.com/articles/wizards/' },
			{ label: 'Material steppers', url: 'https://m1.material.io/components/steppers.html' }
		],
		load: () => import('./C00Default.svelte')
	},
	{
		n: 1,
		slug: 'horizontal-stepper',
		name: 'Sticky horizontal stepper',
		summary:
			'The current wizard, modernised: labelled steps pinned to the top, labels above fields, grouped sections, sticky footer with Close, Save draft, Back and a Next button that names the next step.',
		why: 'Closest to what dealers already know, so it is the lowest-risk upgrade. Collapses to "Step 2 of 5" on phones.',
		bestFor: ['desktop', 'tablet'],
		designer: 'Desktop designer',
		sources: [
			{ label: 'Material steppers', url: 'https://m1.material.io/components/steppers.html' },
			{ label: 'Dribbble · Stepper multi-step form', url: 'https://dribbble.com/shots/6337480-Stepper-Multi-Step-form' },
			{ label: 'NN/g · Wizards', url: 'https://www.nngroup.com/articles/wizards/' }
		],
		load: () => import('./C01HorizontalStepper.svelte')
	},
	{
		n: 2,
		slug: 'vertical-rail',
		name: 'Vertical step rail',
		summary:
			'A left rail lists every step with its status (done, current, error, locked). The form sits on the right. Steps can grow down the page when a product adds more.',
		why: 'Wear Pass has 5 steps and a service contract has 6 — a vertical list absorbs that without cramping a top bar.',
		bestFor: ['desktop', 'tablet'],
		designer: 'Desktop designer',
		sources: [
			{ label: 'Carbon progress indicator', url: 'https://carbondesignsystem.com/components/progress-indicator/usage/' },
			{ label: 'Dribbble · vertical stepper form', url: 'https://dribbble.com/search/vertical-stepper-form' },
			{ label: 'Dribbble · long multi-step list on sidebar', url: 'https://dribbble.com/shots/2690749-Long-multi-step-list-on-sidebar' }
		],
		load: () => import('./C02VerticalRail.svelte')
	},
	{
		n: 3,
		slug: 'product-first',
		name: 'Product-first launcher',
		summary:
			'Starts on a full-page product gallery. Picking a product redraws a tailored flow; a path strip shows exactly which steps that product needs and how long it takes.',
		why: 'Steps branch by product, so settle the product first and show the dealer the shape of the flow before they commit.',
		bestFor: ['desktop', 'tablet', 'mobile'],
		designer: 'UI/UX engineer',
		sources: [
			{ label: 'Atlassian · progress tracker (dynamic stages)', url: 'https://atlaskit.atlassian.com/packages/design-system/progress-tracker/example/dynamic-stages' },
			{ label: 'Dribbble · pricing cards', url: 'https://dribbble.com/tags/pricing-cards' },
			{ label: 'Salesforce · lightning path', url: 'https://developer.salesforce.com/docs/component-library/bundle/lightning:path' }
		],
		load: () => import('./C04ProductFirst.svelte')
	},
	{
		n: 4,
		slug: 'one-question',
		name: 'One thing per page',
		summary:
			'Conversational flow: one question or one tight group per screen, big type, a back link and Continue, ending on a Check your answers page.',
		why: 'Calm and hard to get wrong — suits occasional users and customers filling details on a showroom tablet.',
		bestFor: ['mobile', 'tablet'],
		designer: 'Mobile designer',
		sources: [
			{ label: 'GOV.UK · question pages', url: 'https://design-system.service.gov.uk/patterns/question-pages' },
			{ label: 'Dribbble · multi-step claim flow animation', url: 'https://dribbble.com/shots/24692461-Multi-Step-Form-Animation-New-Claim-Flow-pt-1' },
			{ label: 'GOV.UK · check answers', url: 'https://design-system.service.gov.uk/patterns/check-answers' }
		],
		load: () => import('./C05OneQuestion.svelte')
	},
	{
		n: 5,
		slug: 'task-list',
		name: 'Task list hub',
		summary:
			'The contract home lists tasks — Customer, Vehicle, Coverage — each with a status tag. Each opens a short sub-flow and returns to the hub. Submit unlocks when all are done.',
		why: 'Contracts get started, parked (waiting on a VIN or signature) and finished later. The hub makes resuming obvious.',
		bestFor: ['desktop', 'tablet', 'mobile'],
		designer: 'Mobile designer',
		sources: [
			{ label: 'GOV.UK · complete multiple tasks', url: 'https://design-system.service.gov.uk/patterns/complete-multiple-tasks' },
			{ label: 'NHS · task list', url: 'https://service-manual.nhs.uk/design-system/components/task-list' }
		],
		load: () => import('./C07TaskList.svelte')
	}
];

export const conceptBySlug = (slug: string) => CONCEPTS.find((c) => c.slug === slug) ?? CONCEPTS[0];

/** UX rules every concept follows (from the three research passes). */
export const RULES: { rule: string; source: string; url: string }[] = [
	{ rule: 'Name every step with a verb + noun ("Add vehicle") and show where you are.', source: 'NN/g', url: 'https://www.nngroup.com/articles/wizards/' },
	{ rule: 'Pick the product first; recompute the step list and "Step X of N" when it changes.', source: 'Atlassian', url: 'https://atlaskit.atlassian.com/packages/design-system/progress-tracker/example/dynamic-stages' },
	{ rule: 'Validate on blur, clear the error the moment the value becomes valid.', source: 'Baymard', url: 'https://baymard.com/blog/inline-form-validation' },
	{ rule: 'On a failed Next, show an error summary at the top, focus it, link each error to its field.', source: 'GOV.UK', url: 'https://design-system.service.gov.uk/components/error-summary' },
	{ rule: 'Labels above fields; single column with related fields grouped on one row.', source: 'Baymard', url: 'https://baymard.com/blog/avoid-multi-column-forms' },
	{ rule: 'Address lookup by default with manual fallback; postal code fills province.', source: 'Baymard', url: 'https://baymard.com/blog/automatic-address-lookup' },
	{ rule: 'Decode the VIN to fill year / make / model; allow a camera scan on mobile.', source: 'Scanbot', url: 'https://scanbot.io/data-capture-software/vin-scanner/' },
	{ rule: 'Autosave drafts; Close never throws work away.', source: 'NN/g', url: 'https://www.nngroup.com/articles/wizards/' },
	{ rule: 'End with a review page grouped by step, with Change links. Final button says "Create contract".', source: 'GOV.UK', url: 'https://design-system.service.gov.uk/patterns/check-answers' },
	{ rule: 'Only jump forward to steps whose earlier steps are valid; always allow going back.', source: 'PatternFly', url: 'https://www.patternfly.org/components/wizard/design-guidelines/' },
	{ rule: 'Mobile: 44px+ targets, sticky primary action in the thumb zone, right keyboard per field.', source: 'Baymard', url: 'https://baymard.com/labs/touch-keyboard-types' },
	{ rule: 'No horizontal stepper on phones — use "Step X of N" + a bar + a step-map sheet.', source: 'Material', url: 'https://m1.material.io/components/steppers.html' }
];
