<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import Menu from '@lucide/svelte/icons/menu';
	import type { Snippet } from 'svelte';

	/**
	 * The dealer-app top bar shared by every concept. The border spans the page,
	 * but the logo and account sit in the same 1168px column as the content +
	 * summary group, so both edges line up with the content below.
	 */
	let {
		class: className = '',
		innerClass = '',
		children,
		compact = false,
		menu = false
	}: {
		class?: string;
		/** override the inner column (e.g. offset by a side rail) */
		innerClass?: string;
		children?: Snippet;
		compact?: boolean;
		/** show a hamburger (phones only) before the logo, like the legacy mobile app bar */
		menu?: boolean;
	} = $props();
</script>

<header class={cn('flex h-14 shrink-0 items-center border-b bg-card', className)}>
	<div class={cn('mx-auto flex w-full max-w-[1168px] items-center gap-4 px-4 sm:px-6', innerClass)}>
	{#if menu}
		<button type="button" class="-ml-1 grid size-10 place-items-center rounded-lg text-foreground/80 hover:bg-muted sm:hidden" aria-label={tr('Menu')}>
			<Menu class="size-5" />
		</button>
	{/if}
	<span class="flex items-center gap-2.5">
		<svg viewBox="0 0 32 32" class="size-7" aria-hidden="true">
			<rect x="2" y="2" width="12" height="12" rx="3" fill="var(--primary)" />
			<rect x="18" y="2" width="12" height="12" rx="3" fill="var(--primary)" opacity=".55" />
			<rect x="2" y="18" width="12" height="12" rx="3" fill="var(--primary)" opacity=".55" />
			<rect x="18" y="18" width="12" height="12" rx="6" fill="var(--brand-accent)" />
		</svg>
		{#if !compact}
			<span class="leading-tight">
				<span class="block text-sm font-semibold">{tr('Insclix Dealer')}</span>
				<span class="block text-[11px] text-muted-foreground">{tr('Toyota Wear Pass Program')}</span>
			</span>
		{/if}
	</span>
	<div class="flex min-w-0 flex-1 items-center justify-end gap-3">
		{@render children?.()}
		<div class="hidden text-right leading-tight md:block">
			<p class="text-xs font-medium">Mark Acme</p>
			<p class="text-[11px] text-muted-foreground">{tr('Oakville Toyota')}</p>
		</div>
		<span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">MA</span>
	</div>
	</div>
</header>
