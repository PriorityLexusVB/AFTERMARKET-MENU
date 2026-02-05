# Pick2 + Add-Ons Layout Fix (iPad/Surface guardrails)

## Required flex + scroll pattern

Use a locked, no-scroll page with internal scrolling only in the list regions.

- Paper-mode relies on `--ipad-header-h` and `--ipad-bottom-bar-h` (measured from the header and selection bar) to size the no-scroll container.

### Add-Ons drawer (PackageSelector + AddonSelector)

- Parent drawer container must fill available height:
  - `h-full min-h-0 flex flex-col` on the drawer container in PackageSelector.
- AddonSelector structure:
  - `flex flex-col h-full` on the root.
  - Sticky header at the top.
  - Scrollable list below with `flex-1 min-h-0 overflow-y-auto`.

### Pick2 selector

- Mirror the Add-Ons pattern:
  - Sticky header at the top.
  - Scrollable list with `flex-1 min-h-0 overflow-y-auto`.
  - Container must fill available height in the no-scroll layout.

## Package card footer visibility

- Card root should be `flex flex-col h-full`.
- Feature list area must scroll internally with `overflow-y-auto` and `min-h-0`.
- Footer should use `mt-auto` so "Investment" and "Select Plan" stay visible.

## Tests

Run:

- `npm run build`
- `npm run test:run`
- `npm run test:e2e`

Targeted guardrails:

- `npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts`

Guardrails covered in:

- `e2e/ipad-fit.spec.ts`
- `e2e/surface-pro-fit.spec.ts`
- `e2e/pick2-flow.spec.ts`

## Tips for future changes

- Avoid `overflow-hidden` on parent containers that need to allow internal list scrolling.
- Preserve `min-h-0` on flex children so scroll areas can shrink.
- Validate on iPad and Surface Pro viewports before shipping.
