/**
 * API Seed Route - Comprehensive 317 Plumber Data
 *
 * POST /api/seed - Seeds the database with comprehensive test data
 * DELETE /api/seed - Clears existing 317-plumber data (optional cleanup)
 *
 * This creates everything needed to test ALL features:
 * - Active users (owner, admin, dispatcher, 2 techs, sales)
 * - Contacts with tags and profiles
 * - Jobs in all statuses
 * - Estimates, invoices, payments
 * - Parts inventory
 * - Campaigns, notifications, calendar events
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ACCOUNT_SLUG = '317-plumber'
const ACCOUNT_NAME = '317 Plumber'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if clean was requested
    const { searchParams } = new URL(request.url)
    const shouldClean = searchParams.get('clean') === 'true'

    // Step 1: Clean existing data if requested
    if (shouldClean) {
      await cleanExistingData(supabase)
    }

    // Step 2: Create or get account
    let { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('slug', ACCOUNT_SLUG)
      .single()

    if (!account) {
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          name: ACCOUNT_NAME,
          slug: ACCOUNT_SLUG,
          inbound_email_domain: 'reply.317plumber.com',
          google_review_link: 'https://g.page/317plumber/review',
          persona_config: {
            companyName: '317 Plumber',
            tone: 'friendly, professional',
            services: ['residential plumbing', 'commercial plumbing', 'water heaters', 'drain cleaning', 'emergency service']
          },
          settings: {
            timezone: 'America/Indiana/Indianapolis',
            businessHours: { start: '07:00', end: '18:00' },
            emergencyAfterHours: true,
            taxRate: 0.07
          }
        })
        .select()
        .single()

      if (error) throw new Error(`Account creation failed: ${error.message}`)
      account = newAccount
    }

    const accountId = account.id

    // Step 3: Create users
    const userIds = await createUsers(supabase, accountId)

    // Step 4: Create contact tags
    const tagIds = await createContactTags(supabase, accountId)

    // Step 5: Create contacts
    const contactIds = await createContacts(supabase, accountId, tagIds)

    // Step 6: Create parts inventory
    await createParts(supabase, accountId, userIds.owner)

    // Step 7: Create jobs
    const jobIds = await createJobs(supabase, accountId, contactIds, userIds)

    // Step 8: Create estimates
    const estimateIds = await createEstimates(supabase, accountId, contactIds, jobIds, userIds.sales)

    // Step 9: Create invoices and payments
    await createInvoicesAndPayments(supabase, accountId, contactIds, jobIds, userIds.owner)

    // Step 10: Create conversations
    await createConversations(supabase, accountId, contactIds)

    // Step 11: Create email templates
    await createEmailTemplates(supabase, accountId)

    // Step 12: Create campaigns
    await createCampaigns(supabase, accountId, contactIds)

    // Step 13: Create calendar events
    await createCalendarEvents(supabase, accountId, contactIds, userIds)

    // Step 14: Create notifications
    await createNotifications(supabase, accountId, userIds)

    // Step 15: Create automation rules
    await createAutomationRules(supabase, accountId)

    return NextResponse.json({
      success: true,
      message: '317 Plumber data seeded successfully',
      summary: {
        accountId,
        accountSlug: ACCOUNT_SLUG,
        users: Object.keys(userIds).length,
        contacts: contactIds.length,
        tags: Object.keys(tagIds).length,
        jobs: jobIds.length,
        estimates: estimateIds.length
      },
      credentials: {
        note: 'All users use the same password',
        password: TEST_PASSWORD,
        users: [
          'ryan@317plumber.com (owner)',
          'admin@317plumber.com (admin)',
          'dispatch@317plumber.com (dispatcher)',
          'marcus@317plumber.com (tech)',
          'jake@317plumber.com (tech)',
          'emily@317plumber.com (sales)'
        ]
      }
    })

  } catch (error: unknown) {
    console.error('Seed error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to seed database', details: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    await cleanExistingData(supabase)

    return NextResponse.json({
      success: true,
      message: '317 Plumber data cleaned successfully'
    })

  } catch (error: unknown) {
    console.error('Clean error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to clean database', details: message }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function cleanExistingData(supabase: ReturnType<typeof createClient>) {
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', ACCOUNT_SLUG)
    .single()

  if (!account) return

  // Delete in order respecting foreign keys
  const tables = [
    'notifications', 'messages', 'conversations',
    'job_photos', 'job_parts', 'gps_logs',
    'estimate_items', 'estimates',
    'payments', 'invoices',
    'campaign_recipients', 'campaigns',
    'calendar_events', 'meetings',
    'automation_rules',
    'jobs',
    'contacts',
    'parts',
    'email_templates',
    'contact_tags'
  ]

  for (const table of tables) {
    await supabase.from(table).delete().eq('account_id', account.id).catch(() => {})
  }

  // Delete users separately (need to handle auth too)
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('account_id', account.id)

  if (existingUsers) {
    for (const user of existingUsers) {
      await supabase.from('users').delete().eq('id', user.id).catch(() => {})
      await supabase.auth.admin.deleteUser(user.id).catch(() => {})
    }
  }
}

const users = [
  { email: 'ryan@317plumber.com', full_name: 'Ryan Galbraith', role: 'owner', status: 'active' },
  { email: 'admin@317plumber.com', full_name: 'Michelle Adams', role: 'admin', status: 'active' },
  { email: 'dispatch@317plumber.com', full_name: 'Sarah Johnson', role: 'dispatcher', status: 'active' },
  { email: 'marcus@317plumber.com', full_name: 'Marcus Williams', role: 'tech', status: 'available', phone: '317-555-2001' },
  { email: 'jake@317plumber.com', full_name: 'Jake Thompson', role: 'tech', status: 'available', phone: '317-555-2002' },
  { email: 'emily@317plumber.com', full_name: 'Emily Davis', role: 'sales', status: 'active' }
]

async function createUsers(supabase: ReturnType<typeof createClient>, accountId: string) {
  const userIds: Record<string, string> = {}

  for (const user of users) {
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuth = authUsers?.users?.find(u => u.email === user.email)

    let authUserId: string

    if (existingAuth) {
      authUserId = existingAuth.id
      await supabase.auth.admin.updateUserById(authUserId, {
        password: TEST_PASSWORD,
        email_confirm: true
      })
    } else {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      })

      if (error) throw new Error(`Auth user ${user.email}: ${error.message}`)
      authUserId = newUser.user.id
    }

    await supabase
      .from('users')
      .upsert({
        id: authUserId,
        account_id: accountId,
        full_name: user.full_name,
        role: user.role
      }, { onConflict: 'id' })

    const roleKey = user.role === 'tech' ? (userIds.tech1 ? 'tech2' : 'tech1') : user.role
    userIds[roleKey] = authUserId
    if (user.role === 'tech' && !userIds.tech) userIds.tech = authUserId
  }

  return userIds
}

const contactTags = [
  { name: 'VIP', color: '#FFD700' },
  { name: 'Commercial', color: '#2196F3' },
  { name: 'Residential', color: '#4CAF50' },
  { name: 'Emergency', color: '#F44336' },
  { name: 'Referral Source', color: '#9C27B0' },
  { name: 'Service Agreement', color: '#00BCD4' },
  { name: 'Past Due', color: '#FF5722' },
  { name: 'New Customer', color: '#8BC34A' }
]

async function createContactTags(supabase: ReturnType<typeof createClient>, accountId: string) {
  const tagIds: Record<string, string> = {}

  for (const tag of contactTags) {
    const { data, error } = await supabase
      .from('contact_tags')
      .upsert({ account_id: accountId, ...tag }, { onConflict: 'account_id,name' })
      .select()
      .single()

    if (!error && data) tagIds[tag.name] = data.id
    else {
      const { data: existing } = await supabase
        .from('contact_tags')
        .select('id')
        .eq('account_id', accountId)
        .eq('name', tag.name)
        .single()
      if (existing) tagIds[tag.name] = existing.id
    }
  }

  return tagIds
}

const contacts = [
  { first_name: 'Mike', last_name: 'Henderson', email: 'mike.henderson@email.com', phone: '317-555-0101', address: '4521 Meridian St, Indianapolis, IN 46208', lead_source: 'google', tags: ['VIP', 'Residential', 'Referral Source'], profile: { family: 'Wife Sarah, two kids', notes: 'Long-time customer since 2019' } },
  { first_name: 'Jennifer', last_name: 'Walsh', email: 'jwalsh42@gmail.com', phone: '317-555-0102', address: '892 College Ave, Indianapolis, IN 46220', lead_source: 'referral', tags: ['Residential', 'New Customer'], profile: { preferences: 'Likes updates via text' } },
  { first_name: 'Robert', last_name: 'Chen', email: 'rchen.indy@yahoo.com', phone: '317-555-0103', address: '1547 Washington Blvd, Indianapolis, IN 46205', lead_source: 'google', tags: ['Residential', 'Service Agreement'], profile: { notes: 'House built in 1965, old plumbing' } },
  { first_name: 'Amanda', last_name: 'Torres', email: 'amanda.torres@outlook.com', phone: '317-555-0104', address: '3201 Fall Creek Pkwy, Indianapolis, IN 46205', lead_source: 'facebook', tags: ['Residential', 'Emergency'], profile: { family: 'Husband Carlos, newborn baby' } },
  { first_name: 'David', last_name: 'Mitchell', email: 'dmitchell@businessmail.com', phone: '317-555-0105', address: '7845 Keystone Ave, Indianapolis, IN 46240', lead_source: 'google', tags: ['VIP', 'Residential'], profile: { preferences: 'Saturday appointments only' } },
  { first_name: 'Lisa', last_name: 'Park', email: 'lisa.park.indy@gmail.com', phone: '317-555-0106', address: '2156 Broad Ripple Ave, Indianapolis, IN 46220', lead_source: 'yelp', tags: ['Commercial', 'Service Agreement'], profile: { notes: 'Owns Broad Ripple Cafe - quarterly grease trap' } },
  { first_name: 'James', last_name: 'Wilson', email: 'jwilson.contractor@gmail.com', phone: '317-555-0107', address: '5432 Massachusetts Ave, Indianapolis, IN 46218', lead_source: 'contractor_referral', tags: ['Residential', 'Referral Source'], profile: { notes: 'Retired contractor' } },
  { first_name: 'Patricia', last_name: 'Moore', email: 'pmoore.realtor@remax.com', phone: '317-555-0108', address: '1234 Delaware St, Indianapolis, IN 46202', lead_source: 'referral', tags: ['Commercial', 'VIP', 'Referral Source'], profile: { notes: 'RE/MAX realtor - sends inspection work' } },
  { first_name: 'Thomas', last_name: 'Garcia', email: 'tgarcia@indytech.com', phone: '317-555-0109', address: '8901 Allisonville Rd, Indianapolis, IN 46250', lead_source: 'google', tags: ['Residential', 'Past Due'], profile: { notes: 'Has outstanding invoice' } },
  { first_name: 'Sandra', last_name: 'Brown', email: 'sandra.brown@iupui.edu', phone: '317-555-0110', address: '420 University Blvd, Indianapolis, IN 46202', lead_source: 'facebook', tags: ['Residential', 'New Customer'], profile: { notes: 'Tankless water heater interest' } },
  { first_name: 'William', last_name: 'Taylor', email: 'wtaylor@taylorlaw.com', phone: '317-555-0111', address: '100 Monument Circle #500, Indianapolis, IN 46204', lead_source: 'google', tags: ['Commercial', 'VIP'], profile: { notes: 'Taylor & Associates Law - 5th floor' } },
  { first_name: 'Nancy', last_name: 'Anderson', email: 'nanderson@gmail.com', phone: '317-555-0112', address: '6789 Township Line Rd, Indianapolis, IN 46260', lead_source: 'nextdoor', tags: ['Residential', 'Emergency'], profile: { notes: 'Elderly widow, prefers phone calls' } },
  { first_name: 'Daniel', last_name: 'Martinez', email: 'dan.martinez@gmail.com', phone: '317-555-0113', address: '3456 Fall Creek Rd, Indianapolis, IN 46205', lead_source: 'google', tags: ['Residential', 'Service Agreement'], profile: { notes: 'First-time homeowners, signed annual maintenance' } },
  { first_name: 'Tony', last_name: 'Napoli', email: 'tony@ristorantenapoli.com', phone: '317-555-0114', company: 'Ristorante Napoli', address: '945 Mass Ave, Indianapolis, IN 46202', lead_source: 'google', tags: ['Commercial', 'Service Agreement'], profile: { notes: 'Monthly grease trap maintenance' } },
  { first_name: 'Karen', last_name: 'White', email: 'kwhite@gmail.com', phone: '317-555-0115', address: '2222 Carrollton Ave, Indianapolis, IN 46205', lead_source: 'yelp', tags: ['Residential'], profile: { notes: 'Budget-conscious, payment plans appreciated' } }
]

async function createContacts(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  tagIds: Record<string, string>
) {
  const contactIds: string[] = []

  for (const contact of contacts) {
    const { tags, ...contactData } = contact as typeof contact & { tags?: string[] }

    const { data, error } = await supabase
      .from('contacts')
      .upsert({ account_id: accountId, ...contactData }, { onConflict: 'account_id,email' })
      .select()
      .single()

    if (!error && data) {
      contactIds.push(data.id)

      // Assign tags
      if (tags) {
        for (const tagName of tags) {
          const tagId = tagIds[tagName]
          if (tagId) {
            await supabase
              .from('contact_tag_assignments')
              .upsert({ contact_id: data.id, tag_id: tagId }, { onConflict: 'contact_id,tag_id' })
              .catch(() => {})
          }
        }
      }
    }
  }

  return contactIds
}

const parts = [
  { sku: 'PLU-00001', name: '1/2" Copper Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 2500, quantity_in_stock: 45, reorder_threshold: 10 },
  { sku: 'PLU-00002', name: '3/4" Copper Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 3200, quantity_in_stock: 38, reorder_threshold: 10 },
  { sku: 'PLU-00003', name: '2" PVC Pipe (10ft)', category: 'plumbing', unit: 'each', unit_price: 850, quantity_in_stock: 62, reorder_threshold: 15 },
  { sku: 'PLU-00004', name: 'PVC Elbow 2" 90deg', category: 'plumbing', unit: 'each', unit_price: 125, quantity_in_stock: 150, reorder_threshold: 25 },
  { sku: 'PLU-00005', name: 'SharkBite 1/2" Coupling', category: 'plumbing', unit: 'each', unit_price: 895, quantity_in_stock: 8, reorder_threshold: 10 },
  { sku: 'PLU-00006', name: 'Toilet Wax Ring', category: 'plumbing', unit: 'each', unit_price: 450, quantity_in_stock: 35, reorder_threshold: 10 },
  { sku: 'PLU-00007', name: 'Toilet Fill Valve', category: 'plumbing', unit: 'each', unit_price: 1295, quantity_in_stock: 22, reorder_threshold: 8 },
  { sku: 'MAT-00001', name: 'Teflon Tape Roll', category: 'materials', unit: 'each', unit_price: 195, quantity_in_stock: 85, reorder_threshold: 20 },
  { sku: 'TOO-00001', name: 'Drain Snake 25ft', category: 'tools', unit: 'each', unit_price: 4500, quantity_in_stock: 6, reorder_threshold: 2 },
  { sku: 'HVA-00001', name: 'Water Heater Element 4500W', category: 'hvac', unit: 'each', unit_price: 2495, quantity_in_stock: 12, reorder_threshold: 4 }
]

async function createParts(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  createdBy: string
) {
  for (const part of parts) {
    await supabase
      .from('parts')
      .upsert({ account_id: accountId, ...part, created_by: createdBy }, { onConflict: 'account_id,sku' })
      .catch(() => {})
  }
}

async function createJobs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactIds: string[],
  userIds: Record<string, string>
) {
  const now = new Date()
  const jobIds: string[] = []

  const jobsData = [
    { contact_index: 0, description: 'Kitchen sink faucet replacement and garbage disposal repair', status: 'completed', priority: 'medium', days_offset: -7, total_amount: 45000, tech_key: 'tech1' },
    { contact_index: 2, description: 'Water heater replacement - 50 gallon gas unit', status: 'completed', priority: 'high', days_offset: -5, total_amount: 185000, tech_key: 'tech2' },
    { contact_index: 1, description: 'Bathroom drain clearing - slow drain in master bath', status: 'completed', priority: 'low', days_offset: -3, total_amount: 22500, tech_key: 'tech1' },
    { contact_index: 3, description: 'EMERGENCY: Burst pipe and water damage mitigation', status: 'completed', priority: 'emergency', days_offset: -2, total_amount: 275000, tech_key: 'tech1' },
    { contact_index: 8, description: 'Whole house re-pipe - replacing galvanized with PEX', status: 'in_progress', priority: 'medium', days_offset: -1, total_amount: 850000, tech_key: 'tech2' },
    { contact_index: 11, description: 'Emergency - no hot water, elderly customer', status: 'en_route', priority: 'emergency', days_offset: 0, total_amount: 0, tech_key: 'tech1' },
    { contact_index: 6, description: 'Main sewer line camera inspection and hydro jetting', status: 'scheduled', priority: 'medium', days_offset: 0.1, total_amount: 89500, tech_key: 'tech2' },
    { contact_index: 5, description: 'Commercial grease trap cleaning - Broad Ripple Cafe', status: 'scheduled', priority: 'low', days_offset: 1, total_amount: 45000, tech_key: 'tech1' },
    { contact_index: 4, description: 'Toilet replacement - master bathroom upgrade', status: 'scheduled', priority: 'low', days_offset: 2, total_amount: 65000, tech_key: null },
    { contact_index: 9, description: 'Tankless water heater consultation and quote', status: 'scheduled', priority: 'low', days_offset: 5, total_amount: 0, tech_key: null },
    { contact_index: 13, description: 'Monthly grease trap maintenance - Ristorante Napoli', status: 'scheduled', priority: 'medium', days_offset: 7, total_amount: 35000, tech_key: 'tech2' },
    { contact_index: 14, description: 'Bathroom renovation plumbing - cancelled by customer', status: 'cancelled', priority: 'low', days_offset: -10, total_amount: 0, tech_key: null }
  ]

  for (const job of jobsData) {
    const contactId = contactIds[job.contact_index]
    if (!contactId) continue

    const scheduledStart = new Date(now.getTime() + job.days_offset * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        description: job.description,
        status: job.status,
        priority: job.priority,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: new Date(scheduledStart.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        total_amount: job.total_amount,
        tech_assigned_id: job.tech_key ? userIds[job.tech_key] : null
      })
      .select()
      .single()

    if (!error && data) jobIds.push(data.id)
  }

  return jobIds
}

async function createEstimates(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactIds: string[],
  jobIds: string[],
  createdBy: string
) {
  const now = new Date()
  const estimateIds: string[] = []

  const estimatesData = [
    { contact_index: 4, title: 'Master Bathroom Remodel - Plumbing', status: 'draft', total: 285500 },
    { contact_index: 9, title: 'Tankless Water Heater Installation', status: 'sent', total: 313000 },
    { contact_index: 12, title: 'Annual Maintenance Plan', status: 'accepted', total: 39900, converted: true },
    { contact_index: 7, title: 'Office Building Backflow Testing', status: 'rejected', total: 45000 },
    { contact_index: 10, title: 'Emergency Sump Pump Replacement', status: 'expired', total: 117500 }
  ]

  for (let i = 0; i < estimatesData.length; i++) {
    const est = estimatesData[i]
    const contactId = contactIds[est.contact_index]
    if (!contactId) continue

    const subtotal = Math.round(est.total / 1.07)
    const taxAmount = est.total - subtotal

    const { data, error } = await supabase
      .from('estimates')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        estimate_number: `EST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
        title: est.title,
        subtotal,
        tax_rate: 0.07,
        tax_amount: taxAmount,
        total_amount: est.total,
        status: est.status,
        valid_until: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sent_at: ['sent', 'accepted', 'rejected', 'expired'].includes(est.status) ? new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() : null,
        accepted_at: est.status === 'accepted' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        rejected_at: est.status === 'rejected' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        converted_to_job_id: (est as { converted?: boolean }).converted ? jobIds[0] : null,
        created_by: createdBy
      })
      .select()
      .single()

    if (!error && data) estimateIds.push(data.id)
  }

  return estimateIds
}

async function createInvoicesAndPayments(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactIds: string[],
  jobIds: string[],
  createdBy: string
) {
  const now = new Date()

  const invoicesData = [
    { contact_index: 0, job_index: 0, status: 'paid', total_amount: 45000, days_due: -20, paid: true },
    { contact_index: 2, job_index: 1, status: 'paid', total_amount: 185000, days_due: -10, paid: true },
    { contact_index: 3, job_index: 3, status: 'sent', total_amount: 275000, days_due: 15, paid: false },
    { contact_index: 8, status: 'overdue', total_amount: 125000, days_due: -15, paid: false },
    { contact_index: 1, job_index: 2, status: 'draft', total_amount: 22500, days_due: 30, paid: false },
    { contact_index: 14, status: 'partially_paid', total_amount: 45000, amount_paid: 20000, days_due: 10, paid: false }
  ]

  for (let i = 0; i < invoicesData.length; i++) {
    const inv = invoicesData[i]
    const contactId = contactIds[inv.contact_index]
    if (!contactId) continue

    const subtotal = Math.round(inv.total_amount / 1.07)
    const dueDate = new Date(now.getTime() + inv.days_due * 24 * 60 * 60 * 1000)

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        job_id: (inv as { job_index?: number }).job_index !== undefined ? jobIds[(inv as { job_index: number }).job_index] : null,
        invoice_number: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
        status: inv.status,
        subtotal,
        tax_rate: 0.07,
        tax_amount: inv.total_amount - subtotal,
        total_amount: inv.total_amount,
        amount_paid: (inv as { amount_paid?: number }).amount_paid || (inv.paid ? inv.total_amount : 0),
        due_date: dueDate.toISOString(),
        paid_at: inv.paid ? new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() : null,
        created_by: createdBy
      })
      .select()
      .single()

    if (invoice && inv.paid) {
      await supabase.from('payments').insert({
        account_id: accountId,
        invoice_id: invoice.id,
        amount: inv.total_amount,
        payment_method: 'credit_card',
        payment_date: new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    if (invoice && inv.status === 'partially_paid') {
      await supabase.from('payments').insert({
        account_id: accountId,
        invoice_id: invoice.id,
        amount: (inv as { amount_paid: number }).amount_paid,
        payment_method: 'credit_card',
        payment_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }
}

async function createConversations(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactIds: string[]
) {
  const conversations = [
    { contact_index: 0, subject: 'Follow-up on kitchen repair', status: 'closed', channel: 'email', messages: [
      { direction: 'inbound', sender_type: 'contact', body_text: 'Hey, just wanted to let you know the faucet and disposal are working great!' },
      { direction: 'outbound', sender_type: 'user', body_text: 'Thanks Mike! Glad everything is working well.' }
    ]},
    { contact_index: 3, subject: 'Emergency water damage - follow up', status: 'open', channel: 'sms', messages: [
      { direction: 'inbound', sender_type: 'contact', body_text: 'The restoration company said your team did a great job. Thank you!' },
      { direction: 'outbound', sender_type: 'user', body_text: 'So glad we could help Amanda!' }
    ]},
    { contact_index: 9, subject: 'Questions about tankless water heater', status: 'open', channel: 'email', messages: [
      { direction: 'inbound', sender_type: 'contact', body_text: 'I received your estimate. What is the warranty on the Rinnai unit?' },
      { direction: 'outbound', sender_type: 'user', body_text: 'Great question! Rinnai offers a 12-year warranty on the heat exchanger.' }
    ]}
  ]

  for (const convo of conversations) {
    const contactId = contactIds[convo.contact_index]
    if (!contactId) continue

    const { data: conversation } = await supabase
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

    if (conversation) {
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
  }
}

async function createEmailTemplates(supabase: ReturnType<typeof createClient>, accountId: string) {
  const templates = [
    { name: 'Appointment Confirmation', subject: 'Your 317 Plumber Appointment is Confirmed', body_html: '<p>Hi {{first_name}},</p><p>Your appointment is confirmed for {{scheduled_date}}.</p>', category: 'transactional' },
    { name: 'Invoice Sent', subject: 'Invoice #{{invoice_number}} from 317 Plumber', body_html: '<p>Hi {{first_name}},</p><p>Please find attached Invoice #{{invoice_number}}.</p>', category: 'transactional' },
    { name: 'Review Request', subject: 'How did we do? - 317 Plumber', body_html: '<p>Hi {{first_name}},</p><p>Would you take a moment to share your experience?</p>', category: 'marketing' },
    { name: 'Estimate Follow-up', subject: 'Following Up on Your Plumbing Estimate', body_html: '<p>Hi {{first_name}},</p><p>Following up on the estimate we sent.</p>', category: 'sales' }
  ]

  for (const template of templates) {
    await supabase
      .from('email_templates')
      .upsert({ account_id: accountId, ...template }, { onConflict: 'account_id,name' })
      .catch(() => {})
  }
}

async function createCampaigns(supabase: ReturnType<typeof createClient>, accountId: string, contactIds: string[]) {
  const { data: campaign } = await supabase
    .from('campaigns')
    .insert({
      account_id: accountId,
      name: 'Winter Maintenance Reminder',
      subject: 'Protect Your Pipes This Winter!',
      status: 'sending',
      sent_count: 8,
      open_count: 5
    })
    .select()
    .single()

  if (campaign) {
    for (let i = 0; i < Math.min(8, contactIds.length); i++) {
      await supabase.from('campaign_recipients').insert({
        campaign_id: campaign.id,
        contact_id: contactIds[i],
        status: 'sent',
        sent_at: new Date().toISOString()
      }).catch(() => {})
    }
  }
}

async function createCalendarEvents(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactIds: string[],
  userIds: Record<string, string>
) {
  const now = new Date()
  const events = [
    { title: 'Sewer inspection - James Wilson', contact_index: 6, hours: 2 },
    { title: 'Grease trap - Broad Ripple Cafe', contact_index: 5, hours: 26 },
    { title: 'Toilet replacement - David Mitchell', contact_index: 4, hours: 50 },
    { title: 'Team meeting', contact_index: null, hours: 24 }
  ]

  for (const event of events) {
    const startTime = new Date(now.getTime() + event.hours * 60 * 60 * 1000)
    await supabase.from('calendar_events').insert({
      account_id: accountId,
      title: event.title,
      start_time: startTime.toISOString(),
      end_time: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      contact_id: event.contact_index !== null ? contactIds[event.contact_index] : null,
      created_by: userIds.owner
    }).catch(() => {})
  }
}

async function createNotifications(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  userIds: Record<string, string>
) {
  const notifications = [
    { user: 'owner', type: 'invoice_overdue', title: 'Invoice Overdue', message: 'Invoice #INV-202511-0004 is 15 days overdue', is_read: false },
    { user: 'dispatcher', type: 'tech_available', title: 'Tech Available', message: 'Marcus Williams is now available', is_read: false },
    { user: 'tech1', type: 'job_assigned', title: 'New Job Assigned', message: 'Emergency - no hot water, elderly customer', is_read: false },
    { user: 'tech2', type: 'job_assigned', title: 'New Job Assigned', message: 'Main sewer line inspection', is_read: false },
    { user: 'sales', type: 'estimate_viewed', title: 'Estimate Viewed', message: 'Sandra Brown viewed your estimate', is_read: false },
    { user: 'owner', type: 'review_received', title: 'New 5-Star Review!', message: 'Mike Henderson left a 5-star review', is_read: false }
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
      is_read: notif.is_read
    }).catch(() => {})
  }
}

async function createAutomationRules(supabase: ReturnType<typeof createClient>, accountId: string) {
  const rules = [
    { name: 'Send Review Request After Job', description: 'Send review request 24h after job completion', trigger_type: 'job_status_change', action_type: 'send_email', is_active: true },
    { name: 'Notify Dispatcher on Emergency', description: 'Alert dispatcher when emergency job created', trigger_type: 'job_created', action_type: 'create_notification', is_active: true }
  ]

  for (const rule of rules) {
    await supabase
      .from('automation_rules')
      .upsert({ account_id: accountId, ...rule }, { onConflict: 'account_id,name' })
      .catch(() => {})
  }
}
