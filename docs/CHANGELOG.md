# AFTERMARKET MENU Changelog

This file records release-level changes for production behavior and validation outcomes.

## 2026-03-05 - iPad viewport stabilization and WebKit smoke hardening

### Commits
- d876c9c fix(ipad): stabilize visible viewport height to prevent oversized menu/presentation
- 4a4f342 test(webkit): handle compact Pick2 info-toggle layout in iPad smoke

### Summary
- Stabilized runtime viewport height behavior for real iPad Safari states so menu and presentation do not render oversized.
- Added iPad viewport contract assertions for menu and presentation flows.
- Hardened WebKit Pick2 smoke coverage to correctly handle compact iPad layout where the info toggle is intentionally hidden.

### Validation
- npm run healthcheck -> passed (lint, typecheck, vitest, playwright)
- npm run build -> passed
- npx playwright test --project=webkit-ipad e2e/ipad-fit.spec.ts e2e/pick2-flow.spec.ts -> 8 passed

### CI
- workflow_dispatch with run_webkit_ipad_smoke=true -> success
- https://github.com/PriorityLexusVB/AFTERMARKET-MENU/actions/runs/22725607420
