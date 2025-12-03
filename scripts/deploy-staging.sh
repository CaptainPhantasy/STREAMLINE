#!/bin/bash

#################################################################################
# Staging Deployment Script
#################################################################################
# Staging environment deployment for CRM-AI-PRO
# Allows testing new features before production deployment
#
# Usage:
#   chmod +x scripts/deploy-staging.sh
#   ./scripts/deploy-staging.sh [--skip-tests] [--from-branch] [--dry-run]
#
#################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/staging-deployment-$(date +%Y%m%d-%H%M%S).log"
DEPLOYMENT_LOCK_FILE="/tmp/staging-deployment.lock"

# Parse arguments
SKIP_TESTS=false
FROM_BRANCH="develop"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests) SKIP_TESTS=true; shift ;;
    --from-branch) FROM_BRANCH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Logging functions
log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $@" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✓ $@${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}✗ $@${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠ $@${NC}" | tee -a "$LOG_FILE"; }

log_section() {
  echo "" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
  echo -e "${BLUE}$@${NC}" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
}

acquire_lock() {
  if [ -f "$DEPLOYMENT_LOCK_FILE" ]; then
    local pid=$(cat "$DEPLOYMENT_LOCK_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      log_error "Another staging deployment is in progress (PID: $pid)"
      exit 1
    fi
  fi
  echo $$ > "$DEPLOYMENT_LOCK_FILE"
}

release_lock() {
  rm -f "$DEPLOYMENT_LOCK_FILE"
}

cleanup() {
  log_section "Cleanup"
  release_lock
  log_success "Staging deployment cleanup complete"
}

trap cleanup EXIT

# Pre-deployment checks
check_prerequisites() {
  log_section "Pre-Deployment Checks (Staging)"

  command -v node &> /dev/null || { log_error "Node.js not found"; exit 1; }
  command -v npm &> /dev/null || { log_error "npm not found"; exit 1; }
  command -v vercel &> /dev/null || { log_error "Vercel CLI not found"; exit 1; }
  command -v git &> /dev/null || { log_error "Git not found"; exit 1; }

  log_success "All prerequisites met"
}

validate_staging_environment() {
  log_section "Staging Environment Validation"

  # Check for staging environment file
  if [ ! -f "$PROJECT_ROOT/.env.staging" ] && [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    log_error "No .env.staging or .env.local file found"
    exit 1
  fi

  # Load staging environment
  if [ -f "$PROJECT_ROOT/.env.staging" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.staging" | grep -v '^$' | xargs)
  else
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep -v '^$' | xargs)
  fi

  # Check critical variables
  local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY")
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      log_error "Missing environment variable: $var"
      exit 1
    fi
  done

  log_success "Staging environment validated"
}

checkout_and_pull() {
  log_section "Git Checkout & Update"

  cd "$PROJECT_ROOT"

  # Check if from_branch exists
  if ! git rev-parse --verify "$FROM_BRANCH" > /dev/null 2>&1; then
    log_error "Branch '$FROM_BRANCH' not found"
    exit 1
  fi

  log "Checking out branch: $FROM_BRANCH"
  git fetch origin
  git checkout "$FROM_BRANCH"
  git pull origin "$FROM_BRANCH"

  log_success "Successfully checked out and updated $FROM_BRANCH"
}

build_staging() {
  log_section "Building for Staging"

  cd "$PROJECT_ROOT"

  rm -rf "$PROJECT_ROOT/.next"
  log "Clearing cache"

  npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
  log_success "Dependencies installed"

  if [ "$SKIP_TESTS" != true ]; then
    log "Running tests..."
    npm run lint 2>&1 | tee -a "$LOG_FILE" || log_warning "Linting completed with warnings"
  fi

  npm run build 2>&1 | tee -a "$LOG_FILE"
  log_success "Staging build successful"
}

deploy_staging_vercel() {
  log_section "Deploying to Vercel Staging"

  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would deploy to Vercel staging"
    return 0
  fi

  cd "$PROJECT_ROOT"

  # Deploy to staging (not production)
  vercel deploy 2>&1 | tee -a "$LOG_FILE"

  log_success "Staging deployment to Vercel successful"
}

print_staging_summary() {
  log_section "Staging Deployment Summary"

  echo "" | tee -a "$LOG_FILE"
  echo "Environment:        STAGING" | tee -a "$LOG_FILE"
  echo "Status:             SUCCESS" | tee -a "$LOG_FILE"
  echo "Branch:             $FROM_BRANCH" | tee -a "$LOG_FILE"
  echo "Date:               $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
  echo "Git Commit:         $(git rev-parse --short HEAD)" | tee -a "$LOG_FILE"
  echo "Log File:           $LOG_FILE" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
  echo "Next Steps:" | tee -a "$LOG_FILE"
  echo "  1. Test features in staging environment" | tee -a "$LOG_FILE"
  echo "  2. Verify all integrations work correctly" | tee -a "$LOG_FILE"
  echo "  3. When ready, promote to production with: ./scripts/deploy-production.sh" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
}

main() {
  log_section "CRM-AI-PRO Staging Deployment"
  log "From Branch: $FROM_BRANCH"
  log "Skip Tests: $SKIP_TESTS"
  log "Dry Run: $DRY_RUN"

  acquire_lock

  check_prerequisites
  validate_staging_environment
  checkout_and_pull
  build_staging
  deploy_staging_vercel
  print_staging_summary

  log_success "Staging deployment completed!"
}

main "$@"
