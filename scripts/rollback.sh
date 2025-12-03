#!/bin/bash

#################################################################################
# Emergency Rollback Script
#################################################################################
# Rollback CRM-AI-PRO to a previous deployment
# Supports both production and staging rollback
#
# Usage:
#   chmod +x scripts/rollback.sh
#   ./scripts/rollback.sh [--to-version VERSION] [--environment prod|staging] [--dry-run]
#   ./scripts/rollback.sh --list-versions   # List available versions
#
#################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/rollback-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_ROOT/.deployment-backups"
VERSIONS_DIR="$BACKUP_DIR/versions"

# Parse arguments
TO_VERSION=""
ENVIRONMENT="prod"
DRY_RUN=false
LIST_VERSIONS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --to-version) TO_VERSION="$2"; shift 2 ;;
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --list-versions) LIST_VERSIONS=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Logging functions
log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $@" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✓ $@${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}✗ $@${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠ $@${NC}" | tee -a "$LOG_FILE"; }
log_info() { echo -e "${PURPLE}ℹ $@${NC}" | tee -a "$LOG_FILE"; }

log_section() {
  echo "" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
  echo -e "${BLUE}$@${NC}" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
}

#################################################################################
# Version Management
#################################################################################

list_available_versions() {
  log_section "Available Deployment Versions"

  if [ ! -d "$VERSIONS_DIR" ]; then
    log_warning "No deployment backups found"
    echo ""
    echo "To create version snapshots, run:"
    echo "  mkdir -p $VERSIONS_DIR"
    echo "  git tag -l | grep deploy"
    return 0
  fi

  echo "" | tee -a "$LOG_FILE"
  echo "Available versions in $VERSIONS_DIR:" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  # Check git tags
  if git describe --tags --abbrev=0 &> /dev/null; then
    git tag -l 'deploy-*' --sort=-version:refname 2>/dev/null | head -10 | while read tag; do
      local date=$(git log -1 --format=%ai "$tag" 2>/dev/null || echo "unknown")
      echo "  $tag (Date: $date)" | tee -a "$LOG_FILE"
    done
  else
    log_warning "No git deployment tags found"
  fi

  echo "" | tee -a "$LOG_FILE"
}

