#!/usr/bin/env tsx

/**
 * Check User Role and Permissions
 * Verifies the current user's role and if they can impersonate
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserRole() {
  console.log('🔍 Checking User Role and Permissions...\n');

  try {
    // Get your user ID from the auth record you shared
    const yourAuthUserId = '4e7caf61-cc73-407b-b18c-407d0d04f9d3';

    // Check the users table for role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', yourAuthUserId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    if (!user) {
      console.error('❌ User not found in users table');
      return;
    }

    console.log('✅ Your User Record:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Full Name:', user.full_name);
    console.log('   Role:', user.role);
    console.log('   Account ID:', user.account_id);
    console.log('   Status:', user.status);
    console.log('');

    // Check if owner
    if (user.role === 'owner') {
      console.log('✅ You ARE an Owner - Impersonation should work\n');
    } else {
      console.log('❌ You are NOT an Owner - You cannot impersonate');
      console.log(`   Your role is: ${user.role}`);
      console.log('   Only Owners can use the User Viewer feature\n');
      return;
    }

    // Get all users in the same account
    const { data: accountUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status')
      .eq('account_id', user.account_id)
      .order('role', { ascending: true });

    if (usersError) {
      console.error('❌ Error fetching account users:', usersError);
      return;
    }

    console.log('👥 Users in Your Account:');
    console.log('─'.repeat(60));

    if (!accountUsers || accountUsers.length === 0) {
      console.log('   No users found');
    } else {
      accountUsers.forEach((u, i) => {
        const isSelf = u.id === yourAuthUserId;
        const canImpersonate = u.role !== 'owner' && !isSelf;

        console.log(`   ${i + 1}. ${u.full_name} (${u.email})`);
        console.log(`      Role: ${u.role}`);
        console.log(`      Status: ${u.status}`);
        console.log(`      Can Impersonate: ${canImpersonate ? '✅ YES' : '❌ NO'}`);
        if (isSelf) console.log(`      (This is you)`);
        console.log('');
      });
    }

    // Count impersonatable users
    const impersonatableUsers = accountUsers.filter(
      u => u.role !== 'owner' && u.id !== yourAuthUserId
    );

    console.log('─'.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total users in account: ${accountUsers.length}`);
    console.log(`   Users you can impersonate: ${impersonatableUsers.length}`);

    if (impersonatableUsers.length === 0) {
      console.log('\n⚠️  No users available to impersonate!');
      console.log('   Reasons:');
      console.log('   - You are the only user in the account, OR');
      console.log('   - All other users are also Owners (cannot impersonate owners)');
      console.log('\n💡 Solution:');
      console.log('   Create test users with roles: admin, dispatcher, tech, or sales');
    } else {
      console.log('\n✅ Impersonation should work!');
      console.log('   Available users to impersonate:');
      impersonatableUsers.forEach(u => {
        console.log(`   - ${u.full_name} (${u.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRole();
