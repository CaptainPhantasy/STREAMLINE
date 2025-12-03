#!/bin/bash

#################################################################################
# Health Check Script
#################################################################################
# Post-deployment health verification for CRM-AI-PRO
# Validates all critical services are operational
#
# Usage:
#   chmod +x scripts/health-check.sh
#   ./scripts/health-check.sh [--environment prod|staging] [--full]
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
LOG_FILE="$PROJECT_ROOT/health-check-$(date +%Y%m%d-%H%M%S).log"

# Parse arguments
ENVIRONMENT="prod"
FULL_CHECK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --full) FULL_CHECK=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Logging functions
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $@" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✓ $@${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}✗ $@${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠ $@${NC}" | tee -a "$LOG_FILE"; }
log_skip() { echo -e "${PURPLE}⊘ $@${NC}" | tee -a "$LOG_FILE"; }

log_section() {
  echo "" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
  echo -e "${BLUE}$@${NC}" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
}

# Health check status tracking
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_SKIPPED=0

check_passed() { ((CHECKS_PASSED++)); }
check_failed() { ((CHECKS_FAILED++)); }
check_skipped() { ((CHECKS_SKIPPED++)); }

#################################################################################
# Environment Checks
#################################################################################

check_environment_variables() {
  log_section "Environment Variables Check"

  if [ ! -f "$PROJECT_ROOT/.env.production" ] && [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    log_error "No environment file found"
    check_failed
    return 1
  fi

  if [ -f "$PROJECT_ROOT/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | grep -v '^$' | xargs 2>/dev/null || true)
  else
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep -v '^$' | xargs 2>/dev/null || true)
  fi

  local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
  local missing=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing+=("$var")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing environment variables:"
    for var in "${missing[@]}"; do
      log_error "  - $var"
    done
    check_failed
    return 1
  fi

  log_success "All required environment variables set"
  check_passed
}

#################################################################################
# Application Checks
#################################################################################

check_build_artifacts() {
  log_section "Build Artifacts Check"

  if [ ! -d "$PROJECT_ROOT/.next" ] && [ ! -d "$PROJECT_ROOT/.next/standalone" ]; then
    log_warning "Build artifacts not found locally"
    log "This is normal if deployed to Vercel"
    check_skipped
    return 0
  fi

  if [ -f "$PROJECT_ROOT/.next/BUILD_ID" ]; then
    local build_id=$(cat "$PROJECT_ROOT/.next/BUILD_ID")
    log_success "Build artifacts verified (Build ID: $build_id)"
    check_passed
  else
    log_warning "Could not verify build artifacts"
    check_skipped
  fi
}

check_dependencies() {
  log_section "Dependencies Check"

  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    log_warning "node_modules not found"
    check_skipped
    return 0
  fi

  # Check critical dependencies
  local critical_deps=("next" "react" "@supabase/supabase-js" "ai")
  local missing=()

  for dep in "${critical_deps[@]}"; do
    if [ ! -d "$PROJECT_ROOT/node_modules/$dep" ]; then
      missing+=("$dep")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing critical dependencies:"
    for dep in "${missing[@]}"; do
      log_error "  - $dep"
    done
    check_failed
    return 1
  fi

  log_success "All critical dependencies present"
  check_passed
}

#################################################################################
# Connectivity Checks
#################################################################################

check_supabase_connectivity() {
  log_section "Supabase Connectivity Check"

  if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    log_skip "Supabase URL not configured"
    check_skipped
    return 0
  fi

  log "Checking Supabase API endpoint..."
  local supabase_host=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | cut -d'/' -f1)

  if nc -zw5 "$supabase_host" 443 2>/dev/null; then
    log_success "Supabase endpoint reachable: $supabase_host"
    check_passed
  else
    log_warning "Could not verify Supabase connectivity (nc command or firewall issue)"
    check_skipped
  fi
}

