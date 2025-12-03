#!/bin/bash

# Rewrite commit messages to Conventional Commits format
# This creates a clean, professional git history

set -e

echo "📝 Rewriting commit messages to Conventional Commits..."
echo ""

# Create a mapping of old messages to new professional ones
git filter-branch -f --msg-filter '
read msg
case "$msg" in
  "Fix: Update Supabase API keys to Legacy JWT format and restore admin privileges")
    echo "fix(auth): update authentication configuration and restore admin access"
    ;;
  "Fix: Remove standalone config for standard deployment")
    echo "fix(config): remove standalone config for standard deployment"
    ;;
  "Remove redundant AI badge and make CRM-AI PRO text 33% larger in sidebar")
    echo "style(ui): enhance sidebar branding and remove redundant badge"
    ;;
  "Fix profile dropdown opacity - make fully opaque")
    echo "fix(ui): correct profile dropdown opacity"
    ;;
  "Fix inbox layout: reduce card sizes and add consistent hover effects")
    echo "fix(inbox): improve card layout and hover interactions"
    ;;
  "fix: Remove Dockerfile, use Railway Nixpacks for proper env var handling")
    echo "chore(deploy): migrate to Railway Nixpacks for deployment"
    ;;
  "fix: Lazy initialize Supabase in Stripe webhook to avoid build-time error")
    echo "fix(webhooks): lazy initialize Supabase to prevent build errors"
    ;;
  "fix: Rename mobile routes to /m/ prefix to avoid path conflicts")
    echo "fix(routing): add /m/ prefix to mobile routes"
    ;;
  *"npm install"*)
    echo "fix(ci): update build configuration"
    ;;
  *"Vercel"*)
    echo "chore(deploy): migrate from Vercel to Railway"
    ;;
  *"Mobile PWA"*)
    echo "feat(mobile): add PWA support and Opus theme"
    ;;
  *"major cleanup"*)
    echo "refactor: major codebase cleanup and reorganization"
    ;;
  *"build errors and add monitoring"*)
    echo "fix: resolve build errors and add monitoring tools"
    ;;
  *"MCP server"*)
    echo "feat(integration): add MCP server with Docker support"
    ;;
  *"voice agent"*)
    echo "fix(voice): ensure voice agent persistence across navigation"
    ;;
  *"Phase 3 cleanup"*)
    echo "fix(typescript): resolve TypeScript errors and update docs"
    ;;
  *"dynamic export"*)
    echo "fix(api): add dynamic export for Vercel compatibility"
    ;;
  *)
    echo "$msg"
    ;;
esac
' -- --all

rm -rf .git/refs/original/

echo "✅ Commit messages rewritten!"
echo ""
