#!/bin/bash
# Deploy Edge Functions to Supabase
# Alternative method if Supabase CLI is not installed

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY"
  echo "   Load from .env.local: export \$(cat .env.local | grep SUPABASE | xargs)"
  exit 1
fi

echo "📦 Deploying Edge Functions..."
echo ""
echo "⚠️  Supabase CLI not installed. Edge Functions must be deployed via:"
echo ""
echo "   1. Install Supabase CLI:"
echo "      brew install supabase/tap/supabase"
echo ""
echo "   2. Or deploy via Supabase Dashboard:"
echo "      https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/functions"
echo ""
echo "   3. Or use the Supabase Management API (requires project ref)"
echo ""
echo "📁 Edge Functions to deploy:"
echo "   - supabase/functions/llm-router/index.ts"
echo "   - supabase/functions/provision-tenant/index.ts"
echo ""
echo "💡 Quick install Supabase CLI:"
echo "   brew install supabase/tap/supabase"
echo ""
echo "   Then run:"
echo "   supabase link --project-ref expbvujyegxmxvatcjqt"
echo "   supabase functions deploy llm-router"
echo "   supabase functions deploy provision-tenant"

