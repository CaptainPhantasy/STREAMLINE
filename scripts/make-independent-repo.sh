#!/bin/bash

# =============================================================================
# Make Independent Repository Script
# 
# This converts a git worktree into a completely independent repository
# with NO connection to parent repositories
# =============================================================================

set -e

echo "🔒 Making Repository Completely Independent"
echo "============================================"
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"
echo ""

# Check if this is a worktree
if [ -f .git ] && grep -q "worktree" .git 2>/dev/null; then
    echo "⚠️  DETECTED: This is a git worktree (connected to parent repo)"
    echo ""
    
    # Show what we're disconnecting from
    PARENT_REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "unknown")
    echo "Parent repository: $PARENT_REPO"
    echo ""
    
    read -p "Convert to independent repository? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 1
    fi
    
    echo ""
    echo "📦 Step 1: Stashing any uncommitted changes..."
    git stash push -m "Stash before making independent repo" 2>/dev/null || echo "No changes to stash"
    
    echo ""
    echo "📦 Step 2: Getting current branch name..."
    CURRENT_BRANCH=$(git branch --show-current)
    echo "   Current branch: $CURRENT_BRANCH"
    
    echo ""
    echo "📦 Step 3: Creating backup of current .git reference..."
    if [ -f .git ]; then
        cp .git .git.backup
        echo "   Backup saved: .git.backup"
    fi
    
    echo ""
    echo "🗑️  Step 4: Removing worktree connection..."
    rm -f .git
    
    echo ""
    echo "📦 Step 5: Initializing new independent git repository..."
    git init
    
    echo ""
    echo "📦 Step 6: Adding all files..."
    git add .
    
    echo ""
    echo "📦 Step 7: Creating initial commit..."
    git commit -m "Initial commit: CRM AI Pro with RBAC system

- Complete 9-role RBAC system (super_admin, admin, owner, manager, assistant_manager, dispatcher, tech, sales, csr)
- Comprehensive documentation in docs/knowledge-base/
- User backup system
- Database migrations for role-based access control
- Converted from worktree to independent repository" || echo "⚠️  Nothing to commit"
    
    echo ""
    echo "📦 Step 8: Creating/renaming branch..."
    if [ "$CURRENT_BRANCH" != "main" ]; then
        git branch -M main
        echo "   Branch renamed to: main"
    else
        echo "   Branch is already: main"
    fi
    
    echo ""
    echo "✅ Repository is now COMPLETELY INDEPENDENT"
    echo ""
    echo "Verification:"
    echo "   Git directory: $(git rev-parse --git-dir)"
    echo "   Top level: $(git rev-parse --show-toplevel)"
    echo "   Remotes:"
    git remote -v || echo "   (no remotes configured)"
    echo ""
    
    echo "⚠️  IMPORTANT: Old worktree connection removed"
    echo "   Backup saved at: .git.backup (you can delete this later)"
    echo ""
    
else
    echo "✅ This appears to be an independent repository already"
    echo ""
    echo "Verification:"
    echo "   Git directory: $(git rev-parse --git-dir)"
    echo "   Top level: $(git rev-parse --show-toplevel)"
    echo ""
fi

echo "✅ Ready to connect to new repository!"

