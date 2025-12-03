/**
 * Leads Pipeline API - GET /api/leads/pipeline
 *
 * Returns all leads organized by stage with totals.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadPipeline, LeadStage } from '@/lib/types/sales'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('account_id', (user as any).account_id)
      .order('created_at', { ascending: false })

    if (leadsError) {
      throw leadsError
    }

    // Organize leads by stage
    const stages: LeadPipeline['stages'] = {
      new: { leads: [], total_value: 0, count: 0 },
      contacted: { leads: [], total_value: 0, count: 0 },
      qualified: { leads: [], total_value: 0, count: 0 },
      proposal: { leads: [], total_value: 0, count: 0 },
      negotiation: { leads: [], total_value: 0, count: 0 },
      closed_won: { leads: [], total_value: 0, count: 0 },
      closed_lost: { leads: [], total_value: 0, count: 0 },
    }

    let totalLeads = 0
    let totalValue = 0
    let wonCount = 0
    let lostCount = 0

    for (const lead of leads || []) {
      const stage = lead.stage as LeadStage
      if (stages[stage]) {
        stages[stage].leads.push(lead)
        stages[stage].total_value += lead.value || 0
        stages[stage].count++
      }

      if (stage !== 'closed_lost') {
        totalLeads++
        totalValue += lead.value || 0
      }

      if (stage === 'closed_won') wonCount++
      if (stage === 'closed_lost') lostCount++
    }

    const conversionRate = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0

    const pipeline: LeadPipeline = {
      stages,
      total_leads: totalLeads,
      total_value: totalValue,
      conversion_rate: conversionRate,
    }

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Leads Pipeline Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
