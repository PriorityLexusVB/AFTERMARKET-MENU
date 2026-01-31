# Rollup — Pick2 + Layout Verification (2026-01-31)

## Repo / SHA

- Branch: main
- HEAD: de00f2b0f24bc84013d14ea917dee6d4cfd81a45

## Pick2 data gate (code)

Pick2 tab appears only when:

- `app_config/pick2.enabled === true`
- AND at least one `ala_carte_options` doc has `isPublished=true` AND `pick2Eligible=true`

If the Pick2 button is missing, verify the config and eligible items per the manual steps below.

## Commands run + results

- `npm ci` ✅ (after stopping locked Node/esbuild processes)
- `npm run build` ✅ (missing Firebase env vars triggers demo-mode; build succeeds)
- `npm run test:run` ✅ (all tests passed; ProductHub tests log mock warnings about `fetchPick2Config` export)
- `npm run test:e2e` ✅ (25/25 passed)
- `npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts` ✅ (5/5 passed)

## Layout guardrails checklist

- Add-Ons starts CLOSED (iPad/kiosk) ✅ (covered by iPad/kiosk fit specs)
- Only Add-Ons LIST scrolls; paper-mode window scroll locked ✅ (Pick2 paper-mode spec passes)
- Surface: no horizontal overflow + CTAs visible ✅ (Surface-ish + Surface Pro specs pass)
- Pick2 tab only when enabled + eligible published items ✅ (code gating verified)

## Manual Product Hub steps (if Pick2 missing)

1. Admin → Product Hub → Pick2 config card:
   - Enabled = ON
   - Bundle price set (nonzero)
2. For each desired canonical Pick2 item:
   - Ensure `isPublished=true`
   - Set `pick2Eligible=true`
   - Set `pick2Sort` order
   - Fill `shortValue` + `highlights` (2 lines max)
3. Refresh customer menu → Pick2 tab should appear immediately.

Canonical, no duplicates:

- RustGuard Pro
- ToughGuard Premium
- Interior Protection
- Diamond Shield
- EverNew
- Suntek Film (Standard as canonical; optionally include Complete)

Enforce “no duplicates” by ensuring only ONE doc per concept has `pick2Eligible=true`.

## Env hygiene + risk flags (filenames/line numbers only)

- Tracked env files in history:
  - `.env.production` (commit f5d555d6…)
  - `.env.example` (multiple commits; expected)

- Secret scan hits (filenames/line numbers only):
  - `.env.example:5`
  - `.github/workflows/ci.yml:86`
  - `README.md:168`
  - `README.md:204`
  - `docs/CLOUD_DEPLOYMENT.md:42`
  - `docs/CLOUD_DEPLOYMENT.md:65`
  - `docs/CLOUD_DEPLOYMENT.md:86`
  - `docs/CLOUD_DEPLOYMENT.md:89`
  - `docs/CLOUD_DEPLOYMENT.md:154`
  - `docs/CLOUD_DEPLOYMENT.md:254`
  - `docs/CLOUD_DEPLOYMENT.md:301`
  - `docs/CLOUD_DEPLOYMENT.md:306`
  - `docs/CLOUD_RUN_TROUBLESHOOTING.md:55`
  - `docs/CLOUD_RUN_TROUBLESHOOTING.md:287`
  - `docs/PR_DEPLOYMENT_FIX.md:145`
  - `docs/PR_DEPLOYMENT_FIX.md:159`
  - `scripts/import-mock-data.ts:24`
  - `scripts/validate-env-vars.js:24`
  - `src/components/SetupGuide.tsx:80`
  - `src/firebase.ts:35`
  - `src/firebase.ts:111`
  - `src/schemas.ts:155`

Recommendation: rotate credentials if `.env.production` ever contained real secrets.
