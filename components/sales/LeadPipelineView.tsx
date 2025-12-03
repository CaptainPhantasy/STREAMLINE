'use client'

/**
 * LeadPipelineView - Visual sales funnel with drag-and-drop
 *
 * Shows leads organized by stage with total value per stage.
 *
 * @example
 * ```tsx
 * <LeadPipelineView
 *   pipeline={pipelineData}
 *   onMoveStage={(leadId, stage) => console.log('Move', leadId, stage)}
 * />
 * ```
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, Users } from 'lucide-react'
import type { LeadPipelineViewProps, LeadStage } from '@/lib/types/sales'

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; icon: string }> = {
  new: { label: 'New', color: 'bg-gray-600', icon: '🆕' },
  contacted: { label: 'Contacted', color: 'bg-blue-600', icon: '📞' },
  qualified: { label: 'Qualified', color: 'bg-purple-600', icon: '✅' },
  proposal: { label: 'Proposal', color: 'bg-yellow-600', icon: '📄' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-600', icon: '🤝' },
  closed_won: { label: 'Won', color: 'bg-green-600', icon: '🎉' },
  closed_lost: { label: 'Lost', color: 'bg-red-600', icon: '❌' },
}

export function LeadPipelineView({ pipeline, onMoveStage, onLeadClick, className }: LeadPipelineViewProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stage: LeadStage) => {
    if (draggedLeadId) {
      onMoveStage?.(draggedLeadId, stage)
      setDraggedLeadId(null)
    }
  }

  const activeStages = Object.entries(pipeline.stages).filter(
    ([stage, _]) => !['closed_won', 'closed_lost'].includes(stage)
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-white">{pipeline.total_leads}</p>
        </div>

        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-semibold">Pipeline Value</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(pipeline.total_value)}</p>
        </div>

        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(pipeline.conversion_rate * 100)}%</p>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-3">
        {activeStages.map(([stageKey, stageData]) => {
          const stage = stageKey as LeadStage
          const config = STAGE_CONFIG[stage]

          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
              className={cn(
                'bg-gray-800/50 rounded-xl overflow-hidden border-2 border-transparent transition-all',
                draggedLeadId && 'border-purple-500/50 bg-purple-900/20'
              )}
            >
              {/* Stage Header */}
              <div className={cn('px-4 py-3 flex items-center justify-between', config.color)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="font-bold text-white">{config.label}</span>
                  <span className="text-white/80 text-sm">({stageData.count})</span>
                </div>
                <div className="text-white font-semibold text-sm">
                  {formatCurrency(stageData.total_value)}
                </div>
              </div>

              {/* Leads in Stage */}
              <div className="p-3 space-y-2">
                {stageData.leads.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">No leads in this stage</p>
                ) : (
                  stageData.leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => onLeadClick?.(lead)}
                      className="bg-gray-700/50 rounded-lg p-3 cursor-move hover:bg-gray-700 transition-all active:opacity-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white truncate flex-1">{lead.name}</h4>
                        <span className="text-green-400 font-bold flex-shrink-0 ml-2">
                          {formatCurrency(lead.value)}
                        </span>
                      </div>
                      {lead.company && (
                        <p className="text-sm text-gray-400 mb-1">{lead.company}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{lead.next_action}</span>
                        <span className="text-blue-400">{Math.round(lead.probability)}% likely</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Closed Stages (Collapsed) */}
      <div className="grid grid-cols-2 gap-3">
        {(['closed_won', 'closed_lost'] as LeadStage[]).map((stage) => {
          const stageData = pipeline.stages[stage]
          const config = STAGE_CONFIG[stage]

          return (
            <div key={stage} className={cn('rounded-xl p-4', config.color)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{config.icon}</span>
                <span className="font-bold text-white text-sm">{config.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stageData.count}</div>
              <div className="text-sm text-white/80">{formatCurrency(stageData.total_value)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LeadPipelineView
