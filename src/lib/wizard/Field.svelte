<script lang="ts">
	import { tr, locale } from '$lib/i18n/index.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Button } from '$lib/components/ui/button';
	import ScanLine from '@lucide/svelte/icons/scan-line';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { cn } from '$lib/utils';
	import { getWizard } from './wizard.svelte';
	import { SAMPLE_ADDRESSES, SAMPLE_VIN } from './products';
	import type { FieldDef } from './types';

	let {
		field,
		layout = 'stacked',
		class: className = ''
	}: {
		field: FieldDef;
		/** stacked = label on top (recommended); inline = label left (legacy) */
		layout?: 'stacked' | 'inline';
		class?: string;
	} = $props();

	const w = getWizard();
	const id = $derived(`f-${field.id}`);
	const err = $derived(w.errors[field.id]);
	const value = $derived(w.values[field.id]);
	/** 44px on touch screens (RULES: 44px+ targets); 40px with a mouse; 32px compact */
	const control =
		'h-10 pointer-coarse:h-11 in-data-[density=compact]:h-8 text-[15px] in-data-[density=compact]:text-sm bg-card';

	// a11y: every control points at its visible error or help text
	const helpShown = $derived(!err && !!field.help && !(field.type === 'vin' && w.vinDecoded));
	const describedBy = $derived(err ? `${id}-err` : helpShown ? `${id}-help` : undefined);
	const required = $derived(field.required ? true : undefined);

	// address lookup (the legacy inline layout adds a Lookup on/off switch)
	let lookup = $state(true);
	let addrOpen = $state(false);
	let addrActive = $state(-1);
	const addrMatches = $derived(
		String(value ?? '').length < 2
			? []
			: SAMPLE_ADDRESSES.filter((a) =>
					(a.line1 + ' ' + a.city).toLowerCase().includes(String(value).toLowerCase())
				).slice(0, 4)
	);
	function pickAddress(a: (typeof SAMPLE_ADDRESSES)[number]) {
		w.set('address1', a.line1);
		w.set('city', a.city);
		w.set('province', a.province);
		w.set('postal', a.postal);
		addrOpen = false;
		addrActive = -1;
		for (const k of ['address1', 'city', 'province', 'postal']) w.touch(k);
	}

	const selectedLabel = $derived(field.options?.find((o) => o.value === value)?.label);

	/** combobox keyboard support: arrows move, Enter picks, Escape closes */
	function addrKey(e: KeyboardEvent) {
		const n = addrMatches.length;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			if (!n) return;
			e.preventDefault();
			addrOpen = true;
			addrActive = e.key === 'ArrowDown' ? (addrActive + 1) % n : (addrActive - 1 + n) % n;
		} else if (e.key === 'Enter' && addrOpen && addrActive >= 0 && addrMatches[addrActive]) {
			e.preventDefault();
			pickAddress(addrMatches[addrActive]);
		} else if (e.key === 'Escape' && addrOpen) {
			e.preventDefault();
			addrOpen = false;
			addrActive = -1;
		}
	}
</script>

<div
	class={cn(
		'group/field min-w-0',
		layout === 'inline' ? 'grid gap-x-6 gap-y-1 sm:grid-cols-[180px_1fr] sm:items-start' : 'flex flex-col gap-1.5',
		className
	)}
	data-field={field.id}
	data-span={field.span ?? 6}
