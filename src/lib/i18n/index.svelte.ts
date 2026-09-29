import { FR_CORE } from './fr/core';
import { FR_DESKTOP } from './fr/concepts-desktop';
import { FR_MOBILE } from './fr/concepts-mobile';
import { FR_UIUX } from './fr/concepts-uiux';

export type Lang = 'en' | 'fr';

/**
 * Tiny gettext-style i18n for the prototype: the English string IS the key.
 * `tr('Add customer')` → "Ajouter le client" when French is on; unknown strings
 * fall back to English so nothing ever renders blank.
 * Placeholders: tr('Step {n} of {total}', { n: 2, total: 5 }).
 */
export const i18n = $state({ lang: 'en' as Lang });

const FR: Record<string, string> = { ...FR_CORE, ...FR_DESKTOP, ...FR_MOBILE, ...FR_UIUX };

export function tr(text: string | undefined | null, vars?: Record<string, string | number>): string {
	if (text == null) return '';
	let out = i18n.lang === 'fr' ? (FR[text] ?? text) : text;
	if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
	return out;
}

/** BCP-47 locale for Intl formatting */
export const locale = () => (i18n.lang === 'fr' ? 'fr-CA' : 'en-CA');

export function setLang(lang: Lang) {
	i18n.lang = lang;
	if (typeof document !== 'undefined') document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
}
