#!/bin/bash

# =============================================================================
# Setup New GitHub Repository - Automated
# 
# Creates a completely new GitHub repo with no connection to old origin
# =============================================================================

set -e

echo "🚀 Setting Up New GitHub Repository"
echo "===================================="
echo ""

# Get repository name
read -p "Repository name (e.g., crm-ai-pro-yokohama): " REPO_NAME
if [ -z "$REPO_NAME" ]; then
    echo "❌ Repository name is required"
    exit 1
fi

read -p "Repository description (optional): " REPO_DESC
read -p "Make it private? (y/n) [default: y]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    PRIVATE_FLAG="--public"
else
    PRIVATE_FLAG="--private"
fi

echo ""
echo "📝 Step 1: Committing all current changes..."
git add .
git commit -m "Initial commit: CRM AI Pro with RBAC system

- Complete 9-role RBAC system (super_admin, admin, owner, manager, assistant_manager, dispatcher, tech, sales, csr)
- Comprehensive documentation in docs/knowledge-base/
- User backup system
- Database migrations for role-based access control
- All current work preserved" || echo "⚠️  Nothing to commit or already committed"

echo ""
echo "🗑️  Step 2: Removing old remote..."
git remote remove origin 2>/dev/null || echo "⚠️  No origin remote found (that's okay)"

echo ""
echo "📦 Step 3: Creating new GitHub repository..."
gh repo create "$REPO_NAME" $PRIVATE_FLAG --description "$REPO_DESC" --source=. --remote=origin --push

echo ""
echo "✅ SUCCESS!"
echo ""
echo "Your new repository is ready:"
gh repo view --web

echo ""
echo "Repository URL:"
git remote get-url origin

