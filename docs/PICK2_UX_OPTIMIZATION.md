# Pick2 UX Optimization

## What changed (UX rationale)

- Upgraded the Pick2 selector to a premium, Add‑Ons‑aligned card layout that surfaces more items at once and reduces scanning time.
- Added a sticky Pick2 header with value anchor, progress, and selected chips to keep intent and status visible at all times.
- Improved selection flow clarity with explicit progress text, a “Bundle ready” state, and a clear swap message when two items are selected.
- Added large tap targets on selected chips to support quick removal on iPad/kiosk without hunting for the original card.

## Screens/areas tested

- iPad paper-mode layout (no window scroll, internal list scroll only)
- Surface/desktop layout (no overflow, CTAs visible)
- Pick2 selection flow (progress, bundle pricing, third selection blocked)

## How to verify manually

1. Open /?forceIpad=1&demo=1
2. Navigate to the “You Pick 2” tab.
3. Confirm the header and selected chips remain visible while the Pick2 list scrolls.
4. Select two items; verify progress shows 2/2 selected and “Bundle ready” appears.
5. Attempt a third selection; confirm the message “You’ve selected 2 — remove one to swap.” appears and selection count stays at 2.

Also verify on /?forceIpad=1&demo=1 that:

- The window does not scroll.
- Only the Pick2 list scrolls.

For Surface/desktop:

- Open /?demo=1 and navigate to the Pick2 tab.
- Ensure no horizontal overflow and CTAs remain visible.
