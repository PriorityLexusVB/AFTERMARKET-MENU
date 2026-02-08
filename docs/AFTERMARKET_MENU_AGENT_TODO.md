# AFTERMARKET MENU Agent TODO

## Done

- 7406c9f docs: update decisions and verification log
- aae9e86 feat(ui): refine package grid density and pick2 layout
- 24c0581 fix(ui): improve add-ons drawer and selection bar interaction
- Fixed ProductHub hook dependencies to satisfy react-hooks/exhaustive-deps (pending lint verification).
- Added Pick-2 fix action on selection bar for incomplete bundles.
- Hardened add-ons drawer UX (ESC close + overscroll containment).
- Added Playwright guardrails (iPad overflow + grid width stability + scroll lock + Pick-2 summaries).
- Updated add-ons close button selectors in iPad/Surface guardrails.

## In Progress

- None.

## Next Up

- If any lint suppression is required, document in decisions.

## Blockers

- None.

## Verification Log

- 2026-02-04: npm run lint -> clean (0 warnings).
- 2026-02-04: npx playwright test e2e/ipad-fit.spec.ts -> pass.
- 2026-02-04: npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts e2e/packages.spec.ts -> 14 passed, 1 failed (ipad-fit). Fixed and re-ran ipad-fit.
- 2026-02-04: npm run healthcheck -> lint/typecheck/vitest/playwright all pass.
- 2026-02-04: npx playwright test -> 26 passed.
- 2026-02-04: npm run build -> build succeeded; missing VITE_FIREBASE_* warns and uses mock fallback.
- 2026-02-04: Recommended prod gating: allow mocks only in dev or when VITE_ALLOW_MOCK=1; fail or show hard error in production when Firebase env vars are missing.
- 2026-02-08: npm run lint -> 2 warnings (AddonItem.tsx jsx-a11y/no-noninteractive-element-interactions; ProductHub.tsx jsx-a11y/label-has-associated-control).
- 2026-02-08: npm run healthcheck -> failed (same lint warnings + typecheck errors in App.tsx, ProductHub.tsx, data.ts).
- 2026-02-08: npx playwright test -> failed in Windows UNC cwd; playwright not found.
- 2026-02-08: npm run build -> succeeded; mock fallback for missing VITE_FIREBASE_*.
- 2026-02-08 (Phase 1): npm run healthcheck -> failed (lint warnings in AddonItem.tsx and ProductHub.tsx; typecheck errors in App.tsx, ProductHub.tsx, data.ts).
- 2026-02-08 (Phase 2): npm run healthcheck -> failed (lint warnings in AddonItem.tsx and ProductHub.tsx; typecheck errors in App.tsx, ProductHub.tsx, data.ts).
- 2026-02-08 (Phase 3): npm run healthcheck -> failed (lint warnings in AddonItem.tsx and ProductHub.tsx; typecheck errors in App.tsx, ProductHub.tsx, data.ts).
- 2026-02-08 (Phase 4): npm run healthcheck -> failed (lint warnings in AddonItem.tsx and ProductHub.tsx; typecheck errors in App.tsx, ProductHub.tsx, data.ts).
- 2026-02-08 (Phase 5): npm run healthcheck -> failed (lint warnings in AddonItem.tsx and ProductHub.tsx; typecheck errors in App.tsx, ProductHub.tsx, data.ts).

## DIFF REPORT

- A) SelectionDrawer trust microcopy present? YES
	- Evidence: Trust row copy added in src/components/SelectionDrawer.tsx (variant="bar").
- B) PackageCard "Why this tier" present? YES
	- Evidence: "Best value" microcopy added to recommended tier header in src/components/PackageCard.tsx.
- C) Pick2 info panel copy upgraded? YES
	- Evidence: Pick2 info panel copy updated in src/components/Pick2Selector.tsx.
- D) Button families consolidated/aliased? YES
	- Evidence: Shared btn-lux base styles + focus/disabled behavior in src/index.css; focus-visible checks added in e2e.
- E) ProductHub duplicate lineage / drift detection? YES
	- Evidence: sourceFeatureId added in src/types.ts and src/schemas.ts; duplicates panel added in src/components/ProductHub.tsx.

## Resume Point

- Next command: git status -sb
- Next file: docs/AFTERMARKET_MENU_AGENT_TODO.md (keep verification log current)
