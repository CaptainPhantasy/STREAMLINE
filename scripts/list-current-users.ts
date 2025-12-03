/**
 * List All Current Users in the System
 * 
 * This script queries the database to show all existing users,
 * their roles, and identifies which are admin users.
 * 
 * Usage: npx tsx scripts/list-current-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listCurrentUsers() {
  console.log('📋 Listing All Current Users in the System...\n')
  console.log('='.repeat(80))

  try {
    // 1. Get all auth users
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing auth users:', listError)
      throw listError
    }

    if (!authUsers || authUsers.length === 0) {
      console.log('⚠️  No auth users found in the system.')
      return
    }

    // 2. Get all user records from public.users table
    const { data: userRecords, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, account_id, full_name, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching user records:', usersError)
      throw usersError
    }

    // 3. Get account information
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, slug')

    const accountMap = new Map(accounts?.map(a => [a.id, a]) || [])

    // 4. Match auth users with user records
    interface UserInfo {
      email: string
      authUserId: string
      userRecordId?: string
      fullName?: string
      role?: string
      accountId?: string
      accountName?: string
      accountSlug?: string
      createdAt?: string
      isAdmin: boolean
    }

    const userList: UserInfo[] = []

    for (const authUser of authUsers) {
      const userRecord = userRecords?.find(u => u.id === authUser.id)
      const account = userRecord?.account_id ? accountMap.get(userRecord.account_id) : null

      const isAdmin = userRecord?.role === 'admin' || userRecord?.role === 'owner'

      userList.push({
        email: authUser.email || 'N/A',
        authUserId: authUser.id,
        userRecordId: userRecord?.id,
        fullName: userRecord?.full_name,
        role: userRecord?.role || 'N/A',
        accountId: userRecord?.account_id,
        accountName: account?.name,
        accountSlug: account?.slug,
        createdAt: userRecord?.created_at || authUser.created_at,
        isAdmin
      })
    }

    // 5. Sort by role, then by email
    userList.sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, dispatcher: 2, tech: 3, sales: 4 }
      const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 99
      const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 99
      if (aRole !== bRole) return aRole - bRole
      return (a.email || '').localeCompare(b.email || '')
    })

    // 6. Display results
    console.log(`\nTotal Users: ${userList.length}\n`)

    // Group by role
    const byRole = {
      owner: userList.filter(u => u.role === 'owner'),
      admin: userList.filter(u => u.role === 'admin'),
      dispatcher: userList.filter(u => u.role === 'dispatcher'),
      tech: userList.filter(u => u.role === 'tech'),
      sales: userList.filter(u => u.role === 'sales'),
      other: userList.filter(u => !['owner', 'admin', 'dispatcher', 'tech', 'sales'].includes(u.role || ''))
    }

    // Display ADMIN users first (owner + admin)
    console.log('='.repeat(80))
    console.log('👑 ADMIN USERS (Owner & Admin Roles)')
    console.log('='.repeat(80))
    
    if (byRole.owner.length > 0) {
      console.log(`\n📌 OWNER (${byRole.owner.length}):`)
      byRole.owner.forEach(user => {
        console.log(`   ${user.email}`)
        console.log(`      Name: ${user.fullName || 'N/A'}`)
        console.log(`      Account: ${user.accountName || 'N/A'} (${user.accountSlug || 'N/A'})`)
        console.log(`      Auth ID: ${user.authUserId}`)
        console.log(`      Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`)
        console.log('')
      })
    }

    if (byRole.admin.length > 0) {
      console.log(`\n📌 ADMIN (${byRole.admin.length}):`)
      byRole.admin.forEach(user => {
        console.log(`   ${user.email}`)
        console.log(`      Name: ${user.fullName || 'N/A'}`)
        console.log(`      Account: ${user.accountName || 'N/A'} (${user.accountSlug || 'N/A'})`)
        console.log(`      Auth ID: ${user.authUserId}`)
        console.log(`      Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`)
        console.log('')
      })
    }

    if (byRole.owner.length === 0 && byRole.admin.length === 0) {
      console.log('   ⚠️  No admin users found\n')
    }

    // Display other roles
    console.log('='.repeat(80))
    console.log('👥 OTHER USERS')
    console.log('='.repeat(80))

    if (byRole.dispatcher.length > 0) {
      console.log(`\n📌 DISPATCHER (${byRole.dispatcher.length}):`)
      byRole.dispatcher.forEach(user => {
        console.log(`   ${user.email} - ${user.fullName || 'N/A'}`)
      })
    }

    if (byRole.tech.length > 0) {
      console.log(`\n📌 TECH (${byRole.tech.length}):`)
      byRole.tech.forEach(user => {
        console.log(`   ${user.email} - ${user.fullName || 'N/A'}`)
      })
    }

    if (byRole.sales.length > 0) {
      console.log(`\n📌 SALES (${byRole.sales.length}):`)
      byRole.sales.forEach(user => {
        console.log(`   ${user.email} - ${user.fullName || 'N/A'}`)
      })
    }

    if (byRole.other.length > 0) {
      console.log(`\n📌 OTHER ROLES (${byRole.other.length}):`)
      byRole.other.forEach(user => {
        console.log(`   ${user.email} - Role: ${user.role || 'N/A'} - ${user.fullName || 'N/A'}`)
      })
    }

    // 7. Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total Users: ${userList.length}`)
    console.log(`  👑 Admin Users (owner + admin): ${byRole.owner.length + byRole.admin.length}`)
    console.log(`  👥 Other Users: ${byRole.dispatcher.length + byRole.tech.length + byRole.sales.length + byRole.other.length}`)
    console.log(`\n  Owner: ${byRole.owner.length}`)
    console.log(`  Admin: ${byRole.admin.length}`)
    console.log(`  Dispatcher: ${byRole.dispatcher.length}`)
    console.log(`  Tech: ${byRole.tech.length}`)
    console.log(`  Sales: ${byRole.sales.length}`)
    if (byRole.other.length > 0) {
      console.log(`  Other: ${byRole.other.length}`)
    }

    // 8. Users without user records
    const usersWithoutRecords = authUsers.filter(au => !userRecords?.find(ur => ur.id === au.id))
    if (usersWithoutRecords.length > 0) {
      console.log('\n' + '='.repeat(80))
      console.log('⚠️  AUTH USERS WITHOUT USER RECORDS')
      console.log('='.repeat(80))
      usersWithoutRecords.forEach(user => {
        console.log(`   ${user.email} (Auth ID: ${user.id})`)
      })
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

listCurrentUsers()

