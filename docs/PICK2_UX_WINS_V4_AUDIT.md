# Pick2 UX Wins V4 Audit

## Summary
- Goal: Implement Pick2 wins v4 (featured preset highlight, thumbnails, info panel, telemetry) while preserving guardrails.
- Branch: feat/pick2-ux-wins-v4
- Baseline SHA: 13ebc56737807fa67da7ca602060e6602915c3ad

## Wins Implemented (F-I)
- F: Featured preset highlight and preset ordering (config-driven).
- G: Pick2 thumbnails (fixed-size) when thumbnailUrl exists.
- H: Compact “Why this matters” info panel in Pick2 header.
- I: Pick2 telemetry logging (flagged; off by default).

## Guardrails Confirmed
- Paper mode prevents window scroll; Pick2 list scrolls internally.
- Add-Ons drawer stays closed by default; package footer remains visible.
- Surface/iPad viewports avoid horizontal overflow and clipping.
- Pick2 selection logic unchanged (max selections, swap behavior).

## SAFE Firestore Verification
- Config (dev project): enabled true, price 995, maxSelections 2.
- Eligible list (9 items):
  - Suntek Pro Standard Package (10)
  - Suntek Pro Complete Package (20)
  - EverNew Appearance Protection (30)
  - Diamond Shield Windshield Protection (40)
  - Headlights Protection (50)
  - Door Cups Only (60)
  - Interior Leather & Fabric Protection (70)
  - RustGuard Pro (80)
  - ToughGuard Premium (90)
- Missing: none; Extra: none.

## Telemetry Safety
- Telemetry is off by default and guarded by config.
- Writes are best-effort and never block the UI.

## Gates Run
- npm run build (pass; demo mode warnings only)
- npm run test:run (pass)
- npm run test:e2e (pass)
- npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts (pass)

## Files Touched (Key)
- src/components/Pick2Selector.tsx
- src/components/AddonItem.tsx
- src/components/ProductHub.tsx
- src/App.tsx
- src/utils/telemetry.ts
- src/types.ts
- src/schemas.ts
- src/mock.ts
- e2e/pick2-flow.spec.ts
- docs/PICK2_UX_OPTIMIZATION.md

## Manual Smoke Checks
- Featured preset badge renders and preset order matches configuration.
- Pick2 thumbnails render when thumbnailUrl exists.
- Info panel toggles without window scroll.
- Pick2 flow (select 2, block 3rd, swap) remains intact.
