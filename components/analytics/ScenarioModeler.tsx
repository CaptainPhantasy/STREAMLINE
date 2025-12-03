'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Calculator } from 'lucide-react'
import { toast } from 'sonner'

export function ScenarioModeler() {
  const [scenarioType, setScenarioType] = useState<string>('')
  const [parameters, setParameters] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleRunScenario() {
    if (!scenarioType) {
      toast.error('Please select a scenario type')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/analytics/scenario-modeling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: scenarioType,
          parameters,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to run scenario')
      }

      const data = await response.json()
      setResult(data.scenario)
      toast.success('Scenario completed')
    } catch (error: any) {
      console.error('Error running scenario:', error)
      toast.error(error.message || 'Failed to run scenario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Scenario Modeling
        </CardTitle>
        <CardDescription>What-if analysis for business planning</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Scenario Type</Label>
          <Select value={scenarioType} onValueChange={setScenarioType}>
            <SelectTrigger>
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_increase">Price Increase</SelectItem>
              <SelectItem value="volume_increase">Volume Increase</SelectItem>
              <SelectItem value="efficiency_improvement">Efficiency Improvement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scenarioType === 'price_increase' && (
          <div className="space-y-2">
            <Label>Price Increase (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={parameters.increase_percent || ''}
              onChange={(e) =>
                setParameters({ ...parameters, increase_percent: parseFloat(e.target.value) || 0 })
              }
              placeholder="10"
            />
          </div>
        )}

        {scenarioType === 'volume_increase' && (
          <div className="space-y-2">
            <Label>Volume Increase (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={parameters.volume_increase_percent || ''}
              onChange={(e) =>
                setParameters({
                  ...parameters,
                  volume_increase_percent: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="20"
            />
          </div>
        )}

        {scenarioType === 'efficiency_improvement' && (
          <div className="space-y-2">
            <Label>Efficiency Gain (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={parameters.efficiency_gain_percent || ''}
              onChange={(e) =>
                setParameters({
                  ...parameters,
                  efficiency_gain_percent: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="15"
            />
          </div>
        )}

        <Button onClick={handleRunScenario} disabled={loading || !scenarioType} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Run Scenario
            </>
          )}
        </Button>

        {result && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium mb-2">Baseline</p>
                <p className="text-lg font-semibold">
                  ${(result.baseline.revenue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{result.baseline.jobs} jobs</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm font-medium mb-2">Projected</p>
                <p className="text-lg font-semibold text-green-600">
                  ${(result.projected.revenue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{result.projected.jobs} jobs</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Projected Increase</p>
              <p className="text-xl font-bold text-blue-600">
                +${(result.projected.revenue_increase / 100).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

