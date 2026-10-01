import Package from '@lucide/svelte/icons/package';
import UserRound from '@lucide/svelte/icons/user-round';
import CarFront from '@lucide/svelte/icons/car-front';
import ShieldCheck from '@lucide/svelte/icons/shield-check';
import Landmark from '@lucide/svelte/icons/landmark';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Wrench from '@lucide/svelte/icons/wrench';
import CircleDot from '@lucide/svelte/icons/circle-dot';
import Scale from '@lucide/svelte/icons/scale';
import type { FieldDef, ProductDef, ProductId, StepDef, Values } from './types';
import { tr, locale } from '$lib/i18n/index.svelte';

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export const PROVINCES = [
	{ value: 'AB', label: 'Alberta' },
	{ value: 'BC', label: 'British Columbia' },
	{ value: 'MB', label: 'Manitoba' },
	{ value: 'NB', label: 'New Brunswick' },
	{ value: 'NL', label: 'Newfoundland and Labrador' },
	{ value: 'NS', label: 'Nova Scotia' },
	{ value: 'NT', label: 'Northwest Territories' },
	{ value: 'NU', label: 'Nunavut' },
	{ value: 'ON', label: 'Ontario' },
	{ value: 'PE', label: 'Prince Edward Island' },
	{ value: 'QC', label: 'Quebec' },
	{ value: 'SK', label: 'Saskatchewan' },
	{ value: 'YT', label: 'Yukon' }
];

/** first letter of a Canadian postal code -> province */
export const POSTAL_PROVINCE: Record<string, string> = {
	A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON',
	N: 'ON', P: 'ON', R: 'MB', S: 'SK', T: 'AB', V: 'BC', X: 'NT', Y: 'YT'
};

export const SAMPLE_ADDRESSES = [
	{ line1: '120 Bremner Blvd', city: 'Toronto', province: 'ON', postal: 'M5J 0A8' },
	{ line1: '2150 Lake Shore Blvd W', city: 'Toronto', province: 'ON', postal: 'M8V 1A3' },
	{ line1: '1250 Rene-Levesque Blvd W', city: 'Montreal', province: 'QC', postal: 'H3B 4W8' },
	{ line1: '700 W Georgia St', city: 'Vancouver', province: 'BC', postal: 'V7Y 1G5' },
	{ line1: '9711 Macleod Trail SE', city: 'Calgary', province: 'AB', postal: 'T2J 0P6' },
	{ line1: '3220 Dufferin St', city: 'Toronto', province: 'ON', postal: 'M6A 2T3' }
];

const TOYOTA_MODELS: Record<string, { model: string; trim: string }> = {
	BU: { model: 'Corolla', trim: 'LE' },
	B1: { model: 'Camry', trim: 'SE' },
	RF: { model: 'RAV4', trim: 'XLE AWD' },
	ZA: { model: 'Highlander', trim: 'Limited' },
	NK: { model: 'Tacoma', trim: 'TRD Off-Road' },
	DY: { model: 'Tundra', trim: 'SR5' },
	KD: { model: 'Prius', trim: 'XSE' },
	YC: { model: 'Sienna', trim: 'XLE' }
};
const YEAR_CODES: Record<string, number> = {
	J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026
};

export const SAMPLE_VIN = '2T3RFREV5SW123456';

