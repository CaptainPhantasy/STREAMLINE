import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

/**
 * GET /api/jobs/[id]/ai-suggestions
 * Get AI suggestions for a job (similar jobs, parts, estimates, scheduling)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.id

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, contact:contacts(*), tech:users(*)')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== job.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get similar past jobs
    const { data: similarJobs } = await supabase
      .from('jobs')
      .select('id, description, total_amount, status, completed_at')
      .eq('account_id', userData.account_id)
      .neq('id', jobId)
      .not('description', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Get parts inventory
    const { data: parts } = await supabase
      .from('parts')
      .select('id, name, quantity_in_stock, unit_cost')
      .eq('account_id', userData.account_id)
      .gt('quantity_in_stock', 0)
      .limit(20)

    // Use AI to generate suggestions
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: {
        type: 'object',
        properties: {
          similar_jobs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                job_id: { type: 'string' },
                similarity_score: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
          recommended_parts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                part_id: { type: 'string' },
                part_name: { type: 'string' },
                reason: { type: 'string' },
                estimated_quantity: { type: 'number' },
              },
            },
          },
          estimated_duration: {
            type: 'object',
            properties: {
              hours: { type: 'number' },
              confidence: { type: 'number' },
              reasoning: { type: 'string' },
            },
          },
          estimated_cost: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              confidence: { type: 'number' },
              breakdown: { type: 'string' },
            },
          },
          scheduling_suggestions: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['similar_jobs', 'recommended_parts', 'estimated_duration', 'estimated_cost'],
      },
      prompt: `Analyze this job and provide AI suggestions:

Job Description: ${job.description || 'N/A'}
Job Status: ${job.status}
Contact: ${job.contact?.first_name || ''} ${job.contact?.last_name || ''}
Scheduled: ${job.scheduled_start || 'Not scheduled'}

Similar Past Jobs:
${similarJobs?.map(j => `- ${j.description} ($${j.total_amount ? j.total_amount / 100 : 0})`).join('\n') || 'None'}

Available Parts:
${parts?.map(p => `- ${p.name} (${p.quantity_in_stock} in stock, $${p.unit_cost ? p.unit_cost / 100 : 0} each)`).join('\n') || 'None'}

Provide:
1. Similar jobs with similarity scores
2. Recommended parts based on job description
3. Estimated duration in hours
4. Estimated total cost
5. Scheduling suggestions (optimal time, conflicts, etc.)`,
    })

    return NextResponse.json({
      suggestions: result.object,
      similar_jobs_data: similarJobs || [],
      available_parts: parts || [],
    })
  } catch (error: unknown) {
    console.error('Error generating AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

