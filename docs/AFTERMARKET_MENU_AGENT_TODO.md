# AFTERMARKET MENU Agent TODO

## ✅ Done

- 7406c9f docs: update decisions and verification log
- aae9e86 feat(ui): refine package grid density and pick2 layout
- 24c0581 fix(ui): improve add-ons drawer and selection bar interaction
- Fixed ProductHub hook dependencies to satisfy react-hooks/exhaustive-deps (pending lint verification).
- Added Pick-2 fix action on selection bar for incomplete bundles.
- Hardened add-ons drawer UX (ESC close + overscroll containment).
- Added Playwright guardrails (iPad overflow + grid width stability + scroll lock + Pick-2 summaries).
- Updated add-ons close button selectors in iPad/Surface guardrails.

## 🟡 In Progress

- None.

## ⏭️ Next Up

- If any lint suppression is required, document in decisions.

## 🧱 Blockers

- None.

## 🔁 Verification Log

- 2026-02-04: npm run lint → clean (0 warnings).
- 2026-02-04: npx playwright test e2e/ipad-fit.spec.ts → pass.
- 2026-02-04: npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts e2e/packages.spec.ts → 14 passed, 1 failed (ipad-fit). Fixed and re-ran ipad-fit.
- 2026-02-04: npm run healthcheck → lint/typecheck/vitest/playwright all pass.

## 🧭 Resume Point

- Next command: git status -sb
- Next file: docs/AFTERMARKET_MENU_AGENT_TODO.md (keep verification log current)
