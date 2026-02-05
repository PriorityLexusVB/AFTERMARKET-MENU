# UI Spacing Standards

Purpose: prevent regressions in Vehicle Protection Menu header and package cards by centralizing spacing in `src/index.css` using shared `am-*` utilities.

Source of truth (do not duplicate):
- `src/index.css` (`@layer components`) defines:
  - `.am-page-header` - page header top/bottom padding
  - `.am-page-header-stack` - spacing between title/subtitle
  - `.am-page-tabs-row` - margin below tabs row
  - `.am-grid-top` - offset above package grid
  - `.am-package-card` - base padding for package cards
  - `.am-package-title-block` - spacing under plan title block
  - `.am-package-first-feature` - offset above the first feature row

DO:
- Reuse the `am-*` classes for header, tabs, grid, and package cards.
- Keep adjustments inside `src/index.css` when the spacing standard needs to change.
- Verify iPad landscape: no new vertical scroll introduced.

DON'T:
- Reintroduce ad-hoc large spacers (e.g., `pt-12`, `mb-12`, `mt-12`).
- Add extra `justify-center` or padding on card bodies that push feature rows down.
- Create duplicate spacing helpers in other files.
