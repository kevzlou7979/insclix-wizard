# Insclix Dealer — wizard concepts brief

Prototype dealer app for Core systems (e.g. Toyota Wear Pass dealers). Dealers create protection
contracts through a page wizard whose steps depend on the product. v1 has no quoting. The rest of
the app is contract lookup and reporting. Goal: 10 wizard concepts on one shared engine so the team
can compare layouts with the same data, then pick a structure for the new Insclix Design System.

## Stack
SvelteKit 2 + Svelte 5 runes, Tailwind v4, shadcn-svelte (bits-ui v2) in `src/lib/components/ui/*`,
lucide icons (`@lucide/svelte/icons/<name>`). Insclix tokens in `src/routes/layout.css`
(primary #00447c, Poppins, soft shadows `shadow-soft`/`shadow-lift`, extra colours:
`bg-primary-soft`, `text-success-strong`, `bg-success-soft`, `bg-warning-soft`, `text-warning-strong`,
`bg-danger-soft`, `text-faint`, `bg-brand-accent-soft`, `text-brand-accent`). Dark mode = `.dark` on
<html>. Density: `data-density="compact"` wraps the concept; use `in-data-[density=compact]:` variants.

## Shared engine — `$lib/wizard` (do not change its API)
`const w = getWizard()` (context is set by the preview route). Reactive fields/getters:
- `w.product`, `w.productId`, `w.steps: StepDef[]`, `w.current`, `w.index`, `w.total`, `w.isFirst`, `w.isLast`,
  `w.progress` (0-100), `w.values`, `w.errors`, `w.priceLines`, `w.price`, `w.contractNo`,
  `w.customerName`, `w.vehicleName`, `w.savedAt`, `w.created`, `w.errorTick`, `w.maxVisited`
- methods: `w.next()` (validates current step, returns false + shows errors if invalid; on the last
  step it submits), `w.prev()`, `w.goto(i)` (refuses locked steps), `w.gotoStepId(id)`, `w.canGoto(i)`,
  `w.status(i)` → 'complete'|'current'|'error'|'upcoming'|'locked', `w.validateStep(i)`,
  `w.isStepValid(i)` (quiet), `w.visibleFields(step)`, `w.answers(step)` → [{id,label,value}],
  `w.set(id, v)`, `w.touch(id)`, `w.setProduct(id)`, `w.saveDraft()`, `w.submit()`, `w.fillDemo()`, `w.reset()`
- StepDef: `{ id, title (verb+noun), short, description, icon (component), kind: 'product'|'fields'|'review', fields?, groups? }`

Components (all read the wizard from context):
- `<StepBody step? narrow? layout? grouped? onedit? />` — full content of a step incl. error summary,
  product picker, field grid or review list. Easiest building block.
- `<StepFields step columns={1|6} layout grouped />`, `<Field field layout />` — lower level.
- `<ProductPicker variant="cards"|"list" />`, `<ReviewList dense onedit />`, `<SummaryCard compact />`,
  `<ErrorSummary stepIndex />`, `<SuccessPanel />` (show when `w.created`), `<StatusIcon status n />`,
  `<DealerHeader compact>{children}</DealerHeader>` (app top bar).
- `PRODUCTS`, `money()` from `$lib/wizard`.

## Rules every concept follows
See `RULES` in `src/lib/concepts/registry.ts`. In short: verb+noun step names; product first; validate
on blur and on Next; error summary; labels above fields; VIN decode; autosave; review with Change links;
final button "Create contract"; no forward-jumping into locked steps; 44px+ touch targets and a sticky
thumb-zone CTA on phones; no horizontal stepper on phones.

## Concept files
Each concept is ONE self-contained Svelte component in `src/lib/concepts/CNN*.svelte`, no props,
filling the viewport (`h-dvh` / `min-h-dvh`). It must work at 390px, 820px and 1440px (the gallery
iframes it at those widths), in light + dark, comfortable + compact. `C01HorizontalStepper.svelte`
is the reference implementation — copy its patterns.
