'use client'

/**
 * MeetingSummaryAI - AI-generated meeting summary and action items
 *
 * Generates post-meeting recap with key points and next steps.
 *
 * @example
 * ```tsx
 * <MeetingSummaryAI
 *   meetingId="meeting-123"
 *   onGenerate={() => console.log('Generating...')}
 *   onShare={() => console.log('Sharing...')}
 * />
 * ```
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Share2, CheckCircle, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import type { MeetingSummaryAIProps, MeetingSummary } from '@/lib/types/sales'

export function MeetingSummaryAI({
  meetingId,
  summary: initialSummary,
  onGenerate,
  onShare,
  className,
}: MeetingSummaryAIProps) {
  const [summary, setSummary] = useState<MeetingSummary | null>(initialSummary || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!summary && !isGenerating) {
      fetchSummary()
    }
  }, [meetingId])

  const fetchSummary = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meetingId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      onGenerate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
      console.error('Summary generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!summary) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meeting Summary',
          text: `Key Points:\n${summary.key_points.join('\n')}\n\nNext Steps:\n${summary.next_steps.join('\n')}`,
        })
      } else {
        // Fallback: copy to clipboard
        const text = `Meeting Summary\n\nKey Points:\n${summary.key_points
          .map((p, i) => `${i + 1}. ${p}`)
          .join('\n')}\n\nNext Steps:\n${summary.next_steps
          .map((s, i) => `${i + 1}. ${s}`)
          .join('\n')}`
        await navigator.clipboard.writeText(text)
        alert('Summary copied to clipboard!')
      }
      onShare?.()
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😟'
      default:
        return '😐'
    }
  }

  // Generating State
  if (isGenerating) {
    return (
      <div className={cn('bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Generating AI Summary...</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={cn('bg-red-900/30 border border-red-500/50 rounded-2xl p-6', className)}>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">Summary Error</h2>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className={cn('bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Meeting Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
            title="Regenerate summary"
          >
            <RefreshCw className="w-5 h-5 text-purple-300" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
            title="Share summary"
          >
            <Share2 className="w-5 h-5 text-purple-300" />
          </button>
        </div>
      </div>

      {/* Sentiment */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{getSentimentEmoji(summary.sentiment)}</span>
        <div>
          <div className="text-sm text-gray-400">Meeting Sentiment</div>
          <div className={cn('text-lg font-bold capitalize', getSentimentColor(summary.sentiment))}>
            {summary.sentiment}
          </div>
        </div>
      </div>

      {/* Key Points */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-400 font-semibold mb-3">
          <CheckCircle className="w-5 h-5" />
          Key Points Discussed
        </div>
        <ul className="space-y-2">
          {summary.key_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-200">
              <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Decisions Made */}
      {summary.decisions_made && summary.decisions_made.length > 0 && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 font-semibold mb-3">
            <TrendingUp className="w-5 h-5" />
            Decisions Made
          </div>
          <ul className="space-y-2">
            {summary.decisions_made.map((decision, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-200">
                <span className="text-green-400 flex-shrink-0">✓</span>
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
          <CheckCircle className="w-5 h-5" />
          Action Items
        </div>
        {summary.action_items.length === 0 ? (
          <p className="text-gray-400">No action items</p>
        ) : (
          <div className="space-y-3">
            {summary.action_items.map((item) => (
              <div key={item.id} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-white font-semibold mb-1">{item.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  {item.assigned_to && (
                    <span className="text-gray-400">Assigned: {item.assigned_to}</span>
                  )}
                  {item.due_date && (
                    <span className="text-yellow-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-400 font-semibold mb-3">
          <Clock className="w-5 h-5" />
          Next Steps
        </div>
        <ul className="space-y-2">
          {summary.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-200">
              <span className="text-purple-400 flex-shrink-0">→</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        {summary.follow_up_date && (
          <div className="mt-3 pt-3 border-t border-purple-500/30">
            <span className="text-sm text-gray-400">Follow-up scheduled: </span>
            <span className="text-purple-300 font-semibold">
              {new Date(summary.follow_up_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MeetingSummaryAI
