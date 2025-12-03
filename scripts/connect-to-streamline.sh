#!/bin/bash

# =============================================================================
# Connect to STREAMLINE Repository
# 
# Safely connects this independent repo to STREAMLINE
# =============================================================================

set -e

STREAMLINE_URL="https://github.com/CaptainPhantasy/STREAMLINE.git"

echo "🔗 Connecting to STREAMLINE Repository"
echo "======================================"
echo ""

# Verify we're independent
if [ -f .git ] && grep -q "worktree" .git 2>/dev/null; then
    echo "❌ ERROR: This is still a worktree!"
    echo "   Run ./scripts/make-independent-repo.sh first"
    exit 1
fi

echo "✅ Repository is independent"
echo ""

# Show current state
echo "📊 Current State:"
echo "   Branch: $(git branch --show-current)"
echo "   Current remotes:"
git remote -v || echo "   (no remotes)"
echo ""

# Remove old remotes
if git remote | grep -q origin; then
    echo "🗑️  Removing old origin remote..."
    OLD_URL=$(git remote get-url origin)
    echo "   Old URL: $OLD_URL"
    git remote remove origin
    echo "✅ Old origin removed"
    echo ""
fi

# Add new remote
echo "🔗 Adding STREAMLINE remote..."
echo "   URL: $STREAMLINE_URL"
read -p "Connect to STREAMLINE? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

git remote add origin "$STREAMLINE_URL"
echo "✅ Remote added"
echo ""

# Verify
echo "📊 Verification:"
git remote -v
echo ""

# Push
echo "📤 Ready to push..."
echo "   Repository: $STREAMLINE_URL"
echo "   Branch: $(git branch --show-current)"
echo ""
read -p "Push to STREAMLINE? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin $(git branch --show-current)
    echo ""
    echo "✅ SUCCESS! Code pushed to STREAMLINE"
    echo ""
    echo "Repository: $STREAMLINE_URL"
else
    echo "⚠️  Push cancelled. You can push manually later with:"
    echo "   git push -u origin $(git branch --show-current)"
fi

