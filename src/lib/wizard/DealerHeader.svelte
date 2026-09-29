<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	/** The dealer-app top bar shared by every concept. */
	let {
		class: className = '',
		children,
		compact = false
	}: { class?: string; children?: Snippet; compact?: boolean } = $props();
</script>

<header class={cn('flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 sm:px-6', className)}>
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
</header>
