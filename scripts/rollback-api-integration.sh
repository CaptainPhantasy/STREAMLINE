#!/bin/bash

# ================================================================
# API Integration Rollback Script
#
# Restores API endpoints to their pre-migration state if issues arise.
# This script reverts all changes made by Subagent H (API Integration).
#
# Usage:
#   chmod +x scripts/rollback-api-integration.sh
#   ./scripts/rollback-api-integration.sh
#
# ================================================================

set -e  # Exit on error

echo "=================================================="
echo "API Integration Rollback Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================================
# Configuration
# ================================================================

PROJECT_ROOT="/Volumes/Storage/CRM_AI-PRO/CRM-AI-PRO"
BACKUP_FILES=(
  "app/api/ai/draft/route.ts.bak"
)

# ================================================================
# Check if running from correct directory
# ================================================================

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  echo "Current directory: $(pwd)"
  echo "Expected: $PROJECT_ROOT"
  exit 1
fi

# ================================================================
# Backup Check
# ================================================================

echo "Checking for backup files..."
echo ""

BACKUPS_FOUND=0
BACKUPS_MISSING=0

for backup in "${BACKUP_FILES[@]}"; do
  if [ -f "$backup" ]; then
    echo -e "${GREEN}✅ Found: $backup${NC}"
    BACKUPS_FOUND=$((BACKUPS_FOUND + 1))
  else
    echo -e "${YELLOW}⚠️  Missing: $backup${NC}"
    BACKUPS_MISSING=$((BACKUPS_MISSING + 1))
  fi
done

echo ""
echo "Backups found: $BACKUPS_FOUND"
echo "Backups missing: $BACKUPS_MISSING"
echo ""

if [ $BACKUPS_FOUND -eq 0 ]; then
  echo -e "${RED}❌ No backup files found. Cannot rollback.${NC}"
  echo "Backup files should have been created during migration."
  exit 1
fi

# ================================================================
# Confirmation
# ================================================================

echo -e "${YELLOW}⚠️  WARNING: This will restore API endpoints to pre-migration state.${NC}"
echo ""
read -p "Continue with rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo ""

# ================================================================
# Restore Backup Files
# ================================================================

echo "Restoring backup files..."
echo ""

RESTORED=0
FAILED=0

for backup in "${BACKUP_FILES[@]}"; do
  if [ -f "$backup" ]; then
    original="${backup%.bak}"

    echo "Restoring: $original"

    if cp "$backup" "$original"; then
      echo -e "${GREEN}✅ Restored: $original${NC}"
      RESTORED=$((RESTORED + 1))
    else
      echo -e "${RED}❌ Failed to restore: $original${NC}"
      FAILED=$((FAILED + 1))
    fi
  fi
done

echo ""
echo "Restored: $RESTORED files"
echo "Failed: $FAILED files"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Some files failed to restore. Check errors above.${NC}"
  exit 1
fi

# ================================================================
# Remove Integration Files (Optional)
# ================================================================

echo "Do you want to remove the integration helper library?"
echo "(This will remove lib/llm/integration/ directory)"
read -p "Remove integration library? (yes/no): " REMOVE_LIB

if [ "$REMOVE_LIB" = "yes" ]; then
  if [ -d "lib/llm/integration" ]; then
    echo "Removing lib/llm/integration/..."
    rm -rf lib/llm/integration
    echo -e "${GREEN}✅ Integration library removed${NC}"
  else
    echo -e "${YELLOW}⚠️  Integration library not found (already removed?)${NC}"
  fi
else
  echo "Integration library kept (can still be used by other code)"
fi

echo ""

# ================================================================
# Clear Next.js Cache
# ================================================================

echo "Clearing Next.js cache..."
echo ""

if [ -d ".next" ]; then
  rm -rf .next
  echo -e "${GREEN}✅ Cleared .next cache${NC}"
else
  echo -e "${YELLOW}⚠️  .next directory not found (already cleared?)${NC}"
fi

echo ""

# ================================================================
# Restart Instructions
# ================================================================

echo "=================================================="
echo "Rollback Complete"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ API endpoints restored to pre-migration state${NC}"
echo ""
echo "Next steps:"
echo "1. Restart the development server:"
echo "   ${GREEN}PORT=3002 npm run dev${NC}"
echo ""
echo "2. Test the rolled-back endpoints:"
echo "   ${GREEN}npm run test:llm-router${NC}"
echo ""
echo "3. Check application functionality in browser"
echo ""
echo "If issues persist:"
echo "- Check git status: ${GREEN}git status${NC}"
echo "- Review recent changes: ${GREEN}git diff${NC}"
echo "- Restore from git: ${GREEN}git checkout app/api/ai/draft/route.ts${NC}"
echo ""
echo "=================================================="
