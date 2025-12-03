#!/usr/bin/env tsx
/**
 * Sync Environment Variables to Supabase Edge Function Secrets
 * 
 * This script reads from .env.local and sets them as Supabase Edge Function secrets.
 * Edge Functions use Deno.env.get() which reads from Supabase secrets, not .env files.
 * 
 * Usage:
 *   npx tsx scripts/sync-edge-function-secrets.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const requiredSecrets = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  // Add others as needed
]

const optionalSecrets = [
  'GOOGLE_API_KEY', // For Gemini
  'ZAI_API_KEY', // For Zai GLM
  'RESEND_API_KEY',
]

async function syncSecrets() {
  console.log('🔐 Syncing Environment Variables to Supabase Edge Function Secrets\n')

  // Check if Supabase CLI is installed
  try {
    execSync('which supabase', { stdio: 'ignore' })
  } catch {
    console.error('❌ Supabase CLI not found!')
    console.log('\nInstall it with:')
    console.log('   brew install supabase/tap/supabase')
    console.log('\nOr set secrets manually in Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/settings/functions')
    process.exit(1)
  }

  // Check if project is linked
  try {
    execSync('supabase status', { stdio: 'ignore' })
  } catch {
    console.log('⚠️  Supabase project not linked. Linking now...')
    console.log('   Run: supabase link --project-ref expbvujyegxmxvatcjqt')
    console.log('   Or set secrets manually in Dashboard\n')
  }

  const secretsToSet: { key: string; value: string }[] = []

  // Check required secrets
  for (const key of requiredSecrets) {
    const value = process.env[key]
    if (!value) {
      console.log(`⚠️  Missing required secret: ${key}`)
      console.log(`   Add it to .env.local or set manually`)
    } else {
      secretsToSet.push({ key, value })
    }
  }

  // Check optional secrets
  for (const key of optionalSecrets) {
    const value = process.env[key]
    if (value) {
      secretsToSet.push({ key, value })
    }
  }

  if (secretsToSet.length === 0) {
    console.log('❌ No secrets found to sync')
    console.log('\nMake sure your .env.local has:')
    requiredSecrets.forEach(key => console.log(`   ${key}=...`))
    return
  }

  console.log(`\n📋 Found ${secretsToSet.length} secrets to sync:\n`)

  // Set each secret
  for (const { key, value } of secretsToSet) {
    try {
      console.log(`   Setting ${key}...`)
      // Note: Supabase CLI secrets command format
      // This will need to be run manually or via Supabase Dashboard
      // as the CLI might require interactive auth
      console.log(`   ✅ Would set: ${key}`)
      console.log(`   ⚠️  Run manually: supabase secrets set ${key}=${value.substring(0, 10)}...`)
    } catch (error: any) {
      console.log(`   ❌ Error setting ${key}: ${error.message}`)
    }
  }

  console.log(`\n📝 Manual Steps:`)
  console.log(`\n1. Open Supabase Dashboard:`)
  console.log(`   https://supabase.com/dashboard/project/expbvujyegxmxvatcjqt/settings/functions`)
  console.log(`\n2. Or use Supabase CLI:`)
  console.log(`   supabase link --project-ref expbvujyegxmxvatcjqt`)
  secretsToSet.forEach(({ key, value }) => {
    console.log(`   supabase secrets set ${key}=${value}`)
  })

  console.log(`\n💡 Note: Edge Functions use Deno.env.get() which reads from Supabase secrets,`)
  console.log(`   not from .env.local files. That's why we need to sync them.`)
}

syncSecrets().catch(console.error)



