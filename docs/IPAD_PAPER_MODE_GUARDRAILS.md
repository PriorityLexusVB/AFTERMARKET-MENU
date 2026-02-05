# iPad "Paper Mode" (No-Scroll) Guardrails

This app has a strict iPad Safari landscape requirement:

- The **menu view** must feel like a "printed menu" (single-screen).
- The **page must not scroll**.
- When content grows, we **paginate** (or clamp), rather than enabling page scrolling.

This document exists to prevent regressions.

## What "Paper Mode" means (acceptance criteria)

On an iPad Pro 12.9" in landscape (Safari):

- **Packages page**: all package columns + add-ons column are visible without scrolling.
- **A La Carte page**: the list does not scroll; it shows a **Page X / Y** indicator and **Prev/Next** controls.
- The footer/bottom bar remains visible (fixed), and the header spacing is respected.

## Where it's implemented

### 1) iPad detection + layout switching

Primary switch lives in [src/App.tsx](../src/App.tsx):

- `computeIsIpadLandscape()`
- `isIpadLandscape`
- `enableIpadMenuLayout`, `enableIpadPackagesLayout`, `enableIpadAlaCarteLayout`

Important notes:

- Detection uses a **layout-based media query** (landscape + bounds) and a **touch/coarse-pointer heuristic**.
- There is also a **narrow iPad UA fallback** (`/iPad/`) to keep **desktop device emulation** behaving like the real device.
  - Chrome DevTools "iPad Pro" emulation can report `maxTouchPoints`/`pointer: coarse` incorrectly.
  - If you remove this fallback, the iPad compact layout may silently stop applying during preview, and the A La Carte pager will disappear.

### 2) Hard scroll lock

When `isIpadLandscape && currentView === "menu" && !isAdminView`, [src/App.tsx](../src/App.tsx) applies a scroll-lock class:

- `ipad-landscape-lock` on `html` and `body`

The CSS for that lock is in [src/index.css](../src/index.css):

- `html.ipad-landscape-lock, body.ipad-landscape-lock, .ipad-landscape-lock #root { height: var(--app-height); overflow: hidden; overscroll-behavior: none; }`
- `.am-main-ipad-menu` sets the fixed-height menu container using the same `--app-height` strategy.

There is also an additional **overflow-hidden wrapper** in [src/App.tsx](../src/App.tsx) for iPad landscape menu rendering. This is intentional: iOS Safari can sometimes ignore `body { overflow: hidden; }` in edge cases.

### 3) A La Carte pagination (where the "Page X / Y" comes from)

Pagination UI is in [src/components/AlaCarteSelector.tsx](../src/components/AlaCarteSelector.tsx) and only appears when:

- `isCompact === true`

In "paper mode", `isCompact` is driven by:

- `enableIpadAlaCarteLayout` from [src/App.tsx](../src/App.tsx)

So if iPad detection regresses, the first visible symptom is usually:

- **A La Carte loses the "Page X / Y" indicator** (because `isCompact` is false).

## How to test (quick)

### Real device (recommended)

- Open the app in **Safari on iPad Pro 12.9"**.
- Rotate to landscape.
- Confirm:
  - No page scroll on Packages.
  - No page scroll on A La Carte.
  - A La Carte shows **Page X / Y** and **Prev/Next**.

### Desktop preview

Use one of these:

- DevTools device emulation with an iPad preset (UA often becomes `iPad`).
- Add `?forceIpad=1` to the URL (supported by `computeIsIpadLandscape`).

## Common regression causes (avoid these)

- Reintroducing a tight `max-width` cap in the iPad landscape media query.
- Removing the iPad UA fallback while relying on desktop emulation for approval.
- Adding `overflow-auto` to top-level menu containers on iPad landscape.
- Converting pagination back into scrolling on A La Carte.

## If content grows

Preferred order:

1. Keep "paper mode" (no scroll) and **paginate** (A La Carte already does).
2. Clamp text and reduce non-essential whitespace.
3. Only as a last resort, allow scrolling inside a _contained sub-panel_ - never the full page.
