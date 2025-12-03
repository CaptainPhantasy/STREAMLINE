import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Eleven Labs webhook signature verification
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// Parse voice commands using simple NLP
function parseVoiceCommand(transcription: string): {
  action: string
  params: Record<string, any>
} {
  const lower = transcription.toLowerCase()
  
  // Create job command
  if (lower.includes('create') && lower.includes('job')) {
    // Extract contact name, description, time
    const contactMatch = lower.match(/for\s+([a-z\s]+?)(?:,|$|plumbing|repair|tomorrow|at)/i)
    const timeMatch = lower.match(/(?:at|tomorrow|today)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
    const descMatch = lower.match(/(?:plumbing|repair|fix|install)\s+([^,]+)/i)
    
    return {
      action: 'create_job',
      params: {
        contactName: contactMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim() || 'Plumbing service',
        scheduledTime: timeMatch?.[1]?.trim(),
      }
    }
  }
  
  // Update job status
  if (lower.match(/mark|update|set|change/) && lower.includes('job')) {
    const jobIdMatch = lower.match(/job\s+(\d+)/i)
    const statusMatch = lower.match(/(completed|done|finished|in progress|en route|scheduled)/i)
    
    return {
      action: 'update_job_status',
      params: {
        jobId: jobIdMatch?.[1],
        status: statusMatch?.[1]?.toLowerCase().replace(' ', '_'),
      }
    }
  }
  
  // Get jobs
  if (lower.match(/what|show|list|get/) && lower.includes('job')) {
    const statusMatch = lower.match(/(today|scheduled|completed|in progress)/i)
    
    return {
      action: 'get_jobs',
      params: {
        status: statusMatch?.[1]?.toLowerCase().replace(' ', '_'),
        date: lower.includes('today') ? new Date().toISOString().split('T')[0] : null,
      }
    }
  }
  
  // Search contact
  if (lower.match(/find|search|contact|customer/) && lower.includes('contact')) {
    const nameMatch = lower.match(/(?:named|called|contact)\s+([a-z\s]+)/i)
    
    return {
      action: 'search_contact',
      params: {
        search: nameMatch?.[1]?.trim(),
      }
    }
  }
  
  // Send message
  if (lower.match(/send|message|text|email/) && lower.includes('message')) {
    const contactMatch = lower.match(/to\s+([a-z\s]+)/i)
    const messageMatch = lower.match(/message[:\s]+(.+)/i)
    
    return {
      action: 'send_message',
      params: {
        contactName: contactMatch?.[1]?.trim(),
        message: messageMatch?.[1]?.trim(),
      }
    }
  }
  
  return { action: 'unknown', params: {} }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('X-ElevenLabs-Signature') || ''
    const body = await request.text()
    const secret = process.env.ELEVEN_LABS_WEBHOOK_SECRET || ''
    
    if (secret && !verifySignature(body, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { event, transcription, conversation_id } = payload

    // Only process transcription events
    if (event !== 'conversation_item_input_audio_transcription_completed') {
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    if (!transcription) {
      return NextResponse.json({ error: 'No transcription provided' }, { status: 400 })
    }

    // Get account ID (for now use default - in production get from session/context)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Get first account for webhook (in production, extract from conversation context)
    const tempSupabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    })
    
    const { data: accounts } = await tempSupabase
      .from('accounts')
      .select('id')
      .limit(1)
    
    const accountId = accounts?.[0]?.id

    if (!accountId) {
      return NextResponse.json({ 
        success: false, 
        response: 'No account found. Please configure your account first.'
      }, { status: 500 })
    }

    // Call voice-command Edge Function with AI tool calling
    const voiceCommandUrl = `${supabaseUrl}/functions/v1/voice-command`
    const voiceResponse = await fetch(voiceCommandUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        transcription: transcription,
        conversationId: conversation_id || null,
      }),
    })

    if (!voiceResponse.ok) {
      return NextResponse.json({ error: 'Voice command service failed' }, { status: voiceResponse.status })
    }

    const voiceData = await voiceResponse.json()
    
    // Format response for Eleven Labs
    let responseText = voiceData.response || "I didn't understand that command. Try: create job, update job status, search contact, or get jobs."
    
    if (voiceData.success && voiceData.action) {
      if (voiceData.action === 'create_job' && voiceData.result?.job) {
        responseText = `Job created successfully. Job ID: ${voiceData.result.job.id?.substring(0, 8)}...`
      } else if (voiceData.action === 'search_contacts' && voiceData.contacts?.length > 0) {
        responseText = `Found ${voiceData.contacts.length} contact(s): ${voiceData.contacts.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ')}`
      } else if (voiceData.action === 'get_jobs' && voiceData.jobs?.length > 0) {
        responseText = `You have ${voiceData.jobs.length} job(s). ${voiceData.jobs.map((j: any) => `${j.status}: ${j.description?.substring(0, 30)}`).join('. ')}`
      } else if (voiceData.action === 'update_job_status' && voiceData.result?.job) {
        responseText = `Job status updated to ${voiceData.result.job.status}`
      } else if (voiceData.response) {
        responseText = voiceData.response
      }
    } else if (voiceData.error) {
      responseText = `Error: ${voiceData.error}`
    }

    return NextResponse.json({
      success: true,
      action: voiceData.action || 'unknown',
      data: voiceData.result || voiceData,
      response: responseText,
      transcription
    })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      response: "I encountered an error processing your request. Please try again."
    }, { status: 500 })
  }
}

