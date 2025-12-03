#!/bin/bash

# Direct execution of remaining index creation commands
# Uses IF NOT EXISTS to avoid errors

source .env.local

echo "🚀 Creating Remaining Indexes"
echo "==========================="

# Function to run SQL via curl
run_sql() {
    local sql="$1"
    echo "Running: $sql"

    response=$(curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: params=single-object" \
        -d "{\"query\":\"${sql}\"}")

    echo "Response: $response"
}

# Note: These can't be run via API because CREATE INDEX CONCURRENTLY needs special handling
# So showing exact commands to run in dashboard

echo "⚠️  Run these in Supabase SQL Editor (they use IF NOT EXISTS to avoid errors):"
echo ""
echo "1. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);"
echo ""
echo "2. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);"
echo ""
echo "3. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);"
echo ""
echo "4. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);"
echo ""
echo "5. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id ON users(id, account_id);"
echo ""
echo "6. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role ON users(account_id, role);"
echo ""
echo "7. VACUUM ANALYZE parts;"
echo ""
echo "8. VACUUM ANALYZE users;"
echo ""
echo "9. VACUUM ANALYZE jobs;"
echo ""
echo "10. VACUUM ANALYZE contacts;"
echo ""
echo "✅ idx_parts_account_id already exists! That's why you got 'already exists' error."
echo "Continue with the commands above - they won't error if they already exist."