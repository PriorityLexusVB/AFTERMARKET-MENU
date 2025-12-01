# Dependabot Automation Documentation

This document describes the automated workflow for handling Dependabot pull requests, including auto-fix attempts and auto-merge capabilities.

## Overview

The Dependabot automation workflow (`dependabot-major-automation.yml`) automatically processes Dependabot PRs by:

1. Running the standard CI checks (install, build, test, lint, TypeScript)
2. Attempting automated fixes if initial checks fail
3. Auto-merging PRs when all checks pass (if permitted)

## Workflow Behavior

### Trigger Conditions

The workflow triggers on:
- `pull_request` events: `opened`, `synchronize`, `labeled`, `unlabeled`
- Only runs for PRs authored by `dependabot[bot]`

### Node.js Matrix

The workflow runs on a matrix of Node.js versions:
- Node.js 20 (LTS)
- Node.js 24

### Check Sequence

1. **Initial Checks**
   - `npm ci` - Install dependencies
   - `npm run build` - Build the application (if script exists)
   - `npm run test:run` or `npm test` - Run tests (if script exists)
   - `npm run lint` - Run linter (if script exists)
   - `tsc --noEmit` - TypeScript type checking (if `tsconfig.json` exists)

2. **Auto-fix Attempt** (if initial checks fail)
   - ESLint `--fix` for auto-fixable lint errors
   - Prettier `--write` for formatting issues
   - `npm audit fix` for security vulnerabilities
   - Changes are committed and pushed back to the PR branch

3. **Re-test** (after fixes)
   - All checks are re-run to verify fixes worked

4. **Auto-merge** (if all checks pass)
   - PR is merged using squash merge method

## Opt-Out Labels

### `do-not-autofix`

Add this label to prevent the workflow from attempting automated fixes.

**Use when:**
- You want to review and fix issues manually
- The automated fixes might cause unintended changes
- You're working on the PR and don't want interference

### `do-not-merge`

Add this label to prevent the workflow from auto-merging the PR.

**Use when:**
- You want to review the changes before merging
- There are additional manual checks needed
- You want to batch multiple dependency updates

## Permissions Required

### Workflow Permissions

The workflow requires the following permissions:

```yaml
permissions:
  contents: write      # To push fixes back to the PR branch
  pull-requests: write # To post comments and merge PRs
  checks: write        # To create check runs
```

### GITHUB_TOKEN Limitations

The default `GITHUB_TOKEN` may have limitations:

1. **Cannot push to protected branches** - If the PR's base branch has protection rules
2. **Cannot merge PRs** - Some repositories require elevated permissions

### Setting Up AUTOMERGE_PAT

If the workflow reports merge failures due to permissions:

1. **Create a Personal Access Token (PAT)**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a new token with `repo` scope (or `public_repo` for public repositories)
   - Set an appropriate expiration

2. **Add the secret to your repository**
   - Go to Repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AUTOMERGE_PAT`
   - Value: Your PAT

3. **Re-run the workflow**
   - The workflow will now use the PAT for merge operations

## Checks & Balances

### Safety Measures

1. **Respects Branch Protection**
   - The workflow does not bypass branch protection rules
   - Required reviews and status checks still apply

2. **Matrix Testing**
   - Tests run on multiple Node.js versions to catch compatibility issues

3. **Conservative Fixes**
   - `npm audit fix` runs without `--force` to avoid breaking changes
   - Only well-known tools (ESLint, Prettier) are used for auto-fixes

4. **Transparency**
   - All actions are logged in the workflow run
   - Summary comments are posted on each PR

### When Auto-merge is Blocked

The workflow will NOT auto-merge when:

- `do-not-merge` label is present
- Any check fails after fix attempts
- Branch protection rules require reviews
- Insufficient token permissions

### Manual Intervention Required

You may need to manually intervene when:

1. **TypeScript errors** - Type errors often require code changes
2. **Breaking API changes** - Major version bumps may need code updates
3. **Test failures** - Failed tests may indicate incompatibilities
4. **Complex lint errors** - Some lint issues can't be auto-fixed

## Troubleshooting

### Workflow Not Running

- Verify the PR author is `dependabot[bot]`
- Check that the workflow file exists in the default branch
- Ensure Actions are enabled for the repository

### Fixes Not Being Pushed

- Check if `GITHUB_TOKEN` has write access
- Verify branch protection allows the GitHub Actions bot
- Consider using `AUTOMERGE_PAT` for elevated permissions

### Merge Failing

- Check workflow logs for specific error messages
- Verify branch protection requirements are met
- Ensure `AUTOMERGE_PAT` is set if using protected branches

## Dependabot Groups

The `dependabot.yml` configuration groups related dependencies:

| Group | Packages |
|-------|----------|
| `react-and-types` | React, React DOM, and their type definitions |
| `ci-actions` | GitHub Actions and related packages |
| `dev-dependencies` | Testing tools (Vitest, Playwright), ESLint, Prettier |
| `production-dependencies` | Vite, Tailwind, Express, Zod, Google packages |
| `misc` | All other packages not in the above groups |

## Related Files

- `.github/dependabot.yml` - Dependabot configuration
- `.github/workflows/dependabot-major-automation.yml` - Automation workflow
- `.github/scripts/attempt-dependabot-fixes.sh` - Fix script

## Consolidated from PRs #48, #49, #50

This automation was consolidated from multiple Copilot-created PRs:
- PR #48: `copilot/add-dependabot-config-and-workflow`
- PR #49: `copilot/implement-dependabot-grouping` (canonical)
- PR #50: `copilot/add-dependabot-grouping-workflow`

For the consolidation process, see PR #51.
