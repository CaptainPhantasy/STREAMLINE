/**
 * Cron Job: Email Queue Processor
 *
 * This endpoint should be called by a cron job every 5 minutes
 * to process the email queue.
 *
 * Example cron expression: "*\/5 * * * *"
 * URL: https://your-domain.com/api/cron/email-queue
 */

import { NextResponse } from 'next/server'
import { resendService } from '@/lib/email/resend-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple authentication for cron jobs
// You can use a secret key or IP whitelist
function authenticateCron(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    // If no secret is configured, allow only local requests
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    return ip === '127.0.0.1' || ip === '::1'
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: Request) {
  try {
    // Authenticate the cron request
    if (!authenticateCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting email queue processing...')

    // Process the queue
    await resendService.processQueue()

    console.log('Email queue processing completed')

    return NextResponse.json({
      success: true,
      message: 'Email queue processed',
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process queue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Support GET requests for simple health checks
export async function GET(request: Request) {
  if (!authenticateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'active',
    message: 'Email queue processor is running',
    timestamp: new Date().toISOString()
  })
}