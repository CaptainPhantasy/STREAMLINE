import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function removeLegacyProfiles() {
    console.log('🗑️  Removing Legacy Profiles Table System...\n')

    try {
        // 1. Update Foreign Keys
        console.log('1. Updating Foreign Keys...')

        // Check if profiles table exists
        const { error: checkError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1)

        if (checkError && checkError.code === '42P01') { // undefined_table
            console.log('   ✅ Profiles table already removed.')
            return
        }

        // We can't execute DDL directly via JS client unless we use a stored procedure or SQL editor
        // But we can check if the data is migrated and log what needs to be done manually or via migration file

        console.log('   ⚠️  Cannot execute DDL (DROP TABLE/ALTER TABLE) via JS client.')
        console.log('   ⚠️  Please run the following SQL in the Supabase SQL Editor:')

        const sql = `
    -- 1. Drop foreign keys referencing profiles
    ALTER TABLE IF EXISTS public.job_gates 
      DROP CONSTRAINT IF EXISTS job_gates_completed_by_fkey;

    ALTER TABLE IF EXISTS public.job_photos 
      DROP CONSTRAINT IF EXISTS job_photos_taken_by_fkey;

    -- 2. Add new foreign keys referencing users (if not exists)
    -- Note: This assumes the columns are already UUIDs. If they are text, they might need casting.
    
    ALTER TABLE IF EXISTS public.job_gates
      ADD CONSTRAINT job_gates_completed_by_fkey 
      FOREIGN KEY (completed_by) REFERENCES auth.users(id);

    ALTER TABLE IF EXISTS public.job_photos
      ADD CONSTRAINT job_photos_taken_by_fkey 
      FOREIGN KEY (taken_by) REFERENCES auth.users(id);

    -- 3. Drop the profiles table
    DROP TABLE IF EXISTS public.profiles;

    -- 4. Drop the user_role enum if unused (optional, risky if used elsewhere)
    -- DROP TYPE IF EXISTS public.user_role;
    `

        console.log('\n' + '='.repeat(50))
        console.log(sql)
        console.log('='.repeat(50) + '\n')

        console.log('   ✅ Script completed (SQL generation only).')

    } catch (error: any) {
        console.error(`\n❌ Fatal Error: ${error.message}`)
        process.exit(1)
    }
}

removeLegacyProfiles().catch(console.error)
