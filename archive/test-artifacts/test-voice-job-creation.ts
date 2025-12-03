#!/usr/bin/env tsx

/**
 * Test Voice Job Creation Flow
 *
 * Tests the complete flow: Create contact -> Create job via voice -> Verify job appears
 */

async function testJobCreationFlow() {
  console.log('🧪 Testing Voice Job Creation Flow')
  console.log('=====================================')

  const accountId = 'fde73a6a-ea84-46a7-803b-a3ae7cc09d00'
  const contactName = 'Voice Test Contact'
  const jobDescription = 'fix a leaky faucet'

  try {
    // Step 1: Create a test contact via API
    console.log('\n1. Creating test contact...')
    const contactResponse = await fetch('http://localhost:3000/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // This would need proper auth in a real test
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        accountId,
        firstName: contactName.split(' ')[0],
        lastName: contactName.split(' ')[1],
        email: `voice-test-${Date.now()}@example.com`
      })
    })

    let contactId = null
    if (contactResponse.ok) {
      const contactData = await contactResponse.json()
      contactId = contactData.contact?.id
      console.log(`✅ Created contact: ${contactId}`)
    } else {
      console.log('❌ Failed to create contact, continuing with existing contact search...')
    }

    // Step 2: Test voice command to create job
    console.log('\n2. Testing voice job creation...')
    const transcription = `Create a job for ${contactName} to ${jobDescription}`

    const voiceResponse = await fetch('http://localhost:3000/api/voice-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        transcription,
        context: {}
      })
    })

    const voiceData = await voiceResponse.json()
    console.log('Voice command response:', JSON.stringify(voiceData, null, 2))

    if (voiceData.success && voiceData.jobId) {
      console.log(`✅ Job created successfully: ${voiceData.jobId}`)

      // Step 3: Verify job exists in database
      console.log('\n3. Verifying job in database...')
      const jobsResponse = await fetch(`http://localhost:3000/api/jobs?accountId=${accountId}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        const createdJob = jobsData.jobs?.find((job: any) => job.id === voiceData.jobId)

        if (createdJob) {
          console.log('✅ Job found in database:', {
            id: createdJob.id,
            description: createdJob.description,
            status: createdJob.status,
            contact: createdJob.contact
          })

          // Step 4: Test if job appears in UI (this would need browser automation)
          console.log('\n4. Job creation flow completed successfully!')
          console.log('   - Voice command parsed correctly')
          console.log('   - Job created in database')
          console.log('   - Now check if it appears in the jobs UI')
        } else {
          console.log('❌ Job not found in jobs list - possible UI refresh issue')
        }
      } else {
        console.log('❌ Failed to fetch jobs list')
      }
    } else {
      console.log('❌ Voice job creation failed:', voiceData.error || voiceData)
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

testJobCreationFlow()
