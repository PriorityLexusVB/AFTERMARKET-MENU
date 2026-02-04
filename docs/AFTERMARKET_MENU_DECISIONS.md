# AFTERMARKET MENU Decisions

## 2026-02-04 — Project kickoff

- Decision: Initialize agent tracking docs early to ensure requirements and verification logs are captured from Phase 0.
- Rationale: Required by mission, supports checkpoints and resume protocol.
- Consequences: None.

## 2026-02-04 — Phase 1 density + grid tokens

- Decision: Introduce density tokens (column min, gap, card padding, label/body/price sizes, radius) as CSS custom properties in [src/index.css](src/index.css).
- Rationale: Provide stable, clamp-based sizing while keeping Tailwind structure intact.
- Consequences: Package card padding and price sizing now derive from tokens; requires re-validating e2e layout guardrails.

## 2026-02-04 — Compact grid min-width

- Decision: Add `.am-packages-grid-compact` with a 3-column min width (280px) and fallback to 2 columns below 1180px.
- Rationale: Prevent crushed typography while keeping 3-column layout legible on iPad landscape.
- Consequences: Must re-check bottom bar overlap and package selection clickability in e2e.

## 2026-02-04 — Add-ons drawer becomes overlay side sheet

- Decision: Replace the iPad add-ons push drawer with an overlay side sheet component and keep the package grid width stable.
- Rationale: Satisfies non-negotiable drawer contract (overlay, internal scroll, sticky header/footer) without compressing columns.
- Consequences: Add-ons are accessed via an overlay button in iPad landscape; e2e add-ons heading relies on the drawer header.

## 2026-02-04 — Pick-2 two-slot UI

- Decision: Introduce two visible Pick-2 slots with clear actions, keeping the existing block-on-third-selection behavior.
- Rationale: Makes the “choose exactly two” requirement explicit and guest-friendly.
- Consequences: Pick-2 selector now shows slot cards and a summary line in package card and bottom bar; e2e needs verification.
