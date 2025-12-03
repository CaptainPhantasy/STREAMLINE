#!/bin/bash

# =============================================================================
# SAFE Setup New GitHub Repository - Manual Verification Required
# 
# This script will:
# 1. Show you what it's going to do
# 2. Ask for confirmation at each step
# 3. NEVER touch your existing repo
# =============================================================================

set -e

echo "🔒 SAFE New Repository Setup"
echo "============================"
echo ""
echo "This script will create a COMPLETELY NEW repository."
echo "It will NOT touch your existing repo: https://github.com/CaptainPhantasy/crm-ai-pro.git"
echo ""

# Step 1: Show current state
echo "📊 Current State:"
echo "   Branch: $(git branch --show-current)"
echo "   Current remote:"
git remote -v | sed 's/^/   /'
echo ""

# Step 2: Get new repo URL
read -p "Enter your NEW repository URL (e.g., https://github.com/CaptainPhantasy/crm-ai-pro-yokohama.git): " NEW_REPO_URL

if [ -z "$NEW_REPO_URL" ]; then
    echo "❌ Repository URL is required"
    exit 1
fi

echo ""
echo "⚠️  VERIFICATION:"
echo "   New repository URL: $NEW_REPO_URL"
echo "   Old repository URL: https://github.com/CaptainPhantasy/crm-ai-pro.git"
echo ""
read -p "Are these DIFFERENT repositories? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ STOPPED: URLs must be different!"
    exit 1
fi

# Step 3: Commit changes
echo ""
echo "📝 Step 1: Committing current changes..."
read -p "Commit all current changes? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Initial commit: CRM AI Pro with RBAC system

- Complete 9-role RBAC system (super_admin, admin, owner, manager, assistant_manager, dispatcher, tech, sales, csr)
- Comprehensive documentation in docs/knowledge-base/
- User backup system
- Database migrations for role-based access control
- All current work preserved" || echo "⚠️  Nothing to commit or already committed"
else
    echo "⚠️  Skipping commit. Make sure to commit before pushing!"
fi

# Step 4: Remove old remote
echo ""
echo "🗑️  Step 2: Removing old remote..."
echo "   This will remove: origin -> https://github.com/CaptainPhantasy/crm-ai-pro.git"
read -p "Remove old origin? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git remote remove origin
    echo "✅ Old origin removed"
else
    echo "⚠️  Keeping old origin. You'll need to rename it manually."
fi

# Step 5: Add new remote
echo ""
echo "🔗 Step 3: Adding new remote..."
echo "   New remote: origin -> $NEW_REPO_URL"
read -p "Add new remote? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git remote add origin "$NEW_REPO_URL"
    echo "✅ New remote added"
else
    echo "⚠️  Skipping remote addition"
    exit 0
fi

# Step 6: Show what will be pushed
echo ""
echo "📤 Step 4: Ready to push..."
echo "   Branch: $(git branch --show-current)"
echo "   Remote: origin -> $NEW_REPO_URL"
echo ""
echo "⚠️  FINAL VERIFICATION:"
echo "   This will push to: $NEW_REPO_URL"
echo "   This will NOT push to: https://github.com/CaptainPhantasy/crm-ai-pro.git"
echo ""
read -p "Push to NEW repository? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin $(git branch --show-current)
    echo ""
    echo "✅ SUCCESS! Your code is now in the new repository."
    echo ""
    echo "Repository URL: $NEW_REPO_URL"
else
    echo "⚠️  Push cancelled. You can push manually later with:"
    echo "   git push -u origin $(git branch --show-current)"
fi

