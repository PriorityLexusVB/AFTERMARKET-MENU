# Pick2 + Add-Ons Finalize Checklist (No Regression)

TRACKING (must stay true)

- Add-Ons starts closed (iPad/kiosk)
- Only Add-Ons list scrolls (window scroll locked in paper-mode)
- Surface: no horizontal overflow + CTAs visible
- Pick2 tab appears when enabled + eligible items exist

## Phase 1 — Pick2 should NOT require “Publish to A La Carte”

Goal: Admin can set Pick2 Eligible without clicking Publish.

Done when:

- Pick2 items are sourced from `pick2Eligible=true` options even if `isPublished=false`
- Product Hub Pick2 fields are editable without “Publish to A La Carte”
- Toggling Pick2 Eligible ON auto-creates/updates `ala_carte_options` doc with `isPublished=false`

## Phase 2 — Add-Ons drawer scroll

Goal: When open and content overflows, the drawer list scrolls internally.

Done when:

- AddonSelector list is `overflow-y-auto min-h-0 ios-scroll`
- No page/window scrolling in iPad paper-mode
- E2E asserts internal scroll (conditional) + window scrollY stays 0

## Phase 3 — Investment + Select Plan visibility

Goal: Package cards always show Investment and Select Plan in iPad/kiosk + Surface.

Done when:

- E2E asserts “Investment” and “Select Plan” visible
- No clipping under the bottom selection bar

## Admin setup (your desired Pick2 list)

Pick2 should include:

- RustGuard Pro
- ToughGuard Premium
- Interior Leather & Fabric Protection
- Diamond Shield Windshield Protection
- EverNew
- Suntek Film (Standard canonical)

No duplicates rule:

- One record per concept gets Pick2 Eligible ON.
- Any duplicates for same concept must be Pick2 Eligible OFF.

## Verification commands

- npm run build
- npm run test:run
- npm run test:e2e
- npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts
