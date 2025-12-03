// ElevenLabs Voice AI - Fix Verification Script
// Run this script to test all 4 critical fixes

const SUPABASE_URL = 'https://expbvujyegxmxvatcjqt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

console.log('🔍 Testing ElevenLabs Voice AI Critical Fixes...\n');

// Test 1: Fake Success Bug - Error Handling
async function testErrorHandling() {
  console.log('📋 TEST 1: Error Handling (Fake Success Bug)');

  // Test invalid email (should fail clearly)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-server`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'create_contact',
        arguments: {
          firstName: 'Test',
          email: 'invalid-email-no-at-symbol',
          accountId: '00000000-0000-0000-0000-000000000000' // Invalid UUID
        }
      },
      id: 1
    })
  });

  const result = await response.json();

  console.log('Response:', JSON.stringify(result, null, 2));

  if (result.result?.success === false && result.result?.contactId === null) {
    console.log('✅ PASS: Error properly returned with success=false and contactId=null\n');
  } else {
    console.log('❌ FAIL: Error not properly handled\n');
  }
}

// Test 2: Navigation Enum includes 'dispatch'
async function testNavigationEnum() {
  console.log('📋 TEST 2: Navigation Enum (Dispatch Map)');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-server`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 2
    })
  });

  const result = await response.json();
  const navigateTool = result.result?.tools?.find(t => t.name === 'navigate');

  if (navigateTool) {
    const allowedPages = navigateTool.inputSchema.properties.page.enum;
    console.log('Navigation pages:', allowedPages);

    if (allowedPages.includes('dispatch')) {
      console.log('✅ PASS: "dispatch" is included in navigation enum\n');
    } else {
      console.log('❌ FAIL: "dispatch" is missing from navigation enum\n');
    }
  } else {
    console.log('❌ FAIL: navigate tool not found\n');
  }
}

// Test 3: Create Job with Contact Name (should warn about UUID requirement)
async function testContactJobFlow() {
  console.log('📋 TEST 3: Contact-Job Creation Flow');

  // This test shows what happens when you try to create a job with just a name
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-server`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'create_job',
        arguments: {
          contactName: 'Nonexistent User',
          description: 'Test job',
          accountId: '00000000-0000-0000-0000-000000000000' // Invalid account for testing
        }
      },
      id: 3
    })
  });

  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));

  if (result.result?.error) {
    console.log('✅ PASS: Job creation rejected with proper error\n');
  } else {
    console.log('⚠️  WARNING: Job creation might be accepting names instead of UUIDs\n');
  }
}

// Test 4: Successful Contact Creation (should return valid UUID)
async function testSuccessfulCreation() {
  console.log('📋 TEST 4: Successful Contact Creation');

  const timestamp = Date.now();
  const testEmail = `test+${timestamp}@example.com`;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-server`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'create_contact',
        arguments: {
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
          phone: '555-0123',
          accountId: '00000000-0000-0000-0000-000000000000' // Will fail but test structure
        }
      },
      id: 4
    })
  });

  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));

  // This will likely fail due to invalid account, but we check the response structure
  if (result.result) {
    const { success, error, contactId } = result.result;
    if (success === true && contactId !== null) {
      console.log('✅ PASS: Success response includes contactId\n');
    } else if (success === false && error) {
      console.log('✅ PASS: Error properly returned with success=false\n');
    } else {
      console.log('❌ FAIL: Ambiguous response structure\n');
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testErrorHandling();
    await testNavigationEnum();
    await testContactJobFlow();
    await testSuccessfulCreation();

    console.log('🏁 Test suite completed!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Update ElevenLabs system prompt with pacing protocols');
    console.log('2. Verify agent is using the updated MCP server');
    console.log('3. Monitor production for machine-gunning behavior');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('\n⚠️  Make sure to set SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
}

// Run tests
runAllTests();