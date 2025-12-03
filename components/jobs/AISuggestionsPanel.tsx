'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Clock, DollarSign, Package, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface AISuggestionsPanelProps {
  jobId: string
  onApplySuggestion?: (type: string, data: unknown) => void
}

export function AISuggestionsPanel({ jobId, onApplySuggestion }: AISuggestionsPanelProps) {
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<any>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [jobId])

  async function fetchSuggestions() {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs/${jobId}/ai-suggestions`)

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error: any) {
      console.error('Error fetching suggestions:', error)
      toast.error('Failed to load AI suggestions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Suggestions
        </CardTitle>
        <CardDescription>AI-powered recommendations for this job</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estimated Duration */}
        {suggestions.estimated_duration && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Estimated Duration</span>
            </div>
            <div className="pl-6">
              <p className="text-lg font-semibold">
                {suggestions.estimated_duration.hours} hours
              </p>
              <p className="text-sm text-gray-600">
                {suggestions.estimated_duration.reasoning}
              </p>
              <Badge variant="outline" className="mt-2">
                {suggestions.estimated_duration.confidence}% confidence
              </Badge>
            </div>
          </div>
        )}

        {/* Estimated Cost */}
        {suggestions.estimated_cost && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">Estimated Cost</span>
            </div>
            <div className="pl-6">
              <p className="text-lg font-semibold">
                ${(suggestions.estimated_cost.amount / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {suggestions.estimated_cost.breakdown}
              </p>
              <Badge variant="outline" className="mt-2">
                {suggestions.estimated_cost.confidence}% confidence
              </Badge>
            </div>
          </div>
        )}

        {/* Recommended Parts */}
        {suggestions.recommended_parts && suggestions.recommended_parts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Recommended Parts</span>
            </div>
            <div className="pl-6 space-y-2">
              {suggestions.recommended_parts.map((part: any, idx: number) => (
                <div key={idx} className="p-2 border rounded">
                  <p className="font-medium">{part.part_name}</p>
                  <p className="text-sm text-gray-600">{part.reason}</p>
                  {part.estimated_quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Est. quantity: {part.estimated_quantity}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Jobs */}
        {suggestions.similar_jobs && suggestions.similar_jobs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Similar Past Jobs</span>
            </div>
            <div className="pl-6 space-y-2">
              {suggestions.similar_jobs.map((similar: any, idx: number) => (
                <div key={idx} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{similar.reason}</p>
                    <Badge variant="outline">
                      {Math.round(similar.similarity_score * 100)}% match
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduling Suggestions */}
        {suggestions.scheduling_suggestions &&
          suggestions.scheduling_suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span className="font-medium">Scheduling Suggestions</span>
              </div>
              <div className="pl-6 space-y-1">
                {suggestions.scheduling_suggestions.map((suggestion: string, idx: number) => (
                  <p key={idx} className="text-sm text-gray-600">
                    • {suggestion}
                  </p>
                ))}
              </div>
            </div>
          )}

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  )
}

