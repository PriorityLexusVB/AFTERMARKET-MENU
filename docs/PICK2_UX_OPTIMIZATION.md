# Pick2 UX Optimization

## What changed (UX rationale)

- Upgraded the Pick2 selector to a premium, AddOnsaligned card layout that surfaces more items at once and reduces scanning time.
- Added a sticky Pick2 header with value anchor, progress, and selected chips to keep intent and status visible at all times.
- Improved selection flow clarity with explicit progress text ("0 of 2 selected" → "All set — 2 selected") and a calm swap message after a third tap.
- Added two-slot selected row so guests see exactly what is picked and what remains.

## Screens/areas tested

- iPad paper-mode layout (no window scroll, internal list scroll only)
- Surface/desktop layout (no overflow, CTAs visible)
- Pick2 selection flow (progress, bundle pricing, third selection blocked)

## How to verify manually

1. Open /?forceIpad=1&demo=1
2. Navigate to the "You Pick 2" tab.
3. Confirm the header, selected slots, and swap reassurance remain visible while the Pick2 list scrolls.
4. Select two items; verify progress shows "All set — 2 selected".
5. Attempt a third selection; confirm the message "You’re at 2. Remove one to swap." appears and selection count stays at 2.

Also verify on /?forceIpad=1&demo=1 that:

- The window does not scroll.
- Only the Pick2 list scrolls.

For Surface/desktop:

- Open /?demo=1 and navigate to the Pick2 tab.
- Ensure no horizontal overflow and CTAs remain visible.

## Product Hub refresh

Pick2 config and Pick2 per-item field updates in Product Hub automatically refresh the Menu state
within ~250ms (debounced). No manual reload is required. If changes do not reflect, confirm you are
not in demo mode and that Firestore is connected.
