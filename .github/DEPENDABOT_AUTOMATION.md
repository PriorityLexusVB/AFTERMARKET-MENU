# Dependabot Automation Documentation

This document describes the automated Dependabot management system for the Priority Lexus Aftermarket Menu repository.

## Overview

The automation system provides:

1. **Intelligent Dependency Grouping** - Related packages are grouped together to minimize PR noise
2. **Automated CI Checks** - Build, test, and lint validation for all dependency updates
3. **Automated Repairs** - Attempts to fix minor issues automatically
4. **Auto-Merge Capability** - Merges PRs when all checks pass
5. **Transparency** - Detailed comments on all automation actions

## Configuration Files

### `.github/dependabot.yml`

Configures Dependabot's behavior:

- **Schedule**: Daily checks at 6:00 AM EST
- **Package Ecosystem**: npm and GitHub Actions
- **Rebase Strategy**: Automatic rebasing to keep branches current
- **PR Limits**: 15 npm PRs, 5 GitHub Actions PRs

### Dependency Groups

| Group | Packages | Purpose |
|-------|----------|---------|
| `react-and-types` | react, react-dom, @types/react, @types/react-dom | Core React packages that should update together |
| `dev-dependencies` | vitest, @vitest/*, playwright, @playwright/*, tsx, firebase-admin, eslint, prettier | Development and testing tools |
| `production-dependencies` | vite, @vitejs/*, tailwindcss, express, zod, @google/* | Build and runtime dependencies |
| `ci-actions` | actions/*, github/*, @actions/* | GitHub Actions workflows |
| `misc` | Everything else | Catch-all group |

### `.github/workflows/dependabot-major-automation.yml`

The main automation workflow that:

1. Validates PR conditions (is it from Dependabot? Are there opt-out labels?)
2. Runs CI checks (typecheck, tests, build)
3. Attempts automated repairs if checks fail
4. Auto-merges when all checks pass
5. Posts detailed summary comments

### `.github/scripts/attempt-dependabot-fixes.sh`

Automated repair script that runs:

1. **ESLint --fix** (if ESLint is configured)
2. **Prettier --write** (if Prettier is configured)
3. **npm audit fix** (non-breaking fixes only)
4. **tsc --noEmit** (TypeScript compilation check)

## How It Works

### Workflow Triggers

The automation runs when:
- A PR is opened by `dependabot[bot]`
- A PR from Dependabot is synchronized (new commits pushed)
- Manual trigger via workflow_dispatch

### Decision Flow

```
PR Opened by Dependabot
         │
         ▼
   Has opt-out label?  ──YES──▶ Skip automation
         │
         NO
         ▼
   Run CI Checks
         │
         ├── All Pass ──▶ Auto-merge ──▶ Post success comment
         │
         └── Some Fail
               │
               ▼
         Attempt Repairs
               │
               ▼
         Re-run CI Checks
               │
               ├── All Pass ──▶ Auto-merge ──▶ Post success comment
               │
               └── Still Fail ──▶ Post failure comment
```

### Checks Performed

1. **TypeScript Type Checking** (`npm run typecheck`)
2. **Unit Tests** (`npm run test:run`)
3. **Build** (`npm run build`)

### Auto-Merge Conditions

The PR will be auto-merged when:
- ✅ PR is from `dependabot[bot]`
- ✅ No `do-not-autofix` or `do-not-merge` labels present
- ✅ All CI checks pass (either initially or after repairs)
- ✅ No branch protection rules require human review

### Merge Method

PRs are merged using **squash merge** with a standardized commit message that includes:
- Original PR title
- PR number reference
- Automation attribution

## Opt-Out Options

### Per-PR Opt-Out

Add these labels to specific PRs to control automation:

| Label | Effect |
|-------|--------|
| `do-not-autofix` | Prevents automated repair attempts |
| `do-not-merge` | Prevents automated merging (even if all checks pass) |

### Global Opt-Out

To disable automation entirely:
1. Remove or rename the workflow file
2. Or set `enabled: false` in the workflow

## Permissions

### Required Workflow Permissions

```yaml
permissions:
  contents: write      # To push repair commits and merge PRs
  pull-requests: write # To post comments and merge PRs
  checks: read         # To read check status
  statuses: read       # To read commit status
```

### Branch Protection Considerations

If your repository has branch protection rules that:
- Require pull request reviews
- Require specific status checks
- Restrict who can push to protected branches

The automated merge may fail. In this case:

1. **Option A**: Manually review and merge the PR
2. **Option B**: Create a Personal Access Token (PAT) with `repo` scope
   - Store it as a repository secret named `AUTOMERGE_PAT`
   - Update the workflow to use this token for merges

### Setting Up AUTOMERGE_PAT (Optional)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a new token with `repo` scope
3. In repository Settings → Secrets and variables → Actions
4. Add new repository secret named `AUTOMERGE_PAT`
5. Update workflow to use `secrets.AUTOMERGE_PAT` instead of `secrets.GITHUB_TOKEN`

## Troubleshooting

### "Branch protection prevented merge"

This is expected if:
- Required reviews are configured
- Required status checks haven't passed
- The GITHUB_TOKEN doesn't have sufficient permissions

**Solution**: Either approve the PR manually or configure AUTOMERGE_PAT.

### "Tests still failing after repairs"

The automated repairs are non-invasive and may not fix all issues. Common scenarios:
- Breaking API changes require manual code updates
- New peer dependency requirements
- Configuration changes needed

**Solution**: Review the failing tests and make manual fixes.

### Workflow not triggering

Check that:
- The PR author is exactly `dependabot[bot]`
- The workflow file is in the default branch
- GitHub Actions are enabled for the repository

## Security Considerations

### What the automation WILL do:
- Run ESLint with auto-fix
- Run Prettier formatting
- Run non-breaking npm audit fixes
- Commit and push to the Dependabot branch

### What the automation will NOT do:
- Run `npm audit fix --force` (breaking changes)
- Modify source code beyond linting/formatting
- Override branch protections
- Merge PRs with failing required checks
- Process PRs from non-Dependabot users

### Audit Trail

All automation actions are logged:
- Workflow run logs in GitHub Actions
- Comments posted on PRs
- Commit messages identify automated changes

## Example Comment Output

### Success

```markdown
## 🎉 Dependabot PR Auto-Merged

**PR:** deps: bump react from 18.2.0 to 18.3.0
**Merge Commit:** `abc1234`

### ✅ CI Checks Passed
- TypeScript type checking
- Unit tests
- Build

---
*This PR was automatically merged by the Dependabot Major Automation workflow.*
```

### Failure

```markdown
## ❌ Dependabot PR Automation - Checks Failed

The automated workflow was unable to merge this PR due to failing CI checks.

### 📊 CI Results
| Check | Status |
|-------|--------|
| TypeScript | ✅ Passed |
| Tests | ❌ Failed |
| Build | ✅ Passed |

### 📋 Manual Steps Required
1. Review the failing CI logs above
2. Check if breaking changes require code updates
3. Review the dependency changelog for migration guides
4. Make necessary manual fixes and push to this branch

---
*This comment was posted by the Dependabot Major Automation workflow.*
```

## Maintenance

### Updating the Configuration

1. Edit `.github/dependabot.yml` to modify grouping or schedule
2. Edit `.github/workflows/dependabot-major-automation.yml` to modify automation logic
3. Edit `.github/scripts/attempt-dependabot-fixes.sh` to add new repair strategies

### Monitoring

- Check the Actions tab for workflow run history
- Review PR comments for automation outcomes
- Monitor repository insights for dependency update patterns

## Support

For issues with the automation:

1. Check the workflow run logs in GitHub Actions
2. Review the comments posted on the PR
3. Ensure labels are correctly applied
4. Verify repository permissions and secrets are configured
