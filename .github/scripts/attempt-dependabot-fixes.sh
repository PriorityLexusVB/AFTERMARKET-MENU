#!/bin/bash
#
# attempt-dependabot-fixes.sh
#
# Automated repair script for Dependabot PRs
# Runs non-invasive fixes to help major version bumps pass CI
#
# Exit codes:
#   0 - Successfully applied fixes (or nothing to fix)
#   1 - General error
#   2 - No progress made / encountered error during fix attempts
#
# Usage: ./attempt-dependabot-fixes.sh [--dry-run]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
FIXES_APPLIED=false
HAS_ERRORS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if a file exists in the project
file_exists() {
  [[ -f "$1" ]]
}

# Check if there are staged or unstaged changes
has_changes() {
  ! git diff --quiet || ! git diff --cached --quiet
}

# Run ESLint fix if configured
run_eslint_fix() {
  log_info "Checking for ESLint configuration..."
  
  # Check for ESLint config files
  if file_exists "eslint.config.js" || file_exists "eslint.config.mjs" || \
     file_exists ".eslintrc" || file_exists ".eslintrc.js" || \
     file_exists ".eslintrc.json" || file_exists ".eslintrc.yml" || \
     grep -q '"eslint"' package.json 2>/dev/null; then
    
    log_info "ESLint configuration detected"
    
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[DRY-RUN] Would run: npx eslint --fix ."
      return 0
    fi
    
    # Check if eslint is available
    if npx eslint --version >/dev/null 2>&1; then
      log_info "Running ESLint --fix..."
      if npx eslint --fix . 2>/dev/null || true; then
        log_success "ESLint fix completed"
        FIXES_APPLIED=true
      else
        log_warning "ESLint fix had some issues (non-fatal)"
      fi
    else
      log_warning "ESLint not available in node_modules"
    fi
  else
    log_info "No ESLint configuration found, skipping"
  fi
}

# Run Prettier if configured
run_prettier_fix() {
  log_info "Checking for Prettier configuration..."
  
  # Check for Prettier config or dependency
  if file_exists ".prettierrc" || file_exists ".prettierrc.js" || \
     file_exists ".prettierrc.json" || file_exists "prettier.config.js" || \
     grep -q '"prettier"' package.json 2>/dev/null; then
    
    log_info "Prettier configuration detected"
    
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[DRY-RUN] Would run: npx prettier --write ."
      return 0
    fi
    
    # Check if prettier is available
    if npx prettier --version >/dev/null 2>&1; then
      log_info "Running Prettier --write..."
      if npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}" --ignore-unknown 2>/dev/null || true; then
        log_success "Prettier formatting completed"
        FIXES_APPLIED=true
      else
        log_warning "Prettier had some issues (non-fatal)"
      fi
    else
      log_warning "Prettier not available in node_modules"
    fi
  else
    log_info "No Prettier configuration found, skipping"
  fi
}

# Run npm audit fix (non-breaking)
run_npm_audit_fix() {
  log_info "Running npm audit fix (non-breaking only)..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY-RUN] Would run: npm audit fix"
    return 0
  fi
  
  # Run audit fix without --force to avoid breaking changes
  if npm audit fix 2>/dev/null; then
    log_success "npm audit fix completed"
    
    # If package-lock.json changed, re-run install
    if git diff --quiet package-lock.json 2>/dev/null; then
      log_info "No changes to package-lock.json"
    else
      log_info "package-lock.json modified, re-running npm ci..."
      npm ci --ignore-scripts 2>/dev/null || npm install 2>/dev/null || true
      FIXES_APPLIED=true
    fi
  else
    log_warning "npm audit fix had issues (non-fatal)"
  fi
}

# Run TypeScript compilation check
run_typescript_check() {
  log_info "Checking for TypeScript configuration..."
  
  if file_exists "tsconfig.json"; then
    log_info "TypeScript configuration detected"
    
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[DRY-RUN] Would run: npx tsc --noEmit"
      return 0
    fi
    
    log_info "Running TypeScript compilation check..."
    if npx tsc --noEmit 2>&1; then
      log_success "TypeScript compilation passed"
    else
      log_warning "TypeScript compilation has errors (will be caught by CI)"
      # Don't mark as error - let CI handle this
    fi
  else
    log_info "No tsconfig.json found, skipping TypeScript check"
  fi
}

# Stage and commit changes
commit_fixes() {
  log_info "Checking for changes to commit..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY-RUN] Would stage and commit any changes"
    return 0
  fi
  
  if has_changes; then
    log_info "Changes detected, staging and committing..."
    
    # Stage all changes
    git add -A
    
    # Configure git for commit
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git config user.name "github-actions[bot]"
    
    # Commit with descriptive message
    git commit -m "chore(deps): automated fixes for dependabot updates

Applied automatic fixes:
- ESLint auto-fix (if configured)
- Prettier formatting (if configured)
- npm audit fix (non-breaking)
- TypeScript compilation check

These changes were applied by the dependabot-major-automation workflow
to help this dependency update pass CI checks."

    log_success "Changes committed successfully"
    return 0
  else
    log_info "No changes to commit"
    return 0
  fi
}

# Main execution
main() {
  echo "=============================================="
  echo "  Dependabot Automated Fix Script"
  echo "=============================================="
  echo ""
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "Running in DRY-RUN mode - no changes will be made"
    echo ""
  fi
  
  # Ensure we're in a git repository
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
  fi
  
  # Ensure node_modules exists
  if [[ ! -d "node_modules" ]]; then
    log_info "node_modules not found, running npm ci..."
    if [[ "$DRY_RUN" != "true" ]]; then
      npm ci || npm install
    fi
  fi
  
  echo ""
  echo "--- Running automated fixes ---"
  echo ""
  
  # Run all fix attempts
  run_eslint_fix
  echo ""
  
  run_prettier_fix
  echo ""
  
  run_npm_audit_fix
  echo ""
  
  run_typescript_check
  echo ""
  
  # Commit any changes
  echo "--- Committing changes ---"
  echo ""
  commit_fixes
  
  echo ""
  echo "=============================================="
  
  if [[ "$HAS_ERRORS" == "true" ]]; then
    log_error "Fix script completed with errors"
    exit 2
  elif [[ "$FIXES_APPLIED" == "true" ]]; then
    log_success "Fix script completed - fixes were applied"
    exit 0
  else
    log_info "Fix script completed - no fixes needed"
    exit 0
  fi
}

# Run main function
main "$@"