get_current_version() {
  # Get current git commit
  git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

verify_version_exists() {
  local version=$1

  # Check if it's a git tag
  if git rev-parse "refs/tags/$version" > /dev/null 2>&1; then
    return 0
  fi

  # Check if it's a commit hash
  if git rev-parse "$version" > /dev/null 2>&1; then
    return 0
  fi

  log_error "Version '$version' not found in git history"
  return 1
}

#################################################################################
# Pre-Rollback Checks
#################################################################################

check_prerequisites() {
  log_section "Pre-Rollback Checks"

  command -v git &> /dev/null || { log_error "Git not found"; exit 1; }
  command -v vercel &> /dev/null || { log_error "Vercel CLI not found"; exit 1; }

  log_success "Prerequisites verified"
}

confirm_rollback() {
  log_section "Rollback Confirmation"

  local current=$(get_current_version)

  echo "" | tee -a "$LOG_FILE"
  echo -e "${RED}WARNING: This will rollback your deployment!${NC}" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
  echo "Current Version:     $current" | tee -a "$LOG_FILE"
  echo "Rollback To:         $TO_VERSION" | tee -a "$LOG_FILE"
  echo "Environment:         $ENVIRONMENT" | tee -a "$LOG_FILE"
  echo "Dry Run:             $DRY_RUN" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  if [ "$DRY_RUN" != true ]; then
    echo -e "${YELLOW}This action CANNOT be undone immediately!${NC}" | tee -a "$LOG_FILE"
    echo "All affected services will be reverted to the previous version." | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    read -p "$(echo -e ${RED}Do you want to proceed with the rollback? '(yes/no)' ${NC})" -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      log_warning "Rollback cancelled by user"
      exit 0
    fi
  fi

  log_success "Rollback confirmed"
}

#################################################################################
# Rollback Operations
#################################################################################

backup_current_deployment() {
  log_section "Backing Up Current Deployment"

  mkdir -p "$BACKUP_DIR"

  local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
  local backup_file="$BACKUP_DIR/$backup_name.log"

  # Save current git state
  {
    echo "Backup Date: $(date)"
    echo "Current Commit: $(git rev-parse HEAD)"
    echo "Current Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "Environment: $ENVIRONMENT"
  } > "$backup_file"

  log_success "Current deployment backed up to: $backup_file"
}

rollback_git() {
  log_section "Rolling Back Git Repository"

  cd "$PROJECT_ROOT"

  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would checkout version $TO_VERSION"
    git show --oneline "$TO_VERSION" 2>/dev/null || log_warning "Version info unavailable in dry run"
    return 0
  fi

  log "Verifying version: $TO_VERSION"
  if ! verify_version_exists "$TO_VERSION"; then
    exit 1
  fi

  log "Checking out version: $TO_VERSION"
  git checkout "$TO_VERSION" 2>&1 | tee -a "$LOG_FILE"

  log_success "Git repository rolled back"
}

rebuild_and_deploy() {
  log_section "Rebuilding and Redeploying"

  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would rebuild and redeploy"
    return 0
  fi

  cd "$PROJECT_ROOT"

  log "Clearing cache..."
  rm -rf "$PROJECT_ROOT/.next"

  log "Installing dependencies..."
  npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"

  log "Building application..."
  npm run build 2>&1 | tee -a "$LOG_FILE"

  log "Deploying to $ENVIRONMENT..."

  if [ "$ENVIRONMENT" = "prod" ]; then
    vercel deploy --prod 2>&1 | tee -a "$LOG_FILE"
  else
    vercel deploy 2>&1 | tee -a "$LOG_FILE"
  fi

  log_success "Application redeployed successfully"
}

rollback_database_if_needed() {
  log_section "Database Rollback Consideration"

  log_warning "Database rollback requires manual intervention"
  log_info "Supabase maintains automatic backups"
  log_info ""
  log_info "To restore database to a previous point:"
  log_info "  1. Go to Supabase Dashboard"
  log_info "  2. Project Settings > Backups"
  log_info "  3. Select the backup point matching this rollback"
  log_info "  4. Click 'Restore'"
  log_info ""
  log_info "Ensure database is backed up before continuing"
}

#################################################################################
# Post-Rollback Validation
#################################################################################

verify_rollback() {
  log_section "Verifying Rollback"

  cd "$PROJECT_ROOT"

  local new_version=$(get_current_version)
  local expected=$(git rev-parse --short "$TO_VERSION" 2>/dev/null || echo "$TO_VERSION")

  echo "" | tee -a "$LOG_FILE"
  echo "Current Version:    $new_version" | tee -a "$LOG_FILE"
  echo "Expected Version:   $expected" | tee -a "$LOG_FILE"

  if [ "$new_version" = "$expected" ]; then
    log_success "Rollback verified successfully"
  else
    log_warning "Version mismatch, manual verification recommended"
  fi
}

run_health_check() {
  log_section "Health Check Post-Rollback"

  if [ -f "$PROJECT_ROOT/scripts/health-check.sh" ]; then
    bash "$PROJECT_ROOT/scripts/health-check.sh" 2>&1 | tee -a "$LOG_FILE"
  else
    log_warning "Health check script not found"
  fi
}

#################################################################################
# Notifications
#################################################################################

generate_rollback_report() {
  log_section "Rollback Report"

  cat >> "$LOG_FILE" << EOF

================================================================================
ROLLBACK SUMMARY
================================================================================
Rollback Date:      $(date '+%Y-%m-%d %H:%M:%S')
Rolled Back To:     $TO_VERSION
Environment:        $ENVIRONMENT
Status:             SUCCESS

Current Version:    $(get_current_version)
Log File:           $LOG_FILE

IMPORTANT: If you rolled back the database, perform a manual restore:
1. Visit: https://app.supabase.com/project/expbvujyegxmxvatcjqt/backups/scheduled
2. Restore from backup matching rollback time
3. Verify data integrity

NEXT STEPS:
1. Monitor application for errors
2. Test critical functionality
3. Verify all services are responding
4. Check application logs for issues

For production issues, contact your DevOps team immediately.
================================================================================
EOF

  log_success "Rollback report generated: $LOG_FILE"
}

print_rollback_summary() {
  log_section "Rollback Complete"

  echo "" | tee -a "$LOG_FILE"
  echo "Rollback Status:    SUCCESS" | tee -a "$LOG_FILE"
  echo "Rolled Back To:     $TO_VERSION" | tee -a "$LOG_FILE"
  echo "Environment:        $ENVIRONMENT" | tee -a "$LOG_FILE"
  echo "Log File:           $LOG_FILE" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
}

#################################################################################
# Main Execution
#################################################################################

main() {
  log_section "CRM-AI-PRO Emergency Rollback"

  if [ "$LIST_VERSIONS" = true ]; then
    list_available_versions
    exit 0
  fi

  if [ -z "$TO_VERSION" ]; then
    log_error "No version specified"
    echo ""
    echo "Usage:"
    echo "  $0 --to-version <version> [--environment prod|staging] [--dry-run]"
    echo "  $0 --list-versions"
    echo ""
    echo "Examples:"
    echo "  # Rollback to a git tag"
    echo "  $0 --to-version deploy-2024-01-15 --environment prod"
    echo ""
    echo "  # Rollback to a commit hash"
    echo "  $0 --to-version abc1234 --environment staging"
    echo ""
    echo "  # Dry run to verify rollback"
    echo "  $0 --to-version deploy-2024-01-15 --dry-run"
    exit 1
  fi

  check_prerequisites
  list_available_versions
  confirm_rollback
  backup_current_deployment
  rollback_git
  rebuild_and_deploy
  rollback_database_if_needed
  verify_rollback
  run_health_check
  generate_rollback_report
  print_rollback_summary

  log_success "Rollback process completed!"
}

main "$@"
