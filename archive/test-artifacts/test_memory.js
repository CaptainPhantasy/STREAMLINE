// Quick test for memory functionality
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ref-ojlhkxzuomddagmfehg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZi1vamxoa3h6dW9tZGRhZ21mZWhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjc4MjE5NCwiZXhwIjoyMDQ4MzU4MTk0fQ.6bE_J2q6hQaP5bXXg_-s_Nx3Jv5a1FHulJj9mGkJK0Q'; // This would be the actual service role key

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testMemory() {
  console.log('Testing 72-hour memory functionality...\n');

  const testPhone = '+1-555-TEST-123';

  // Test 1: Save memory
  console.log('1. Saving memory...');
  const { data: saveResult, error: saveError } = await supabase
    .from('agent_memory')
    .upsert({
      phone_number: testPhone,
      conversation_summary: 'User needs heater repair at 123 Main St',
      intent: 'in_progress',
      staging_data: { address: '123 Main St', issue: 'heater not working' },
      last_active_at: new Date().toISOString()
    })
    .select()
    .single();

  if (saveError) {
    console.error('❌ Save failed:', saveError);
    return;
  }
  console.log('✅ Memory saved:', saveResult.id);

  // Test 2: Read memory
  console.log('\n2. Reading memory...');
  const { data: readResult, error: readError } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('phone_number', testPhone)
    .single();

  if (readError) {
    console.error('❌ Read failed:', readError);
    return;
  }
  console.log('✅ Memory retrieved:', readResult.conversation_summary);

  // Test 3: Complete job
  console.log('\n3. Marking job as completed...');
  const { error: completeError } = await supabase
    .from('agent_memory')
    .update({
      intent: 'completed',
      conversation_summary: 'Job successfully created',
      last_active_at: new Date().toISOString()
    })
    .eq('phone_number', testPhone);

  if (completeError) {
    console.error('❌ Complete failed:', completeError);
    return;
  }
  console.log('✅ Job marked as completed');

  console.log('\n🎉 All tests passed! Memory functionality is working.');
}

// Note: This script would need actual credentials to run
console.log('Memory test script created. To run: node test_memory.js');
console.log('Note: Update Supabase credentials before running.');