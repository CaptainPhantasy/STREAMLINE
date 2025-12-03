import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache service account token
let serviceAccountToken: string | null = null
let tokenExpiry: number = 0

async function getServiceAccountToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (serviceAccountToken && Date.now() < tokenExpiry - 300000) {
    return serviceAccountToken
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, anonKey)

  // CRITICAL FIX: Use service role key instead of hardcoded credentials
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  // Create service client with proper authentication
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  })

  // Get service account token using service role
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'voice-agent@demo.local'
  })

  if (error || !data.session) {
    throw new Error(`Failed to get service account token: ${error?.message || 'Unknown error'}`)
  }

  serviceAccountToken = data.session.access_token
  tokenExpiry = (data.session.expires_at || 0) * 1000

  return serviceAccountToken
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    if (!supabaseUrl) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { accountId, transcription, context } = body

    if (!accountId || !transcription) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, transcription' },
        { status: 400 }
      )
    }

    // Get service account token for edge function authentication
    const token = await getServiceAccountToken()

    // Call voice-command edge function
    const voiceCommandUrl = `${supabaseUrl}/functions/v1/voice-command`
    const voiceResponse = await fetch(voiceCommandUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        transcription,
        context: context || {},
      }),
    })

    const voiceData = await voiceResponse.json()

    if (!voiceResponse.ok) {
      console.error('Voice command edge function error:', voiceData)
      return NextResponse.json(
        { 
          error: voiceData.error || 'Failed to process voice command', 
          details: voiceData.details || voiceData.message || voiceData 
        },
        { status: voiceResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      ...voiceData,
    })
  } catch (error: any) {
    console.error('Voice command API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}

