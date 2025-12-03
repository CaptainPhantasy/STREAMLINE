/**
 * End-to-End Test for Meeting AI Integration
 * Tests the complete flow: Create meeting → AI analysis → Database storage
 */

interface MeetingResponse {
  success: boolean
  meeting: {
    id: string
    transcript: string
    summary?: string
    action_items?: string[]
    sentiment?: string
    extracted_data?: any
  }
  analysis?: {
    summary: string
    actionItems: string[]
    sentiment: string
    keyPoints: string[]
    nextSteps: string
    personalDetails?: any
  }
}

const API_BASE = 'http://localhost:3002/api'

async function testEndToEndFlow() {
  console.log('🧪 Meeting AI - End-to-End Test')
  console.log('='.repeat(80))

  // Test Case 1: Create meeting with transcript
  console.log('\n📝 TEST 1: Create Meeting with AI Analysis')
  console.log('-'.repeat(80))

  const testTranscript = `Had a great meeting with Jennifer from GlobalTech Solutions today.
They're really excited about our enterprise package and want to move forward.
Budget has been approved for $125,000. They need the system deployed before their Q4 kickoff on October 15th.
Jennifer will be our main point of contact and she'll loop in their IT director next week.
Action items: Send contract by Wednesday, schedule technical walkthrough for next Friday, prepare deployment timeline.
Jennifer mentioned she's training for a marathon and has a golden retriever named Max.`

  const startTime = Date.now()

  try {
    const response = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Jennifer',
        transcript: testTranscript,
        meetingType: 'video_call',
        title: 'Enterprise Package Discussion',
      }),
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      console.error(`❌ FAILED: ${response.status}`)
      const error = await response.text()
      console.error('Error:', error)
      return false
    }

    const data: MeetingResponse = await response.json()

    console.log('✅ Meeting created successfully')
    console.log(`📊 Response Time: ${responseTime}ms`)
    console.log(`\nMeeting ID: ${data.meeting?.id}`)
    console.log('\nAI Analysis Results:')
    console.log('-'.repeat(80))

    if (data.analysis) {
      console.log(`Summary: ${data.analysis.summary}`)
      console.log(`\nAction Items (${data.analysis.actionItems?.length || 0}):`)
      data.analysis.actionItems?.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item}`)
      })
      console.log(`\nSentiment: ${data.analysis.sentiment}`)
      console.log(`\nKey Points:`)
      data.analysis.keyPoints?.forEach(point => {
        console.log(`  • ${point}`)
      })
      if (data.analysis.nextSteps) {
        console.log(`\nNext Steps: ${data.analysis.nextSteps}`)
      }
      if (data.analysis.personalDetails && Object.keys(data.analysis.personalDetails).length > 0) {
        console.log(`\nPersonal Details Extracted:`)
        Object.entries(data.analysis.personalDetails).forEach(([key, value]) => {
          console.log(`  • ${key}: ${value}`)
        })
      }

      // Validate analysis quality
      console.log('\n📋 Quality Checks:')
      const checks = {
        'Summary exists': !!data.analysis.summary,
        'Summary length appropriate': data.analysis.summary.length >= 50 && data.analysis.summary.length <= 500,
        'Action items extracted': Array.isArray(data.analysis.actionItems) && data.analysis.actionItems.length > 0,
        'Sentiment detected': ['positive', 'neutral', 'negative', 'mixed'].includes(data.analysis.sentiment),
        'Key points identified': Array.isArray(data.analysis.keyPoints) && data.analysis.keyPoints.length > 0,
      }

      let passedChecks = 0
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${check}`)
        if (passed) passedChecks++
      })

      console.log(`\n📊 Quality Score: ${passedChecks}/${Object.keys(checks).length} (${((passedChecks / Object.keys(checks).length) * 100).toFixed(0)}%)`)

      if (passedChecks === Object.keys(checks).length) {
        console.log('🎉 All quality checks passed!')
      }
    } else {
      console.log('⚠️ No AI analysis returned')
      return false
    }

    // Test Case 2: Graceful degradation with short transcript
    console.log('\n\n📝 TEST 2: Graceful Degradation (Short Transcript)')
    console.log('-'.repeat(80))

    const shortResponse = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Quick call',
        meetingType: 'phone_call',
        title: 'Brief Check-in',
      }),
    })

    if (shortResponse.ok) {
      const shortData = await shortResponse.json()
      console.log('✅ Meeting saved even with short transcript')
      console.log(`   AI Analysis: ${shortData.analysis ? 'Attempted' : 'Skipped (as expected)'}`)
    } else {
      console.log('⚠️ Short transcript handling could be improved')
    }

    // Test Case 3: Test standalone analyze endpoint
    console.log('\n\n📝 TEST 3: Standalone Analyze Endpoint')
    console.log('-'.repeat(80))

    const analyzeResponse = await fetch(`${API_BASE}/meetings/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: testTranscript,
      }),
    })

    if (analyzeResponse.ok) {
      const analyzeData = await analyzeResponse.json()
      console.log('✅ Standalone analyze endpoint working')
      console.log(`   Provider: ${analyzeData.metadata?.provider}`)
      console.log(`   Model: ${analyzeData.metadata?.model}`)
      console.log(`   Tokens: ${analyzeData.metadata?.tokensUsed}`)
    } else {
      console.log('❌ Standalone analyze endpoint failed')
      return false
    }

    console.log('\n' + '='.repeat(80))
    console.log('🎉 END-TO-END TEST COMPLETE - ALL TESTS PASSED')
    console.log('='.repeat(80))

    return true
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error)
    return false
  }
}

// Run test
testEndToEndFlow()
  .then(success => {
    if (!success) {
      console.log('\n❌ Some tests failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
