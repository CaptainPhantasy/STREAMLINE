/**
 * Check if mobile PWA tables exist in Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    const tables = ['job_gates', 'job_photos', 'gps_logs', 'meetings']

    console.log('🔍 Checking for mobile PWA tables...\n')

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1)

            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`❌ ${table}: Does NOT exist`)
                } else {
                    console.log(`⚠️  ${table}: Error - ${error.message}`)
                }
            } else {
                const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
                console.log(`✅ ${table}: EXISTS (${count || 0} records)`)
            }
        } catch (e) {
            console.log(`❌ ${table}: Exception - ${e}`)
        }
    }

    console.log('\n📊 Checking for sample data...\n')

    // Check job_gates structure if exists
    try {
        const { data } = await supabase
            .from('job_gates')
            .select('*')
            .limit(1)
            .single()

        if (data) {
            console.log('Sample job_gates record:')
            console.log(JSON.stringify(data, null, 2))
        }
    } catch (e) {
        // Table doesn't exist or no data
    }
}

checkTables()
    .then(() => {
        console.log('\n✅ Database check complete')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
