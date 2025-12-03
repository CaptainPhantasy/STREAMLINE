import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

async function deployGenerateReply() {
  console.log('🔍 Agent 1: Deploying generate-reply Edge Function\n')

  try {
    // Read the function code
    const functionCode = readFileSync(
      resolve(process.cwd(), 'supabase/functions/generate-reply/index.ts'),
      'utf-8'
    )

    console.log('✅ Function code loaded')
    console.log(`   Size: ${functionCode.length} bytes`)

    // Note: Actual deployment requires Supabase CLI
    // This script verifies the function exists and is ready
    console.log('\n📋 Deployment Instructions:')
    console.log('   1. Install Supabase CLI: npm install -g supabase')
    console.log('   2. Login: supabase login')
    console.log('   3. Link project: supabase link --project-ref expbvujyegxmxvatcjqt')
    console.log('   4. Deploy: supabase functions deploy generate-reply')
    console.log('\n   OR use Supabase Dashboard → Edge Functions → Deploy')

    // Test if function is accessible
    console.log('\n🧪 Testing function accessibility...')
    const testUrl = `${supabaseUrl}/functions/v1/generate-reply`
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: 'test',
        conversationId: 'test',
      }),
    })

    if (response.status === 404) {
      console.log('   ❌ Function not deployed (404)')
      console.log('   ⚠️  Needs deployment via Supabase CLI or Dashboard')
    } else {
      console.log(`   ✅ Function accessible (${response.status})`)
      console.log('   ✅ Function is deployed')
    }

    return { deployed: response.status !== 404 }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return { deployed: false, error: error.message }
  }
}

deployGenerateReply().catch(console.error)

