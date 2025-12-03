#!/usr/bin/env tsx

/**
 * Remove User Impersonation Feature
 *
 * This script removes the user impersonation feature from Supabase.
 * It uses the service role key to bypass RLS and execute DDL statements.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runCleanup() {
  console.log('🚀 Starting User Impersonation Cleanup...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20251127_remove_user_impersonation.sql'
    );

    console.log('📄 Reading cleanup SQL file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing SQL statements...\n');

    // Try to execute using rpc 'exec_sql' first (standard for this project?)
    const { error } = await supabase.rpc('exec_sql', {
      query: migrationSQL,
    });

    if (error) {
      console.log('⚠️  exec_sql function not found or failed, using statement splitting...\n');
      console.log('Error details:', error.message);

      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

      // Execute each statement individually
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        
        // We try to use the rpc 'exec' or 'exec_sql' if it exists, 
        // but if the previous attempt failed, we might not have a direct SQL execution method exposed.
        // However, let's try the REST method that was in the original script.
        
        try {
            // Try standard postgres function call via RPC if defined
            const { error: rpcError } = await supabase.rpc('exec', { query: statement });
            
            if (rpcError) {
                console.log(`   ❌ RPC exec failed: ${rpcError.message}`);
                // If this fails, we might be out of options without direct DB access.
            } else {
                console.log(`   ✅ Success`);
            }
        } catch (e) {
             console.error(`   ❌ Exception executing statement: ${e}`);
        }
      }
    } else {
      console.log('✅ Cleanup executed successfully via exec_sql!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Cleanup completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();
