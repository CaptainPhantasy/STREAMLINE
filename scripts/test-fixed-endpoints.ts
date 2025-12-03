/**
 * Quick test script for the 9 fixed endpoints
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testFixedEndpoints() {
  console.log('🔧 Testing 9 fixed endpoints...\n')

  // Authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test-owner@317plumber.com',
    password: 'Test123!@#',
  })

  if (authError || !authData.session) {
    console.error('❌ Failed to authenticate:', authError?.message)
    return
  }

  const token = authData.session.access_token
  const userId = authData.user.id
  console.log(`✓ Authenticated as: ${userId}\n`)

  const results = []

  // Test 1: Revenue Analytics
  console.log('[1/9] Testing /api/analytics/revenue...')
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/revenue?groupBy=date`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100))
    results.push({ endpoint: 'revenue analytics', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'revenue analytics', status: 'error', success: false })
  }

  // Test 2: Calendar Sync
  console.log('\n[2/9] Testing /api/calendar/sync...')
  try {
    const res = await fetch(`${BASE_URL}/api/calendar/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100))
    results.push({ endpoint: 'calendar sync', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'calendar sync', status: 'error', success: false })
  }

  // Test 3: Export Invoices
  console.log('\n[3/9] Testing /api/export/invoices...')
  try {
    const res = await fetch(`${BASE_URL}/api/export/invoices?format=json`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100))
    results.push({ endpoint: 'export invoices', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'export invoices', status: 'error', success: false })
  }

  // Test 4: Gmail Sync
  console.log('\n[4/9] Testing /api/integrations/gmail/sync...')
  try {
    const res = await fetch(`${BASE_URL}/api/integrations/gmail/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maxMessages: 10 }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100))
    results.push({ endpoint: 'gmail sync', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'gmail sync', status: 'error', success: false })
  }

  // Test 5: Microsoft Sync
  console.log('\n[5/9] Testing /api/integrations/microsoft/sync...')
  try {
    const res = await fetch(`${BASE_URL}/api/integrations/microsoft/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maxMessages: 10 }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100))
    results.push({ endpoint: 'microsoft sync', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'microsoft sync', status: 'error', success: false })
  }

  // Test 6: Onboarding Dismiss
  console.log('\n[6/9] Testing /api/onboarding/dismiss...')
  try {
    const res = await fetch(`${BASE_URL}/api/onboarding/dismiss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 150))
    results.push({ endpoint: 'onboarding dismiss', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'onboarding dismiss', status: 'error', success: false })
  }

  // Test 7: Onboarding Restart
  console.log('\n[7/9] Testing /api/onboarding/restart...')
  try {
    const res = await fetch(`${BASE_URL}/api/onboarding/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 150))
    results.push({ endpoint: 'onboarding restart', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'onboarding restart', status: 'error', success: false })
  }

  // Test 8: Email Create Job
  console.log('\n[8/9] Testing /api/email/create-job...')
  try {
    const res = await fetch(`${BASE_URL}/api/email/create-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contactId: 'test-contact-id',
        contactName: 'Test Contact',
        emailBody: 'Need a plumber to fix a leak in the kitchen.',
      }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 150))
    results.push({ endpoint: 'email create-job', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'email create-job', status: 'error', success: false })
  }

  // Test 9: Email Extract Actions
  console.log('\n[9/9] Testing /api/email/extract-actions...')
  try {
    const res = await fetch(`${BASE_URL}/api/email/extract-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        emailBody: 'Please call me back tomorrow at 3pm to discuss the estimate.',
      }),
    })
    console.log(`   Status: ${res.status}`)
    const data = await res.json()
    console.log(`   Response:`, JSON.stringify(data).substring(0, 150))
    results.push({ endpoint: 'email extract-actions', status: res.status, success: res.ok })
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
    results.push({ endpoint: 'email extract-actions', status: 'error', success: false })
  }

  // Summary
  console.log('\n\n📊 SUMMARY')
  console.log('=' .repeat(80))
  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  console.log(`✅ Passed: ${passed}/9`)
  console.log(`❌ Failed: ${failed}/9`)
  console.log('\nDetails:')
  results.forEach((r) => {
    const icon = r.success ? '✅' : '❌'
    console.log(`${icon} ${r.endpoint.padEnd(25)} - Status: ${r.status}`)
  })
}

testFixedEndpoints().catch(console.error)
