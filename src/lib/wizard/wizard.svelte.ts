import { getContext, setContext } from 'svelte';
import { DEMO_VALUES, decodeVin, POSTAL_PROVINCE, productById, localizeProduct, localizedProducts } from './products';
import { tr, locale } from '$lib/i18n/index.svelte';
import type { FieldDef, ProductId, StepDef, StepStatus, Values } from './types';

const KEY = Symbol('wizard');

/**
 * Shared wizard engine. Every concept renders the SAME steps, fields,
 * validation and pricing — only the layout / navigation differs.
 */
export class Wizard {
	productId = $state<ProductId>('wearpass');
	values = $state<Values>({ language: 'en', condition: 'new', usage: 'personal' });
	errors = $state<Record<string, string>>({});
	index = $state(0);
	maxVisited = $state(0);
	savedAt = $state<Date | null>(null);
	created = $state(false);
	/** step ids that failed validation on the last Next / submit */
	errorSteps = $state<string[]>([]);
	/** bumps on every failed Next so concepts can move focus to the error summary */
	errorTick = $state(0);
	vinDecoded = $state(false);
	/** task-list style concepts let dealers complete sections in any order */
	freeNav = $state(false);

	/** localized copy — re-derives when the language changes */
	product = $derived(localizeProduct(productById(this.productId)));
	products = $derived(localizedProducts());
	steps = $derived(this.product.steps);
	current = $derived(this.steps[Math.min(this.index, this.steps.length - 1)]);
	isFirst = $derived(this.index === 0);
	isLast = $derived(this.index === this.steps.length - 1);
	total = $derived(this.steps.length);
	/** 0..100, counts completed steps */
	progress = $derived(Math.round((this.index / (this.steps.length - 1)) * 100));
	priceLines = $derived(this.product.price(this.values));
	price = $derived(this.priceLines.reduce((s, l) => s + l.amount, 0));
	contractNo = $derived(`${this.product.prefix}-2026-${String(4817 + this.productId.length).padStart(6, '0')}`);
	customerName = $derived(
		[this.values.firstName, this.values.lastName].filter(Boolean).join(' ') || tr('New customer')
	);
	vehicleName = $derived(
		[this.values.year, this.values.make, this.values.model].filter(Boolean).join(' ') || tr('No vehicle yet')
	);

	constructor(productId: ProductId = 'wearpass') {
		this.productId = productId;
	}

	// ----- product ----------------------------------------------------------
	setProduct(id: ProductId) {
		if (id === this.productId) return;
		this.productId = id;
		// steps after "product" may have changed, so only step 1 counts as visited
		this.maxVisited = Math.min(this.maxVisited, 1);
		this.errors = {};
		this.errorSteps = [];
	}

	// ----- fields -----------------------------------------------------------
	visibleFields(step: StepDef = this.current): FieldDef[] {
		return (step.fields ?? []).filter((f) => !f.showIf || f.showIf(this.values));
	}

	set(id: string, value: any) {
		this.values[id] = value;
		// clear error as soon as the value becomes valid (Baymard: reward early, punish late)
		if (this.errors[id]) {
			const f = this.findField(id);
			if (f && !this.fieldError(f)) delete this.errors[id];
		}
		if (id === 'vin') this.tryDecodeVin();
		if (id === 'postal') this.fillFromPostal();
	}

	findField(id: string): FieldDef | undefined {
		for (const s of this.steps) {
			const f = s.fields?.find((x) => x.id === id);
			if (f) return f;
		}
	}

	fieldError(f: FieldDef): string | null {
		const v = this.values[f.id];
		const empty = v === undefined || v === null || v === '' || v === false;
		const name = f.label.toLowerCase().replace(/ \(.*\)/, '');
		if (f.required && empty && (f.type === 'segmented' || f.type === 'select')) return tr('Select {label}', { label: name });
		if (f.required && empty && f.type !== 'switch') return tr('Enter {label}', { label: name });
		return f.validate ? f.validate(v, this.values) : null;
	}

	/** validate on blur */
	touch(id: string) {
		const f = this.findField(id);
		if (!f) return;
		const err = this.fieldError(f);
		if (err) this.errors[id] = err;
		else delete this.errors[id];
	}

