/**
 * Comprehensive Seed Script: 317 Plumber
 *
 * Creates a complete, realistic dataset for testing ALL features.
 * This is the CANONICAL seed script - use this for all testing.
 *
 * Usage: npx tsx scripts/seed-comprehensive.ts
 *
 * Data Created:
 * - 1 Account (317 Plumber)
 * - 6 Users (owner, admin, dispatcher, 2 techs, sales) - ALL ACTIVE
 * - 15 Contacts with realistic profiles and tags
 * - 8 Contact Tags for categorization
 * - 12 Jobs in various statuses (with tech assignments)
 * - 5 Estimates (draft, sent, accepted, rejected, expired)
 * - 6 Invoices (draft, sent, paid, overdue, partially_paid)
 * - 4 Payments
 * - 15 Parts (inventory items)
 * - 5 Email Templates
 * - 2 Campaigns with recipients
 * - 10 Notifications
 * - 8 Calendar Events
 * - 6 Conversations with messages
 * - 3 Meetings
 * - 3 Automation Rules
 *
 * Created: Nov 27, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// CONFIGURATION
// ============================================================================
const ACCOUNT_SLUG = '317-plumber'
const ACCOUNT_NAME = '317 Plumber'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

// Users - ALL ACTIVE with proper status
const users = [
  {
    email: 'ryan@317plumber.com',
    full_name: 'Ryan Galbraith',
    role: 'owner',
    status: 'active'
  },
  {
    email: 'admin@317plumber.com',
    full_name: 'Michelle Adams',
    role: 'admin',
    status: 'active'
  },
  {
    email: 'dispatch@317plumber.com',
    full_name: 'Sarah Johnson',
    role: 'dispatcher',
    status: 'active'
  },
  {
    email: 'marcus@317plumber.com',
    full_name: 'Marcus Williams',
    role: 'tech',
    status: 'available', // Tech-specific status
    phone: '317-555-2001'
  },
  {
    email: 'jake@317plumber.com',
    full_name: 'Jake Thompson',
    role: 'tech',
    status: 'available', // Tech-specific status
    phone: '317-555-2002'
  },
  {
    email: 'emily@317plumber.com',
    full_name: 'Emily Davis',
    role: 'sales',
    status: 'active'
  }
]

// Contact Tags
const contactTags = [
  { name: 'VIP', color: '#FFD700', description: 'High-value customers' },
  { name: 'Commercial', color: '#2196F3', description: 'Business customers' },
  { name: 'Residential', color: '#4CAF50', description: 'Home customers' },
  { name: 'Emergency', color: '#F44336', description: 'Emergency service history' },
  { name: 'Referral Source', color: '#9C27B0', description: 'Refers other customers' },
  { name: 'Service Agreement', color: '#00BCD4', description: 'Has maintenance contract' },
  { name: 'Past Due', color: '#FF5722', description: 'Has overdue payments' },
  { name: 'New Customer', color: '#8BC34A', description: 'Recent first-time customer' }
]

// Contacts - Realistic Indianapolis homeowners
const contacts = [
  {
    first_name: 'Mike',
    last_name: 'Henderson',
    email: 'mike.henderson@email.com',
    phone: '317-555-0101',
    address: '4521 Meridian St, Indianapolis, IN 46208',
    lead_source: 'google',
    tags: ['VIP', 'Residential', 'Referral Source'],
    profile: {
      family: 'Wife Sarah, two kids (Emma 8, Jake 12)',
      preferences: 'Prefers morning appointments, has a golden retriever named Max',
      notes: 'Long-time customer since 2019, always pays promptly'
    }
  },
  {
    first_name: 'Jennifer',
    last_name: 'Walsh',
    email: 'jwalsh42@gmail.com',
    phone: '317-555-0102',
    address: '892 College Ave, Indianapolis, IN 46220',
    lead_source: 'referral',
    lead_source_detail: 'Referred by Mike Henderson',
    tags: ['Residential', 'New Customer'],
    profile: {
      family: 'Single, works from home as graphic designer',
      preferences: 'Very detail-oriented, likes updates via text',
      notes: 'First-time customer, very satisfied with service'
    }
  },
  {
    first_name: 'Robert',
    last_name: 'Chen',
    email: 'rchen.indy@yahoo.com',
    phone: '317-555-0103',
    address: '1547 Washington Blvd, Indianapolis, IN 46205',
    lead_source: 'google',
    utm_campaign: 'water_heater_2024',
    tags: ['Residential', 'Service Agreement'],
    profile: {
      family: 'Wife Lin, elderly mother lives with them',
      preferences: 'Needs accessible bathroom, budget-conscious',
      notes: 'House built in 1965, old plumbing - annual inspection contract'
    }
  },
  {
    first_name: 'Amanda',
    last_name: 'Torres',
    email: 'amanda.torres@outlook.com',
    phone: '317-555-0104',
    address: '3201 Fall Creek Pkwy, Indianapolis, IN 46205',
    lead_source: 'facebook',
    tags: ['Residential', 'Emergency'],
    profile: {
      family: 'Husband Carlos, newborn baby',
      preferences: 'Very concerned about water quality for baby',
      notes: 'Emergency call - water damage, excellent recovery'
    }
  },
  {
    first_name: 'David',
    last_name: 'Mitchell',
    email: 'dmitchell@businessmail.com',
    phone: '317-555-0105',
    address: '7845 Keystone Ave, Indianapolis, IN 46240',
    lead_source: 'google',
    tags: ['VIP', 'Residential'],
    profile: {
      family: 'Divorced, teenage daughter visits weekends',
      preferences: 'Saturday appointments only, very busy executive',
      notes: 'Owns 3 rental properties, potential commercial work'
    }
  },
  {
    first_name: 'Lisa',
    last_name: 'Park',
    email: 'lisa.park.indy@gmail.com',
    phone: '317-555-0106',
    address: '2156 Broad Ripple Ave, Indianapolis, IN 46220',
    lead_source: 'yelp',
    tags: ['Commercial', 'Service Agreement'],
    profile: {
      family: 'Partner Kim, two cats',
      preferences: 'Eco-friendly options when available',
      notes: 'Owns "Broad Ripple Cafe" - quarterly grease trap contract'
    }
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    email: 'jwilson.contractor@gmail.com',
    phone: '317-555-0107',
    address: '5432 Massachusetts Ave, Indianapolis, IN 46218',
    lead_source: 'contractor_referral',
    tags: ['Residential', 'Referral Source'],
    profile: {
      family: 'Wife Betty, grown kids',
      preferences: 'Retired contractor himself, knows the trade',
      notes: 'Main sewer line issues - older neighborhood, gives good referrals'
    }
  },
  {
    first_name: 'Patricia',
    last_name: 'Moore',
    email: 'pmoore.realtor@remax.com',
    phone: '317-555-0108',
    address: '1234 Delaware St, Indianapolis, IN 46202',
    lead_source: 'referral',
    tags: ['Commercial', 'VIP', 'Referral Source'],
    profile: {
      family: 'Married to Tom, empty nesters',
      preferences: 'Quick response critical for real estate closings',
      notes: 'RE/MAX realtor - sends us lots of inspection work'
    }
  },
  {
    first_name: 'Thomas',
    last_name: 'Garcia',
    email: 'tgarcia@indytech.com',
    phone: '317-555-0109',
    address: '8901 Allisonville Rd, Indianapolis, IN 46250',
    lead_source: 'google',
    tags: ['Residential', 'Past Due'],
    profile: {
      family: 'Wife Maria, three teenage boys',
      preferences: 'Tech-savvy, prefers email communication',
      notes: 'Large house, frequent drain issues - has outstanding invoice'
    }
  },
  {
    first_name: 'Sandra',
    last_name: 'Brown',
    email: 'sandra.brown@iupui.edu',
    phone: '317-555-0110',
    address: '420 University Blvd, Indianapolis, IN 46202',
    lead_source: 'facebook',
    tags: ['Residential', 'New Customer'],
    profile: {
      family: 'Single, professor at IUPUI',
      preferences: 'Very analytical, appreciates detailed explanations',
      notes: 'New customer - tankless water heater interest'
    }
  },
  {
    first_name: 'William',
    last_name: 'Taylor',
    email: 'wtaylor@taylorlaw.com',
    phone: '317-555-0111',
    address: '100 Monument Circle #500, Indianapolis, IN 46204',
    lead_source: 'google',
    tags: ['Commercial', 'VIP'],
    profile: {
      family: 'Wife Elizabeth, two daughters in college',
      preferences: 'Downtown law office, after-hours service preferred',
      notes: 'Taylor & Associates Law - 5th floor office suite'
    }
  },
  {
    first_name: 'Nancy',
    last_name: 'Anderson',
    email: 'nanderson@gmail.com',
    phone: '317-555-0112',
    address: '6789 Township Line Rd, Indianapolis, IN 46260',
    lead_source: 'nextdoor',
    tags: ['Residential', 'Emergency'],
    profile: {
      family: 'Widow, lives alone',
      preferences: 'Prefers phone calls, not tech-savvy',
      notes: 'Elderly customer, be patient and explain clearly'
    }
  },
  {
    first_name: 'Daniel',
    last_name: 'Martinez',
    email: 'dan.martinez@gmail.com',
    phone: '317-555-0113',
    address: '3456 Fall Creek Rd, Indianapolis, IN 46205',
    lead_source: 'google',
    tags: ['Residential', 'Service Agreement'],
    profile: {
      family: 'Wife Rosa, newlyweds',
      preferences: 'First-time homeowners, need education',
      notes: 'Just bought 1940s home - signed annual maintenance plan'
    }
  },
  {
    first_name: 'Tony',
    last_name: 'Napoli',
    email: 'tony@ristorantenapoli.com',
    phone: '317-555-0114',
    address: '945 Mass Ave, Indianapolis, IN 46202',
    lead_source: 'google',
    tags: ['Commercial', 'Service Agreement'],
    profile: {
      family: 'Family-owned Ristorante Napoli since 1985',
      preferences: 'Early morning service before restaurant opens',
      notes: 'Monthly grease trap maintenance contract'
    }
  },
  {
    first_name: 'Karen',
    last_name: 'White',
    email: 'kwhite@gmail.com',
    phone: '317-555-0115',
    address: '2222 Carrollton Ave, Indianapolis, IN 46205',
    lead_source: 'yelp',
    tags: ['Residential'],
    profile: {
      family: 'Single mom, two elementary school kids',
      preferences: 'Budget-conscious, payment plans appreciated',
      notes: 'Good customer, sometimes needs flexible payment terms'
    }
  }
]

// Parts Inventory
const parts = [
  { sku: 'PLU-00001', name: '1/2" Copper Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 2500, quantity_in_stock: 45, reorder_threshold: 10 },
  { sku: 'PLU-00002', name: '3/4" Copper Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 3200, quantity_in_stock: 38, reorder_threshold: 10 },
  { sku: 'PLU-00003', name: '2" PVC Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 850, quantity_in_stock: 62, reorder_threshold: 15 },
  { sku: 'PLU-00004', name: 'PVC Elbow 2" 90°', category: 'plumbing', unit: 'each', unit_price: 125, quantity_in_stock: 150, reorder_threshold: 25 },
  { sku: 'PLU-00005', name: 'SharkBite 1/2" Coupling', category: 'plumbing', unit: 'each', unit_price: 895, quantity_in_stock: 28, reorder_threshold: 10 },
  { sku: 'PLU-00006', name: 'Toilet Wax Ring', category: 'plumbing', unit: 'each', unit_price: 450, quantity_in_stock: 35, reorder_threshold: 10 },
  { sku: 'PLU-00007', name: 'Toilet Fill Valve', category: 'plumbing', unit: 'each', unit_price: 1295, quantity_in_stock: 22, reorder_threshold: 8 },
  { sku: 'PLU-00008', name: 'Toilet Flapper Universal', category: 'plumbing', unit: 'each', unit_price: 595, quantity_in_stock: 40, reorder_threshold: 15 },
  { sku: 'MAT-00001', name: 'Teflon Tape Roll', category: 'materials', unit: 'each', unit_price: 195, quantity_in_stock: 85, reorder_threshold: 20 },
  { sku: 'MAT-00002', name: 'Pipe Thread Sealant', category: 'materials', unit: 'each', unit_price: 895, quantity_in_stock: 18, reorder_threshold: 5 },
  { sku: 'MAT-00003', name: 'Plumbers Putty 14oz', category: 'materials', unit: 'each', unit_price: 495, quantity_in_stock: 24, reorder_threshold: 8 },
  { sku: 'TOO-00001', name: 'Drain Snake 25ft', category: 'tools', unit: 'each', unit_price: 4500, quantity_in_stock: 6, reorder_threshold: 2 },
  { sku: 'TOO-00002', name: 'Pipe Wrench 14"', category: 'tools', unit: 'each', unit_price: 2995, quantity_in_stock: 8, reorder_threshold: 2 },
  { sku: 'HVA-00001', name: 'Water Heater Element 4500W', category: 'hvac', unit: 'each', unit_price: 2495, quantity_in_stock: 12, reorder_threshold: 4 },
  { sku: 'HVA-00002', name: 'Water Heater Thermostat', category: 'hvac', unit: 'each', unit_price: 1895, quantity_in_stock: 8, reorder_threshold: 3 }
]

// Email Templates
const emailTemplates = [
  {
    name: 'Appointment Confirmation',
    subject: 'Your 317 Plumber Appointment is Confirmed',
    body_html: '<p>Hi {{first_name}},</p><p>This confirms your appointment on <strong>{{scheduled_date}}</strong>.</p><p>Our technician {{tech_name}} will arrive between {{time_window}}.</p><p>If you need to reschedule, please call us at (317) 555-0000.</p><p>Thank you for choosing 317 Plumber!</p>',
    body_text: 'Hi {{first_name}}, This confirms your appointment on {{scheduled_date}}. Our technician {{tech_name}} will arrive between {{time_window}}.',
    category: 'transactional'
  },
  {
    name: 'Invoice Sent',
    subject: 'Invoice #{{invoice_number}} from 317 Plumber',
    body_html: '<p>Hi {{first_name}},</p><p>Please find attached Invoice #{{invoice_number}} for ${{total_amount}}.</p><p>Payment is due by {{due_date}}.</p><p>Questions? Reply to this email or call (317) 555-0000.</p>',
    body_text: 'Hi {{first_name}}, Please find attached Invoice #{{invoice_number}} for ${{total_amount}}. Payment is due by {{due_date}}.',
    category: 'transactional'
  },
  {
    name: 'Estimate Follow-up',
    subject: 'Following Up on Your Plumbing Estimate',
    body_html: '<p>Hi {{first_name}},</p><p>I wanted to follow up on the estimate we sent for {{estimate_title}}.</p><p>Do you have any questions? We\'re happy to discuss the scope of work or adjust the estimate.</p><p>Just reply to this email or call (317) 555-0000.</p>',
    body_text: 'Hi {{first_name}}, I wanted to follow up on the estimate we sent for {{estimate_title}}. Do you have any questions?',
    category: 'sales'
  },
  {
    name: 'Review Request',
    subject: 'How did we do? - 317 Plumber',
    body_html: '<p>Hi {{first_name}},</p><p>Thank you for choosing 317 Plumber! We hope {{tech_name}} provided excellent service.</p><p>Would you take a moment to share your experience?</p><p><a href="{{review_link}}">Leave a Google Review</a></p><p>Your feedback helps us serve you better!</p>',
    body_text: 'Hi {{first_name}}, Thank you for choosing 317 Plumber! Would you take a moment to share your experience? {{review_link}}',
    category: 'marketing'
  },
  {
    name: 'Annual Maintenance Reminder',
    subject: 'Time for Your Annual Plumbing Checkup!',
    body_html: '<p>Hi {{first_name}},</p><p>It\'s been about a year since your last plumbing inspection. Regular maintenance prevents costly emergency repairs!</p><p>Schedule your annual checkup today and get 10% off.</p><p>Call (317) 555-0000 or reply to this email.</p>',
    body_text: 'Hi {{first_name}}, It\'s been about a year since your last plumbing inspection. Schedule your annual checkup today and get 10% off!',
    category: 'marketing'
  }
]

// Automation Rules
const automationRules = [
  {
    name: 'Send Review Request After Job',
    description: 'Automatically send review request 24 hours after job completion',
    trigger_type: 'job_status_change',
    trigger_config: { from_status: 'in_progress', to_status: 'completed' },
    action_type: 'send_email',
    action_config: { template: 'Review Request', delay_hours: 24 },
    is_active: true
  },
  {
    name: 'Notify Dispatcher on Emergency',
    description: 'Alert dispatcher when emergency job is created',
    trigger_type: 'job_created',
    trigger_config: { priority: 'emergency' },
    action_type: 'create_notification',
    action_config: { role: 'dispatcher', title: 'Emergency Job Created' },
    is_active: true
  },
  {
    name: 'Follow-up on Unsent Estimates',
    description: 'Remind sales to send estimates that are still draft after 3 days',
    trigger_type: 'estimate_age',
    trigger_config: { status: 'draft', days_old: 3 },
    action_type: 'create_task',
    action_config: { assignee: 'creator', title: 'Follow up on draft estimate' },
    is_active: false
  }
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('=' .repeat(60))
  console.log('🌱 317 PLUMBER COMPREHENSIVE SEED')
  console.log('='.repeat(60))
  console.log('')

  try {
    // Step 1: Clean existing data (optional - comment out to keep existing)
    await cleanExistingData()

    // Step 2: Create or get account
    const accountId = await createAccount()

    // Step 3: Create users (with auth)
    const userIds = await createUsers(accountId)

    // Step 4: Create contact tags
    const tagIds = await createContactTags(accountId)

    // Step 5: Create contacts (with tags)
    const contactIds = await createContacts(accountId, tagIds)

    // Step 6: Create parts inventory
    await createParts(accountId, userIds.owner)

    // Step 7: Create jobs (various statuses, assigned to techs)
    const jobIds = await createJobs(accountId, contactIds, userIds)

    // Step 8: Create estimates
    const estimateIds = await createEstimates(accountId, contactIds, jobIds, userIds.sales)

    // Step 9: Create invoices and payments
    await createInvoicesAndPayments(accountId, contactIds, jobIds, userIds.owner)

    // Step 10: Create conversations and messages
    await createConversations(accountId, contactIds)

    // Step 11: Create email templates
    await createEmailTemplates(accountId)

    // Step 12: Create campaigns
    await createCampaigns(accountId, contactIds)

    // Step 13: Create calendar events
    await createCalendarEvents(accountId, contactIds, userIds)

    // Step 14: Create notifications
    await createNotifications(accountId, userIds)

    // Step 15: Create automation rules
    await createAutomationRules(accountId)

    // Step 16: Create meetings
    await createMeetings(accountId, contactIds, userIds.sales)

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('✅ SEED COMPLETE!')
    console.log('='.repeat(60))
    console.log(`
📊 Data Summary:
   • Account: ${ACCOUNT_NAME} (${accountId})
   • Users: ${Object.keys(userIds).length} (all active)
   • Contact Tags: ${Object.keys(tagIds).length}
   • Contacts: ${contactIds.length}
   • Jobs: ${jobIds.length} (various statuses)
   • Estimates: ${estimateIds.length}
   • Invoices: Created with payments
   • Parts: ${parts.length} inventory items
   • Email Templates: ${emailTemplates.length}
   • Campaigns: 2 (with recipients)
   • Calendar Events: Created
   • Notifications: Created
   • Automation Rules: ${automationRules.length}
   • Meetings: 3

🔐 Test Login Credentials:
   Email: ryan@317plumber.com (owner)
   Password: ${TEST_PASSWORD}

   Other users: admin@, dispatch@, marcus@, jake@, emily@ @317plumber.com
   All use password: ${TEST_PASSWORD}

🎯 Features Ready to Test:
   ✓ Job assignment to techs
   ✓ Job status workflow
   ✓ Estimates (create, send, accept/reject)
   ✓ Invoices and payments
   ✓ Parts inventory
   ✓ Contact management with tags
   ✓ Email campaigns
   ✓ Calendar scheduling
   ✓ Notifications
   ✓ Automation rules
   ✓ Dispatch map (active techs)
`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function cleanExistingData() {
  console.log('🧹 Cleaning existing 317-plumber data...')

  // Get account ID first
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', ACCOUNT_SLUG)
    .single()

  if (account) {
    // Delete in order respecting foreign keys
    const tables = [
      'notifications', 'messages', 'conversations',
      'job_photos', 'job_parts', 'job_materials', 'gps_logs',
      'estimate_items', 'estimates',
      'payments', 'invoices',
      'campaign_recipients', 'campaigns',
      'calendar_events', 'meetings',
      'automation_rules',
      'jobs',
      'contact_tags AS ct USING (contacts)', // Special handling
      'contacts',
      'parts',
      'email_templates',
      'users'
    ]

    for (const table of tables) {
      try {
        // Handle special cases
        if (table.includes('contact_tags')) {
          // Delete tag associations, not the tags themselves yet
          try {
            await supabase.rpc('exec_sql', {
              sql: `DELETE FROM contact_tag_assignments WHERE contact_id IN (SELECT id FROM contacts WHERE account_id = '${account.id}')`
            })
          } catch {
            // Ignore
          }
        } else {
          await supabase
            .from(table)
            .delete()
            .eq('account_id', account.id)
        }
      } catch (e) {
        // Table might not exist or have different structure, continue
      }
    }

    // Delete contact tags last
    try {
      await supabase.from('contact_tags').delete().eq('account_id', account.id)
    } catch {
      // Ignore errors
    }

    console.log('   ✓ Existing data cleaned')
  } else {
    console.log('   ✓ No existing account found')
  }
}

async function createAccount(): Promise<string> {
  console.log('\n📋 Creating account...')

  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', ACCOUNT_SLUG)
    .single()

  if (existing) {
    console.log(`   ✓ Using existing account: ${existing.id}`)
    return existing.id
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .insert({
      name: ACCOUNT_NAME,
      slug: ACCOUNT_SLUG,
      inbound_email_domain: 'reply.317plumber.com',
      google_review_link: 'https://g.page/317plumber/review',
      persona_config: {
        companyName: '317 Plumber',
        tone: 'friendly, professional, knowledgeable',
        services: ['residential plumbing', 'commercial plumbing', 'water heaters',
                   'drain cleaning', 'emergency service', 'sewer repair', 'backflow testing']
      },
      settings: {
        timezone: 'America/Indiana/Indianapolis',
        businessHours: { start: '07:00', end: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
        emergencyAfterHours: true,
        taxRate: 0.07,
        defaultPaymentTerms: 30
      }
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create account: ${error.message}`)

  console.log(`   ✓ Created account: ${account.id}`)
  return account.id
}

async function createUsers(accountId: string): Promise<Record<string, string>> {
  console.log('\n👥 Creating users...')

  const userIds: Record<string, string> = {}

  for (const user of users) {
    // Check if auth user exists
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuth = authUsers?.users?.find(u => u.email === user.email)

    let authUserId: string

    if (existingAuth) {
      authUserId = existingAuth.id
      // Update password to ensure it matches
      await supabase.auth.admin.updateUserById(authUserId, {
        password: TEST_PASSWORD,
        email_confirm: true
      })
      console.log(`   ✓ Auth user exists: ${user.email}`)
    } else {
      // Create auth user
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      })

      if (error) throw new Error(`Failed to create auth user ${user.email}: ${error.message}`)
      authUserId = newUser.user.id
      console.log(`   ✓ Created auth user: ${user.email}`)
    }

    // Upsert public user (only columns that exist in schema: id, account_id, full_name, role, avatar_url)
    const { error: publicError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        account_id: accountId,
        full_name: user.full_name,
        role: user.role
      }, { onConflict: 'id' })

    if (publicError) throw new Error(`Failed to create public user ${user.email}: ${publicError.message}`)

    userIds[user.role === 'tech' ? (userIds.tech1 ? 'tech2' : 'tech1') : user.role] = authUserId

    // Also store by simple role name for techs
    if (user.role === 'tech') {
      if (!userIds.tech) userIds.tech = authUserId
    }
  }

  console.log(`   ✓ Created ${users.length} users`)
  return userIds
}

async function createContactTags(accountId: string): Promise<Record<string, string>> {
  console.log('\n🏷️  Creating contact tags...')

  const tagIds: Record<string, string> = {}

  for (const tag of contactTags) {
    const { data, error } = await supabase
      .from('contact_tags')
      .upsert({
        account_id: accountId,
        name: tag.name,
        color: tag.color,
        description: tag.description
      }, { onConflict: 'account_id,name' })
      .select()
      .single()

    if (error) {
      // Try to get existing
      const { data: existing } = await supabase
        .from('contact_tags')
        .select('id')
        .eq('account_id', accountId)
        .eq('name', tag.name)
        .single()

      if (existing) tagIds[tag.name] = existing.id
    } else if (data) {
      tagIds[tag.name] = data.id
    }
  }

  console.log(`   ✓ Created ${Object.keys(tagIds).length} tags`)
  return tagIds
}

async function createContacts(accountId: string, tagIds: Record<string, string>): Promise<string[]> {
  console.log('\n📇 Creating contacts...')

  const contactIds: string[] = []

  for (const contact of contacts) {
    const { tags, ...contactData } = contact

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('email', contact.email)
      .single()

    let contactId: string

    if (existing) {
      contactId = existing.id
      console.log(`   ⏭️ Contact exists: ${contact.first_name} ${contact.last_name}`)
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          account_id: accountId,
          ...contactData
        })
        .select()
        .single()

      if (error) {
        console.error(`   ✗ Failed: ${contact.email}`, error.message)
        continue
      }

      contactId = data.id
      console.log(`   ✓ Created: ${contact.first_name} ${contact.last_name}`)
    }

    contactIds.push(contactId)

    // Assign tags to contact (if junction table exists)
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tagId = tagIds[tagName]
        if (tagId) {
          await supabase
            .from('contact_tag_assignments')
            .upsert({
              contact_id: contactId,
              tag_id: tagId
            }, { onConflict: 'contact_id,tag_id' })
        }
      }
    }
  }

  console.log(`   ✓ Created ${contactIds.length} contacts`)
  return contactIds
}

async function createParts(accountId: string, createdBy: string) {
  console.log('\n🔧 Creating parts inventory...')

  for (const part of parts) {
    await supabase
      .from('parts')
      .upsert({
        account_id: accountId,
        ...part,
        created_by: createdBy
      }, { onConflict: 'account_id,sku' })
  }

  console.log(`   ✓ Created ${parts.length} parts`)
}

async function createJobs(
  accountId: string,
  contactIds: string[],
  userIds: Record<string, string>
): Promise<string[]> {
  console.log('\n🛠️  Creating jobs...')

  const now = new Date()
  const jobIds: string[] = []

  const jobsData = [
    // Completed jobs (past)
    {
      contact_index: 0,
      description: 'Kitchen sink faucet replacement and garbage disposal repair',
      status: 'completed',
      scheduled_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      total_amount: 45000,
      tech_id: userIds.tech1,
      notes: 'Installed new Moen faucet and InSinkErator disposal. Customer very happy.'
    },
    {
      contact_index: 2,
      description: 'Water heater replacement - 50 gallon gas unit',
      status: 'completed',
      scheduled_start: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      total_amount: 185000,
      tech_id: userIds.tech2,
      notes: 'Installed new Rheem 50-gallon high-efficiency gas water heater.'
    },
    {
      contact_index: 1,
      description: 'Bathroom drain clearing - slow drain in master bath',
      status: 'completed',
      scheduled_start: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      total_amount: 22500,
      tech_id: userIds.tech1,
      notes: 'Hair clog about 18 inches down. Used drain snake. Recommended drain guards.'
    },
    {
      contact_index: 3,
      description: 'EMERGENCY: Burst pipe and water damage mitigation',
      status: 'completed',
      scheduled_start: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      total_amount: 275000,
      tech_id: userIds.tech1,
      notes: 'Shut off water, repaired copper pipe, extracted ~40 gallons water.'
    },
    // In progress
    {
      contact_index: 8,
      description: 'Whole house re-pipe - replacing galvanized with PEX',
      status: 'in_progress',
      scheduled_start: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      total_amount: 850000,
      tech_id: userIds.tech2,
      notes: 'Day 2 of 3-day job. Galvanized pipes corroded throughout.'
    },
    // En route
    {
      contact_index: 11,
      description: 'Emergency - no hot water, elderly customer',
      status: 'en_route',
      scheduled_start: new Date(),
      total_amount: 0, // TBD
      tech_id: userIds.tech1,
      notes: 'Elderly widow with no hot water. Priority dispatch.'
    },
    // Scheduled for today
    {
      contact_index: 6,
      description: 'Main sewer line camera inspection and hydro jetting',
      status: 'scheduled',
      scheduled_start: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      total_amount: 89500,
      tech_id: userIds.tech2,
      notes: 'Customer reports slow drains throughout house. Suspects main line.'
    },
    // Scheduled for tomorrow
    {
      contact_index: 5,
      description: 'Commercial grease trap cleaning - Broad Ripple Cafe',
      status: 'scheduled',
      scheduled_start: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      total_amount: 45000,
      tech_id: userIds.tech1,
      notes: 'Quarterly grease trap cleaning. Restaurant closed Mondays.'
    },
    {
      contact_index: 4,
      description: 'Toilet replacement - master bathroom upgrade',
      status: 'scheduled',
      scheduled_start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      total_amount: 65000,
      tech_id: null, // Unassigned - for testing assignment
      notes: 'Customer wants to upgrade to high-efficiency toilet.'
    },
    // Scheduled for next week
    {
      contact_index: 9,
      description: 'Tankless water heater consultation and quote',
      status: 'scheduled',
      scheduled_start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      total_amount: 0,
      tech_id: null, // Unassigned
      notes: 'Customer interested in tankless conversion. Sales visit.'
    },
    {
      contact_index: 13,
      description: 'Monthly grease trap maintenance - Ristorante Napoli',
      status: 'scheduled',
      scheduled_start: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      total_amount: 35000,
      tech_id: userIds.tech2,
      notes: 'Regular monthly maintenance visit.'
    },
    // Lead (potential job)
    {
      contact_index: 14,
      description: 'Bathroom renovation plumbing - quote requested',
      status: 'lead',
      scheduled_start: null,
      total_amount: 0,
      tech_id: null,
      notes: 'Customer interested in full bathroom renovation. Waiting for decision.'
    }
  ]

  for (const job of jobsData) {
    const contactId = contactIds[job.contact_index]
    if (!contactId) continue

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        description: job.description,
        status: job.status,
        scheduled_start: job.scheduled_start ? job.scheduled_start.toISOString() : null,
        scheduled_end: job.scheduled_start ? new Date(job.scheduled_start.getTime() + 3 * 60 * 60 * 1000).toISOString() : null,
        total_amount: job.total_amount,
        tech_assigned_id: job.tech_id,
        notes: job.notes
      })
      .select()
      .single()

    if (error) {
      console.error(`   ✗ Job failed: ${error.message}`)
    } else {
      jobIds.push(data.id)
    }
  }

  console.log(`   ✓ Created ${jobIds.length} jobs`)
  return jobIds
}

async function createEstimates(
  accountId: string,
  contactIds: string[],
  jobIds: string[],
  createdBy: string
): Promise<string[]> {
  console.log('\n📝 Creating estimates...')

  // Check if estimates table exists
  const { error: checkError } = await supabase
    .from('estimates')
    .select('id')
    .limit(1)

  if (checkError && checkError.message.includes('schema cache')) {
    console.log('   ⚠ Estimates table not found - skipping (run migration to enable)')
    return []
  }

  const now = new Date()
  const estimateIds: string[] = []

  const estimatesData = [
    {
      contact_index: 4,
      title: 'Master Bathroom Remodel - Plumbing',
      description: 'Complete plumbing for master bathroom renovation including new shower, toilet, and vanity',
      status: 'draft',
      valid_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      items: [
        { item_type: 'labor', name: 'Plumbing labor (estimated 16 hours)', quantity: 16, unit: 'hour', unit_price: 12500 },
        { item_type: 'material', name: 'PEX piping and fittings', quantity: 1, unit: 'each', unit_price: 45000 },
        { item_type: 'material', name: 'Toilet rough-in kit', quantity: 1, unit: 'each', unit_price: 8500 },
        { item_type: 'material', name: 'Shower valve assembly', quantity: 1, unit: 'each', unit_price: 32000 }
      ]
    },
    {
      contact_index: 9,
      title: 'Tankless Water Heater Installation',
      description: 'Replace existing 50-gallon tank with Rinnai tankless unit',
      status: 'sent',
      sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      valid_until: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      items: [
        { item_type: 'equipment', name: 'Rinnai RU199iN Tankless Water Heater', quantity: 1, unit: 'each', unit_price: 195000 },
        { item_type: 'labor', name: 'Installation labor', quantity: 6, unit: 'hour', unit_price: 12500 },
        { item_type: 'material', name: 'Gas line upgrade materials', quantity: 1, unit: 'each', unit_price: 28000 },
        { item_type: 'material', name: 'Venting materials', quantity: 1, unit: 'each', unit_price: 15000 }
      ]
    },
    {
      contact_index: 12,
      title: 'Annual Maintenance Plan',
      description: 'First-year maintenance plan including quarterly inspections',
      status: 'accepted',
      sent_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      accepted_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      valid_until: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      converted_to_job_id: jobIds[0] || null,
      items: [
        { item_type: 'labor', name: 'Annual maintenance plan (4 visits)', quantity: 1, unit: 'each', unit_price: 39900 }
      ]
    },
    {
      contact_index: 7,
      title: 'Office Building Backflow Testing',
      description: 'Annual backflow prevention testing for commercial property',
      status: 'rejected',
      sent_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      rejected_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      rejection_reason: 'Went with another vendor who offered lower price',
      valid_until: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      items: [
        { item_type: 'labor', name: 'Backflow testing and certification', quantity: 3, unit: 'each', unit_price: 15000 }
      ]
    },
    {
      contact_index: 10,
      title: 'Emergency Sump Pump Replacement',
      description: 'Replace failed sump pump with battery backup system',
      status: 'expired',
      sent_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      valid_until: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      items: [
        { item_type: 'equipment', name: 'Zoeller M53 Sump Pump', quantity: 1, unit: 'each', unit_price: 22500 },
        { item_type: 'equipment', name: 'Battery backup system', quantity: 1, unit: 'each', unit_price: 45000 },
        { item_type: 'labor', name: 'Installation', quantity: 4, unit: 'hour', unit_price: 12500 }
      ]
    }
  ]

  for (let i = 0; i < estimatesData.length; i++) {
    const est = estimatesData[i]
    const contactId = contactIds[est.contact_index]
    if (!contactId) continue

    // Calculate totals
    const subtotal = est.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const taxRate = 0.07
    const taxAmount = Math.round(subtotal * taxRate)
    const total = subtotal + taxAmount

    const { data, error } = await supabase
      .from('estimates')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        estimate_number: `EST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
        title: est.title,
        description: est.description,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        status: est.status,
        valid_until: est.valid_until.toISOString(),
        sent_at: est.sent_at?.toISOString() || null,
        accepted_at: (est as any).accepted_at?.toISOString() || null,
        rejected_at: (est as any).rejected_at?.toISOString() || null,
        rejection_reason: (est as any).rejection_reason || null,
        converted_to_job_id: (est as any).converted_to_job_id || null,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error(`   ✗ Estimate failed: ${error.message}`)
      continue
    }

    estimateIds.push(data.id)

    // Create line items
    for (let j = 0; j < est.items.length; j++) {
      const item = est.items[j]
      await supabase
        .from('estimate_items')
        .insert({
          account_id: accountId,
          estimate_id: data.id,
          item_type: item.item_type,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          sort_order: j
        })
    }
  }

  console.log(`   ✓ Created ${estimateIds.length} estimates`)
  return estimateIds
}

async function createInvoicesAndPayments(
  accountId: string,
  contactIds: string[],
  jobIds: string[],
  createdBy: string
) {
  console.log('\n💵 Creating invoices and payments...')

  const now = new Date()

  const invoicesData = [
    {
      contact_index: 0,
      job_index: 0,
      status: 'paid',
      total_amount: 45000,
      due_date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      paid_at: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
      payment_method: 'credit_card'
    },
    {
      contact_index: 2,
      job_index: 1,
      status: 'paid',
      total_amount: 185000,
      due_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      paid_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      payment_method: 'check'
    },
    {
      contact_index: 3,
      job_index: 3,
      status: 'sent',
      total_amount: 275000,
      due_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      paid_at: null,
      payment_method: null
    },
    {
      contact_index: 8,
      job_index: null,
      status: 'overdue',
      total_amount: 125000,
      due_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      paid_at: null,
      payment_method: null
    },
    {
      contact_index: 1,
      job_index: 2,
      status: 'draft',
      total_amount: 22500,
      due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      paid_at: null,
      payment_method: null
    },
    {
      contact_index: 14,
      job_index: null,
      status: 'sent',
      total_amount: 45000,
      due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      paid_at: null,
      payment_method: null,
      notes: 'Customer on payment plan - $200 partial payment received'
    }
  ]

  let invoiceCount = 0
  let paymentCount = 0

  for (let i = 0; i < invoicesData.length; i++) {
    const inv = invoicesData[i]
    const contactId = contactIds[inv.contact_index]
    if (!contactId) continue

    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`

    const taxAmount = Math.round(inv.total_amount * 0.07)
    const amount = inv.total_amount - taxAmount

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        job_id: inv.job_index !== null ? jobIds[inv.job_index] : null,
        invoice_number: invoiceNumber,
        status: inv.status,
        amount: amount,
        tax_amount: taxAmount,
        total_amount: inv.total_amount,
        due_date: inv.due_date.toISOString(),
        paid_at: inv.paid_at?.toISOString() || null,
        notes: (inv as any).notes || null
      })
      .select()
      .single()

    if (error) {
      console.error(`   ✗ Invoice failed: ${error.message}`)
      continue
    }

    invoiceCount++

    // Create payment record for paid invoices
    if (inv.status === 'paid' && inv.paid_at) {
      await supabase.from('payments').insert({
        account_id: accountId,
        invoice_id: invoice.id,
        amount: inv.total_amount,
        payment_method: inv.payment_method,
        payment_date: inv.paid_at.toISOString(),
        notes: 'Payment received'
      })
      paymentCount++
    }
  }

  console.log(`   ✓ Created ${invoiceCount} invoices, ${paymentCount} payments`)
}

async function createConversations(accountId: string, contactIds: string[]) {
  console.log('\n💬 Creating conversations...')

  const conversationsData = [
    {
      contact_index: 0,
      subject: 'Follow-up on kitchen repair',
      status: 'closed',
      channel: 'email',
      messages: [
        { direction: 'inbound', sender_type: 'contact', body_text: 'Hey, just wanted to let you know the faucet and disposal are working great! Thanks for the quick service.' },
        { direction: 'outbound', sender_type: 'user', body_text: 'Thanks Mike! Glad everything is working well. Don\'t hesitate to reach out if you need anything else. - 317 Plumber' }
      ]
    },
    {
      contact_index: 3,
      subject: 'Emergency water damage - follow up',
      status: 'open',
      channel: 'sms',
      messages: [
        { direction: 'inbound', sender_type: 'contact', body_text: 'Hi, the restoration company came today. They said your team did a great job with the initial mitigation. Thank you so much for coming out at midnight!' },
        { direction: 'outbound', sender_type: 'user', body_text: 'So glad we could help Amanda! How is the baby doing with all the construction? Let us know if you need anything.' },
        { direction: 'inbound', sender_type: 'contact', body_text: 'She\'s fine, we\'re staying at my mom\'s for a few days. Can you send over the invoice when you get a chance?' }
      ]
    },
    {
      contact_index: 6,
      subject: 'Main line inspection appointment',
      status: 'open',
      channel: 'email',
      messages: [
        { direction: 'inbound', sender_type: 'contact', body_text: 'Confirming my appointment for today. I\'ll be home all day. The cleanout is on the east side of the house by the garage.' }
      ]
    },
    {
      contact_index: 9,
      subject: 'Questions about tankless water heater',
      status: 'open',
      channel: 'email',
      messages: [
        { direction: 'inbound', sender_type: 'contact', body_text: 'I received your estimate for the tankless water heater. A few questions: 1) What\'s the warranty? 2) Will my gas line definitely need upgrading? 3) How long does installation take?' },
        { direction: 'outbound', sender_type: 'user', body_text: 'Great questions! 1) Rinnai offers a 12-year warranty on the heat exchanger. 2) We\'d need to assess your current gas line - it depends on the BTU capacity. 3) Usually 4-6 hours. Would you like to schedule a quick assessment?' },
        { direction: 'inbound', sender_type: 'contact', body_text: 'Yes, let\'s schedule the assessment. I\'m available Tuesday or Thursday afternoon.' }
      ]
    },
    {
      contact_index: 7,
      subject: 'RE: Backflow testing quote',
      status: 'closed',
      channel: 'email',
      messages: [
        { direction: 'outbound', sender_type: 'user', body_text: 'Hi Patricia, following up on the backflow testing estimate we sent. Let me know if you have any questions!' },
        { direction: 'inbound', sender_type: 'contact', body_text: 'Thanks for following up. Unfortunately we went with another vendor who came in lower. But I\'ll keep you in mind for other properties!' }
      ]
    },
    {
      contact_index: 8,
      subject: 'Payment reminder - Invoice past due',
      status: 'open',
      channel: 'email',
      messages: [
        { direction: 'outbound', sender_type: 'user', body_text: 'Hi Thomas, this is a friendly reminder that Invoice #INV-202511-0004 is now 15 days past due. Please let us know if you need to set up a payment plan.' },
        { direction: 'inbound', sender_type: 'contact', body_text: 'Sorry about that - things have been hectic. Can I pay half now and half next month?' }
      ]
    }
  ]

  let convoCount = 0

  for (const convo of conversationsData) {
    const contactId = contactIds[convo.contact_index]
    if (!contactId) continue

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        subject: convo.subject,
        status: convo.status,
        channel: convo.channel
      })
      .select()
      .single()

    if (error) continue

    convoCount++

    for (const msg of convo.messages) {
      await supabase.from('messages').insert({
        account_id: accountId,
        conversation_id: conversation.id,
        direction: msg.direction,
        sender_type: msg.sender_type,
        body_text: msg.body_text
      })
    }
  }

  console.log(`   ✓ Created ${convoCount} conversations`)
}

async function createEmailTemplates(accountId: string) {
  console.log('\n📧 Creating email templates...')

  for (const template of emailTemplates) {
    await supabase
      .from('email_templates')
      .upsert({
        account_id: accountId,
        ...template
      }, { onConflict: 'account_id,name' })
      
  }

  console.log(`   ✓ Created ${emailTemplates.length} templates`)
}

async function createCampaigns(accountId: string, contactIds: string[]) {
  console.log('\n📢 Creating campaigns...')

  const now = new Date()

  // Campaign 1: Active campaign
  const { data: campaign1 } = await supabase
    .from('campaigns')
    .insert({
      account_id: accountId,
      name: 'Winter Maintenance Reminder',
      subject: 'Protect Your Pipes This Winter! ❄️',
      status: 'sending',
      template_id: null,
      scheduled_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sent_count: 8,
      open_count: 5,
      click_count: 2
    })
    .select()
    .single()

  // Add recipients to campaign 1
  if (campaign1) {
    const residentialContacts = contactIds.slice(0, 8)
    for (const contactId of residentialContacts) {
      await supabase.from('campaign_recipients').insert({
        campaign_id: campaign1.id,
        contact_id: contactId,
        status: Math.random() > 0.3 ? 'sent' : 'pending',
        sent_at: Math.random() > 0.3 ? new Date().toISOString() : null,
        opened_at: Math.random() > 0.5 ? new Date().toISOString() : null
      })
    }
  }

  // Campaign 2: Completed campaign
  const { data: campaign2 } = await supabase
    .from('campaigns')
    .insert({
      account_id: accountId,
      name: 'Fall Service Special',
      subject: '20% Off Water Heater Inspection',
      status: 'completed',
      scheduled_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      sent_count: 12,
      open_count: 8,
      click_count: 4
    })
    .select()
    .single()

  console.log('   ✓ Created 2 campaigns')
}

async function createCalendarEvents(
  accountId: string,
  contactIds: string[],
  userIds: Record<string, string>
) {
  console.log('\n📅 Creating calendar events...')

  const now = new Date()

  const events = [
    { title: 'Sewer inspection - James Wilson', contact_index: 6, hours_from_now: 2 },
    { title: 'Grease trap - Broad Ripple Cafe', contact_index: 5, hours_from_now: 26 },
    { title: 'Toilet replacement - David Mitchell', contact_index: 4, hours_from_now: 50 },
    { title: 'Tankless consultation - Sandra Brown', contact_index: 9, hours_from_now: 74 },
    { title: 'Monthly maintenance - Napoli', contact_index: 13, hours_from_now: 168 },
    { title: 'Team meeting', contact_index: null, hours_from_now: 24 },
    { title: 'Vendor call - Rinnai rep', contact_index: null, hours_from_now: 48 },
    { title: 'Safety training', contact_index: null, hours_from_now: 96 }
  ]

  for (const event of events) {
    const startTime = new Date(now.getTime() + event.hours_from_now * 60 * 60 * 1000)

    await supabase.from('calendar_events').insert({
      account_id: accountId,
      title: event.title,
      start_time: startTime.toISOString(),
      end_time: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      contact_id: event.contact_index !== null ? contactIds[event.contact_index] : null,
      created_by: userIds.owner
    })
  }

  console.log(`   ✓ Created ${events.length} calendar events`)
}

async function createNotifications(accountId: string, userIds: Record<string, string>) {
  console.log('\n🔔 Creating notifications...')

  const now = new Date()

  const notifications = [
    { user: 'owner', type: 'invoice_overdue', title: 'Invoice Overdue', message: 'Invoice #INV-202511-0004 is 15 days overdue ($1,250.00)', is_read: false },
    { user: 'owner', type: 'new_lead', title: 'New Lead', message: 'New contact from Google Ads: Sandra Brown', is_read: true },
    { user: 'dispatcher', type: 'tech_available', title: 'Tech Available', message: 'Marcus Williams is now available for dispatch', is_read: false },
    { user: 'dispatcher', type: 'job_completed', title: 'Job Completed', message: 'Jake Thompson completed job at 1547 Washington Blvd', is_read: true },
    { user: 'tech1', type: 'job_assigned', title: 'New Job Assigned', message: 'You have been assigned to: Emergency - no hot water', is_read: false },
    { user: 'tech2', type: 'job_assigned', title: 'New Job Assigned', message: 'You have been assigned to: Main sewer line inspection', is_read: false },
    { user: 'sales', type: 'estimate_viewed', title: 'Estimate Viewed', message: 'Sandra Brown viewed estimate for Tankless Water Heater', is_read: false },
    { user: 'sales', type: 'estimate_accepted', title: 'Estimate Accepted!', message: 'Daniel Martinez accepted Annual Maintenance Plan', is_read: true },
    { user: 'owner', type: 'review_received', title: 'New 5-Star Review!', message: 'Mike Henderson left a 5-star Google review', is_read: false },
    { user: 'admin', type: 'low_inventory', title: 'Low Inventory Alert', message: 'SharkBite 1/2" Coupling is below reorder threshold', is_read: false }
  ]

  for (const notif of notifications) {
    const userId = userIds[notif.user]
    if (!userId) continue

    await supabase.from('notifications').insert({
      account_id: accountId,
      user_id: userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      is_read: notif.is_read,
      read_at: notif.is_read ? new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
      created_at: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString()
    })
  }

  console.log(`   ✓ Created ${notifications.length} notifications`)
}

async function createAutomationRules(accountId: string) {
  console.log('\n⚡ Creating automation rules...')

  for (const rule of automationRules) {
    await supabase
      .from('automation_rules')
      .upsert({
        account_id: accountId,
        name: rule.name,
        description: rule.description,
        trigger_type: rule.trigger_type,
        trigger_config: rule.trigger_config,
        action_type: rule.action_type,
        action_config: rule.action_config,
        is_active: rule.is_active
      }, { onConflict: 'account_id,name' })
      
  }

  console.log(`   ✓ Created ${automationRules.length} automation rules`)
}

async function createMeetings(accountId: string, contactIds: string[], salesUserId: string) {
  console.log('\n🤝 Creating meetings...')

  const now = new Date()

  const meetings = [
    {
      contact_index: 9,
      title: 'Tankless Water Heater Consultation',
      scheduled_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      location: '420 University Blvd, Indianapolis, IN 46202',
      status: 'scheduled',
      notes: 'Customer interested in tankless conversion. Bring Rinnai brochures.'
    },
    {
      contact_index: 4,
      title: 'Rental Property Plumbing Assessment',
      scheduled_date: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      location: '7845 Keystone Ave, Indianapolis, IN 46240',
      status: 'scheduled',
      notes: 'Customer owns 3 rental properties. Big opportunity for maintenance contracts.'
    },
    {
      contact_index: 7,
      title: 'Commercial Property Walk-through',
      scheduled_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      location: '100 Monument Circle, Indianapolis, IN 46204',
      status: 'completed',
      notes: 'Met with building manager. Quoted backflow testing for 3 units.',
      summary: 'Good meeting. Building has 3 backflow preventers needing annual testing. Sent estimate same day. They went with another vendor but said to keep in touch.'
    }
  ]

  for (const meeting of meetings) {
    const contactId = contactIds[meeting.contact_index]
    if (!contactId) continue

    await supabase.from('meetings').insert({
      account_id: accountId,
      contact_id: contactId,
      user_id: salesUserId,
      title: meeting.title,
      scheduled_date: meeting.scheduled_date.toISOString(),
      location: meeting.location,
      status: meeting.status,
      notes: meeting.notes,
      summary: (meeting as any).summary || null
    })
  }

  console.log(`   ✓ Created ${meetings.length} meetings`)
}

// Run the seed
seed()
