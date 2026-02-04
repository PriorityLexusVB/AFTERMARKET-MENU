# AFTERMARKET MENU Agent TODO

## ✅ Done

- Created agent tracking docs (this file), viewport contracts, and decisions docs.
- Added npm healthcheck script.
- Baseline verification run (see Verification Log).
- Phase 1 (partial): Added density tokens, compact grid min-width, and capped package feature lists.
- Phase 2 (partial): Implemented overlay add-ons drawer side sheet for iPad layout.
- Phase 3 (partial): Added Pick-2 two-slot UI and summary surfaces.

## 🟡 In Progress

- Phase 1: 3-column legibility + card scan rules (verify and adjust if needed).
- Phase 2: Drawer V2 overlay side sheet (verify header/footer + internal scroll).
- Phase 3: Pick-2 V2 (swap/block behavior + summary in bottom bar/card).

## ⏭️ Next Up (prioritized)

- Proceed with requested small commits after healthcheck.
- Confirm package selection click works with bottom bar overlay.
- Phase 3: Pick-2 V2 two-slot selector + summaries.
- Phase 4: Bottom selection bar updates.
- Phase 5: Finalize viewport contracts.
- Phase 6: Tests/guardrails + healthcheck validation.

## 🧱 Blockers / Risks

- Lint emits warnings in ProductHub (react-hooks/exhaustive-deps).

## 🔁 Verification Log

- 2026-02-04: npm run lint → warnings in ProductHub useEffect deps.
- 2026-02-04: npm run typecheck → pass.
- 2026-02-04: npm run test:run → pass (stderr warnings about fetchPick2Config mock in ProductHub tests).
- 2026-02-04: npm run test:e2e → pass (25 tests).
- 2026-02-04: npm run healthcheck → pass (lint warnings only).

## 🧭 Repo Map (Phase 0)

- Paper-mode / no-scroll lock: [src/App.tsx](src/App.tsx), [src/index.css](src/index.css)
- 3-column package grid: [src/components/PackageSelector.tsx](src/components/PackageSelector.tsx), [src/index.css](src/index.css)
- Bottom selection bar: [src/components/SelectionDrawer.tsx](src/components/SelectionDrawer.tsx) (variant="bar")
- Drawer (add-ons side panel in package view): [src/components/PackageSelector.tsx](src/components/PackageSelector.tsx)
- Pick-2 UI + state: [src/components/Pick2Selector.tsx](src/components/Pick2Selector.tsx), [src/App.tsx](src/App.tsx)
- Pick-2 config/data: [src/data.ts](src/data.ts)
- E2E guardrails: [e2e/](e2e/) (notably ipad-fit, pick2-flow, responsive-guardrails)

## 🧭 Resume Point

- Next command: git status -sb
- Next file: src/components/AddonDrawer.tsx