/** Fake VIN decoder: good enough for a prototype. */
export function decodeVin(raw: string) {
	const vin = (raw ?? '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
	if (vin.length !== 17) return null;
	const m = TOYOTA_MODELS[vin.slice(3, 5)] ?? TOYOTA_MODELS[vin.slice(4, 6)] ?? { model: 'RAV4', trim: 'XLE AWD' };
	const year = YEAR_CODES[vin[9]] ?? 2025;
	return { year: String(year), make: 'Toyota', model: m.model, trim: m.trim };
}

export const money = (n: number) =>
	new Intl.NumberFormat(locale(), { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(
		n || 0
	);

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const email = (v: string) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? tr('Enter an email like name@example.com') : null);
const phone = (v: string) =>
	v && v.replace(/\D/g, '').length !== 10 ? tr('Enter a 10-digit phone number') : null;
const postal = (v: string) =>
	v && !/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(v.trim())
		? tr('Enter a postal code like M5V 2T6')
		: null;
const vin = (v: string) =>
	v && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(v.trim()) ? tr('A VIN is 17 letters and numbers (no I, O or Q)') : null;
const dob = (v: string) => {
	if (!v) return null;
	const d = new Date(v);
	const age = (Date.now() - d.getTime()) / 3.15576e10;
	if (isNaN(age)) return tr('Enter a date as YYYY-MM-DD');
	if (age < 18) return tr('The applicant must be 18 or older');
	if (age > 110) return tr('Check the year of birth');
	return null;
};
const odo = (v: string) => (v && Number(v) > 400000 ? tr('Odometer looks too high — check the reading') : null);

// ---------------------------------------------------------------------------
// Shared steps
// ---------------------------------------------------------------------------

export const productStep: StepDef = {
	id: 'product',
	title: 'Choose product',
	short: 'Product',
	description: 'Pick the protection product. The steps that follow change to match it.',
	icon: Package,
	kind: 'product'
};

const applicantFields: FieldDef[] = [
	{ id: 'firstName', label: 'First name', type: 'text', required: true, autocomplete: 'given-name', span: 3 },
	{ id: 'lastName', label: 'Last name', type: 'text', required: true, autocomplete: 'family-name', span: 3 },
	{ id: 'dob', label: 'Date of birth', type: 'date', required: true, autocomplete: 'bday', span: 3, validate: dob },
	{
		id: 'language',
		label: 'Preferred language',
		type: 'segmented',
		span: 3,
		options: [
			{ value: 'en', label: 'English' },
			{ value: 'fr', label: 'Français' }
		]
	},
	{ id: 'phone', label: 'Mobile phone', type: 'tel', required: true, autocomplete: 'tel', inputmode: 'tel', span: 3, placeholder: '416 555 0142', validate: phone },
	{ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email', span: 3, validate: email },
	{ id: 'address1', label: 'Street address', type: 'address', required: true, autocomplete: 'address-line1', span: 6, help: 'Start typing to search Canada Post addresses.' },
	{ id: 'address2', label: 'Unit / suite (optional)', type: 'text', autocomplete: 'address-line2', span: 2 },
	{ id: 'city', label: 'City', type: 'text', required: true, autocomplete: 'address-level2', span: 4 },
	{ id: 'province', label: 'Province', type: 'select', required: true, options: PROVINCES, autocomplete: 'address-level1', span: 3 },
	{ id: 'postal', label: 'Postal code', type: 'postal', required: true, autocomplete: 'postal-code', span: 3, placeholder: 'M5V 2T6', validate: postal },
	{ id: 'hasCoBuyer', label: 'Add a co-buyer', type: 'switch', span: 6, help: 'Both names print on the contract.' },
	{ id: 'coFirstName', label: 'Co-buyer first name', type: 'text', required: true, span: 3, showIf: (v) => !!v.hasCoBuyer },
	{ id: 'coLastName', label: 'Co-buyer last name', type: 'text', required: true, span: 3, showIf: (v) => !!v.hasCoBuyer }
];

export const applicantStep: StepDef = {
	id: 'applicant',
	title: 'Add customer',
	short: 'Customer',
	description:
		'The primary buyer or co-buyer named on the vehicle loan or lease. They must have an insurable interest in the vehicle.',
	icon: UserRound,
	kind: 'fields',
	fields: applicantFields,
	groups: [
		{ title: 'Personal details', fields: ['firstName', 'lastName', 'dob', 'language'] },
		{ title: 'Contact', fields: ['phone', 'email'] },
		{ title: 'Home address', fields: ['address1', 'address2', 'city', 'province', 'postal'] },
		{ title: 'Co-buyer', fields: ['hasCoBuyer', 'coFirstName', 'coLastName'] }
	]
};

const vehicleFields = (withUse = true): FieldDef[] => [
	{ id: 'vin', label: 'VIN', type: 'vin', required: true, span: 6, placeholder: '17 characters', help: 'Year, make and model fill in automatically.', validate: vin },
	{ id: 'year', label: 'Year', type: 'text', required: true, inputmode: 'numeric', span: 2 },
	{ id: 'make', label: 'Make', type: 'text', required: true, span: 2 },
	{ id: 'model', label: 'Model', type: 'text', required: true, span: 2 },
	{ id: 'trim', label: 'Trim', type: 'text', span: 2 },
	{
		id: 'condition',
		label: 'Condition',
		type: 'segmented',
		required: true,
		span: 4,
		options: [
			{ value: 'new', label: 'New' },
			{ value: 'used', label: 'Used' },
			{ value: 'cpo', label: 'Certified' }
		]
	},
	{ id: 'odometer', label: 'Odometer (km)', type: 'number', required: true, inputmode: 'numeric', span: 3, validate: odo },
	{ id: 'saleDate', label: 'Sale date', type: 'date', required: true, span: 3 },
	...(withUse
		? ([
				{
					id: 'usage',
					label: 'Vehicle use',
					type: 'segmented',
					span: 6,
					options: [
						{ value: 'personal', label: 'Personal' },
						{ value: 'commercial', label: 'Commercial', hint: '+15%' }
					]
				}
			] as FieldDef[])
		: [])
];

const vehicleStep = (withUse = true): StepDef => ({
	id: 'vehicle',
	title: 'Add vehicle',
	short: 'Vehicle',
	description: 'Enter or scan the VIN. We decode the rest so you only confirm it.',
	icon: CarFront,
	kind: 'fields',
	fields: vehicleFields(withUse),
	groups: [
		{ title: 'Identify', fields: ['vin', 'year', 'make', 'model', 'trim'] },
		{ title: 'Sale details', fields: ['condition', 'odometer', 'saleDate', 'usage'] }
	]
});

export const reviewStep: StepDef = {
	id: 'review',
	title: 'Review and create',
	short: 'Review',
	description: 'Check every answer. Change anything before the contract is created.',
	icon: ClipboardCheck,
	kind: 'review'
};

const termOptions = (months: number[]) => months.map((m) => ({ value: String(m), label: `${m} months` }));

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const PRODUCTS: ProductDef[] = [
	{
		id: 'wearpass',
		name: 'Wear Pass',
		tagline: 'Lease-end wear & tear',
		description: 'Covers excess wear and tear charges at lease return — dents, scratches, tires, glass.',
		icon: Sparkles,
		tone: 'primary',
		prefix: 'WP',
		steps: [
			productStep,
			applicantStep,
			vehicleStep(false),
			{
				id: 'coverage',
				title: 'Select coverage',
				short: 'Coverage',
				description: 'Choose the term to match the lease, then any add-ons.',
				icon: ShieldCheck,
				kind: 'fields',
				fields: [
					{ id: 'term', label: 'Term', type: 'segmented', required: true, span: 6, options: termOptions([24, 36, 48, 60]) },
					{ id: 'leaseEnd', label: 'Lease maturity date', type: 'date', required: true, span: 3 },
					{ id: 'kmAllowance', label: 'Annual km allowance', type: 'select', required: true, span: 3, options: ['16000', '20000', '24000', '30000'].map((k) => ({ value: k, label: `${Number(k).toLocaleString('en-CA')} km` })) },
					{ id: 'addTire', label: 'Tire & wheel add-on', type: 'switch', span: 3, help: '+$150' },
					{ id: 'addKey', label: 'Key replacement add-on', type: 'switch', span: 3, help: '+$99' }
				]
			},
			reviewStep
		],
		price: (v) => {
			const base: Record<string, number> = { '24': 499, '36': 699, '48': 899, '60': 1099 };
			const lines = [{ label: tr('{product} · {n} mo', { product: 'Wear Pass', n: v.term ?? '—' }), amount: base[v.term] ?? 0 }];
			if (v.addTire) lines.push({ label: tr('Tire & wheel add-on'), amount: 150 });
			if (v.addKey) lines.push({ label: tr('Key replacement add-on'), amount: 99 });
			return lines;
		}
	},
	{
		id: 'vsc',
		name: 'Vehicle Service Contract',
		tagline: 'Mechanical breakdown',
		description: 'Repairs to covered components after the factory warranty, with roadside and rental.',
		icon: Wrench,
		tone: 'primary',
		prefix: 'VSC',
		steps: [
			productStep,
			applicantStep,
			vehicleStep(true),
			{
				id: 'plan',
				title: 'Select plan',
				short: 'Plan',
				description: 'Pick a coverage level, term and deductible.',
				icon: ShieldCheck,
				kind: 'fields',
				fields: [
					{
						id: 'tier',
						label: 'Coverage level',
						type: 'segmented',
						required: true,
						span: 6,
						options: [
							{ value: 'powertrain', label: 'Powertrain', hint: 'Engine, transmission' },
							{ value: 'gold', label: 'Gold', hint: '+ electrical, A/C' },
							{ value: 'platinum', label: 'Platinum', hint: 'Exclusionary' }
						]
					},
					{ id: 'term', label: 'Term', type: 'segmented', required: true, span: 6, options: termOptions([36, 48, 60, 72, 84]) },
					{ id: 'kmLimit', label: 'Kilometre limit', type: 'select', required: true, span: 3, options: ['60000', '100000', '160000', '200000'].map((k) => ({ value: k, label: `${Number(k).toLocaleString('en-CA')} km` })) },
					{ id: 'deductible', label: 'Deductible', type: 'segmented', required: true, span: 3, options: ['0', '100', '250'].map((d) => ({ value: d, label: `$${d}` })) }
				]
			},
			{
				id: 'options',
				title: 'Add options',
				short: 'Options',
				description: 'Surcharges are added automatically based on the vehicle.',
				icon: Scale,
				kind: 'fields',
				fields: [
					{ id: 'optRoadside', label: '24/7 roadside assistance', type: 'switch', span: 6, help: '+$120' },
					{ id: 'optRental', label: 'Rental car, up to $60/day', type: 'switch', span: 6, help: '+$180' },
					{ id: 'optHybrid', label: 'Hybrid battery surcharge', type: 'switch', span: 6, help: '+$250 — required for hybrid models' },
					{ id: 'notes', label: 'Notes for the administrator', type: 'textarea', span: 6 }
				]
			},
			reviewStep
		],
		price: (v) => {
			const tier: Record<string, number> = { powertrain: 900, gold: 1400, platinum: 2100 };
			const t = Number(v.term ?? 0);
			const ded: Record<string, number> = { '0': 250, '100': 0, '250': -150 };
			const base = (tier[v.tier] ?? 0) * (t ? t / 48 : 0);
			const lines = [{ label: tr('{tier} · {n} mo', { tier: tr(v.tier ? v.tier[0].toUpperCase() + v.tier.slice(1) : 'Plan'), n: t || '—' }), amount: Math.round(base) }];
			if (v.deductible) lines.push({ label: tr('${n} deductible', { n: v.deductible }), amount: ded[v.deductible] ?? 0 });
			if (v.usage === 'commercial') lines.push({ label: tr('Commercial use +15%'), amount: Math.round(base * 0.15) });
			if (v.optRoadside) lines.push({ label: tr('Roadside assistance'), amount: 120 });
			if (v.optRental) lines.push({ label: tr('Rental car'), amount: 180 });
			if (v.optHybrid) lines.push({ label: tr('Hybrid battery'), amount: 250 });
			return lines;
		}
	},
	{
		id: 'gap',
		name: 'GAP Protection',
		tagline: 'Loan / lease shortfall',
		description: 'Pays the difference between the insurance payout and the balance owing after a total loss.',
		icon: Landmark,
		tone: 'primary',
		prefix: 'GAP',
		steps: [
			productStep,
			applicantStep,
			vehicleStep(false),
			{
				id: 'financing',
				title: 'Add financing',
				short: 'Financing',
				description: 'GAP is priced from the amount financed, so match the bill of sale.',
				icon: Landmark,
				kind: 'fields',
				fields: [
					{ id: 'dealType', label: 'Deal type', type: 'segmented', required: true, span: 6, options: [{ value: 'loan', label: 'Loan' }, { value: 'lease', label: 'Lease' }] },
					{ id: 'lender', label: 'Lender', type: 'select', required: true, span: 6, options: ['Toyota Financial Services', 'RBC', 'TD Auto Finance', 'Scotiabank', 'BMO', 'Desjardins'].map((l) => ({ value: l, label: l })) },
					{ id: 'msrp', label: 'Vehicle price', type: 'money', required: true, span: 3, inputmode: 'decimal' },
					{ id: 'financed', label: 'Amount financed', type: 'money', required: true, span: 3, inputmode: 'decimal', validate: (v, all) => (Number(v) > Number(all.msrp || 0) * 1.5 ? tr('Amount financed is over 150% of the price') : null) },
					{ id: 'finTerm', label: 'Finance term', type: 'select', required: true, span: 3, options: termOptions([36, 48, 60, 72, 84, 96]) },
					{ id: 'apr', label: 'APR (%)', type: 'number', required: true, span: 3, inputmode: 'decimal' }
				]
			},
			{
				id: 'coverage',
				title: 'Select coverage',
				short: 'Coverage',
				description: 'Choose the benefit cap and whether the insurance deductible is covered.',
				icon: ShieldCheck,
				kind: 'fields',
				fields: [
					{ id: 'gapCap', label: 'Maximum benefit', type: 'segmented', required: true, span: 6, options: [{ value: '50000', label: '$50,000' }, { value: '75000', label: '$75,000' }, { value: '100000', label: '$100,000' }] },
					{ id: 'gapDeductible', label: 'Cover insurance deductible (up to $1,000)', type: 'switch', span: 6, help: '+$95' }
				]
			},
			reviewStep
		],
		price: (v) => {
			const f = Number(v.financed || 0);
			const lines = [{ label: tr('GAP · 2.1% of financed'), amount: Math.round(f * 0.021) }];
			if (v.gapCap === '100000') lines.push({ label: tr('$100k cap'), amount: 120 });
			if (v.gapDeductible) lines.push({ label: tr('Deductible cover'), amount: 95 });
			return lines;
		}
	},
	{
		id: 'tirewheel',
		name: 'Tire & Wheel',
		tagline: 'Road hazard',
		description: 'Repairs or replaces tires and rims damaged by potholes, nails and road debris.',
		icon: CircleDot,
		tone: 'primary',
		prefix: 'TW',
		steps: [
			productStep,
			applicantStep,
			vehicleStep(false),
			{
				id: 'coverage',
				title: 'Select coverage',
				short: 'Coverage',
				description: 'Wheel size sets the price band.',
				icon: ShieldCheck,
				kind: 'fields',
				fields: [
					{ id: 'term', label: 'Term', type: 'segmented', required: true, span: 6, options: termOptions([24, 36, 48, 60]) },
					{ id: 'wheelSize', label: 'Wheel size', type: 'segmented', required: true, span: 6, options: [{ value: '17', label: 'Up to 17"' }, { value: '19', label: '18–19"' }, { value: '22', label: '20"+' }] },
					{ id: 'addCosmetic', label: 'Cosmetic wheel repair', type: 'switch', span: 6, help: '+$110' }
				]
			},
			reviewStep
		],
		price: (v) => {
			const t = Number(v.term || 0);
			const size: Record<string, number> = { '17': 1, '19': 1.25, '22': 1.6 };
			const lines = [{ label: tr('{product} · {n} mo', { product: tr('Tire & Wheel'), n: t || '—' }), amount: Math.round((t ? 12 * t : 0) * (size[v.wheelSize] ?? 1)) }];
			if (v.addCosmetic) lines.push({ label: tr('Cosmetic repair'), amount: 110 });
			return lines;
		}
	}
];

export const productById = (id: ProductId) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

/** Realistic demo values so every concept can be walked end-to-end quickly. */
export const DEMO_VALUES: Values = {
	firstName: 'Priya',
	lastName: 'Raman',
	dob: '1988-04-12',
	language: 'en',
	phone: '416 555 0142',
	email: 'priya.raman@example.com',
	address1: '120 Bremner Blvd',
	city: 'Toronto',
	province: 'ON',
	postal: 'M5J 0A8',
	vin: SAMPLE_VIN,
	year: '2025',
	make: 'Toyota',
	model: 'RAV4',
	trim: 'XLE AWD',
	condition: 'new',
	odometer: '42',
	saleDate: '2026-09-29',
	usage: 'personal',
	term: '48',
	leaseEnd: '2030-09-29',
	kmAllowance: '20000',
	tier: 'gold',
	kmLimit: '100000',
	deductible: '100',
	dealType: 'loan',
	lender: 'Toyota Financial Services',
	msrp: '46500',
	financed: '41200',
	finTerm: '72',
	apr: '5.49',
	gapCap: '75000',
	wheelSize: '19'
};

// ---------------------------------------------------------------------------
// Localization — the engine hands out translated copies so every concept that
// renders step.title / field.label / option.label gets French for free.
// ---------------------------------------------------------------------------

function trLabel(label: string): string {
	let m = /^(\d+) months$/.exec(label);
	if (m) return tr('{n} months', { n: m[1] });
	m = /^([\d,]+) km$/.exec(label);
	if (m) return `${Number(m[1].replace(/,/g, '')).toLocaleString(locale())} km`;
	m = /^\$([\d,]+)$/.exec(label);
	if (m) return money(Number(m[1].replace(/,/g, '')));
	return tr(label);
}

function localizeField(f: FieldDef): FieldDef {
	return {
		...f,
		label: tr(f.label),
		help: f.help && tr(f.help),
		placeholder: f.placeholder && tr(f.placeholder),
		options: f.options?.map((o) => ({ ...o, label: trLabel(o.label), hint: o.hint && tr(o.hint) }))
	};
}

export function localizeStep(s: StepDef): StepDef {
	return {
		...s,
		title: tr(s.title),
		short: tr(s.short),
		description: tr(s.description),
		fields: s.fields?.map(localizeField),
		groups: s.groups?.map((g) => ({ ...g, title: tr(g.title) }))
	};
}

export function localizeProduct(p: ProductDef): ProductDef {
	return { ...p, name: tr(p.name), tagline: tr(p.tagline), description: tr(p.description), steps: p.steps.map(localizeStep) };
}

/** Localized product list — reactive when read inside $derived / templates. */
export const localizedProducts = () => PRODUCTS.map(localizeProduct);
