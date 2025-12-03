/**
 * Quick Estimate API - POST /api/estimates/quick-create
 *
 * Creates and optionally sends a quick estimate.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contact_id, services, notes, send_immediately = false } = body

    if (!contact_id || !services || services.length === 0) {
      return NextResponse.json({ error: 'contact_id and services are required' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = services.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
    const tax = subtotal * 0.08 // 8% tax
    const total = subtotal + tax

    // Create valid_until date (30 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    // Create estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert({
        contact_id,
        account_id: (user as any).account_id,
        created_by: user.id,
        services: JSON.stringify(services),
        subtotal,
        tax,
        total,
        notes,
        valid_until: validUntil.toISOString(),
        status: send_immediately ? 'sent' : 'draft',
      })
      .select()
      .single()

    if (estimateError) {
      throw estimateError
    }

    // If send_immediately, trigger email (optional)
    if (send_immediately) {
      // TODO: Implement email sending via your email service
      // For now, just mark as sent
    }

    return NextResponse.json({
      estimate: {
        ...estimate,
        services: typeof estimate.services === 'string' ? JSON.parse(estimate.services) : estimate.services,
      },
    })
  } catch (error) {
    console.error('Quick Estimate Error:', error)
    return NextResponse.json(
      { error: 'Failed to create estimate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
