#!/bin/bash

# Direct Database Performance Fixes
# Executes all SQL commands using service role key from .env.local

source .env.local

echo "🚀 Applying Database Performance Fixes"
echo "===================================="

API_URL="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
AUTH_HEADER="Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
APIKEY_HEADER="apikey: ${SUPABASE_SERVICE_ROLE_KEY}"

# Function to execute SQL via PostgREST
exec_sql() {
    local sql="$1"
    local desc="$2"

    echo -e "\n🔧 $desc"
    echo "   SQL: ${sql:0:60}..."

    # Use the _rpc endpoint if available, otherwise use direct approach
    local response=$(curl -s -X POST "${API_URL}/rpc/" \
        -H "$AUTH_HEADER" \
        -H "$APIKEY_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$(echo "$sql" | sed 's/"/\\"/g' | tr '\n' ' ')}\"")

    if [[ $? -eq 0 && $response != *"error"* ]]; then
        echo "   ✅ Success"
    else
        # Try alternative: use POST to /rest/v1/ with raw SQL
        echo "   ⚠️  Trying alternative method..."

        # Create a temporary RPC function
        local temp_func="temp_exec_$(date +%s)"
        response=$(curl -s -X POST "${API_URL}/rpc/create_temp_func" \
            -H "$AUTH_HEADER" \
            -H "$APIKEY_HEADER" \
            -H "Content-Type: application/json" \
            -d "{\"sql\": \"$(echo "$sql" | sed 's/"/\\"/g' | tr '\n' ' ')}\"}")

        echo "   Response: ${response:0:100}..."
    fi
}

# Test connection
echo -e "\n📡 Testing connection..."
response=$(curl -s "${API_URL}/" -H "$AUTH_HEADER" -H "$APIKEY_HEADER")
if [[ $response == *"\"swagger\""* ]]; then
    echo "   ✅ Connected to Supabase"
else
    echo "   ❌ Connection failed"
    exit 1
fi

# Execute fixes
echo -e "\n📋 Executing SQL fixes..."

# Since CREATE INDEX needs special handling, let's use a different approach
# We'll use psql through a local connection if available, or provide commands

echo -e "\n⚠️  CREATE INDEX commands need special handling."
echo "   Providing the exact commands to execute manually:"

cat << 'EOF'

RUN THESE COMMANDS ONE BY ONE in Supabase SQL Editor:
https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/sql

1. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_account_id_created_at ON parts(account_id, created_at DESC);

2. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_entity ON realtime.subscription(entity);

3. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_subscription_id ON realtime.subscription(subscription_id);

4. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_subscription_created_at ON realtime.subscription(created_at);

5. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_account_id ON users(id, account_id);

6. CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_id_role ON users(account_id, role);

7. VACUUM ANALYZE parts;

8. VACUUM ANALYZE users;

9. VACUUM ANALYZE jobs;

10. VACUUM ANALYZE contacts;

Note: idx_parts_account_id already exists (that's why you got the error).
EOF

# Test current performance
echo -e "\n📊 Testing current performance..."
for table in parts users jobs contacts; do
    start=$(date +%s%3N)
    curl -s "${API_URL}/${table}?select=id&limit=1" \
        -H "$AUTH_HEADER" \
        -H "$APIKEY_HEADER" > /dev/null
    duration=$(( $(date +%s%3N) - start ))

    if [ $duration -lt 50 ]; then
        status="✅ Fast"
    elif [ $duration -lt 200 ]; then
        status="⚠️ OK"
    else
        status="🔴 Slow"
    fi

    echo "   $status $table: ${duration}ms"
done

echo -e "\n✅ Performance fix script completed."
echo "   Please run the SQL commands above in the dashboard."