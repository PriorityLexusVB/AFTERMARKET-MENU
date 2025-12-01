# Dependabot Automation Documentation

This document describes the automated Dependabot PR handling system implemented in this repository.

## Overview

The automation system handles Dependabot pull requests by:

1. **Running validation checks** (build, tests, TypeScript, lint)
2. **Attempting automated fixes** when checks fail
3. **Auto-merging** when all checks pass and conditions are met

## Behavior

### Workflow Trigger

The automation triggers on `pull_request` events:
- `opened` - When Dependabot opens a new PR
- `synchronize` - When the PR is updated
- `labeled` / `unlabeled` - When labels are added or removed

### Validation Steps

For each Dependabot PR, the workflow:

1. **Installs dependencies** (`npm ci`)
2. **Runs build** (if `build` script exists in package.json)
3. **Runs tests** (if `test` or `test:run` script exists)
4. **Runs lint** (if `lint` script exists)
5. **Runs TypeScript check** (if `tsconfig.json` exists)

### Auto-Fix Behavior

When initial checks fail:

1. **ESLint fix** - Runs `eslint --fix` if ESLint is available
2. **Prettier fix** - Runs `prettier --write` if Prettier is available
3. **npm audit fix** - Runs `npm audit fix` (non-force)
4. **Re-runs validation** - Tests are re-run after fixes

### Auto-Merge Behavior

A PR is eligible for auto-merge when:
- All validation checks pass (either initially or after fixes)
- The `do-not-merge` label is NOT present
- Node.js version tests pass in the matrix (20, 24)

## Opt-Out Labels

### `do-not-autofix`

Add this label to prevent the workflow from:
- Running automated fix scripts
- Committing changes back to the Dependabot branch

Use this when:
- You want to manually review and fix issues
- The automated fixes might cause unintended changes
- The dependency update requires careful manual handling

### `do-not-merge`

Add this label to prevent the workflow from:
- Automatically merging the PR even if all checks pass

Use this when:
- You want to manually review the changes before merging
- The update is for a critical dependency requiring extra scrutiny
- You need to coordinate the merge with other changes

## Permissions Required

### Repository Settings

The workflow requires these GitHub Actions permissions:
- `contents: write` - To push fix commits to Dependabot branches
- `pull-requests: write` - To post comments and merge PRs
- `checks: write` - To report check status

### Personal Access Token (PAT)

For auto-merge to work, you may need to add an `AUTOMERGE_PAT` secret:

1. Create a Personal Access Token with:
   - `repo` scope (for private repos) or `public_repo` (for public repos)
   - `workflow` scope (if updating workflow files)

2. Add the token as a repository secret named `AUTOMERGE_PAT`

If the PAT is not configured, the workflow will:
- Still run all checks and attempt fixes
- Post a comment explaining how to configure the PAT

## Branch Protection

This automation **does not bypass branch protection rules**. If branch protection requires:
- Required reviews → PR will not auto-merge until approved
- Required status checks → Those must pass independently
- Signed commits → Commits from github-actions[bot] may need to be allowed

## Dependency Groups

The Dependabot configuration groups dependencies to reduce PR noise:

| Group | Packages | Description |
|-------|----------|-------------|
| `react-and-types` | react, react-dom, @types/react* | Core React packages |
| `ci-actions` | actions/*, @actions/* | GitHub Actions |
| `dev-dependencies` | vitest, playwright, tsx, eslint, prettier | Development tools |
| `production-dependencies` | vite, tailwindcss, express, zod | Production packages |
| `misc` | Everything else | Catch-all group |

## Troubleshooting

### Workflow doesn't run

- Ensure the PR author is `dependabot[bot]`
- Check that the workflow file is on the default branch

### Auto-merge fails

1. Check the workflow run logs for error details
2. Verify `AUTOMERGE_PAT` secret is configured
3. Check branch protection rules

### Fixes aren't committed

- Ensure `AUTOMERGE_PAT` or `GITHUB_TOKEN` has write access
- Check if `do-not-autofix` label is present

### Tests fail after fixes

- Review the specific test failures in the workflow logs
- Consider adding `do-not-autofix` label and fixing manually

## Checks & Balances

### Safety Measures

1. **Label-based opt-out** - Human control over automation behavior
2. **No force merging** - Branch protection is always respected
3. **Matrix testing** - Tests run on multiple Node.js versions
4. **Detailed logging** - All actions are logged and reported
5. **Comment notifications** - Results are posted to the PR

### What the automation CANNOT do

- Bypass branch protection rules
- Merge without passing required status checks
- Override required reviewers
- Run on non-Dependabot PRs

## Admin Guidance

### Initial Setup

1. Review the workflow permissions in repository settings
2. Configure `AUTOMERGE_PAT` secret if auto-merge is desired
3. Review and adjust Dependabot groupings in `dependabot.yml`

### Maintenance

- Monitor workflow runs for unexpected failures
- Adjust dependency groups as the project evolves
- Review auto-merged PRs periodically for quality

### Emergency Stop

To immediately stop all automation:
1. Add `do-not-merge` label to all open Dependabot PRs
2. Disable the workflow in GitHub Actions settings
3. Or delete/modify the workflow file

## Related Files

- `.github/dependabot.yml` - Dependabot configuration
- `.github/workflows/dependabot-major-automation.yml` - Automation workflow
- `.github/scripts/attempt-dependabot-fixes.sh` - Fix script
