# AFTERMARKET-MENU - AGENTS RULES (Authoritative)

## Primary goal
Maintain a premium "Black Label" iPad-first sales UI that is production-safe and regression-resistant.

## Tool ladder (always use the simplest correct tool)
Source of truth order:
1) git + terminal output (status/log/diff) is truth
2) rg (ripgrep) for discovery
3) package.json scripts + tests for verification
4) docs/AFTERMARKET_MENU_AGENT_TODO.md for continuity

Preferred commands:
- Discovery:
  - rg -n "<term>" src e2e docs
- Repo state:
  - git status -sb
  - git diff / git diff --stat
- Safety:
  - git stash -u -m "wip"
  - git checkout -B main origin/main
- Verification gates:
  - npm run lint
  - npm run healthcheck
  - npx playwright test
  - npm run build
- PR + CI:
  - gh pr create/edit/checks
  - gh run watch
  - gh workflow run "CI" --ref <branch> -f run_webkit_ipad_smoke=true

Firestore/MCP rule:
- Only touch Firestore schemas/data if the request explicitly requires it.
- If task is UI/copy/style/tests only, do not use Firestore tooling.

## Non-negotiable UI/UX contracts (must never regress)
A) iPad "paper mode" (landscape):
- NO page-level scrolling (window + scrollingElement must stay at 0)
- bottom selection bar always visible and clickable
- no horizontal overflow

B) 3-column legibility:
- enforce minimum readable column width
- opening drawers must NOT squeeze/compress the 3-column grid

C) Drawer behavior:
- overlay side sheet (NOT push layout)
- drawer content scrolls internally only (sticky header/footer)
- ESC closes; focus is managed (focus on open, restore on close)

D) Pick-2:
- max 2 selections, no duplicates
- third selection is blocked or requires swap with clear message
- summaries visible in package card and selection bar

E) ASCII-safe UI source:
- No raw unicode punctuation/icons in source files.
- Use SVG or HTML entities (e.g., &bull; &times;) if you need symbols.

## Branch + PR policy (anti-chaos)
- One branch per milestone, one PR at a time.
- Do NOT create multiple parallel PRs for the same workstream.
- No PR is allowed if npm run healthcheck fails.

## Required merge gates (must be green before requesting merge)
Run and record:
- npm run lint
- npm run healthcheck
- npx playwright test
- npm run build
- ASCII scan (docs/e2e/src):
  - rg -n --pcre2 "[^\\x00-\\x7F]" docs e2e src || true  (should show no matches)

## WebKit iPad smoke (manual release gate)
If the workflow is configured as workflow_dispatch:
- gh workflow run "CI" --ref <branch> -f run_webkit_ipad_smoke=true
- gh run list --workflow "CI" --branch <branch> --limit 3
- gh run watch <RUN_ID> --exit-status