>
	{#if field.type === 'switch'}
		<div class="flex items-center justify-between gap-4 rounded-lg border bg-card px-3 py-2.5 sm:col-span-2">
			<div class="min-w-0">
				<Label for={id} class="text-sm font-medium">{field.label}</Label>
				{#if field.help}<p id={`${id}-help`} class="text-xs text-muted-foreground">{field.help}</p>{/if}
			</div>
			<Switch
				{id}
				checked={!!value}
				onCheckedChange={(c) => w.set(field.id, c)}
				aria-describedby={field.help ? `${id}-help` : undefined}
			/>
		</div>
	{:else}
		<Label
			for={field.type === 'segmented' ? undefined : id}
			id={`${id}-label`}
			class={cn('text-sm font-medium text-foreground/90', layout === 'inline' && 'sm:pt-2.5')}
		>
			<span>{field.label}{#if field.required}<span class="text-primary" aria-hidden="true">*</span>{/if}</span>
		</Label>

		<div class="flex min-w-0 flex-col gap-1.5">
			{#if field.type === 'select'}
				<Select.Root
					type="single"
					value={value ?? ''}
					onValueChange={(v) => {
						w.set(field.id, v);
						w.touch(field.id);
					}}
				>
					<Select.Trigger {id} aria-invalid={!!err} aria-describedby={describedBy} aria-required={required} class={cn(control, 'w-full data-[size=default]:h-10 in-data-[density=compact]:data-[size=default]:h-8')}>
						<span class={cn(!selectedLabel && 'text-muted-foreground')}>{selectedLabel ?? tr('Select {x}', { x: field.label.toLowerCase() })}</span>
					</Select.Trigger>
					<Select.Content class="max-h-72">
						{#each field.options ?? [] as o (o.value)}
							<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{:else if field.type === 'segmented'}
				<ToggleGroup.Root
					type="single"
					variant="outline"
					value={value ?? ''}
					onValueChange={(v) => {
						if (v) w.set(field.id, v);
					}}
					{id}
					aria-invalid={!!err}
					aria-labelledby={`${id}-label`}
					aria-describedby={describedBy}
					class={cn('flex w-full flex-wrap justify-start', err && 'rounded-lg ring-2 ring-destructive/30')}
				>
					{#each field.options ?? [] as o (o.value)}
						<ToggleGroup.Item
							value={o.value}
							class="h-auto min-h-10 flex-1 flex-col pointer-coarse:min-h-11 gap-0 bg-card first:rounded-l-lg last:rounded-r-lg px-3 py-1.5 text-sm in-data-[density=compact]:min-h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
						>
							<span class="font-medium">{o.label}</span>
							{#if o.hint}<span class="text-[11px] opacity-75">{o.hint}</span>{/if}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			{:else if field.type === 'textarea'}
				<Textarea
					{id}
					value={value ?? ''}
					oninput={(e) => w.set(field.id, e.currentTarget.value)}
					onblur={() => w.touch(field.id)}
					aria-invalid={!!err}
					aria-describedby={describedBy}
					aria-required={required}
					rows={3}
					class="bg-card"
				/>
			{:else if field.type === 'vin'}
				<div class="flex gap-2">
					<Input
						{id}
						value={value ?? ''}
						oninput={(e) => w.set(field.id, e.currentTarget.value.toUpperCase())}
						onblur={() => w.touch(field.id)}
						aria-invalid={!!err}
						aria-describedby={[describedBy, w.vinDecoded && !err ? `${id}-decoded` : ''].filter(Boolean).join(' ') || undefined}
						aria-required={required}
						placeholder={field.placeholder}
						maxlength={17}
						autocapitalize="characters"
						autocomplete="off"
						spellcheck={false}
						class={cn(control, 'font-mono tracking-wider uppercase')}
					/>
					<Button
						type="button"
						variant="outline"
						class="h-10 shrink-0 gap-1.5 pointer-coarse:h-11 in-data-[density=compact]:h-8"
						onclick={() => {
							w.set('vin', SAMPLE_VIN);
							w.touch('vin');
						}}
					>
						<ScanLine class="size-4" /> {tr('Scan')}
					</Button>
				</div>
				<div aria-live="polite">
					{#if w.vinDecoded && !err}
						<p id={`${id}-decoded`} class="flex items-center gap-1.5 text-xs font-medium text-success-strong">
							<CircleCheck class="size-3.5" aria-hidden="true" /> {tr('Decoded: {vehicle}', { vehicle: [w.values.year, w.values.make, w.values.model, w.values.trim].filter(Boolean).join(' ') })}
						</p>
					{/if}
				</div>
			{:else if field.type === 'address'}
				<div class="flex items-center gap-4">
				<div class="relative min-w-0 flex-1">
					{#if lookup}<MapPin class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />{/if}
					<Input
						{id}
						value={value ?? ''}
						oninput={(e) => {
							w.set(field.id, e.currentTarget.value);
							addrOpen = lookup;
							addrActive = -1;
						}}
						onkeydown={addrKey}
						onblur={() => setTimeout(() => ((addrOpen = false), (addrActive = -1), w.touch(field.id)), 150)}
						aria-invalid={!!err}
						aria-describedby={describedBy}
						aria-required={required}
						autocomplete="off"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={addrOpen && addrMatches.length > 0}
						aria-controls={`${id}-list`}
						aria-activedescendant={addrOpen && addrActive >= 0 ? `${id}-opt-${addrActive}` : undefined}
						placeholder={lookup ? tr('Start typing an address') : ''}
						class={cn(control, lookup && 'pl-9')}
					/>
					{#if addrOpen && addrMatches.length}
						<ul
							id={`${id}-list`}
							role="listbox"
							aria-label={tr('Matching addresses')}
							class="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover p-1 shadow-lift"
						>
							{#each addrMatches as a, i (a.line1)}
								<!-- keyboard is handled on the combobox input (aria-activedescendant) -->
								<li
									id={`${id}-opt-${i}`}
									role="option"
									aria-selected={i === addrActive}
									class={cn(
										'flex min-h-11 w-full cursor-pointer flex-col items-start justify-center rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted',
										i === addrActive && 'bg-muted'
									)}
									onmousedown={(e) => e.preventDefault()}
									onclick={() => pickAddress(a)}
									onkeydown={addrKey}
								>
									<span class="font-medium">{a.line1}</span>
									<span class="text-xs text-muted-foreground">{a.city}, {a.province} {a.postal}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				{#if layout === 'inline'}
					<label class="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
						<Switch checked={lookup} onCheckedChange={(c) => ((lookup = c), (addrOpen = false))} aria-label={tr('Address lookup')} />
						{tr('Lookup')}
					</label>
				{/if}
				</div>
			{:else}
				<Input
					{id}
					type={field.type === 'money' || field.type === 'number' ? 'text' : field.type === 'postal' ? 'text' : field.type}
					value={value ?? ''}
					oninput={(e) => {
						let v = e.currentTarget.value;
						if (field.type === 'postal') v = v.toUpperCase();
						w.set(field.id, v);
					}}
					onblur={() => w.touch(field.id)}
					aria-invalid={!!err}
					aria-describedby={describedBy}
					aria-required={required}
					autocomplete={field.autocomplete}
					inputmode={field.inputmode ?? (field.type === 'money' || field.type === 'number' ? 'decimal' : undefined)}
					placeholder={field.placeholder}
					autocapitalize={field.type === 'email' || field.type === 'postal' ? 'off' : undefined}
					class={cn(control, field.type === 'money' && 'tabular-nums')}
				/>
			{/if}

			{#if err}
				<p id={`${id}-err`} class="flex items-center gap-1.5 text-xs font-medium text-destructive">
					<CircleAlert class="size-3.5 shrink-0" aria-hidden="true" />{err}
				</p>
			{:else if helpShown}
				<p id={`${id}-help`} class="text-xs text-muted-foreground">{field.help}</p>
			{/if}
		</div>
	{/if}
</div>
