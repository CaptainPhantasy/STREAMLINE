/**
 * Test script for Meeting AI Analysis endpoint
 * Tests the /api/meetings/analyze endpoint with sample transcripts
 */

const API_URL = 'http://localhost:3002/api/meetings/analyze'

interface TestTranscript {
  name: string
  transcript: string
  expectedSentiment: string
}

const testTranscripts: TestTranscript[] = [
  {
    name: 'Successful Sales Call',
    transcript: `Great meeting with John from Acme Corp today. They're interested in our premium HVAC package for their new office building. Budget approved at $75k. Need to send detailed proposal by Friday. Installation target is March 15th. John will coordinate with their facilities team. Follow up call scheduled for next Tuesday to review proposal. John mentioned he has two kids and loves playing golf on weekends.`,
    expectedSentiment: 'positive',
  },
  {
    name: 'Challenging Sales Call',
    transcript: `Met with Sarah from TechStart Inc. They have concerns about pricing compared to competitors. They're evaluating 3 vendors total. Want to see case studies from similar companies in the healthcare sector. Need ROI analysis with detailed cost breakdown. Decision timeline is end of Q1. She mentioned budget constraints but didn't give specifics. Follow up needed on competitive analysis.`,
    expectedSentiment: 'neutral',
  },
  {
    name: 'Quick Follow-up',
    transcript: `Quick check-in call with Mike. Project is on track. Customer happy with progress so far. Minor issue with access permissions but IT is working on it. Next milestone review scheduled for Friday at 2pm. No immediate action items needed.`,
    expectedSentiment: 'positive',
  },
]

async function testAnalyzeEndpoint(testCase: TestTranscript) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${testCase.name}`)
  console.log(`${'='.repeat(80)}\n`)
  console.log('Transcript:')
  console.log(testCase.transcript)
  console.log('\n' + '-'.repeat(80) + '\n')

  const startTime = Date.now()

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: testCase.transcript }),
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ FAILED: ${response.status} ${response.statusText}`)
      console.error('Error:', error)
      return false
    }

    const result = await response.json()

    console.log('✅ SUCCESS\n')
    console.log('AI Analysis Results:')
    console.log('-------------------')
    console.log(`Summary: ${result.analysis.summary}`)
    console.log(`\nSentiment: ${result.analysis.sentiment} (expected: ${testCase.expectedSentiment})`)
    console.log(`\nAction Items (${result.analysis.actionItems.length}):`)
    result.analysis.actionItems.forEach((item: string, i: number) => {
      console.log(`  ${i + 1}. ${item}`)
    })

    if (result.analysis.keyPoints && result.analysis.keyPoints.length > 0) {
      console.log(`\nKey Points:`)
      result.analysis.keyPoints.forEach((point: string) => {
        console.log(`  • ${point}`)
      })
    }

    if (result.analysis.nextSteps) {
      console.log(`\nNext Steps: ${result.analysis.nextSteps}`)
    }

    if (result.analysis.personalDetails && Object.keys(result.analysis.personalDetails).length > 0) {
      console.log(`\nPersonal Details:`)
      Object.entries(result.analysis.personalDetails).forEach(([key, value]) => {
        console.log(`  • ${key}: ${value}`)
      })
    }

    if (result.analysis.followUpDate) {
      console.log(`\nFollow-up Date: ${result.analysis.followUpDate}`)
    }

    if (result.analysis.followUpNotes) {
      console.log(`Follow-up Notes: ${result.analysis.followUpNotes}`)
    }

    console.log('\nMetadata:')
    console.log(`  Provider: ${result.metadata.provider}`)
    console.log(`  Model: ${result.metadata.model}`)
    console.log(`  Tokens Used: ${result.metadata.tokensUsed}`)
    console.log(`  Response Time: ${responseTime}ms`)

    // Validate sentiment
    const sentimentMatch = result.analysis.sentiment === testCase.expectedSentiment
    console.log(`\n${sentimentMatch ? '✅' : '⚠️'} Sentiment ${sentimentMatch ? 'matches' : 'differs from'} expected`)

    return true
  } catch (error) {
    console.error('❌ EXCEPTION:', error)
    return false
  }
}

async function runAllTests() {
  console.log('\n🤖 Meeting AI Analysis - Test Suite')
  console.log('=' .repeat(80))

  let passed = 0
  let failed = 0

  for (const testCase of testTranscripts) {
    const success = await testAnalyzeEndpoint(testCase)
    if (success) {
      passed++
    } else {
      failed++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('Test Results Summary')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${testTranscripts.length}`)
  console.log(`Success Rate: ${((passed / testTranscripts.length) * 100).toFixed(1)}%`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️ Some tests failed. Check logs above.')
  }
}

// Run tests
runAllTests().catch(console.error)
