#!/bin/bash

# Direct SQL execution script using Supabase REST API
# This runs the critical performance fixes

# Load environment variables
source .env.local

echo "🚀 Running Performance Fixes Directly"
echo "===================================="

# Function to execute SQL
execute_sql() {
    local sql="$1"
    local desc="$2"

    echo -e "\n🔧 $desc"
    echo "   Executing: $(echo "$sql" | cut -c1-60)..."

    # Use curl to execute via RPC
    response=$(curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql_query\": \"$(echo "$sql" | sed 's/"/\\"/g')\"}")

    if [[ $? -eq 0 ]]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        echo "   Response: $response"
    fi
}

# Check if project is linked
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

# Test connection
echo -e "\n📡 Testing connection to Supabase..."
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null

if [ $? -eq 0 ]; then
    echo "   ✅ Connected to Supabase"
else
    echo "   ❌ Connection failed"
    exit 1
fi

# Execute fixes that can run via REST API
echo -e "\n📋 Applying fixes via REST API..."

# Create timezone cache table
execute_sql "CREATE TABLE IF NOT EXISTS cached_timezones (name TEXT PRIMARY KEY, last_updated TIMESTAMP DEFAULT NOW());" \
    "Creating timezone cache table"

# Enable pg_stat_statements
execute_sql "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" \
    "Enabling performance monitoring"

# Populate timezone cache
execute_sql "INSERT INTO cached_timezones (name) SELECT name FROM pg_timezone_names ON CONFLICT (name) DO NOTHING;" \
    "Populating timezone cache"

# Clean up old subscriptions
execute_sql "DELETE FROM realtime.subscription WHERE created_at < NOW() - INTERVAL '24 hours';" \
    "Cleaning up old subscriptions"

# Test performance
echo -e "\n📊 Testing current performance..."
test_table() {
    local table=$1
    local start=$(date +%s%N)

    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=id&limit=1" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" > /dev/null

    local duration=$(( ($(date +%s%N) - start) / 1000000 ))
    local status=""

    if [ $duration -lt 50 ]; then
        status="✅"
    elif [ $duration -lt 200 ]; then
        status="⚠️"
    else
        status="🔴"
    fi

    echo "   $status $table: ${duration}ms"
}

test_table "parts"
test_table "users"
test_table "jobs"
test_table "contacts"

echo -e "\n⚠️  MANUAL STEPS REQUIRED for INDEXES:"
echo "   ===================================="
echo "   The following commands MUST be run manually in the Supabase Dashboard:"
echo "   Go to: https://supabase.com/dashboard/project/_/sql"
echo ""
echo "   1. CREATE INDEX CONCURRENTLY idx_parts_account_id ON parts(account_id);"
echo "   2. CREATE INDEX CONCURRENTLY idx_parts_account_id_created_at ON parts(account_id, created_at DESC);"
echo "   3. CREATE INDEX CONCURRENTLY idx_realtime_subscription_entity ON realtime.subscription(entity);"
echo "   4. CREATE INDEX CONCURRENTLY idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);"
echo "   5. CREATE INDEX CONCURRENTLY idx_realtime_subscription_created_at ON realtime.subscription(created_at);"
echo "   6. CREATE INDEX CONCURRENTLY idx_users_id_account_id ON users(id, account_id);"
echo "   7. CREATE INDEX CONCURRENTLY idx_users_account_id_role ON users(account_id, role);"
echo ""
echo "   Then run these VACUUM commands:"
echo "   8. VACUUM ANALYZE parts;"
echo "   9. VACUUM ANALYZE users;"
echo "   10. VACUUM ANALYZE jobs;"
echo "   11. VACUUM ANALYZE contacts;"

echo -e "\n✅ Partial fixes applied. Manual execution required for indexes."