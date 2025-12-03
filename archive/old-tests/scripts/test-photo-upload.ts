/**
 * Test photo upload to job-photos bucket
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://expbvujyegxmxvatcjqt.supabase.co',
  'sb_secret_4_U_HfhcGnqyMZdSkGNHRA_sY6lf89T'
)

async function testUpload() {
  console.log('🧪 Testing photo upload to job-photos bucket...\n')

  // Create a test file (1x1 pixel PNG)
  const testImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )

  console.log('📤 Uploading test image...')
  const { data, error } = await supabase.storage
    .from('job-photos')
    .upload('test/test-upload.png', testImage, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error('❌ Upload failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Upload successful:', data.path)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('job-photos')
    .getPublicUrl('test/test-upload.png')

  console.log('✅ Public URL:', urlData.publicUrl)

  // Clean up test file
  console.log('\n🧹 Cleaning up test file...')
  const { error: deleteError } = await supabase.storage
    .from('job-photos')
    .remove(['test/test-upload.png'])

  if (deleteError) {
    console.error('⚠️  Failed to clean up test file:', deleteError.message)
  } else {
    console.log('✅ Test file cleaned up')
  }
}

testUpload()
  .then(() => {
    console.log('\n✅ Photo upload test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
