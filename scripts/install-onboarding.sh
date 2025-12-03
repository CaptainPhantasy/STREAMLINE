#!/bin/bash

# Onboarding System Installation Script
# Installs dependencies and runs database migration

set -e  # Exit on error

echo "🎉 Installing Onboarding System..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the project root?"
  exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1/3: Installing dependencies..."
npm install react-confetti --legacy-peer-deps
echo "✅ Dependencies installed"
echo ""

# Step 2: Run database migration
echo "🗄️  Step 2/3: Running database migration..."
if command -v supabase &> /dev/null; then
  supabase db push
  echo "✅ Database migration complete"
else
  echo "⚠️  Warning: Supabase CLI not found"
  echo "   Please run the migration manually:"
  echo "   supabase db push"
  echo "   or:"
  echo "   psql -U postgres -d your_db < supabase/migrations/20251127_create_user_onboarding.sql"
fi
echo ""

# Step 3: Clear Next.js cache
echo "🧹 Step 3/3: Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"
echo ""

# Done!
echo "✨ Onboarding system installed successfully!"
echo ""
echo "📚 Next steps:"
echo "   1. Review: components/onboarding/QUICK_START.md"
echo "   2. Integrate: Add OnboardingWizard to your layout"
echo "   3. Test: Create test users and verify flows"
echo ""
echo "🚀 Ready to onboard users!"