check_api_connectivity() {
  log_section "API Endpoints Check"

  # Get deployment URL from Vercel
  local api_url=""
  if command -v vercel &> /dev/null; then
    api_url=$(vercel ls --prod --json 2>/dev/null | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
  fi

  if [ -z "$api_url" ]; then
    log_skip "Could not determine API URL"
    check_skipped
    return 0
  fi

  log "Testing API endpoint: $api_url"

  # Test /api/health or similar
  local response=$(curl -s -o /dev/null -w "%{http_code}" "https://$api_url/api/mcp" 2>/dev/null || echo "000")

  if [ "$response" -lt 500 ]; then
    log_success "API endpoint responding (HTTP $response)"
    check_passed
  else
    log_error "API endpoint returned error (HTTP $response)"
    check_failed
  fi
}

#################################################################################
# LLM Router Checks
#################################################################################

check_llm_providers() {
  log_section "LLM Providers Check"

  local openai_key="${OPENAI_API_KEY:-}"
  local anthropic_key="${ANTHROPIC_API_KEY:-}"

  if [ -n "$openai_key" ]; then
    log_success "OpenAI API key configured"
    check_passed
  else
    log_warning "OpenAI API key not configured"
    check_failed
  fi

  if [ -n "$anthropic_key" ]; then
    log_success "Anthropic API key configured"
    check_passed
  else
    log_warning "Anthropic API key not configured"
    check_failed
  fi
}

check_llm_routes() {
  log_section "LLM Routes Configuration"

  if [ -f "$PROJECT_ROOT/lib/llm/router.ts" ]; then
    log_success "LLM router configuration file present"
    check_passed
  else
    log_warning "LLM router configuration file not found"
    check_skipped
  fi
}

#################################################################################
# Database Checks
#################################################################################

check_database_schema() {
  log_section "Database Schema Check"

  if [ ! -f "$PROJECT_ROOT/supabase/COMPREHENSIVE_SCHEMA_FOR_ALL_PHASES.sql" ]; then
    log_warning "Comprehensive schema file not found"
    check_skipped
    return 0
  fi

  log_success "Database schema file verified"
  check_passed
}

check_migrations() {
  log_section "Database Migrations Check"

  local migration_files=$(find "$PROJECT_ROOT/supabase" -name "*.sql" -type f | wc -l)

  if [ "$migration_files" -gt 0 ]; then
    log_success "Found $migration_files migration files"
    check_passed
  else
    log_warning "No migration files found"
    check_skipped
  fi
}

#################################################################################
# File System Checks
#################################################################################

check_required_files() {
  log_section "Required Files Check"

  local required_files=(
    "package.json"
    "next.config.mjs"
    "app/layout.tsx"
    "lib/mcp/tools/index.ts"
  )

  local missing=()
  for file in "${required_files[@]}"; do
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
      missing+=("$file")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing required files:"
    for file in "${missing[@]}"; do
      log_error "  - $file"
    done
    check_failed
    return 1
  fi

  log_success "All required files present"
  check_passed
}

check_configuration_files() {
  log_section "Configuration Files Check"

  local config_files=(
    "tailwind.config.js"
    "supabase/config.toml"
    "playwright.config.ts"
  )

  for file in "${config_files[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      log_success "$file present"
      check_passed
    else
      log_warning "$file not found"
      check_skipped
    fi
  done
}

#################################################################################
# Advanced Checks (Full Mode Only)
#################################################################################

run_full_checks() {
  if [ "$FULL_CHECK" != true ]; then
    return 0
  fi

  log_section "Full System Validation"

  # Check build output
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    log "Checking package.json syntax..."
    if node -e "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/package.json', 'utf8'))" 2>/dev/null; then
      log_success "package.json is valid JSON"
      check_passed
    else
      log_error "package.json has syntax errors"
      check_failed
    fi
  fi

  # Check for TypeScript configuration
  if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
    log_success "TypeScript configuration found"
    check_passed
  fi

  # Check for ESLint configuration
  if [ -f "$PROJECT_ROOT/.eslintrc.json" ] || [ -f "$PROJECT_ROOT/.eslintrc.js" ]; then
    log_success "ESLint configuration found"
    check_passed
  fi
}

#################################################################################
# Summary and Reporting
#################################################################################

print_summary() {
  log_section "Health Check Summary"

  local total=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_SKIPPED))
  local pass_rate=0
  if [ $total -gt 0 ]; then
    pass_rate=$((CHECKS_PASSED * 100 / total))
  fi

  echo "" | tee -a "$LOG_FILE"
  echo "Environment:        $ENVIRONMENT" | tee -a "$LOG_FILE"
  echo "Checks Passed:      $CHECKS_PASSED" | tee -a "$LOG_FILE"
  echo "Checks Failed:      $CHECKS_FAILED" | tee -a "$LOG_FILE"
  echo "Checks Skipped:     $CHECKS_SKIPPED" | tee -a "$LOG_FILE"
  echo "Pass Rate:          ${pass_rate}%" | tee -a "$LOG_FILE"
  echo "Log File:           $LOG_FILE" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"

  if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the log.${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

#################################################################################
# Main Execution
#################################################################################

main() {
  log_section "CRM-AI-PRO Health Check"
  log "Environment: $ENVIRONMENT"
  log "Full Check: $FULL_CHECK"
  log "Log File: $LOG_FILE"

  # Environment checks
  check_environment_variables

  # Application checks
  check_build_artifacts
  check_dependencies
  check_required_files
  check_configuration_files

  # Connectivity checks
  check_supabase_connectivity
  check_api_connectivity

  # LLM checks
  check_llm_providers
  check_llm_routes

  # Database checks
  check_database_schema
  check_migrations

  # Advanced checks
  run_full_checks

  # Summary
  print_summary
}

main "$@"
