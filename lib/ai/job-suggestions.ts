/**
 * AI Job Suggestions
 * Provides AI-powered suggestions for jobs
 */

import { createClient } from '@supabase/supabase-js'

export interface JobSuggestion {
  type: 'similar_job' | 'part' | 'estimate' | 'scheduling'
  title: string
  description: string
  confidence?: number
  data?: unknown
}

/**
 * Get similar jobs based on description
 */
export async function findSimilarJobs(
  jobDescription: string,
  accountId: string,
  excludeJobId?: string
): Promise<Array<{ job: unknown; similarity: number }>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get completed jobs with similar keywords
  const keywords = jobDescription
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'completed')
    .not('id', 'eq', excludeJobId || '')
    .not('description', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(20)

  if (!jobs) return []

  // Simple keyword matching (could be enhanced with embeddings)
  const scored = jobs.map((job) => {
    const jobDesc = (job.description || '').toLowerCase()
    const matches = keywords.filter((kw) => jobDesc.includes(kw)).length
    const similarity = keywords.length > 0 ? matches / keywords.length : 0

    return { job, similarity }
  })

  return scored
    .filter((s) => s.similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
}

/**
 * Recommend parts based on job description
 */
export async function recommendParts(
  jobDescription: string,
  accountId: string
): Promise<Array<{ part: unknown; reason: string }>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all available parts
  const { data: parts } = await supabase
    .from('parts')
    .select('*')
    .eq('account_id', accountId)
    .gt('quantity_in_stock', 0)

  if (!parts) return []

  // Simple keyword matching (enhance with AI)
  const descLower = jobDescription.toLowerCase()
  const recommended = parts
    .filter((part) => {
      const partName = (part.name || '').toLowerCase()
      return descLower.includes(partName) || partName.includes(descLower.split(' ')[0])
    })
    .slice(0, 5)

  return recommended.map((part) => ({
    part,
    reason: `Mentioned in job description`,
  }))
}

