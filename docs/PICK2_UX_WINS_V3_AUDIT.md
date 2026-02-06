# Pick2 UX Wins V3 Audit

## Summary
- Goal: Implement Pick2 UX wins v3 (savings summary, sticky footer, presets, trust chips), extend Pick2 config schema, and update ProductHub editor while preserving guardrails.
- Branch: feat/pick2-ux-wins-v3
- Baseline SHA: 3fa68022d7a7edaf2c3d3f9045b25faf9d27c0dc

## Wins Implemented (A-E)
- A: Savings summary block shows when 2 selections are active.
- B: Sticky footer with Done/Clear actions and incomplete selection guidance.
- C: Recommended presets support with buttons (configured or fallback defaults).
- D: Trust chips on Pick2 add-ons when warranty/service cues exist.
- E: Micro-polish: copy, spacing, and responsiveness adjustments for Pick2.

## Schema + Admin Updates
- Pick2 config extended with optional recommendedPairs for presets.
- ProductHub editor supports editing recommended pairs and eligible options.

## Guardrails Verified
- Paper mode prevents window scroll; Pick2 list scrolls internally.
- Add-Ons drawer stays closed by default; package footer remains visible.
- Surface/iPad viewports avoid horizontal overflow and clipping.
- Pick2 selection logic unchanged (max selections, swap behavior).

## SAFE Firestore Verification
- Config (dev project): enabled true, price 995, title "You Pick 2", subtitle "Choose any 2 featured add-ons for one price", maxSelections 2.
- Eligible list (9 items):
  - Suntek Pro Standard (10)
  - Suntek Pro Complete (20)
  - EverNew Appearance Protection (30)
  - Diamond Shield Windshield Protection (40)
  - Headlights Protection (50)
  - Door Cups Only (60)
  - Interior Leather & Fabric Protection (70)
  - RustGuard Pro (80)
  - ToughGuard Premium (90)
- Missing: none; Extra: none.

## Presets (Recommended Pairs)
- Best Protection: Suntek Pro Standard Package + Diamond Shield Windshield Protection
- Resale Focus: EverNew Appearance Protection + Interior Leather & Fabric Protection
- Visibility + Daily Wear: Headlights Protection + Door Cups Only
- Coastal Defense: RustGuard Pro + ToughGuard Premium
- Storage status: falls back to defaults when config is missing; ProductHub saves to config when provided.

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
- src/types.ts
- src/schemas.ts
- src/mock.ts
- e2e/pick2-flow.spec.ts
- docs/PICK2_UX_OPTIMIZATION.md

## Skipped Items
- None.

## Manual Smoke Checks
- Pick2: select 2, verify savings block and done/clear behavior.
- Presets appear when configured and apply selections correctly.
- Paper mode: window scroll locked; list scrolls internally.
- Surface/iPad fit: no horizontal overflow, CTAs visible.
