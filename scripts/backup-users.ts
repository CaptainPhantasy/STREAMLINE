/**
 * Backup Users Script
 * 
 * Exports all users from the database and saves to:
 * 1. Local JSON file
 * 2. Supabase Storage bucket (database-backups)
 */

import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local')
const envResult = config({ path: envPath })

if (envResult.error) {
  console.warn(`⚠️  Warning: Could not load .env.local: ${envResult.error.message}`)
  console.warn(`   Looking for: ${envPath}`)
  console.warn('   Continuing with system environment variables...\n')
} else {
  console.log(`✅ Loaded environment variables from: ${envPath}\n`)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error(`\n   Looking for .env.local at: ${envPath}`)
  console.error('   Make sure these variables are set in .env.local or as system environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backupUsers() {
  console.log('🔄 Starting user backup...\n')

  try {
    // Step 1: Fetch all users
    console.log('📥 Fetching all users from database...')
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at')

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database')
      return
    }

    console.log(`✅ Found ${users.length} users\n`)

    // Step 2: Create backup metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupData = {
      timestamp: new Date().toISOString(),
      total_users: users.length,
      douglas_user_id: '4e7caf61-cc73-407b-b18c-407d0d04f9d3',
      users: users,
    }

    // Step 3: Save locally
    console.log('💾 Saving backup to local file...')
    const backupDir = join(process.cwd(), 'backups')
    await mkdir(backupDir, { recursive: true })
    
    const localFilename = `users-backup-${timestamp}.json`
    const localPath = join(backupDir, localFilename)
    
    await writeFile(localPath, JSON.stringify(backupData, null, 2), 'utf-8')
    console.log(`✅ Local backup saved: ${localPath}\n`)

    // Step 4: Create backup bucket if it doesn't exist
    console.log('🪣 Checking for database-backups bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`)
    }

    const backupBucket = buckets?.find(b => b.name === 'database-backups')
    
    if (!backupBucket) {
      console.log('📦 Creating database-backups bucket...')
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('database-backups', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['application/json'],
      })

      if (createError) {
        console.warn(`⚠️  Failed to create bucket: ${createError.message}`)
        console.warn('   Continuing with local backup only...\n')
      } else {
        console.log('✅ Created database-backups bucket\n')
      }
    } else {
      console.log('✅ database-backups bucket exists\n')
    }

    // Step 5: Upload to Supabase Storage
    console.log('☁️  Uploading backup to Supabase Storage...')
    const storagePath = `users/${localFilename}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('database-backups')
      .upload(storagePath, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      console.warn(`⚠️  Failed to upload to storage: ${uploadError.message}`)
      console.warn('   Local backup is still available\n')
    } else {
      console.log(`✅ Uploaded to storage: ${storagePath}\n`)
      
      // Get public URL (even though bucket is private, we can still get the path)
      const { data: urlData } = supabase.storage
        .from('database-backups')
        .getPublicUrl(storagePath)
      
      console.log(`📎 Storage path: database-backups/${storagePath}`)
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ BACKUP COMPLETE')
    console.log('='.repeat(60))
    console.log(`📊 Total users backed up: ${users.length}`)
    console.log(`💾 Local file: ${localPath}`)
    console.log(`☁️  Storage path: database-backups/users/${localFilename}`)
    console.log(`🆔 Douglas's user ID: 4e7caf61-cc73-407b-b18c-407d0d04f9d3`)
    console.log('='.repeat(60) + '\n')

    // Step 7: Show user breakdown
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('📊 User breakdown by role:')
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
    console.log('')

  } catch (error: any) {
    console.error('\n❌ Backup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

backupUsers()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

