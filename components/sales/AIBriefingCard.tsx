'use client'

/**
 * AIBriefingCard - AI-powered meeting preparation component
 *
 * This is the CORE DIFFERENTIATOR for the Sales role - provides AI-generated
 * meeting briefs with customer history, talking points, and pricing suggestions.
 *
 * @example
 * ```tsx
 * <AIBriefingCard
 *   contactId="contact-123"
 *   onRefresh={() => console.log('Refreshing...')}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  RefreshCw,
  User,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react'
import type { AIBriefing, AIBriefingCardProps } from '@/lib/types/sales'

export function AIBriefingCard({ contactId, onRefresh, className }: AIBriefingCardProps) {
  const [briefing, setBriefing] = useState<AIBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    talking_points: true,
    pricing: true,
    history: false,
    warnings: true,
  })

  const fetchBriefing = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate briefing: ${response.statusText}`)
      }

      const data = await response.json()
      setBriefing(data.briefing)
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load briefing')
      console.error('AI Briefing Error:', err)
    } finally {
      setLoading(false)
    }
  }, [contactId, onRefresh])

  useEffect(() => {
    fetchBriefing()
  }, [fetchBriefing])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Loading State
  if (loading) {
    return (
      <div className={cn('bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white">AI Meeting Brief</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
        <p className="text-center text-gray-400 mt-4">Generating your AI briefing...</p>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={cn('bg-red-900/30 border border-red-500/50 rounded-2xl p-6', className)}>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">Briefing Error</h2>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchBriefing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!briefing) {
    return null
  }

  return (
    <div className={cn('bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">AI Meeting Brief</h2>
            <p className="text-xs text-gray-400">
              Generated {new Date(briefing.generated_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchBriefing}
          className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
          title="Refresh briefing"
        >
          <RefreshCw className="w-5 h-5 text-purple-300" />
        </button>
      </div>

      {/* Warnings (Always Visible) */}
      {briefing.warnings && briefing.warnings.length > 0 && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
            <AlertCircle className="w-5 h-5" />
            Important Warnings
          </div>
          <ul className="space-y-1 text-gray-300">
            {briefing.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-400 font-semibold mb-2">
          <User className="w-5 h-5" />
          Quick Summary
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{briefing.history_summary}</p>
      </div>

      {/* Talking Points */}
      <div className="bg-gray-800/50 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('talking_points')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Talking Points ({briefing.talking_points.length})
          </div>
          {expandedSections.talking_points ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.talking_points && (
          <div className="p-4 pt-0 space-y-2">
            {briefing.talking_points.map((point) => (
              <div
                key={point.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  point.priority === 'high' && 'bg-red-900/20 border border-red-500/30',
                  point.priority === 'medium' && 'bg-yellow-900/20 border border-yellow-500/30',
                  point.priority === 'low' && 'bg-gray-700/50'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2',
                  point.priority === 'high' && 'bg-red-400',
                  point.priority === 'medium' && 'bg-yellow-400',
                  point.priority === 'low' && 'bg-gray-400'
                )} />
                <div className="flex-1">
                  <p className="text-gray-200 text-sm">{point.text}</p>
                  <span className="text-xs text-gray-500 capitalize">{point.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Suggestions */}
      {briefing.pricing_suggestions && briefing.pricing_suggestions.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('pricing')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <DollarSign className="w-5 h-5" />
              Pricing Suggestions
            </div>
            {expandedSections.pricing ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.pricing && (
            <div className="p-4 pt-0 space-y-3">
              {briefing.pricing_suggestions.map((suggestion, i) => (
                <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="font-semibold text-white mb-2">{suggestion.service}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Low: ${suggestion.low}</span>
                    <span className="text-green-400 font-bold">
                      Recommended: ${suggestion.recommended}
                    </span>
                    <span className="text-gray-400">High: ${suggestion.high}</span>
                  </div>
                  {suggestion.notes && (
                    <p className="text-xs text-gray-500 mt-2">{suggestion.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Opportunities */}
      {briefing.opportunities && briefing.opportunities.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 font-semibold mb-2">
            <TrendingUp className="w-5 h-5" />
            Opportunities
          </div>
          <ul className="space-y-1 text-gray-300 text-sm">
            {briefing.opportunities.map((opp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400">→</span>
                {opp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pain Points */}
      {briefing.pain_points && briefing.pain_points.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
            <AlertCircle className="w-5 h-5" />
            Known Pain Points
          </div>
          <ul className="space-y-1 text-gray-300 text-sm">
            {briefing.pain_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Services */}
      {briefing.recommended_services && briefing.recommended_services.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 font-semibold mb-2">
            <Clock className="w-5 h-5" />
            Recommended Services
          </div>
          <div className="flex flex-wrap gap-2">
            {briefing.recommended_services.map((service, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded-full text-sm text-purple-200"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIBriefingCard
