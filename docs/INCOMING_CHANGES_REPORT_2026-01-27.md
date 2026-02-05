# Incoming Changes Report (Pre-sync  Upstream) - 2026-01-27

This report lists **all incoming upstream changes** that landed when syncing from the pre-sync snapshot to the updated upstream state, **separately** from the small "restore iPad layout" commit.

## References (exact SHAs)

- Pre-sync snapshot: `af5b1fd828cf107dcf71008a91da256e0c86c4cb` (branch `backup/pre-sync-2026-01-27`)
- Upstream synced base: `7feebaf326ccc3822788ef3b664b28c8a7fcf1db`
- Restore iPad layout commit: `3f23ab3` (current `main`)

## What changed (incoming upstream only)

These are **all files changed** between `backup/pre-sync-2026-01-27`  `7feebaf`.

### File list (with line-change counts)

(Format: `+added  -removed  path` from `git diff --numstat backup/pre-sync-2026-01-27..7feebaf`)

- `+51  -7` `.github/workflows/ci.yml`
- `+1   -0` `.markdownlintignore`
- `+609 -0` `docs/EMPHASIZED_ITEMS.md` (new)
- `+63  -0` `e2e/ipad-fit.spec.ts` (new)
- `+6   -8` `e2e/packages.spec.ts`
- Binary changed `e2e/packages.spec.ts-snapshots/package-cards-chromium-linux.png`
- Binary changed `e2e/packages.spec.ts-snapshots/package-cards-chromium-win32.png`
- `+1   -1` `e2e/presentation.spec.ts`
- `+32  -0` `e2e/surface-fit.spec.ts` (new)
- `+20  -15` `index.js`
- `+136 -136` `package-lock.json`
- `+7   -6` `package.json`
- `+2   -2` `playwright.config.ts`
- Binary added `public/menu11.png`
- `+147 -11` `src/App.tsx`
- `+29  -7` `src/components/AddonItem.tsx`
- `+18  -3` `src/components/AddonSelector.tsx`
- `+192 -189` `src/components/AdminToCustomerMapping.test.tsx`
- `+4   -11` `src/components/FeatureModal.tsx`
- `+84  -53` `src/components/PackageCard.test.tsx`
- `+171 -43` `src/components/PackageCard.tsx`
- `+205 -22` `src/components/PackageSelector.tsx`
- `+2   -2` `src/components/SelectionDrawer.tsx`
- `+649 -418` `src/components/ValuePresentation.tsx`
- `+43  -3` `src/data.ts`
- `+30  -3` `src/index.css`
- `+251 -238` `src/utils/featureOrdering.test.ts`
- `+39  -46` `src/utils/featureOrdering.ts`
- `+6   -0` `src/vite-env.d.ts` (new)
- `+40  -7` `vite.config.ts`

### "Line-by-line" review commands (exact)

Run any of these to see the full line-by-line diff for a file:

- Full diff (all files):
  - `git diff backup/pre-sync-2026-01-27..7feebaf`
- One file:
  - `git diff backup/pre-sync-2026-01-27..7feebaf -- src/App.tsx`
  - `git diff backup/pre-sync-2026-01-27..7feebaf -- src/components/PackageCard.tsx`
  - `git diff backup/pre-sync-2026-01-27..7feebaf -- src/components/PackageSelector.tsx`

If you want it in VS Code's diff UI, open any file, then use Source Control  "Open Changes".

## Incoming upstream commits (each update)

These are **every commit** that came in during the sync from `af5b1fd..7feebaf` (newest first):

- `7feebaf` docs: add EMPHASIZED_ITEMS.md to document key features and highlights
- `a98ac2c` ci: add on-demand WebKit iPad smoke run
- `f4e1e12` deps: bump hono in the npm-security group across 1 directory (#145)
- `9a6237b` Enable demo mode for kiosk verification and automated tests; update test navigation and viewport handling
- `4d36253` Enhance PackageSelector with responsive drawer width handling and container resizing
- `0d0e7b8` Refactor add-on drawer toggle logic and improve accessibility features
- `f0349eb` Add test for feature points rendering in compact mode and adjust layout classes
- `8849d22` Implement build badge visibility toggle and improve animation handling for iPad
- `0be621c` Add build info generation and display in the app
- `5711557` Merge branch 'main' of https://github.com/PriorityLexusVB/AFTERMARKET-MENU
- `debf0a8` Add iPad and Surface Pro viewport fit tests for menu visibility
- `de82fb7` Fix failing E2E tests: update snapshot and fix slide overflow
- `a363fdd` Refactor PackageCard component to improve connector rendering and accessibility attributes
- `a99da0a` Tidy iPad package cards dividers
- `09d6bfb` Fix packages to use explicit featureIds
- `a31fb2e` Refactor test assertions for deriving Elite tier features
- `673477a` Revert to strict tier feature mapping
- `f7bff71` Restore ladder tier feature mapping
- `734417d` Fix iPad add-ons drawer default closed
- `401fc0c` Revert "Ensure iPad Protection Packages fits without scroll"
- `c0315ea` Ensure iPad Protection Packages fits without scroll
- `84c35b7` Fix iPad menu cutoff (iOS scroll + stable viewport height)
- `ce50a10` fix: improve viewport handling for iOS Safari and enhance package grid scrolling
- `25dd1f4` fix: add overflow handling to package grid for better scrolling
- `65c977b` Merge branch 'main' of https://github.com/PriorityLexusVB/AFTERMARKET-MENU
- `b67c36b` Refactor code structure for improved readability and maintainability
- `f68c386` deps: bump the npm-minor-patch group with 7 updates (#143)
- `dcb5dd3` Refactor component styles for improved readability and consistency

For commit-by-commit file stats, run:

- `git log --oneline --stat af5b1fd..7feebaf`

## What changed (our restore commit only)

These are **only** the files modified in `7feebaf..3f23ab3`:

(From `git diff --numstat 7feebaf..HEAD`)

- `+1   -1` `src/components/PackageCard.tsx`
- `+21  -191` `src/components/PackageSelector.tsx`
- `+2   -0` `src/index.css`

## Notes tied to your report ("Recommended" and selection)

- The upstream changes introduced support for a `isRecommended`/`is_recommended` field and UI styling in `src/components/PackageCard.tsx`.
- In demo/mock data, `src/mock.ts` currently marks `Platinum` as `isRecommended: true`, which is why you can see "Recommended" **in demo mode**.

## Pending local changes (NOT committed yet)

These are currently in your working tree but are **not** committed or pushed:

- `src/components/PackageCard.tsx`
- `src/components/PackageCard.test.tsx`

Intent: restore the "tap anywhere selects/highlights" behavior and hide the "Recommended" badge/styling by default so the customer menu looks like it did before.

---

If you want, I can generate a second report that summarizes behavioral changes per file (auth/demo flow, presentation mode, layout changes, etc.) after we confirm which exact URL/mode you're testing (demo vs logged-in vs admin).
