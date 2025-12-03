/**
 * Auth Helpers for Playwright Tests
 * 
 * Creates authentication state files for each user role.
 * These files are used by playwright.config.ts projects.
 * 
 * Usage:
 *   Run this script to generate auth state files:
 *   npx tsx tests/utils/auth-helpers.ts
 */

import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface UserConfig {
  email: string
  password: string
  role: 'owner' | 'admin' | 'dispatcher' | 'tech'
  storageStatePath: string
}

const users: UserConfig[] = [
  {
    email: 'test@317plumber.com',
    password: 'TestPass123!',
    role: 'owner',
    storageStatePath: 'playwright/.auth/owner.json',
  },
  {
    email: 'admin@317plumber.com',
    password: 'TestPass123!',
    role: 'admin',
    storageStatePath: 'playwright/.auth/admin.json',
  },
  {
    email: 'dispatcher@317plumber.com',
    password: 'TestPass123!',
    role: 'dispatcher',
    storageStatePath: 'playwright/.auth/dispatcher.json',
  },
  {
    email: 'tech@317plumber.com',
    password: 'TestPass123!',
    role: 'tech',
    storageStatePath: 'playwright/.auth/tech.json',
  },
]

/**
 * Create auth state files for all roles
 * This should be run as a setup script before tests
 */
async function createAuthStates() {
  console.log('🔐 Creating authentication state files...\n')

  // Ensure directory exists
  if (!existsSync('playwright/.auth')) {
    await mkdir('playwright/.auth', { recursive: true })
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  for (const user of users) {
    console.log(`Processing ${user.role} user: ${user.email}`)

    // Check if user exists, create if not
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let authUser = existingUsers?.users?.find(u => u.email === user.email)

    // Generate deterministic phone number based on email
    // Pattern: 317555XXXX where XXXX is derived from email
    const emailHash = user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const uniqueSuffix = (emailHash % 10000).toString().padStart(4, '0')
    const phoneNumber = `317555${uniqueSuffix}`

    if (!authUser) {
      console.log(`  Creating auth user...`)
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        phone: phoneNumber,
        phone_confirm: true,
        user_metadata: {
          full_name: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} User`
        }
      })
      if (error) {
        console.error(`  Error creating user:`, error.message)
        continue
      }
      authUser = newUser.user
    } else {
      // Update existing user with correct password and phone if needed
      // Note: We don't update password here to avoid changing protected users if this script is run against them
      // But for these specific test users, we want to ensure they have the phone number
      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        phone: phoneNumber,
        phone_confirm: true,
        user_metadata: {
          ...authUser.user_metadata,
          full_name: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} User`
        }
      })
      
      if (error) {
        console.error(`  Error updating user metadata:`, error.message)
      }
    }

    // Get account_id
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('slug', '317plumber')
      .single()

    if (!account) {
      console.error(`  Account not found`)
      continue
    }

    // Ensure user record exists in public.users
    const { data: publicUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser!.id)
      .single()

    if (!publicUser) {
      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser!.id,
          account_id: account.id,
          role: user.role,
          full_name: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} User`,
        })
      if (error) {
        console.error(`  Error creating user record:`, error.message)
        continue
      }
    } else {
      // Update role and full_name if needed
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          role: user.role,
          full_name: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} User`
        })
        .eq('id', authUser!.id)
      if (error) {
        console.error(`  Error updating user role:`, error.message)
      }
    }

    // Create auth state via Playwright
    await setup(`authenticate as ${user.role}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', user.email)
      await page.fill('input[type="password"]', user.password)
      await page.click('button[type="submit"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL(new RegExp(`${BASE_URL}/inbox|${BASE_URL}/jobs`), {
        timeout: 10000,
      })

      // Save auth state
      await page.context().storageState({ path: user.storageStatePath })
    })

    console.log(`  ✅ Auth state saved to ${user.storageStatePath}\n`)
  }

  console.log('✅ All auth state files created!')
}

// Run if executed directly
if (require.main === module) {
  createAuthStates().catch(console.error)
}

export { createAuthStates, users }

