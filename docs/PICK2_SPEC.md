# Pick2 ("You Pick 2") Spec

## Overview
Pick2 is a curated 2-item bundle built from a subset of published A La Carte items.

- Customers choose up to `maxSelections` items (default: 2)
- When exactly `maxSelections` items are selected, the bundle becomes active
- The bundle adds a single bundle price line item (no per-item add-on pricing for the included items)

This feature is intentionally designed to be "safe" for iPad/kiosk paper-mode:
- No window/page scrolling is introduced
- Any scrolling happens only within contained list panels

## Data Model

### Global config (Firestore)
Document: `app_config/pick2`

TypeScript: `Pick2Config` ([src/types.ts](../src/types.ts))

Fields:
- `enabled: boolean` (required)
- `price: number` (required) - bundle price applied once when complete
- `title?: string` (optional) - display name (defaults are handled by mock/fallback)
- `subtitle?: string` (optional) - display subtext
- `maxSelections?: number` (optional) - selection cap; defaults to `2` when missing

Runtime validation:
- Zod schema: `Pick2ConfigSchema`
- Load helper: `fetchPick2Config()` falls back to a safe mock when missing/invalid

### Per-item fields (Firestore)
Collection: `ala_carte_options`

TypeScript: `AlaCarteOption` ([src/types.ts](../src/types.ts))

Fields:
- `pick2Eligible?: boolean` - include this item in Pick2 list when `true`
- `pick2Sort?: number` - optional sort priority (lower sorts first)
- `shortValue?: string` - single-line value statement shown on the card
- `highlights?: string[]` - up to 2 short highlight lines shown on the card

Notes:
- These fields live ONLY on the A La Carte option document.
- The customer-facing Pick2 list is derived from published A La Carte options where `pick2Eligible === true`.

## Eligibility + Sorting

Eligible items:
- Must exist as an A La Carte option (i.e., published)
- Must have `pick2Eligible: true`

Ordering:
- Primary: `pick2Sort` ascending when present
- Secondary: stable fallback ordering (to avoid shuffle across renders)

## Selection Rules

### Max selections
- User can select at most `maxSelections` items
- Attempting to select more shows a friendly "blocked" message
- Deselecting below the cap clears the blocked message

### Conflict rules (no double-charge)
Pick2 and individually-priced A La Carte add-ons are mutually exclusive:
- Selecting an item in Pick2 removes it from individually-priced add-ons
- Selecting an individually-priced add-on removes it from Pick2

This prevents the same item from being charged twice.

## Pricing Rules

### Bundle activation
- Bundle is **active** only when `selectedCount === maxSelections`

### Total price
- When inactive (0..max-1 selected): **no bundle price is added**
- When active (exactly max selected): **add `Pick2Config.price` once**

### Cost (manager view)
- Bundle cost is the sum of included items' costs

## Product Hub Admin Setup

Product Hub now provides two configuration surfaces:

### A La Carte item Pick2 fields
Location: Product Hub  expand a product  "You Pick 2 (Pick2) Fields"

Rules:
- Inputs are enabled only when the item is Published to A La Carte
- Saves are partial and only write the Pick2 fields

Fields:
- Pick2 Eligible (toggle)
- Pick2 Sort (number)
- Short Value (text, single line)
- Highlights (two text inputs  stored as a string array)

### Global Pick2 config
Location: Product Hub  "You Pick 2 Config" card near the top

Fields:
- Enabled (toggle)
- Bundle Price (number)
- Optional Title (text)
- Optional Subtitle (text)

## Implementation Notes / Guardrails

Non-negotiables:
- Do not touch PackageSelector drawer start-closed logic
- Do not change no-scroll wrappers; only contained panels may scroll

Testing:
- Playwright: `e2e/pick2-flow.spec.ts` covers Pick2 visibility, selection cap, pricing-once, and iPad scroll lock
