# Rollup Verify — Pick2 + Layout Guardrails

Date: 2026-01-31
Repo: PriorityLexusVB/AFTERMARKET-MENU
Branch: `main`
HEAD: `de00f2b0f24bc84013d14ea917dee6d4cfd81a45`

## 1) Pick2 is on main and wired correctly

### UI gate (why the button shows/hides)

The **"You Pick 2"** tab is intentionally hidden unless both are true:

- `pick2Config.enabled === true`
- There is at least one A La Carte option that is:
  - `isPublished === true` AND
  - `pick2Eligible === true`

Primary references:

- [Pick2 gating + NavButton](../src/App.tsx)
- [Curated = published](../src/utils/alaCarte.ts)
- [Pick2 selector UI](../src/components/Pick2Selector.tsx)

### Pricing integration

- Pick2 bundle price comes from `pick2Config.price`.
- Pick2 contributes to totals only when enabled and selection is complete (`maxSelections`, default 2).

Reference:

- [Pick2 pricing + total calculations](../src/App.tsx)

### Agreement/print integration

- Agreement view receives `pick2={pick2Selection}` and renders a **"You Pick 2 Bundle"** line item plus the selected item names.

Reference:

- [Agreement includes Pick2 bundle line](../src/components/AgreementView.tsx)

## 2) iPad / Surface Pro layout constraints still hold

### Requirements checked

- Add-Ons starts **closed**
- Only Add-Ons **list** scrolls (paper-mode window scroll locked)
- Surface-ish: **no horizontal overflow** and key CTAs visible

### Tests executed (all passed)

Full gates:

- `npm ci`
- `npm run build`
- `npm run test:run`
- `npm run test:e2e`

Targeted layout/spec checks:

- `npx playwright test e2e/ipad-fit.spec.ts e2e/surface-pro-fit.spec.ts e2e/pick2-flow.spec.ts`

Notes:

- The Playwright suite includes explicit Pick2 flow + iPad paper-mode scroll lock + Surface-ish overflow guardrails.

## 3) If Pick2 button is missing, Firestore config is the only remaining likely reason

Given the code gate above, if you don’t see the Pick2 tab in a real Firestore-backed environment, it’s almost always:

- `app_config/pick2.enabled` is false/missing, OR
- there are **0** items in `ala_carte_options` with `isPublished=true` AND `pick2Eligible=true`, OR
- deploy/cache lag (client still running older build)

## 4) Firestore verification (Firebase MCP)

### Status

Firebase MCP is **not available as an MCP client** in this VS Code session.

- The workspace task “Firebase: MCP Server (stdio)” indicates it must be launched by an MCP client.
- Result: cannot read/write Firestore directly here.

### Manual Product Hub steps (exact)

1. Open the app in admin mode (Product Hub).
2. Find **"You Pick 2 Config"** (stored at `app_config/pick2`):
   - Set **Enabled = true**
   - Set **Bundle Price** to a valid number (> 0)
3. For items in `ala_carte_options`:
   - Ensure at least one item is **Published**
   - In that item’s **You Pick 2 (Pick2) Fields** section:
     - Set **Pick2 Eligible = true**
     - Set **Pick2 Sort** (optional but recommended)
4. Verify the customer menu now shows **"You Pick 2"**.

## 5) Vite / .env / secrets hygiene (safe cleanup)

### HEAD tracking check

- `git ls-tree -r --name-only HEAD | grep -E '^\.env(\.|$)'` returns only `.env.example`.

### .gitignore

- `.gitignore` now ignores `.env*` while allowing `.env.example`.

### Safe example env file

- `.env.example` is ensured to contain **placeholders only** (no secrets).

### IMPORTANT: potential exposure found — stop and rotate

A `.env.production` file appears in git history (filenames only; contents not inspected).

- Treat as potential secret exposure.
- Recommend rotating any credentials that may have been present.
- Do not rewrite git history without explicit instruction.

### Pattern scan results (filenames/line numbers only; no values printed)

The safe scan for common key markers returned matches at:

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

Interpretation:

- These are expected locations for placeholders/docs/config references, but because `.env.production` exists in history, treat this as a **potential exposure** and rotate any affected keys.
