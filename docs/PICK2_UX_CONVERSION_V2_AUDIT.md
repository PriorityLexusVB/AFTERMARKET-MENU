# Pick2 UX Conversion V2 Audit

## Baseline
- Branch: feat/pick2-ux-conversion-v2
- BASELINE_SHA: e6da7795d57c1bcb5d544df6cd87c207b816a908

## What changed
- Refined Pick2 header and progress copy to match premium, compact guidance.
- Added two-slot selected row with explicit empty prompts and swap reassurance.
- Adjusted Pick2 card CTAs and price subline to keep selection intent clear.
- Updated Pick2 e2e assertions to match new copy and third-tap swap message.

## Files changed
- src/components/Pick2Selector.tsx
- src/components/AddonItem.tsx
- e2e/pick2-flow.spec.ts
- docs/PICK2_UX_OPTIMIZATION.md
- docs/PICK2_UX_CONVERSION_V2_AUDIT.md

## Commands executed
### Baseline gates
- npm ci (after clearing esbuild lock)
- npm run build
- npm run test:run
- npm run test:e2e
- npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts

### Full gates
- npm run build
- npm run test:run
- npm run test:e2e
- npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts

## Guardrails checklist
- iPad paper-mode / kiosk: no window scroll, internal list scroll only. Confirmed via e2e.
- Add-Ons drawer starts closed on iPad/kiosk; only drawer list scrolls; handle visible. Confirmed via e2e.
- Package cards: Investment + Select Plan visible on iPad + Surface. Confirmed via e2e.
- Surface-ish: no horizontal overflow; CTAs visible. Confirmed via e2e.
- Drawer open/close logic, routes/params, selectors preserved. No changes outside Pick2 UI + tests.

## Data gate verification (dev)
### app_config/pick2
- enabled: true
- price: 995
- title: You Pick 2
- subtitle: Choose any 2 featured add-ons for one price
- maxSelections: 2

### pick2Eligible list (doc id, name, pick2Sort)
- oIDJdmvYBwrHUUWLYo09	Suntek Pro Standard Package	10
- 6fL23lOJ6srBvKE9Y88h	Suntek Pro Complete Package	20
- Q92L4LchngptEzgmPaHl	EverNew Appearance Protection	30
- dDHf8LW8zS1Tgxh9IDGW	Diamond Shield Windshield Protection	40
- bqjcNJZNsLbVutMi98xj	Headlights Protection	50
- nlaltSWwBwKImm7nxu57	Door Cups Only	60
- 8DdlEy86X8ObgPUcf4aj	Interior Leather & Fabric Protection	70
- 5P53Z99UEYZ5uGHzG3hw	RustGuard Pro	80
- TyLhgUdlOc7oQiYujwxX	ToughGuard Premium	90

## Skipped changes
- None.
