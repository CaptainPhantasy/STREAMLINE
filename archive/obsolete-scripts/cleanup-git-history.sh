#!/bin/bash

# Professional Git History Cleanup Script
# Rewrites git history with Conventional Commits and professional email

set -e

echo "🧹 Starting Professional Git History Cleanup..."
echo "================================================"
echo ""

# Backup
echo "📦 Creating backup tag..."
git tag -f backup-original-history HEAD
echo "✅ Backup created: backup-original-history"
echo ""

# Update author email throughout history
echo "✉️  Updating author email to professional email..."
git filter-branch -f --env-filter '
CORRECT_NAME="Douglas Talley"
CORRECT_EMAIL="douglas.talley@legacyai.space"

export GIT_COMMITTER_NAME="$CORRECT_NAME"
export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
export GIT_AUTHOR_NAME="$CORRECT_NAME"
export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
' --tag-name-filter cat -- --branches --tags

echo "✅ Author email updated"
echo ""

# Clean up filter-branch refs
rm -rf .git/refs/original/

echo "✅ Git history cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review history: git log --oneline"
echo "2. Force push: git push --force-with-lease"
echo ""
