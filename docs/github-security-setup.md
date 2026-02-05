# GitHub Security Setup Guide

This document describes the security automation configured for this repository and the manual settings that need to be enabled in GitHub.

## Configured via Repository Files

The following security automation has been configured via files in this repository:

### `.github/dependabot.yml`

Dependabot is configured to automatically check for dependency updates:

- **npm ecosystem** (directory: `/`)

  - Scans `package.json` and `package-lock.json` for JavaScript/TypeScript dependency updates
  - Schedule: Weekly on Mondays at 9:00 AM ET
  - Groups production and development dependency updates to reduce PR noise
  - Labels PRs with `dependencies`

- **github-actions ecosystem** (directory: `/`)
  - Scans GitHub Actions workflow files for action version updates
  - Schedule: Monthly on Mondays at 9:00 AM ET
  - Groups all action updates together
  - Labels PRs with `dependencies` and `github-actions`

### `.github/workflows/codeql.yml`

CodeQL static analysis is configured to scan for security vulnerabilities:

- **Languages analyzed**: `javascript-typescript`
- **Triggers**:
  - On push to `main` branch
  - On pull requests targeting `main` branch
  - Weekly scheduled scan (Mondays at 5:00 AM UTC)
- **Uses GitHub's Autobuild** to automatically detect and build the project

## Must Be Enabled Manually in GitHub Settings

To fully activate security features, the following settings need to be enabled in the GitHub repository settings:

### Navigate to: Settings  Code security and analysis

Enable the following features:

1. **Dependency graph** 

   - Required for Dependabot to function
   - Usually enabled by default for public repositories

2. **Dependabot alerts** 

   - Alerts you when vulnerabilities are found in your dependencies
   - Recommended: Enable

3. **Dependabot security updates** 

   - Automatically creates PRs to fix vulnerable dependencies
   - Recommended: Enable

4. **Dependabot version updates** 

   - Uses the `dependabot.yml` configuration in this repo
   - Recommended: Enable (should work automatically once the file is present)

5. **Code scanning** 

   - Enable the CodeQL workflow added to this repo
   - Option 1: Use "Default setup" if offered
   - Option 2: The workflow file `.github/workflows/codeql.yml` will be detected automatically

6. **Secret scanning** 

   - Scans for accidentally committed secrets (API keys, tokens, etc.)
   - Recommended: Enable

7. **Push protection** 
   - Prevents pushing commits that contain secrets
   - Recommended: Enable

### Note on GitHub Advanced Security

Some features may require **GitHub Advanced Security** to be enabled for your organization:

- Private repositories may need Advanced Security license for:
  - CodeQL / Code scanning
  - Secret scanning
  - Push protection

For public repositories, these features are generally available for free.

## Verification Steps

After enabling the settings above:

1. **Verify Dependabot**:

   - Go to "Insights"  "Dependency graph"  "Dependabot" tab
   - You should see the configured ecosystems listed

2. **Verify CodeQL**:

   - Go to "Security"  "Code scanning alerts"
   - The CodeQL workflow should run on the next push to `main` or PR

3. **Verify Secret Scanning**:
   - Go to "Security"  "Secret scanning alerts"
   - This page should be accessible if secret scanning is enabled

## Troubleshooting

### Dependabot PRs not appearing

- Ensure "Dependabot version updates" is enabled in settings
- Wait up to 24 hours for the first scan to complete
- Check the Dependabot logs in "Insights"  "Dependency graph"

### CodeQL workflow not running

- Ensure the workflow file is in the `main` branch
- Check "Actions" tab for any workflow run errors
- Verify the repository has "Actions" enabled

### Secret scanning not working

- May require GitHub Advanced Security for private repositories
- Ensure "Secret scanning" is enabled in settings

## CI secrets (Playwright E2E)

The CI workflow [.github/workflows/ci.yml](../.github/workflows/ci.yml) can run Playwright E2E tests using Firebase credentials when available.

Add these as GitHub repository secrets (Settings  Secrets and variables  Actions) if you want E2E to run against a real Firebase config:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `TEST_FIRESTORE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

If these secrets are not set (or the workflow is running from a fork PR), the workflow will still run and will execute E2E in demo/mock mode.