	validateStep(i = this.index): boolean {
		const step = this.steps[i];
		if (step.kind === 'product') return !!this.productId;
		if (step.kind === 'review') return this.steps.slice(0, i).every((_, j) => this.validateStep(j));
		let ok = true;
		for (const f of this.visibleFields(step)) {
			const err = this.fieldError(f);
			if (err) {
				this.errors[f.id] = err;
				ok = false;
			} else delete this.errors[f.id];
		}
		this.errorSteps = ok
			? this.errorSteps.filter((s) => s !== step.id)
			: Array.from(new Set([...this.errorSteps, step.id]));
		return ok;
	}

	/** quiet check — no error messages written */
	isStepValid(i: number): boolean {
		const step = this.steps[i];
		if (step.kind !== 'fields') return true;
		return this.visibleFields(step).every((f) => !this.fieldError(f));
	}

	stepErrors(i = this.index): { id: string; label: string; message: string }[] {
		return this.visibleFields(this.steps[i])
			.filter((f) => this.errors[f.id])
			.map((f) => ({ id: f.id, label: f.label, message: this.errors[f.id] }));
	}

	// ----- navigation ---------------------------------------------------------
	next(): boolean {
		if (!this.validateStep()) {
			this.errorTick++;
			return false;
		}
		if (this.isLast) return this.submit();
		this.index++;
		this.maxVisited = Math.max(this.maxVisited, this.index);
		this.autosave();
		return true;
	}

	prev() {
		if (this.index > 0) this.index--;
	}

	canGoto(i: number) {
		if (this.freeNav) return i < this.steps.length - 1 || this.steps.slice(0, i).every((_, j) => this.isStepValid(j));
		return i <= this.maxVisited || this.steps.slice(0, i).every((_, j) => this.isStepValid(j));
	}

	goto(i: number) {
		if (i < 0 || i >= this.steps.length || !this.canGoto(i)) return false;
		this.index = i;
		this.maxVisited = Math.max(this.maxVisited, i);
		return true;
	}

	gotoStepId(id: string) {
		const i = this.steps.findIndex((s) => s.id === id);
		if (i >= 0) this.goto(i);
	}

	status(i: number): StepStatus {
		const s = this.steps[i];
		if (i === this.index) return this.errorSteps.includes(s.id) ? 'error' : 'current';
		if (this.errorSteps.includes(s.id)) return 'error';
		if (i <= this.maxVisited && s.kind !== 'review' && this.isStepValid(i)) return 'complete';
		return this.canGoto(i) ? 'upcoming' : 'locked';
	}

	/** Filled answers for a step (for summaries / review). */
	answers(step: StepDef) {
		return this.visibleFields(step)
			.map((f) => ({ id: f.id, label: f.label, value: this.display(f) }))
			.filter((a) => a.value !== '');
	}

	display(f: FieldDef): string {
		const v = this.values[f.id];
		if (v === undefined || v === null || v === '') return '';
		if (f.type === 'switch') return v ? tr('Yes') : '';
		if (f.type === 'money') return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Number(v));
		if (f.options) return f.options.find((o) => o.value === v)?.label ?? String(v);
		if (f.id === 'odometer') return `${Number(v).toLocaleString(locale())} km`;
		return String(v);
	}

	// ----- helpers ------------------------------------------------------------
	tryDecodeVin() {
		const d = decodeVin(this.values.vin);
		this.vinDecoded = !!d;
		if (d) {
			Object.assign(this.values, d);
			for (const k of Object.keys(d)) delete this.errors[k];
		}
	}

	fillFromPostal() {
		const p = String(this.values.postal ?? '').trim().toUpperCase();
		const prov = POSTAL_PROVINCE[p[0]];
		if (prov && !this.values.province) this.values.province = prov;
	}

	autosave() {
		this.savedAt = new Date();
	}

	saveDraft() {
		this.autosave();
	}

	submit(): boolean {
		for (let i = 0; i < this.steps.length; i++) {
			if (!this.validateStep(i)) {
				this.index = i;
				this.errorTick++;
				return false;
			}
		}
		this.created = true;
		return true;
	}

	fillDemo() {
		Object.assign(this.values, DEMO_VALUES);
		this.errors = {};
		this.errorSteps = [];
		this.vinDecoded = true;
	}

	reset() {
		this.values = { language: 'en', condition: 'new', usage: 'personal' };
		this.errors = {};
		this.errorSteps = [];
		this.index = 0;
		this.maxVisited = 0;
		this.created = false;
		this.savedAt = null;
		this.vinDecoded = false;
	}
}

export function setWizard(w: Wizard) {
	return setContext(KEY, w);
}

export function getWizard(): Wizard {
	return getContext<Wizard>(KEY);
}
