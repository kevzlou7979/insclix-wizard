<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Progress } from '$lib/components/ui/progress';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Save from '@lucide/svelte/icons/save';
	import CloudCheck from '@lucide/svelte/icons/cloud-check';
	import FilePen from '@lucide/svelte/icons/file-pen';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import FileClock from '@lucide/svelte/icons/file-clock';
	import Banknote from '@lucide/svelte/icons/banknote';
	import { cn } from '$lib/utils';
	import { getWizard, money, productById, DealerHeader, StepBody, StatusIcon, SuccessPanel, SummaryLayout } from '$lib/wizard';
	import type { ProductId, Values } from '$lib/wizard';
	import { tr, locale } from '$lib/i18n/index.svelte';

	/**
	 * Concept 8 — Drawer over contracts.
	 * The dealer stays on the contract lookup table; "New contract" slides a
	 * wide sheet in from the right. Closing it keeps a Draft row with Resume.
	 * Both the list and the sheet keep a summary card right beside the content
	 * (checkout pattern): "This month" on the list, the contract summary in
	 * the sheet (≥1024px; a collapsible summary bar below that).
	 */
	const w = getWizard();

	type Status = 'Active' | 'Draft' | 'Pending' | 'Cancelled';
	type Row = {
		key: string;
		contractNo: string;
		customer: string;
		vehicle: string;
		product: string;
				status: Status;
		/** creation date; `today` rows show "Today" (+ time when `timed`) instead of a date */
		created: Date;
		today?: boolean;
		timed?: boolean;
		price: number;
	};
	type Parked = { key: string; productId: ProductId; values: Values; index: number; maxVisited: number; savedAt: Date };

	// product + status are English keys, translated at render via tr()
	const SEED: Row[] = [
		{ key: 's1', contractNo: 'WP-2026-004811', customer: 'Daniel Okafor', vehicle: '2026 Toyota RAV4 XLE', product: 'Wear Pass', status: 'Active', created: new Date(2026, 8, 28), price: 899 },
		{ key: 's2', contractNo: 'VS-2026-004806', customer: 'Sophie Tremblay', vehicle: '2025 Toyota Camry SE', product: 'Vehicle Service Contract', status: 'Active', created: new Date(2026, 8, 27), price: 2340 },
		{ key: 's3', contractNo: 'GP-2026-004802', customer: 'Arjun Mehta', vehicle: '2026 Toyota Highlander', product: 'GAP Protection', status: 'Pending', created: new Date(2026, 8, 26), price: 1195 },
		{ key: 's4', contractNo: 'TW-2026-004799', customer: 'Emily Chen', vehicle: '2024 Toyota Corolla LE', product: 'Tire & Wheel', status: 'Active', created: new Date(2026, 8, 25), price: 649 },
		{ key: 's5', contractNo: 'WP-2026-004793', customer: 'Marc-André Gagnon', vehicle: '2026 Toyota Sienna XLE', product: 'Wear Pass', status: 'Active', created: new Date(2026, 8, 23), price: 1099 },
		{ key: 's6', contractNo: 'VS-2026-004788', customer: 'Olivia Brooks', vehicle: '2023 Toyota Tacoma TRD', product: 'Vehicle Service Contract', status: 'Cancelled', created: new Date(2026, 8, 20), price: 1890 },
		{ key: 's7', contractNo: 'WP-2026-004781', customer: 'Hassan Al-Sayed', vehicle: '2026 Toyota Prius XSE', product: 'Wear Pass', status: 'Active', created: new Date(2026, 8, 18), price: 699 },
		{ key: 's8', contractNo: 'GP-2026-004774', customer: 'Grace Nakamura', vehicle: '2025 Toyota Tundra SR5', product: 'GAP Protection', status: 'Active', created: new Date(2026, 8, 15), price: 1345 },
		{ key: 's9', contractNo: 'TW-2026-004769', customer: 'Liam O’Connor', vehicle: '2026 Toyota RAV4 Hybrid', product: 'Tire & Wheel', status: 'Pending', created: new Date(2026, 8, 12), price: 549 },
		{ key: 's10', contractNo: 'VS-2026-004760', customer: 'Isabela Santos', vehicle: '2024 Toyota Camry XSE', product: 'Vehicle Service Contract', status: 'Active', created: new Date(2026, 8, 9), price: 2780 }
	];

	const FILTERS = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'Active', label: 'Active' },
		{ value: 'Draft', label: 'Draft' },
		{ value: 'Pending', label: 'Pending' },
		{ value: 'Cancelled', label: 'Cancelled' }
	];

	const DEFAULT_KEYS = ['language', 'condition', 'usage'];

	let open = $state(false);
	let query = $state('');
	let statusFilter = $state('all');
	let createdRows = $state<Row[]>([]);
	let parked = $state<Parked[]>([]);
	let recorded = $state(false);
	let fresh = $state<string | null>(null);
	let body = $state<HTMLElement>();

	const hasData = $derived(
		w.index > 0 ||
			Object.entries(w.values).some(([k, v]) => !DEFAULT_KEYS.includes(k) && v !== '' && v != null && v !== false)
	);
	const time = (d: Date | null) => (d ? d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }) : '');
	const created = (r: Row) =>
		r.today
			? r.timed
				? tr('Today, {time}', { time: time(r.created) })
				: tr('Today')
			: r.created.toLocaleDateString(locale(), { month: 'short', day: 'numeric', year: 'numeric' });
	const monthLabel = $derived(new Date(2026, 8, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }));
	const nextLabel = $derived(w.isLast ? tr('Create contract') : tr('Next: {step}', { step: w.steps[w.index + 1]?.short ?? '' }));

	const liveDraft = $derived<Row | null>(
		hasData && !w.created
			? {
					key: 'live',
					contractNo: '',
					customer: w.customerName,
					vehicle: w.vehicleName,
					product: w.product.name,
					status: 'Draft',
					created: w.savedAt ?? new Date(),
					today: true,
					timed: !!w.savedAt,
					price: w.price
				}
			: null
	);

	function parkedRow(p: Parked): Row {
		const name = [p.values.firstName, p.values.lastName].filter(Boolean).join(' ') || tr('New customer');
		const veh = [p.values.year, p.values.make, p.values.model].filter(Boolean).join(' ') || tr('No vehicle yet');
		const prod = productById(p.productId);
		const price = prod.price(p.values).reduce((s, l) => s + l.amount, 0);
		return { key: p.key, contractNo: '', customer: name, vehicle: veh, product: prod.name, status: 'Draft', created: p.savedAt, today: true, timed: true, price };
	}

	const allRows = $derived<Row[]>([
		...(liveDraft ? [liveDraft] : []),
		...parked.map(parkedRow),
		...createdRows,
		...SEED
	]);

	const rows = $derived(
		allRows.filter((r) => {
			if (statusFilter !== 'all' && r.status !== statusFilter) return false;
			const q = query.trim().toLowerCase();
			if (!q) return true;
			return [r.contractNo, r.customer, r.vehicle, r.product, tr(r.product)].some((x) => x.toLowerCase().includes(q));
		})
	);

	const kpis = $derived.by(() => {
		const active = allRows.filter((r) => r.status === 'Active');
		return [
			{ id: 'active', label: tr('Active contracts'), value: String(active.length), sub: tr('This month'), icon: BadgeCheck, tone: 'bg-success-soft text-success-strong' },
			{ id: 'drafts', label: tr('Drafts to finish'), value: String(allRows.filter((r) => r.status === 'Draft').length), sub: tr('Resume from the table'), icon: FilePen, tone: 'bg-warning-soft text-warning-strong' },
			{ id: 'pending', label: tr('Pending review'), value: String(allRows.filter((r) => r.status === 'Pending').length), sub: tr('Waiting on lender'), icon: FileClock, tone: 'bg-primary-soft text-primary dark:text-accent-foreground' },
			{ id: 'retail', label: tr('Retail this month'), value: money(active.reduce((s, r) => s + r.price, 0)), sub: tr('Active contracts'), icon: Banknote, tone: 'bg-brand-accent-soft text-brand-accent' }
		];
	});

	const STATUSES: Status[] = ['Active', 'Pending', 'Draft', 'Cancelled'];
	const month = $derived.by(() => {
		const active = allRows.filter((r) => r.status === 'Active');
		return {
			counts: STATUSES.map((st) => ({ status: st, n: allRows.filter((r) => r.status === st).length })),
			retail: active.reduce((s, r) => s + r.price, 0),
			avg: active.length ? Math.round(active.reduce((s, r) => s + r.price, 0) / active.length) : 0,
			drafts: allRows.filter((r) => r.status === 'Draft')
		};
	});

	const dot: Record<Status, string> = {
		Active: 'bg-success-strong',
		Pending: 'bg-primary dark:bg-accent-foreground',
		Draft: 'bg-warning',
		Cancelled: 'bg-faint'
	};

	const badge: Record<Status, string> = {
		Active: 'bg-success-soft text-success-strong',
		Draft: 'bg-warning-soft text-warning-strong',
		Pending: 'bg-primary-soft text-primary dark:text-accent-foreground',
		Cancelled: 'bg-muted text-muted-foreground'
	};

	// record a new Active row once per created contract
	$effect(() => {
		if (w.created && !recorded) {
			recorded = true;
			untrack(() => {
				const key = `c-${Date.now()}`;
				createdRows.unshift({
					key,
					contractNo: w.contractNo,
					customer: w.customerName,
					vehicle: w.vehicleName,
					product: w.product.name,
					status: 'Active',
					created: new Date(),
					today: true,
					timed: true,
					price: w.price
				});
				flash(key);
			});
		} else if (!w.created && recorded) {
			recorded = false;
		}
	});

	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	function flash(key: string) {
		fresh = key;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (fresh = null), 2400);
	}

	function snapshot(): Parked {
		return {
			key: `p-${Date.now()}`,
			productId: w.productId,
			values: $state.snapshot(w.values),
			index: w.index,
			maxVisited: w.maxVisited,
			savedAt: w.savedAt ?? new Date()
		};
	}

	function restore(p: Parked) {
		w.reset();
		w.productId = p.productId;
		w.values = { ...p.values };
		w.index = p.index;
		w.maxVisited = p.maxVisited;
		w.savedAt = p.savedAt;
	}

	function startNew() {
		if (w.created) w.reset();
		else if (hasData) {
			parked.unshift(snapshot());
			w.reset();
		}
		open = true;
	}

	function resume(key: string) {
		if (key !== 'live') {
			const p = parked.find((x) => x.key === key);
			if (!p) return;
			parked = parked.filter((x) => x.key !== key);
			if (hasData && !w.created) parked.unshift(snapshot());
			restore(p);
		}
		open = true;
	}

	function onOpenChange(o: boolean) {
		if (o) return;
		if (w.created) {
			w.reset();
		} else if (hasData) {
			w.saveDraft();
			flash('live');
		}
	}

	function go(fn: () => unknown) {
		fn();
		body?.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#snippet monthPanel()}
	<aside aria-label={tr('This month')} class="flex flex-col gap-3">
		<section class="rounded-2xl border bg-card p-5 shadow-soft in-data-[density=compact]:p-4">
			<header class="flex items-center justify-between gap-3">
				<h2 class="text-base font-semibold">{tr('This month')}</h2>
				<span class="text-xs text-muted-foreground">{monthLabel}</span>
			</header>
			<dl class="mt-3 border-t pt-3 text-sm">
				{#each month.counts as c (c.status)}
					<div class="flex items-center justify-between gap-4 py-1.5 in-data-[density=compact]:py-1">
						<dt class="flex items-center gap-2 text-muted-foreground">
							<span class={cn('size-2 rounded-full', dot[c.status])} aria-hidden="true"></span>{tr(c.status)}
						</dt>
						<dd class="font-medium tabular-nums">{c.n}</dd>
					</div>
				{/each}
			</dl>
			<dl class="mt-3 border-t pt-3 text-sm">
				<div class="flex items-baseline justify-between gap-4 py-1">
					<dt class="text-muted-foreground">{tr('Contracts')}</dt>
					<dd class="font-medium tabular-nums">{allRows.length}</dd>
				</div>
				<div class="flex items-baseline justify-between gap-4 py-1">
					<dt class="text-muted-foreground">{tr('Average retail')}</dt>
					<dd class="font-medium tabular-nums">{money(month.avg)}</dd>
				</div>
			</dl>
			<div class="mt-3 flex items-center justify-between gap-3 border-t pt-4">
				<span class="text-sm font-semibold">{tr('Retail total')}</span>
				<span class="flex items-center gap-2 text-lg font-semibold tabular-nums">
					<Banknote class="size-4 text-brand-accent" aria-hidden="true" />{money(month.retail)}
				</span>
			</div>
			<p class="mt-1 text-right text-[11px] text-faint">{tr('Active contracts only')}</p>
		</section>

		<section class="rounded-2xl border bg-card p-5 shadow-soft in-data-[density=compact]:p-4">
			<header class="flex items-center justify-between gap-3">
				<h2 class="text-sm font-semibold">{tr('Drafts to resume')}</h2>
				<span class="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong tabular-nums">{month.drafts.length}</span>
			</header>
			{#if month.drafts.length}
				<ul class="mt-3 border-t pt-2 text-sm">
					{#each month.drafts as d (d.key)}
						<li class="flex items-center justify-between gap-3 py-1.5">
							<span class="min-w-0">
								<span class="block truncate font-medium">{d.customer}</span>
								<span class="block truncate text-xs text-muted-foreground">{tr(d.product)} · {created(d)}</span>
							</span>
							<Button size="sm" variant="outline" class="h-8 shrink-0" onclick={() => resume(d.key)} aria-label={tr('Resume draft for {customer}', { customer: d.customer })}>
								{tr('Resume')}
							</Button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 border-t pt-3 text-sm text-muted-foreground">{tr('No drafts. Closing a contract part-way keeps it here.')}</p>
			{/if}
		</section>
	</aside>
{/snippet}

<div class="flex min-h-dvh flex-col">
	<DealerHeader>
		<nav aria-label={tr('Dealer app')} class="mr-auto ml-6 hidden items-center gap-1 text-sm lg:flex">
			<span class="rounded-lg bg-primary-soft px-3 py-1.5 font-medium text-primary dark:text-accent-foreground">{tr('Contracts')}</span>
			<span class="rounded-lg px-3 py-1.5 text-muted-foreground">{tr('Reports')}</span>
			<span class="rounded-lg px-3 py-1.5 text-muted-foreground">{tr('Remittance')}</span>
		</nav>
	</DealerHeader>

	<main class="flex-1">
		<div class="mx-auto w-full max-w-[1168px] px-4 py-6 sm:px-6 sm:py-8">
			<!-- Page title -->
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 class="text-2xl font-semibold tracking-tight">{tr('Contracts')}</h1>
					<p class="mt-1 text-sm text-muted-foreground">{tr('{dealer} · all protection products', { dealer: tr('Oakville Toyota') })}</p>
				</div>
				<Button class="hidden h-10 gap-1.5 px-4 shadow-soft sm:inline-flex" onclick={startNew}>
					<Plus class="size-4" /> {tr('New contract')}
				</Button>
			</div>

			<SummaryLayout class="mt-6" summary={monthPanel} mobile={false}>
			<!-- KPIs (below lg; the "This month" panel replaces them beside the table) -->
			<div class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:hidden">
				{#each kpis as k (k.id)}
					<div class="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-soft">
						<span class={cn('hidden size-9 shrink-0 place-items-center rounded-lg sm:grid', k.tone)}><k.icon class="size-4" /></span>
						<div class="min-w-0">
							<p class="truncate text-xs text-muted-foreground">{k.label}</p>
							<p class="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">{k.value}</p>
							<p class="truncate text-[11px] text-faint">{k.sub}</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- Table card -->
			<section class="rounded-2xl border bg-card shadow-soft">
				<div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
					<div class="relative flex-1 sm:max-w-sm">
						<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							bind:value={query}
							placeholder={tr('Search contract no., customer or vehicle')}
							aria-label={tr('Search contracts')}
							class="h-10 pl-9"
						/>
					</div>
					<Select.Root type="single" bind:value={statusFilter}>
						<Select.Trigger aria-label={tr('Filter by status')} class="h-10 w-full data-[size=default]:h-10 sm:w-44">
							{tr(FILTERS.find((f) => f.value === statusFilter)?.label)}
						</Select.Trigger>
						<Select.Content>
							{#each FILTERS as f (f.value)}
								<Select.Item value={f.value} label={tr(f.label)} />
							{/each}
						</Select.Content>
					</Select.Root>
					<p class="text-xs text-muted-foreground sm:ml-auto">{tr('{shown} of {total} contracts', { shown: rows.length, total: allRows.length })}</p>
				</div>

				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="pl-4">{tr('Contract no.')}</Table.Head>
							<Table.Head>{tr('Customer')}</Table.Head>
							<Table.Head class="hidden md:table-cell lg:hidden">{tr('Product')}</Table.Head>
							<Table.Head>{tr('Status')}</Table.Head>
							<Table.Head class="hidden xl:table-cell">{tr('Created')}</Table.Head>
							<Table.Head class="hidden text-right sm:table-cell">{tr('Price')}</Table.Head>
							<Table.Head class="pr-4 text-right"><span class="sr-only">{tr('Actions')}</span></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each rows as r (r.key)}
							<Table.Row class={cn('transition-colors duration-700', fresh === r.key && 'bg-primary-soft/60')}>
								<Table.Cell class="pl-4 font-mono text-xs">
									{#if r.contractNo}{r.contractNo}{:else}<span class="font-sans text-faint">{tr('Not issued')}</span>{/if}
								</Table.Cell>
								<Table.Cell class="max-w-[160px] sm:max-w-none lg:max-w-[240px]">
									<p class="truncate font-medium">{r.customer}</p>
									<p class="truncate text-xs text-muted-foreground"><span class="md:hidden lg:inline">{tr(r.product)}<span class="hidden sm:inline">{" · "}</span></span><span class="hidden sm:inline">{r.vehicle}</span></p>
								</Table.Cell>
								<Table.Cell class="hidden md:table-cell lg:hidden">{tr(r.product)}</Table.Cell>
								<Table.Cell>
									<span class={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', badge[r.status])}>{tr(r.status)}</span>
								</Table.Cell>
								<Table.Cell class="hidden text-muted-foreground xl:table-cell">{created(r)}</Table.Cell>
								<Table.Cell class="hidden text-right font-medium tabular-nums sm:table-cell">{r.price ? money(r.price) : '—'}</Table.Cell>
								<Table.Cell class="pr-4 text-right">
									{#if r.status === 'Draft'}
										<Button size="sm" variant="outline" class="h-9 gap-1 sm:h-7" onclick={() => resume(r.key)} aria-label={tr('Resume draft for {customer}', { customer: r.customer })}>
											{tr('Resume')}
										</Button>
									{:else}
										<Button size="sm" variant="ghost" class="h-9 text-muted-foreground sm:h-7" aria-label={tr('View {contract}', { contract: r.contractNo })}>
											{tr('View')}
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row class="hover:bg-transparent">
								<Table.Cell colspan={7} class="py-12 text-center text-sm text-muted-foreground">
									{tr('No contracts match. Clear the search or pick another status.')}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</section>
			</SummaryLayout>
		</div>
	</main>

	<!-- phones: thumb-zone primary action -->
	<div class="pb-safe sticky bottom-0 border-t bg-card/95 px-4 pt-3 backdrop-blur sm:hidden">
		<Button class="h-11 w-full gap-1.5" onclick={startNew}><Plus class="size-4" /> {tr('New contract')}</Button>
	</div>
</div>

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content
		side="right"
		class="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[1040px]"
	>
		<!-- Sheet header -->
		<Sheet.Header class="gap-0 border-b px-5 pt-4 pb-3 pr-14 sm:px-6">
			<Sheet.Title class="text-lg font-semibold tracking-tight">
				{w.created ? tr('Contract created') : hasData ? w.customerName : tr('New contract')}
			</Sheet.Title>
			<Sheet.Description class="flex flex-wrap items-center gap-x-2 text-xs">
				<span>{w.product.name}</span>
				<span aria-hidden="true">·</span>
				<span class="font-mono">{w.contractNo}</span>
				{#if w.savedAt && !w.created}
					<span class="flex items-center gap-1 text-success-strong"><CloudCheck class="size-3.5" /> {tr('Saved {time}', { time: time(w.savedAt) })}</span>
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		{#if w.created}
			<div class="flex-1 overflow-y-auto"><SuccessPanel /></div>
		{:else}
			<!-- Compact stepper -->
			<nav aria-label={tr('Contract steps')} class="shrink-0 border-b bg-muted/30 px-5 py-2.5 sm:px-6">
				<ol class="hidden items-center gap-1.5 sm:flex">
					{#each w.steps as s, i (s.id)}
						{@const st = w.status(i)}
						<li class={cn('flex items-center gap-1.5', i === w.index && 'min-w-0')}>
							<button
								type="button"
								onclick={() => go(() => w.goto(i))}
								disabled={st === 'locked'}
								aria-label={tr('Step {n}: {title}', { n: i + 1, title: s.title })}
								aria-current={i === w.index ? 'step' : undefined}
								class="flex items-center gap-2 rounded-full disabled:cursor-not-allowed"
							>
								<StatusIcon status={st} n={i + 1} class="size-6 text-[11px]" />
								{#if i === w.index}<span class="truncate text-sm font-semibold">{s.short}</span>{/if}
							</button>
							{#if i < w.steps.length - 1}
								<span class={cn('h-px w-5', i < w.index ? 'bg-primary' : 'bg-border')}></span>
							{/if}
						</li>
					{/each}
				</ol>
				<div class="flex flex-col gap-1.5 sm:hidden">
					<p class="text-sm"><span class="text-muted-foreground">{tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} ·</span> <span class="font-semibold">{w.current.short}</span></p>
					<Progress value={((w.index + 1) / w.total) * 100} aria-label={tr('Step {n} of {total}', { n: w.index + 1, total: w.total })} class="h-1.5" />
				</div>
			</nav>

			<!-- Body -->
			<div bind:this={body} class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
				<SummaryLayout sticky="top-4">
					<div>
						<h2 class="text-base font-semibold">{w.current.title}</h2>
						<p class="mt-0.5 mb-5 text-sm text-muted-foreground">{w.current.description}</p>
						<StepBody />
					</div>
				</SummaryLayout>
			</div>

			<!-- Sticky footer -->
			<div class="pb-safe shrink-0 border-t bg-card px-5 pt-3 sm:px-6">
				<div class="flex items-center gap-2">
					<Sheet.Close>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" class="h-11 gap-1.5 sm:h-9" aria-label={tr('Save and close')}>
								<Save class="size-4" /><span class="hidden sm:inline">{tr('Save and close')}</span>
							</Button>
						{/snippet}
					</Sheet.Close>
					<span class="flex-1"></span>
					{#if w.priceLines.length && w.price}
						<span class="mr-1 hidden text-sm font-semibold tabular-nums md:inline lg:hidden">{money(w.price)}</span>
					{/if}
					<Button variant="outline" class="h-11 gap-1 sm:h-9" disabled={w.isFirst} onclick={() => go(() => w.prev())} aria-label={tr('Back')}>
						<ChevronLeft class="size-4" /><span class="hidden sm:inline">{tr('Back')}</span>
					</Button>
					<Button class="h-11 gap-1 px-4 sm:h-9" onclick={() => go(() => w.next())}>
						{nextLabel}
						{#if !w.isLast}<ChevronRight class="size-4" />{/if}
					</Button>
				</div>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
