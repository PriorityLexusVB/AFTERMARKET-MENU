# UX / UI Optional Features Review - 2026-01-27

This document is a **meticulous checklist** of UX/UI features discussed in this chat, what was added upstream, what we reverted/disabled to preserve the exact iPad layout, and what optional features you may want to enable.

## Core requirements from this chat (status)

### 1) Preserve iPad Pro 12.9" layout (thin add-ons tab, 3 package columns, no bottom clipping)

- Status: **DONE on `main`** (via the earlier restore commit).
- Relevant files:
  - `src/components/PackageSelector.tsx`
  - `src/index.css`

### 2) Selection highlight should work by tapping card / selecting plan

- Status: **IMPLEMENTED LOCALLY (not committed yet)**
- What changed locally:
  - Package cards are tappable as a whole (role/button + click + keyboard).
  - Feature-name clicks still open the feature modal (stopPropagation).
  - "Select Plan" still works (stopPropagation to avoid double-toggle).
- Relevant files:
  - `src/components/PackageCard.tsx`

### 3) "Recommended" should be an option available in Product Hub

- Status: **IMPLEMENTED LOCALLY (not committed yet)**
- What changed locally:
  - Product Hub now displays the same Recommended package radio controls (it reuses AdminPanel's existing `setRecommendedPackage` flow).
- Relevant files:
  - `src/components/ProductHub.tsx`
  - `src/components/AdminPanel.tsx`

### 4) Magnifying glass behavior (easy to read, still click features, scroll, and select)

- Status: **RE-ADDED LOCALLY (not committed yet)**
- Behavior:
  - iPad layout shows a magnify icon on each package card.
  - Tapping magnify opens a full-screen overlay with a magnified PackageCard (larger text), scrollable.
  - Feature clicks still open the existing feature modal.
  - Selection can still be changed inside the overlay.
- Relevant files:
  - `src/components/PackageSelector.tsx`

## Upstream UX features that were introduced (and your "options")

### A) "Recommended" badge on customer cards

- Upstream introduced support for `isRecommended` / `is_recommended` fields and a "Recommended" chip.
- Current local approach:
  - Keep the underlying data fields (so Admin/ProductHub can set it).
  - **Do not show the badge by default** on the customer menu unless we explicitly enable it.
- Where it comes from in demo mode:
  - `src/mock.ts` marks Platinum as recommended.

### B) Demo mode / kiosk verification entry

- Upstream added a deterministic `?demo=1` path to skip login for kiosk/testing.
- This is helpful for repeatable iPad verification and automated tests.
- File: `src/App.tsx`

### C) Build badge toggle

- Upstream added a build SHA/time badge (useful during rollout) that's pointer-events none.
- File: `src/App.tsx`

### D) Drawer behavior options (right add-ons panel)

- Upstream experimented with different drawer sizing/behavior.
- We restored the classic behavior:
  - iPad: starts closed, thin tab (~44px), open width ~320px.
- File: `src/components/PackageSelector.tsx`

### E) Compact bullet layout (two-column)

- Upstream briefly introduced a compact two-column points layout.
- We forced single-column to match your screenshots.
- File: `src/components/PackageCard.tsx`

## What I still need from you (so nothing is reintroduced accidentally)

Pick your preference for the customer menu:

1. Show Recommended badge on customer menu?
   - Option A: **OFF** (current local default; recommended is admin-only signal)
   - Option B: ON for iPad only
   - Option C: ON everywhere

2. Magnify scope?
   - Option A: iPad only (current local)
   - Option B: iPad + desktop kiosk
   - Option C: everywhere

## Reference: incoming changes list

- For a line-by-line upstream diff, see: `docs/INCOMING_CHANGES_REPORT_2026-01-27.md`
