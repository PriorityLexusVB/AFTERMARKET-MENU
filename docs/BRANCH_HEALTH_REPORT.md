# Branch Health Automation

This document describes the automated branch health management system for this repository.

## Overview

The branch health automation provides:

1. **Branch Discovery & Classification** - Enumerates and classifies all branches
2. **Merge Status Analysis** - Identifies merged, unmerged, and conflicting branches
3. **Staleness Detection** - Finds branches that haven't been updated recently
4. **Automated Actions** - Safe deletion and PR creation with dry-run support
5. **Reporting** - JSON and Markdown reports for review

## Quick Start

### Running Manually

The workflow can be triggered manually from the GitHub Actions tab:

1. Go to **Actions** → **Branch Health**
2. Click **Run workflow**
3. Select options:
   - **Mode**: `dry-run` (default) or `apply`
   - **Verbose**: Enable for detailed logging
   - **Post to issue**: Optionally post report to an issue

### Scheduled Runs

The workflow runs automatically every Monday at 06:00 UTC in dry-run mode.

## Configuration

Configuration is stored in `.github/branch-health.yml`:

```yaml
# Staleness thresholds in days
staleness:
  warning: 30   # Days before warning
  stale: 60     # Days before considered stale
  critical: 90  # Days before critical

# Branches to never delete or flag
ignoreBranches:
  - main
  - master
  - develop
  - release/*
  - hotfix/*

# Auto-merge settings
autoMerge:
  enabled: false
  requireStatusChecks: true
  requireNoConflicts: true
  fastForwardOnly: true

# Auto-delete settings
autoDelete:
  enabled: false
  requireMerged: true
  safeToDeletePatterns:
    - temp/*
    - experiment/*
  minAgeDays: 7

# Always dry-run by default
dryRun: true

# Report settings
reporting:
  json: true
  markdown: true
```

## Permissions Required

The workflow requires these permissions:

| Permission | Scope | Purpose |
|------------|-------|---------|
| `contents` | `write` | Delete branches (when apply mode) |
| `pull-requests` | `write` | Create/update PRs |
| `issues` | `write` | Post report comments |

## Running Locally

You can run the analysis locally:

```bash
# Install dependencies
npm ci

# Run in dry-run mode
npx tsx scripts/branch-health.ts --dry-run

# Run with verbose output
npx tsx scripts/branch-health.ts --dry-run --verbose

# Apply actions (delete merged branches, etc.)
npx tsx scripts/branch-health.ts --apply
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Report only, no modifications (default) |
| `--apply` | Apply safe actions |
| `--config <path>` | Config file path (default: `.github/branch-health.yml`) |
| `--output <dir>` | Output directory (default: `./branch-health-reports`) |
| `--verbose`, `-v` | Enable verbose logging |
| `--help`, `-h` | Show help |

## Branch Classification

Branches are classified into these categories:

### Merge Status

| Status | Description |
|--------|-------------|
| `merged` | All commits are in the default branch |
| `unmerged` | Has commits not in default branch |
| `in-conflict` | Would have merge conflicts |
| `protected` | GitHub branch protection enabled |
| `ignored` | Matches ignore pattern in config |

### Staleness Level

| Level | Description |
|-------|-------------|
| `active` | Updated within warning threshold |
| `warning` | Updated 30-60 days ago (configurable) |
| `stale` | Updated 60-90 days ago (configurable) |
| `critical` | Not updated in 90+ days (configurable) |

### Proposed Actions

| Action | Description |
|--------|-------------|
| `keep` | No action needed |
| `open-pr` | Should open a PR to merge changes |
| `update-pr` | Existing PR needs updates |
| `auto-merge` | Safe for automatic merge |
| `delete` | Safe to delete |
| `review` | Needs manual review |

## Reports

### JSON Report

Located at `branch-health-reports/branch-health-report.json`, contains:

- Full branch information
- Ahead/behind counts
- Merge status
- Proposed actions
- Summary statistics

### Markdown Report

Located at `branch-health-reports/branch-health-report.md`, includes:

- Summary table
- Branch details table
- Actions taken
- Stale branches requiring attention
- Branches ahead of default

## Safety Features

The automation includes several safety measures:

1. **Dry-run by default** - No changes unless explicitly requested
2. **Protected branch detection** - Never modifies protected branches
3. **Configurable ignore patterns** - Exclude important branches
4. **Minimum age requirement** - Only delete branches older than threshold
5. **Merged-only deletion** - By default, only delete fully merged branches
6. **Conflict detection** - Identifies branches that would conflict

## Workflow Integration

The branch health check integrates with other workflows:

- **CI**: Runs independently, doesn't block CI
- **Dependabot**: Works alongside Dependabot automation
- **CodeQL**: Doesn't interfere with security scanning

## Troubleshooting

### Report shows 0 branches

Ensure the checkout step uses `fetch-depth: 0` to get full history.

### API rate limiting

The script uses GitHub API for some operations. For large repos, consider running less frequently.

### Permission denied

Ensure the workflow has the required permissions and `GITHUB_TOKEN` is available.

## See Also

- [GitHub Actions Workflow](/.github/workflows/branch-health.yml)
- [Configuration File](/.github/branch-health.yml)
- [Branch Health Script](/scripts/branch-health.ts)
