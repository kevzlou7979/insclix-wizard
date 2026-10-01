import { prefersReducedMotion } from 'svelte/motion';
import type { Wizard } from './wizard.svelte';

/**
 * "All steps on one page" behaviour shared by concepts that stack every step
 * as a section in one scroll container:
 * - Next validates the current section, then scrolls to the next one
 * - step tiles / Change links jump to a section
 * - scroll-spy moves the current step as the dealer scrolls
 *
 * Sections must carry `data-section="<index>"` and a focusable `h2`.
 * Call `spy()` inside an `$effect` (it returns the cleanup).
 */
export function createOnePage(w: Wizard, root: () => HTMLElement | undefined) {
	// every section is visible, so any section can be visited (review still
	// needs the earlier ones to be valid)
	w.freeNav = true;
	/** true while we scroll programmatically, so the spy doesn't fight it */
	let steering = false;
	const smooth = () => !prefersReducedMotion.current;

	function scrollToStep(i: number) {
		const main = root();
		const el = main?.querySelector<HTMLElement>(`[data-section="${i}"]`);
		if (!main || !el) return;
		steering = true;
		const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 24;
		main.scrollTo({ top, behavior: smooth() ? 'smooth' : 'auto' });
		setTimeout(() => (steering = false), smooth() ? 700 : 50);
		el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
	}

	return {
		scrollToStep,
		jump(i: number) {
			if (w.goto(i)) scrollToStep(i);
		},
		next() {
			// validates the current section; on the last one it creates the contract.
			// On failure we still scroll so the error summary is in view.
			w.next();
			if (!w.created) scrollToStep(w.index);
		},
		prev() {
			w.prev();
			scrollToStep(w.index);
		},
		/** section crossing the upper third of the scroller becomes current */
		spy() {
			const main = root();
			if (!main) return;
			const io = new IntersectionObserver(
				(entries) => {
					if (steering) return;
					for (const e of entries) {
						if (!e.isIntersecting) continue;
						const i = Number((e.target as HTMLElement).dataset.section);
						if (i !== w.index) w.goto(i);
					}
				},
				{ root: main, rootMargin: '-25% 0px -70% 0px' }
			);
			main.querySelectorAll('[data-section]').forEach((el) => io.observe(el));
			return () => io.disconnect();
		}
	};
}
