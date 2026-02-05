#!/bin/bash
# Attempt to automatically fix common issues in Dependabot PRs
#
# This script is called by the dependabot-major-automation workflow
# to attempt automated repairs before failing a Dependabot PR.
#
# Exit codes:
#   0 - Changes were made and pushed
#   2 - No fixes were applied

set -e

# Configure git for github-actions[bot]
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

CHANGES_MADE=false

echo "=== Starting automated fix attempts ==="

# Function to check if there are uncommitted changes
check_changes() {
  git diff --quiet && git diff --cached --quiet
}

# Function to commit changes if any exist
commit_if_changed() {
  local message="$1"
  if ! check_changes; then
    git add -A
    git commit -m "$message"
    CHANGES_MADE=true
    echo " Committed: $message"
  fi
}

# Detect and run ESLint --fix
if [ -f "node_modules/.bin/eslint" ] || command -v eslint &> /dev/null; then
  echo " Running ESLint --fix..."
  if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yml" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
    npx eslint --fix . 2>/dev/null || true
    commit_if_changed "chore(deps): automated fix - eslint --fix"
  else
    echo "  No ESLint config found, skipping"
  fi
fi

# Detect and run Prettier --write
if [ -f "node_modules/.bin/prettier" ] || command -v prettier &> /dev/null; then
  echo " Running Prettier --write..."
  if [ -f ".prettierrc" ] || [ -f ".prettierrc.js" ] || [ -f ".prettierrc.json" ] || [ -f ".prettierrc.yml" ] || [ -f "prettier.config.js" ] || [ -f "prettier.config.mjs" ]; then
    npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md,yml,yaml}" --ignore-unknown 2>/dev/null || true
    commit_if_changed "chore(deps): automated fix - prettier --write"
  else
    echo "  No Prettier config found, skipping"
  fi
fi

# Run npm audit fix (non-force)
echo " Running npm audit fix..."
npm audit fix --no-fund 2>/dev/null || true

# Check if package.json or package-lock.json changed
if ! check_changes; then
  FILES_TO_ADD=()
  [ -f package.json ] && FILES_TO_ADD+=("package.json")
  [ -f package-lock.json ] && FILES_TO_ADD+=("package-lock.json")
  if [ ${#FILES_TO_ADD[@]} -gt 0 ]; then
    git add "${FILES_TO_ADD[@]}"
  fi
  if ! git diff --cached --quiet; then
    git commit -m "chore(deps): automated fix - npm audit fix"
    CHANGES_MADE=true
    echo " Committed: npm audit fix"
  fi
fi

# Run TypeScript check to see if there are any remaining errors
if [ -f "tsconfig.json" ]; then
  echo " Running TypeScript check..."
  npx tsc --noEmit || echo "  TypeScript errors remain (manual intervention may be needed)"
fi

# Push changes if any were made
if [ "$CHANGES_MADE" = true ]; then
  echo " Pushing changes to origin..."
  
  # Get the PR branch name
  BRANCH="${PR_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
  
  # Push to the Dependabot branch
  git push origin "HEAD:${BRANCH}" || {
    echo " Failed to push changes. This may be due to insufficient permissions."
    echo "   Ensure GITHUB_TOKEN or AUTOMERGE_PAT has write access to the repository."
    exit 1
  }
  
  echo " Successfully pushed fixes to ${BRANCH}"
  exit 0
else
  echo " No automatic fixes were applied"
  exit 2
fi
