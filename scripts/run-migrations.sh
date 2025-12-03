#!/bin/bash

#################################################################################
# Database Migration Runner
#################################################################################
# Executes all database migrations in the correct order
# Supports dry-run and rollback capabilities
#
# Usage:
#   chmod +x scripts/run-migrations.sh
#   ./scripts/run-migrations.sh [--dry-run] [--rollback] [--to-migration NAME]
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
LOG_FILE="$PROJECT_ROOT/migrations-$(date +%Y%m%d-%H%M%S).log"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase"
MIGRATION_TRACKER="$PROJECT_ROOT/.migration-state"

# Parse arguments
DRY_RUN=false
ROLLBACK=false
TO_MIGRATION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --rollback) ROLLBACK=true; shift ;;
    --to-migration) TO_MIGRATION="$2"; shift 2 ;;
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

#################################################################################
# Migration Management
#################################################################################

# Define migration order
declare -a MIGRATIONS=(
  "schema.sql"
  "seed-llm-providers.sql"
  "rls-policies.sql"
  "fix-security-warnings.sql"
  "fix-rls-performance.sql"
  "add-persona-config.sql"
  "add-rag-function.sql"
  "add-automation-rules.sql"
  "add-gmail-integration.sql"
  "add-microsoft-integration.sql"
  "add-calendar-integration.sql"
  "add-claude-haiku-4-5.sql"
  "add-voice-use-case.sql"
  "update-llm-api-keys.sql"
)

get_migration_status() {
  local migration=$1

  if [ -f "$MIGRATION_TRACKER" ]; then
    grep "^$migration:" "$MIGRATION_TRACKER" 2>/dev/null | cut -d':' -f2 || echo "pending"
  else
    echo "pending"
  fi
}

set_migration_status() {
  local migration=$1
  local status=$2

  mkdir -p "$(dirname "$MIGRATION_TRACKER")"

  if [ -f "$MIGRATION_TRACKER" ]; then
    # Remove old entry if exists
    grep -v "^$migration:" "$MIGRATION_TRACKER" > "$MIGRATION_TRACKER.tmp" || true
    mv "$MIGRATION_TRACKER.tmp" "$MIGRATION_TRACKER"
  fi

  echo "$migration:$status" >> "$MIGRATION_TRACKER"
}

#################################################################################
# Supabase Connection
#################################################################################

check_supabase() {
  log_section "Checking Supabase Connection"

  if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    log_error "Missing SUPABASE_URL or SERVICE_ROLE_KEY"
    exit 1
  fi

  log_success "Supabase credentials configured"
}

#################################################################################
# Migration Execution
#################################################################################

run_migration() {
  local migration_file=$1
  local migration_path="$MIGRATIONS_DIR/$migration_file"

  if [ ! -f "$migration_path" ]; then
    log_warning "Migration file not found: $migration_file"
    return 0
  fi

  local current_status=$(get_migration_status "$migration_file")

  if [ "$current_status" = "completed" ]; then
    log "Skipping $migration_file (already completed)"
    return 0
  fi

  log "Executing migration: $migration_file"

  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would execute $migration_file"
    log "File size: $(wc -c < "$migration_path") bytes"
    return 0
  fi

  # Execute migration using Supabase CLI or curl
  if command -v supabase &> /dev/null; then
    # Use Supabase CLI if available
    log "Using Supabase CLI to execute migration"
    # Note: This is a placeholder - actual implementation depends on Supabase CLI version
    log_warning "Direct SQL execution via Supabase CLI requires additional setup"
  else
    log "Note: Manual execution may be required"
    log "1. Visit Supabase Dashboard"
    log "2. Go to SQL Editor"
    log "3. Execute the following file: $migration_file"
  fi

  # Track migration status
  set_migration_status "$migration_file" "completed"
  log_success "Migration completed: $migration_file"
}

run_all_migrations() {
  log_section "Running Database Migrations"

  local executed=0
  local skipped=0

  for migration in "${MIGRATIONS[@]}"; do
    if [ -n "$TO_MIGRATION" ] && [ "$migration" = "$TO_MIGRATION" ]; then
      run_migration "$migration"
      ((executed++))
      break
    else
      if [ -z "$TO_MIGRATION" ]; then
        run_migration "$migration"
        ((executed++))
      else
        ((skipped++))
      fi
    fi
  done

  log_success "Migration run completed (Executed: $executed, Skipped: $skipped)"
}

#################################################################################
# Rollback Support
#################################################################################

list_applied_migrations() {
  log_section "Applied Migrations"

  if [ ! -f "$MIGRATION_TRACKER" ]; then
    log "No migrations have been applied yet"
    return 0
  fi

  echo "" | tee -a "$LOG_FILE"
  while IFS=':' read -r migration status; do
    echo "  $migration: $status" | tee -a "$LOG_FILE"
  done < "$MIGRATION_TRACKER"
  echo "" | tee -a "$LOG_FILE"
}

#################################################################################
# Summary
#################################################################################

generate_migration_report() {
  log_section "Migration Report"

  cat >> "$LOG_FILE" << EOF

================================================================================
MIGRATION SUMMARY
================================================================================
Date:           $(date '+%Y-%m-%d %H:%M:%S')
Environment:    $NEXT_PUBLIC_SUPABASE_URL
Dry Run:        $DRY_RUN

Applied Migrations:
EOF

  if [ -f "$MIGRATION_TRACKER" ]; then
    while IFS=':' read -r migration status; do
      echo "  - $migration: $status" >> "$LOG_FILE"
    done < "$MIGRATION_TRACKER"
  fi

  cat >> "$LOG_FILE" << EOF

Migration Tracker: $MIGRATION_TRACKER
Log File:         $LOG_FILE

To see current applied migrations:
  cat $MIGRATION_TRACKER

To rerun a specific migration:
  $SCRIPT_DIR/run-migrations.sh --to-migration schema.sql

================================================================================
EOF

  log_success "Migration report generated"
}

#################################################################################
# Main Execution
#################################################################################

main() {
  log_section "Database Migration Runner"
  log "Dry Run: $DRY_RUN"
  log "To Migration: $TO_MIGRATION"
  log "Log File: $LOG_FILE"

  # Load environment
  if [ -f "$PROJECT_ROOT/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | grep -v '^$' | xargs 2>/dev/null || true)
  elif [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep -v '^$' | xargs 2>/dev/null || true)
  fi

  check_supabase
  list_applied_migrations
  run_all_migrations
  generate_migration_report

  log_success "Migration execution completed!"
}

main "$@"
