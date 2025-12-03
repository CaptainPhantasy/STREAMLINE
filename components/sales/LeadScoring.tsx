'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, TrendingUp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface LeadScoringProps {
  contactId: string
  currentScore?: number
  onScoreUpdated?: (score: number) => void
}

export function LeadScoring({ contactId, currentScore, onScoreUpdated }: LeadScoringProps) {
  const [calculating, setCalculating] = useState(false)
  const [scoreData, setScoreData] = useState<any>(null)

  async function handleCalculate() {
    setCalculating(true)

    try {
      const response = await fetch(`/api/leads/${contactId}/score`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to calculate score')
      }

      const data = await response.json()
      setScoreData(data)
      onScoreUpdated?.(data.score)
      toast.success('Lead score calculated')
    } catch (error: any) {
      console.error('Error calculating score:', error)
      toast.error(error.message || 'Failed to calculate score')
    } finally {
      setCalculating(false)
    }
  }

  const score = scoreData?.score || currentScore || 0
  const probability = scoreData?.conversion_probability || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Lead Scoring
        </CardTitle>
        <CardDescription>AI-powered lead score and conversion probability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {score > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lead Score</span>
              <Badge variant="outline" className="text-lg">
                {score}/100
              </Badge>
            </div>
            <Progress value={score} className="h-2" />
          </div>
        )}

        {probability > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Probability</span>
              <span className="text-sm font-semibold">{probability.toFixed(1)}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>
        )}

        {scoreData?.recommended_actions && scoreData.recommended_actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended Actions</p>
            <ul className="space-y-1">
              {scoreData.recommended_actions.map((action: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={handleCalculate}
          disabled={calculating}
          className="w-full"
          variant="outline"
        >
          {calculating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Calculate Score
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

