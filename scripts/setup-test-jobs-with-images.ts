import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readdir } from 'fs/promises'
import { join } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestJob {
  jobNumber: string
  address: string
  contactName: string
  contactEmail: string
  contactPhone: string
  description: string
  jobType: string
  status: 'lead' | 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'invoiced' | 'paid'
  images: {
    filename: string
    label: string
    caption: string
  }[]
}

const testJobs: TestJob[] = [
  {
    jobNumber: 'JOB-2025-001',
    address: '1234 Maple Street, Indianapolis, IN 46202',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@example.com',
    contactPhone: '(317) 555-0101',
    description: 'Kitchen sink drain pipe leaking under cabinet, water pooling on floor',
    jobType: 'Emergency Repair',
    status: 'completed',
    images: [
      { filename: 'job-001-front-before.jpg', label: 'FRONT - BEFORE', caption: 'Front view showing water pooling on floor' },
      { filename: 'job-001-back-before.jpg', label: 'BACK - BEFORE', caption: 'Back view showing pipe connections and water stains' },
      { filename: 'job-001-work-progress.jpg', label: 'WORK IN PROGRESS', caption: 'Technician working on pipe connection' },
      { filename: 'job-001-materials.jpg', label: 'MATERIALS', caption: 'Replacement pipe fitting and sealant' },
      { filename: 'job-001-front-after.jpg', label: 'FRONT - AFTER', caption: 'Front view after repair, dry floor' },
      { filename: 'job-001-back-after.jpg', label: 'BACK - AFTER', caption: 'Back view showing completed repair' },
    ],
  },
  {
    jobNumber: 'JOB-2025-002',
    address: '5678 Oak Avenue, Carmel, IN 46032',
    contactName: 'Michael Chen',
    contactEmail: 'michael.chen@example.com',
    contactPhone: '(317) 555-0102',
    description: 'Replace 15-year-old gas water heater with new 50-gallon unit',
    jobType: 'Installation',
    status: 'completed',
    images: [
      { filename: 'job-002-before-old-unit.jpg', label: 'BEFORE - OLD UNIT', caption: 'Old water heater showing rust and age' },
      { filename: 'job-002-problem-rust.jpg', label: 'PROBLEM - RUST', caption: 'Close-up of rust and corrosion' },
      { filename: 'job-002-materials-new-unit.jpg', label: 'MATERIALS - NEW UNIT', caption: 'New 50-gallon water heater in box' },
      { filename: 'job-002-work-installation.jpg', label: 'WORK IN PROGRESS', caption: 'Connecting gas and water lines' },
      { filename: 'job-002-safety-vent-check.jpg', label: 'SAFETY CHECK', caption: 'Checking vent pipe connection' },
      { filename: 'job-002-after-installed.jpg', label: 'AFTER - INSTALLED', caption: 'New water heater fully installed' },
      { filename: 'job-002-front-complete.jpg', label: 'FRONT - COMPLETE', caption: 'Wide view of completed installation' },
    ],
  },
  {
    jobNumber: 'JOB-2025-003',
    address: '9012 Elm Drive, Fishers, IN 46037',
    contactName: 'Jennifer Martinez',
    contactEmail: 'jennifer.martinez@example.com',
    contactPhone: '(317) 555-0103',
    description: 'Main bathroom sink drain completely clogged, water backing up, slow drain',
    jobType: 'Service Call',
    status: 'completed',
    images: [
      { filename: 'job-003-problem-clogged.jpg', label: 'PROBLEM - CLOGGED', caption: 'Sink filled with standing water' },
      { filename: 'job-003-work-drain-snake.jpg', label: 'WORK IN PROGRESS', caption: 'Drain snake equipment in use' },
      { filename: 'job-003-materials-extracted.jpg', label: 'MATERIALS EXTRACTED', caption: 'Extracted clog material' },
      { filename: 'job-003-after-cleared.jpg', label: 'AFTER - CLEARED', caption: 'Drain cleared and flowing' },
      { filename: 'job-003-front-complete.jpg', label: 'FRONT - COMPLETE', caption: 'Bathroom view showing completed work' },
    ],
  },
  {
    jobNumber: 'JOB-2025-004',
    address: '3456 Pine Court, Noblesville, IN 46060',
    contactName: 'Robert Thompson',
    contactEmail: 'robert.thompson@example.com',
    contactPhone: '(317) 555-0104',
    description: 'Basement flooding from broken pipe, water damage assessment and mitigation',
    jobType: 'Emergency Service',
    status: 'completed',
    images: [
      { filename: 'job-004-problem-flooding.jpg', label: 'PROBLEM - FLOODING', caption: 'Basement floor covered in water' },
      { filename: 'job-004-problem-broken-pipe.jpg', label: 'PROBLEM - BROKEN PIPE', caption: 'Close-up of broken pipe' },
      { filename: 'job-004-work-water-extraction.jpg', label: 'WORK IN PROGRESS', caption: 'Water extraction equipment removing water' },
      { filename: 'job-004-work-pipe-repair.jpg', label: 'WORK IN PROGRESS', caption: 'Repairing broken pipe section' },
      { filename: 'job-004-materials-drying-equipment.jpg', label: 'MATERIALS - DRYING EQUIPMENT', caption: 'Dehumidifiers and fans set up' },
      { filename: 'job-004-after-dry.jpg', label: 'AFTER - DRYING', caption: 'Basement floor now dry' },
      { filename: 'job-004-after-repair-complete.jpg', label: 'AFTER - REPAIR COMPLETE', caption: 'Repaired pipe section' },
      { filename: 'job-004-front-mitigation-complete.jpg', label: 'FRONT - MITIGATION COMPLETE', caption: 'Wide view of completed mitigation' },
    ],
  },
  {
    jobNumber: 'JOB-2025-005',
    address: '7890 Cedar Lane, Westfield, IN 46074',
    contactName: 'Lisa Anderson',
    contactEmail: 'lisa.anderson@example.com',
    contactPhone: '(317) 555-0105',
    description: 'Replace old toilet with new high-efficiency model, upgrade bathroom fixture',
    jobType: 'Installation',
    status: 'completed',
    images: [
      { filename: 'job-005-before-old-toilet.jpg', label: 'BEFORE - OLD TOILET', caption: 'Old toilet showing age and wear' },
      { filename: 'job-005-work-removal.jpg', label: 'WORK IN PROGRESS', caption: 'Old toilet removed, preparing area' },
      { filename: 'job-005-materials-new-toilet.jpg', label: 'MATERIALS - NEW TOILET', caption: 'New high-efficiency toilet in box' },
      { filename: 'job-005-work-installation.jpg', label: 'WORK IN PROGRESS', caption: 'Installing new toilet' },
      { filename: 'job-005-after-installed.jpg', label: 'AFTER - INSTALLED', caption: 'New toilet fully installed' },
      { filename: 'job-005-front-complete.jpg', label: 'FRONT - COMPLETE', caption: 'Full bathroom view showing completed work' },
    ],
  },
  {
    jobNumber: 'JOB-2025-006',
    address: '2345 Birch Street, Zionsville, IN 46077',
    contactName: 'David Wilson',
    contactEmail: 'david.wilson@example.com',
    contactPhone: '(317) 555-0106',
    description: 'Recurring drain issues, camera inspection to identify root intrusion in sewer line',
    jobType: 'Diagnostic Service',
    status: 'completed',
    images: [
      { filename: 'job-006-problem-drain-issue.jpg', label: 'PROBLEM - DRAIN ISSUES', caption: 'Multiple drains backing up' },
      { filename: 'job-006-work-camera-setup.jpg', label: 'WORK IN PROGRESS', caption: 'Camera inspection equipment set up' },
      { filename: 'job-006-problem-roots.jpg', label: 'PROBLEM - ROOT INTRUSION', caption: 'Camera screen showing root intrusion' },
      { filename: 'job-006-work-hydro-jetting.jpg', label: 'WORK IN PROGRESS', caption: 'Hydro jetting equipment clearing roots' },
      { filename: 'job-006-after-cleared.jpg', label: 'AFTER - CLEARED', caption: 'Camera screen showing clear sewer line' },
    ],
  },
  {
    jobNumber: 'JOB-2025-007',
    address: '4567 Main Street (Restaurant), Indianapolis, IN 46204',
    contactName: 'James Rodriguez',
    contactEmail: 'james.rodriguez@example.com',
    contactPhone: '(317) 555-0107',
    description: 'Commercial kitchen grease trap cleaning and drain line maintenance',
    jobType: 'Commercial Service',
    status: 'completed',
    images: [
      { filename: 'job-007-problem-grease-trap.jpg', label: 'PROBLEM - GREASE TRAP', caption: 'Grease trap showing buildup' },
      { filename: 'job-007-work-cleaning.jpg', label: 'WORK IN PROGRESS', caption: 'Technician cleaning grease trap' },
      { filename: 'job-007-materials-extracted.jpg', label: 'MATERIALS EXTRACTED', caption: 'Extracted grease and debris' },
      { filename: 'job-007-safety-ppe.jpg', label: 'SAFETY - PPE', caption: 'Technician in full PPE' },
      { filename: 'job-007-after-cleaned.jpg', label: 'AFTER - CLEANED', caption: 'Clean grease trap, drainage restored' },
      { filename: 'job-007-front-complete.jpg', label: 'FRONT - COMPLETE', caption: 'Commercial kitchen view showing completed work' },
    ],
  },
]

