/**
 * Resend Webhook Handler
 *
 * Handles events from Resend:
 * - email.delivered
 * - email.bounced
 * - email.complained
 * - email.opened
 * - email.clicked
 */

import { NextRequest, NextResponse } from 'next/server'
import { resendService } from '@/lib/email/resend-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Verify webhook signature
function verifyWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('RESEND_WEBHOOK_SECRET not configured, skipping verification')
    return true
  }

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('resend-signature') || ''

    // Verify webhook signature
    if (!verifyWebhook(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse events
    const events = JSON.parse(body)
    const eventsArray = Array.isArray(events) ? events : [events]

    console.log(`Processing ${eventsArray.length} webhook events`)

    // Process each event
    for (const event of eventsArray) {
      try {
        await resendService.handleWebhook(event)
      } catch (error) {
        console.error(`Error processing event ${event.type}:`, error)
        // Continue processing other events
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Error in Resend webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle webhook verification request from Resend
export async function GET(request: NextRequest) {
  // Return 200 to confirm endpoint is active
  return NextResponse.json({ status: 'active' })
}