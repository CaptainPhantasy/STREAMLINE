#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUsers() {
  const yourAccountId = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00';

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('account_id', yourAccountId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${users?.length || 0} users in your account:\n`);
  users?.forEach((u, i) => {
    console.log(`${i+1}. ${u.full_name}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   ID: ${u.id}`);
    console.log('');
  });

  const nonOwners = users?.filter(u => u.role !== 'owner') || [];
  console.log(`Non-owner users you can impersonate: ${nonOwners.length}`);

  if (nonOwners.length === 0) {
    console.log('\n❌ NO USERS TO IMPERSONATE!');
    console.log('You need to create other users (Admin, Dispatcher, Tech, Sales) to use this feature.\n');
  }
}

checkUsers();