async function setupTestJobsWithImages() {
  console.log('🏗️  Setting up Test Jobs with Image Associations...\n')

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get the 317 Plumber account ID
  const { data: account, error: accountError } = await supabaseAdmin
    .from('accounts')
    .select('id, name, slug')
    .eq('slug', '317plumber')
    .single()

  if (accountError || !account) {
    console.error('❌ Error finding 317plumber account:', accountError?.message)
    return
  }
  const accountId = account.id
  console.log(`✅ Found account: ${account.name} (${account.slug})`)
  console.log(`   Account ID: ${accountId}\n`)

  // Get a tech user to assign as taken_by
  const { data: techUsers, error: techError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, role')
    .eq('account_id', accountId)
    .eq('role', 'tech')
    .limit(1)

  if (techError || !techUsers || techUsers.length === 0) {
    console.error('❌ Error finding tech user:', techError?.message)
    return
  }
  const techUserId = techUsers[0].id
  console.log(`✅ Found tech user: ${techUsers[0].full_name} (ID: ${techUserId})\n`)

  let contactsCreated = 0
  let contactsUpdated = 0
  let jobsCreated = 0
  let jobsUpdated = 0
  let photosCreated = 0

  for (const testJob of testJobs) {
    console.log(`\n📋 Processing: ${testJob.jobNumber} - ${testJob.description}`)
    console.log(`   Address: ${testJob.address}`)
    console.log(`   Contact: ${testJob.contactName}`)

    // 1. Create or update contact
    const { data: existingContact, error: contactCheckError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('email', testJob.contactEmail)
      .single()

    let contactId: string

    if (contactCheckError && contactCheckError.code !== 'PGRST116') {
      console.error(`   ❌ Error checking contact:`, contactCheckError.message)
      continue
    }

    if (existingContact) {
      // Update existing contact
      const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update({
          first_name: testJob.contactName.split(' ')[0],
          last_name: testJob.contactName.split(' ').slice(1).join(' ') || null,
          phone: testJob.contactPhone,
          address: testJob.address,
        })
        .eq('id', existingContact.id)

      if (updateError) {
        console.error(`   ❌ Error updating contact:`, updateError.message)
        continue
      }
      contactId = existingContact.id
      contactsUpdated++
      console.log(`   ✅ Updated contact: ${testJob.contactName}`)
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabaseAdmin
        .from('contacts')
        .insert({
          account_id: accountId,
          email: testJob.contactEmail,
          phone: testJob.contactPhone,
          first_name: testJob.contactName.split(' ')[0],
          last_name: testJob.contactName.split(' ').slice(1).join(' ') || null,
          address: testJob.address,
        })
        .select()
        .single()

      if (createError || !newContact) {
        console.error(`   ❌ Error creating contact:`, createError?.message)
        continue
      }
      contactId = newContact.id
      contactsCreated++
      console.log(`   ✅ Created contact: ${testJob.contactName}`)
    }

    // 2. Create or update job
    const { data: existingJob, error: jobCheckError } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('account_id', accountId)
      .eq('contact_id', contactId)
      .ilike('description', `%${testJob.description.substring(0, 30)}%`)
      .single()

    let jobId: string

    if (jobCheckError && jobCheckError.code !== 'PGRST116') {
      console.error(`   ❌ Error checking job:`, jobCheckError.message)
      continue
    }

    if (existingJob) {
      // Update existing job
      const { error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({
          description: testJob.description,
          status: testJob.status,
          tech_assigned_id: techUserId,
        })
        .eq('id', existingJob.id)

      if (updateError) {
        console.error(`   ❌ Error updating job:`, updateError.message)
        continue
      }
      jobId = existingJob.id
      jobsUpdated++
      console.log(`   ✅ Updated job: ${testJob.jobNumber}`)
    } else {
      // Create new job
      const { data: newJob, error: createError } = await supabaseAdmin
        .from('jobs')
        .insert({
          account_id: accountId,
          contact_id: contactId,
          description: testJob.description,
          status: testJob.status,
          tech_assigned_id: techUserId,
          scheduled_start: new Date().toISOString(),
          scheduled_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        })
        .select()
        .single()

      if (createError || !newJob) {
        console.error(`   ❌ Error creating job:`, createError?.message)
        continue
      }
      jobId = newJob.id
      jobsCreated++
      console.log(`   ✅ Created job: ${testJob.jobNumber} (ID: ${jobId})`)
    }

    // 3. Create job photo records (images will be uploaded separately)
    console.log(`   📸 Processing ${testJob.images.length} image records...`)
    for (const image of testJob.images) {
      // Check if photo record already exists
      const { data: existingPhoto, error: photoCheckError } = await supabaseAdmin
        .from('job_photos')
        .select('id')
        .eq('job_id', jobId)
        .eq('caption', image.caption)
        .single()

      if (photoCheckError && photoCheckError.code !== 'PGRST116') {
        console.error(`      ❌ Error checking photo:`, photoCheckError.message)
        continue
      }

      if (existingPhoto) {
        console.log(`      ⏭️  Photo record already exists: ${image.filename}`)
        continue
      }

      // Create photo record (photo_url will be set when image is uploaded)
      // For now, we'll use a placeholder URL that indicates the image needs to be uploaded
      const placeholderUrl = `/test-assets/job-photos/${image.filename}`
      
      const { data: newPhoto, error: photoError } = await supabaseAdmin
        .from('job_photos')
        .insert({
          account_id: accountId,
          job_id: jobId,
          photo_url: placeholderUrl,
          thumbnail_url: placeholderUrl,
          caption: image.caption,
          taken_by: techUserId,
          taken_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (photoError) {
        console.error(`      ❌ Error creating photo record:`, photoError.message)
        continue
      }
      photosCreated++
      console.log(`      ✅ Created photo record: ${image.filename} (${image.label})`)
    }
  }

  console.log(`\n============================================================`)
  console.log(`📊 SETUP SUMMARY`)
  console.log(`============================================================`)
  console.log(`✅ Contacts Created: ${contactsCreated}`)
  console.log(`🔄 Contacts Updated: ${contactsUpdated}`)
  console.log(`✅ Jobs Created: ${jobsCreated}`)
  console.log(`🔄 Jobs Updated: ${jobsUpdated}`)
  console.log(`📸 Photo Records Created: ${photosCreated}`)
  console.log(`\n💡 Next Steps:`)
  console.log(`   1. Generate images according to TEST_IMAGE_GENERATION_SPEC.md`)
  console.log(`   2. Upload images to Supabase Storage bucket 'job-photos'`)
  console.log(`   3. Update photo_url and thumbnail_url in job_photos table`)
  console.log(`   4. Test photo display in job detail views`)
}

setupTestJobsWithImages().catch(console.error)

