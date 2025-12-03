/**
 * Check if job-photos storage bucket exists in Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBucket() {
  console.log('🔍 Checking for job-photos storage bucket...\n')

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.log('❌ Error listing buckets:', error.message)
      return
    }

    const jobPhotosBucket = buckets.find(b => b.name === 'job-photos')

    if (jobPhotosBucket) {
      console.log('✅ job-photos bucket: EXISTS')
      console.log('   Public:', jobPhotosBucket.public)
      console.log('   Created:', jobPhotosBucket.created_at)
      console.log('   ID:', jobPhotosBucket.id)
    } else {
      console.log('❌ job-photos bucket: Does NOT exist')
      console.log('\nAvailable buckets:')
      buckets.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`))
      console.log('\n⚠️  You need to create the job-photos bucket in Supabase Storage')
    }
  } catch (e: any) {
    console.log('❌ Exception:', e.message)
  }
}

checkBucket()
  .then(() => {
    console.log('\n✅ Storage check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
