import type { Component } from 'svelte';

export type Values = Record<string, any>;

export type FieldType =
	| 'text'
	| 'email'
	| 'tel'
	| 'date'
	| 'number'
	| 'money'
	| 'select'
	| 'segmented'
	| 'switch'
	| 'textarea'
	| 'vin'
	| 'postal'
	| 'address';

export interface Option {
	value: string;
	label: string;
	hint?: string;
}

export interface FieldDef {
	id: string;
	label: string;
	type: FieldType;
	required?: boolean;
	options?: Option[];
	placeholder?: string;
	help?: string;
	autocomplete?: any;
	inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'search';
	/** width inside a 6-column grid: 6 = full, 3 = half, 2 = third */
	span?: 2 | 3 | 4 | 6;
	validate?: (value: any, values: Values) => string | null;
	showIf?: (values: Values) => boolean;
}

export type StepKind = 'product' | 'fields' | 'review';

export interface StepDef {
	id: string;
	/** verb + noun, e.g. "Add vehicle" */
	title: string;
	/** one-word label for compact steppers */
	short: string;
	description: string;
	icon: Component;
	kind: StepKind;
	fields?: FieldDef[];
	/** optional sub-headings: groups of field ids */
	groups?: { title: string; fields: string[] }[];
}

export interface PriceLine {
	label: string;
	amount: number;
}

export interface ProductDef {
	id: ProductId;
	name: string;
	tagline: string;
	description: string;
	icon: Component;
	/** tailwind text/bg utility pair used for accents */
	tone: 'primary' | 'success' | 'warning' | 'accent';
	prefix: string;
	steps: StepDef[];
	price: (v: Values) => PriceLine[];
}

export type ProductId = 'wearpass' | 'vsc' | 'gap' | 'tirewheel';

export type StepStatus = 'complete' | 'current' | 'error' | 'upcoming' | 'locked';
