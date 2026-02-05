# Responsive Guardrails Runbook (E2E)

This runbook defines and verifies the responsive layout contracts for AFTERMARKET-MENU across iPad "paper mode" and desktop kiosk-style viewports.

## What we guarantee

### iPad "Paper Mode" (Safari landscape behavior)

On iPad Pro landscape, the app must behave like a single-screen printed menu:

- No page-level scrolling (the document stays at `scrollY = 0` after attempted scroll).
- The bottom selection bar (`.am-selection-bar`) stays visible and not clipped.
- When content grows, the app paginates (not page-scroll).

Source of truth: [docs/IPAD_PAPER_MODE_GUARDRAILS.md](IPAD_PAPER_MODE_GUARDRAILS.md)

### Surface-ish / Desktop expectations

- No horizontal overflow (no sideways scrolling).
- Bottom selection bar remains visible.
- Key CTAs remain visible (Print + Finalize).
- Desktop kiosk viewport should use a no-scroll layout when the kiosk media query matches (see [src/App.tsx](../src/App.tsx)).

## Viewport matrix

| Device / contract | Viewport (px) | URL params | Tests |
|---|---:|---|---|
| iPad Pro 12.9 landscape (paper mode) | 13661024 | `/?forceIpad=1&demo=1` | `e2e/ipad-12_9-paper-mode.spec.ts` |
| iPad Pro 12.9 landscape (A La Carte pager) | 13661024 | `/?forceIpad=1&demo=1` | `e2e/ipad-alacarte-pager.spec.ts` |
| iPad Pro 11 landscape (existing fit + scroll lock) | 1194834 | `/?forceIpad=1&demo=1` | `e2e/ipad-fit.spec.ts` |
| Surface-ish landscape (guardrails) | 1368912 | `/?demo=1` | `e2e/surface-pro-fit.spec.ts` + `e2e/responsive-guardrails.spec.ts` |
| Desktop baseline (guardrails) | 1440900 | `/?demo=1` | `e2e/responsive-guardrails.spec.ts` |
| Desktop baseline (guardrails) | 19201080 | `/?demo=1` | `e2e/responsive-guardrails.spec.ts` |

## Acceptance criteria per spec

### e2e/ipad-12_9-paper-mode.spec.ts

- Viewport 13661024, `/?forceIpad=1&demo=1`
- `ipad-landscape-lock` is applied to both `html` and `body`
- `.am-selection-bar` is visible and fits within viewport (4px tolerance)
- Page scroll is disabled (`window.scrollY` remains `0` after `scrollTo`)
- Key CTAs visible (reuses existing selectors/roles from existing E2E tests)

### e2e/ipad-alacarte-pager.spec.ts

- Viewport 13661024, `/?forceIpad=1&demo=1`
- Navigate to **A La Carte Options**
- Pager UI is present using the exact component contract from [src/components/AlaCarteSelector.tsx](../src/components/AlaCarteSelector.tsx):
  - A `Page` label
  - A numeric badge that renders `{safePage} / {totalPages}` (e.g. `1 / 2`)
- Prev/Next controls exist with accessible names:
  - `Previous add-ons page`
  - `Next add-ons page`
- Page-level scroll remains disabled
- If multiple pages exist in demo mode, clicking Next advances page number; otherwise Prev/Next are disabled

### e2e/surface-pro-fit.spec.ts

- Viewport 1368912, `/?demo=1`
- No horizontal overflow (`scrollWidth <= clientWidth + 2`)
- `.am-selection-bar` visible and within viewport (4px tolerance)
- Print + Finalize CTAs visible
- Open/close Add-Ons works and does not hide the selection bar
- No-scroll layout is enforced at kiosk viewports (attempted scroll keeps `scrollY = 0`)

### e2e/responsive-guardrails.spec.ts

- Validates no horizontal overflow across the viewport matrix.
- Only enforces no-vertical-overflow when an existing spec/doc already guarantees a strict no-scroll contract.

## How to run locally

1) Install dependencies

- `npm ci`

2) Install Playwright Chromium (used by CI)

- `npm run test:e2e:install`

3) Run E2E suite

- `npm run test:e2e`

4) Optional: WebKit smoke (closest to iOS Safari)

- `npm run test:e2e:webkit:smoke`

Use WebKit smoke when:
- a paper-mode regression is suspected specifically in Safari-like behavior
- investigating a failure related to iPad landscape scroll locking

## CI notes

- CI runs Playwright Chromium via `npm run test:e2e` in [\.github/workflows/ci.yml](../.github/workflows/ci.yml).
- WebKit smoke is intentionally scoped and should be run on-demand (workflow_dispatch) to control runtime.

## Debug checklist for failures

1) Open the Playwright HTML report

- `npx playwright show-report`

2) Inspect artifacts

- Screenshots are stored in the Playwright test output directory (and are also captured explicitly by key guardrail specs).
- If running in CI, download the Playwright report/artifacts from the workflow run.

3) Triage by failure type

- Horizontal overflow: `scrollWidth > clientWidth` indicates layout widening/clipping risk.
- Bottom bar clipped: selection bar bounding box exceeds viewport height.
- Pager missing: A La Carte is no longer in compact/paper-mode layout, or pager UI contract regressed.
- Scroll lock failure: attempted `scrollTo` changes `scrollY`.

## Stop conditions / regression rules

- If a responsive guardrail test fails, do **not** "fix" it by changing UI/UX/styling casually.
- Do **not** touch `src/**`, CSS, or runtime logic in this guardrails PR unless a new/updated test clearly demonstrates a real regression and the fix is minimal and targeted.
- If a production fix is needed and non-trivial, stop and open a separate PR with focused scope and review.

## Related references

- [docs/IPAD_PAPER_MODE_GUARDRAILS.md](IPAD_PAPER_MODE_GUARDRAILS.md)
- [e2e/ipad-fit.spec.ts](../e2e/ipad-fit.spec.ts)
- [e2e/responsive-guardrails.spec.ts](../e2e/responsive-guardrails.spec.ts)
- [src/components/AlaCarteSelector.tsx](../src/components/AlaCarteSelector.tsx)
