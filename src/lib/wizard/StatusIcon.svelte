<script lang="ts">
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import Lock from '@lucide/svelte/icons/lock';
	import type { StepStatus } from './types';

	let { status, n, class: className = '' }: { status: StepStatus; n: number; class?: string } = $props();
</script>

<span
	aria-hidden="true"
	class={cn(
		'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
		status === 'complete' && 'bg-primary text-primary-foreground',
		status === 'current' && 'bg-primary-soft text-primary ring-2 ring-primary dark:text-accent-foreground',
		status === 'error' && 'bg-destructive text-white',
		status === 'upcoming' && 'bg-muted text-muted-foreground ring-1 ring-border',
		status === 'locked' && 'bg-muted text-faint',
		className
	)}
>
	{#if status === 'complete'}<Check class="size-3.5" />{:else if status === 'error'}!{:else if status === 'locked'}<Lock class="size-3" />{:else}{n}{/if}
</span>
