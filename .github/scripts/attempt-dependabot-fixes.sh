#!/bin/bash
# Attempt to fix common issues in Dependabot PRs
# This script is called by the dependabot-major-automation workflow

set -e

FIXES_APPLIED=false
BRANCH="${GITHUB_HEAD_REF:-$(git rev-parse --abbrev-ref HEAD)}"

# Configure git user for github-actions[bot]
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

echo "::group::Git Configuration"
echo "Branch: $BRANCH"
git config --list | grep -E "^user\." || true
echo "::endgroup::"

# Function to commit changes if any
commit_if_changed() {
  local message="$1"
  if ! git diff --quiet || ! git diff --staged --quiet; then
    git add -A
    git commit -m "$message" || true
    FIXES_APPLIED=true
    echo "✅ Committed: $message"
  else
    echo "ℹ️ No changes to commit for: $message"
  fi
}

# Detect and run ESLint --fix if available
echo "::group::ESLint Fix"
if [ -f "node_modules/.bin/eslint" ] || command -v eslint &> /dev/null; then
  echo "Running eslint --fix..."
  npx eslint --fix . --ext .js,.jsx,.ts,.tsx 2>/dev/null || true
  commit_if_changed "fix: auto-fix ESLint issues"
else
  echo "ESLint not detected, skipping..."
fi
echo "::endgroup::"

# Detect and run Prettier --write if available
echo "::group::Prettier Fix"
if [ -f "node_modules/.bin/prettier" ] || command -v prettier &> /dev/null; then
  echo "Running prettier --write..."
  npx prettier --write "**/*.{js,jsx,ts,tsx,json,md,yml,yaml}" 2>/dev/null || true
  commit_if_changed "fix: auto-format with Prettier"
else
  echo "Prettier not detected, skipping..."
fi
echo "::endgroup::"

# Run npm audit fix (non-force)
echo "::group::NPM Audit Fix"
echo "Running npm audit fix..."
npm audit fix --audit-level=none 2>/dev/null || true
if ! git diff --quiet package.json package-lock.json 2>/dev/null; then
  commit_if_changed "fix: npm audit fix"
fi
echo "::endgroup::"

# Run TypeScript check if tsconfig.json present
echo "::group::TypeScript Check"
if [ -f "tsconfig.json" ]; then
  echo "Running tsc --noEmit..."
  npx tsc --noEmit 2>&1 || echo "TypeScript errors detected (may need manual fixes)"
else
  echo "No tsconfig.json found, skipping TypeScript check..."
fi
echo "::endgroup::"

# Push commits to the Dependabot branch
echo "::group::Push Changes"
if [ "$FIXES_APPLIED" = true ]; then
  echo "Pushing commits to origin HEAD:$BRANCH..."
  git push origin "HEAD:$BRANCH" || {
    echo "::warning::Failed to push changes. GITHUB_TOKEN may lack permissions."
    exit 1
  }
  echo "✅ Changes pushed successfully"
  exit 0
else
  echo "ℹ️ No fixes were applied"
  exit 2
fi
echo "::endgroup::"
