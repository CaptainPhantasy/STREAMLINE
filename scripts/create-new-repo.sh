#!/bin/bash

# =============================================================================
# Create New GitHub Repository Script
# 
# This script helps you create a completely new GitHub repository with no
# connection to the old origin. It will:
# 1. Commit all current changes
# 2. Remove old remote
# 3. Create new GitHub repo (via GitHub CLI or manual instructions)
# 4. Add new remote
# 5. Push to new repo
# =============================================================================

set -e

echo "🚀 Creating New GitHub Repository"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in a git repo
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Step 2: Show current status
echo -e "${YELLOW}📊 Current Git Status:${NC}"
git status --short
echo ""

# Step 3: Ask if user wants to commit current changes
read -p "Do you want to commit all current changes? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}📝 Committing all changes...${NC}"
    git add .
    git commit -m "Initial commit: CRM AI Pro with RBAC system and documentation

- Complete 9-role RBAC system (super_admin, admin, owner, manager, assistant_manager, dispatcher, tech, sales, csr)
- Comprehensive documentation in docs/knowledge-base/
- User backup system
- Database migrations for role-based access control
- All current work preserved"
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping commit. Make sure to commit before pushing!${NC}"
fi
echo ""

# Step 4: Remove old remote
echo -e "${YELLOW}🔗 Current remotes:${NC}"
git remote -v
echo ""

read -p "Remove old 'origin' remote? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🗑️  Removing old origin...${NC}"
    git remote remove origin
    echo -e "${GREEN}✅ Old origin removed${NC}"
else
    echo -e "${YELLOW}⚠️  Keeping old origin. You'll need to rename it later.${NC}"
fi
echo ""

# Step 5: Check for GitHub CLI
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI (gh) found${NC}"
    echo ""
    
    # Check if logged in
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
        echo ""
        
        read -p "Create new GitHub repository using GitHub CLI? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Repository name (e.g., crm-ai-pro-yokohama): " REPO_NAME
            read -p "Repository description (optional): " REPO_DESC
            read -p "Make it private? (y/n): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                PRIVATE_FLAG="--private"
            else
                PRIVATE_FLAG="--public"
            fi
            
            echo -e "${GREEN}📦 Creating repository: $REPO_NAME${NC}"
            gh repo create "$REPO_NAME" $PRIVATE_FLAG --description "$REPO_DESC" --source=. --remote=origin --push
            
            echo ""
            echo -e "${GREEN}✅ Repository created and pushed!${NC}"
            echo ""
            echo "Repository URL:"
            gh repo view --web
        else
            echo -e "${YELLOW}📝 Manual setup instructions:${NC}"
            echo ""
            echo "1. Go to https://github.com/new"
            echo "2. Create a new repository (don't initialize with README)"
            echo "3. Copy the repository URL"
            echo "4. Run these commands:"
            echo ""
            echo "   git remote add origin <YOUR_NEW_REPO_URL>"
            echo "   git branch -M main"
            echo "   git push -u origin main"
            echo ""
        fi
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
        echo "Run: gh auth login"
        echo ""
        echo -e "${YELLOW}📝 Manual setup instructions:${NC}"
        echo ""
        echo "1. Go to https://github.com/new"
        echo "2. Create a new repository (don't initialize with README)"
        echo "3. Copy the repository URL"
        echo "4. Run these commands:"
        echo ""
        echo "   git remote add origin <YOUR_NEW_REPO_URL>"
        echo "   git branch -M main"
        echo "   git push -u origin main"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found${NC}"
    echo ""
    echo -e "${YELLOW}📝 Manual setup instructions:${NC}"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository:"
    echo "   - Name: (choose a name, e.g., crm-ai-pro-yokohama)"
    echo "   - Description: (optional)"
    echo "   - Public/Private: (your choice)"
    echo "   - DO NOT initialize with README, .gitignore, or license"
    echo "3. Copy the repository URL (e.g., https://github.com/username/repo-name.git)"
    echo ""
    echo "4. Then run these commands:"
    echo ""
    echo "   git remote add origin <YOUR_NEW_REPO_URL>"
    echo "   git branch -M main  # Rename current branch to main"
    echo "   git push -u origin main"
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Your repository is now ready. All old connections have been removed."

