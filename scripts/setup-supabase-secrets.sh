#!/bin/bash

# =============================================================================
# Supabase Edge Function Secrets Setup Script
# =============================================================================
# This script sets all required secrets for Supabase Edge Functions
# Run this after setting up your .env.local file
#
# Usage:
#   chmod +x scripts/setup-supabase-secrets.sh
#   ./scripts/setup-supabase-secrets.sh
#
# Prerequisites:
#   - Supabase CLI installed: npm install -g supabase
#   - Logged in to Supabase: supabase login
#   - Linked to project: supabase link
#   - .env.local file with required variables
# =============================================================================

set -e  # Exit on error

echo "🔐 Setting up Supabase Edge Function secrets..."
echo ""

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "📄 Loading environment variables from .env.local..."
  # Export variables from .env.local (ignore comments and empty lines)
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
  echo "✅ Environment variables loaded"
  echo ""
else
  echo "❌ Error: .env.local file not found"
  echo "   Please create .env.local with your API keys first"
  echo "   See: docs/ENVIRONMENT_SETUP.md"
  exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI is not installed"
  echo "   Install it with: npm install -g supabase"
  exit 1
fi

echo "🔍 Checking required environment variables..."
echo ""

# Required variables
REQUIRED_VARS=(
  "OPENAI_API_KEY"
  "ANTHROPIC_API_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

# Check if all required variables are set
MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    MISSING_VARS+=("$VAR")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Error: Missing required environment variables:"
  for VAR in "${MISSING_VARS[@]}"; do
    echo "   - $VAR"
  done
  echo ""
  echo "   Please add these to your .env.local file"
  echo "   See: docs/ENVIRONMENT_SETUP.md"
  exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Set secrets
echo "🚀 Setting Supabase secrets..."
echo ""

# Function to set a secret
set_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2

  echo "Setting $SECRET_NAME..."
  if supabase secrets set "$SECRET_NAME=$SECRET_VALUE" > /dev/null 2>&1; then
    echo "✅ $SECRET_NAME set successfully"
  else
    echo "❌ Failed to set $SECRET_NAME"
    echo "   Make sure you're logged in: supabase login"
    echo "   Make sure you're linked to project: supabase link"
    return 1
  fi
}

# Set OpenAI API Key
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"

# Set Anthropic API Key
set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

# Set Supabase Service Role Key
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# Optional: Set additional secrets if they exist
if [ -n "$GOOGLE_GEMINI_API_KEY" ]; then
  echo ""
  echo "📝 Optional: Setting Google Gemini API Key..."
  set_secret "GOOGLE_GEMINI_API_KEY" "$GOOGLE_GEMINI_API_KEY"
fi

if [ -n "$ZAI_GLM_API_KEY" ]; then
  echo ""
  echo "📝 Optional: Setting Zai GLM API Key..."
  set_secret "ZAI_GLM_API_KEY" "$ZAI_GLM_API_KEY"
fi

if [ -n "$ELEVENLABS_API_KEY" ]; then
  echo ""
  echo "📝 Optional: Setting ElevenLabs API Key..."
  set_secret "ELEVENLABS_API_KEY" "$ELEVENLABS_API_KEY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All required secrets configured successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "   1. Verify secrets: supabase secrets list"
echo "   2. Deploy functions: supabase functions deploy"
echo "   3. Test LLM Router: npm run test:llm-router"
echo ""
echo "📖 For more information, see: docs/ENVIRONMENT_SETUP.md"
echo ""
