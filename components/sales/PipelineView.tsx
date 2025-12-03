'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, User, MoreVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PipelineViewProps {
  onContactClick?: (contactId: string) => void
  onStageChange?: () => void
}

export function PipelineView({ onContactClick, onStageChange }: PipelineViewProps) {
  const [loading, setLoading] = useState(true)
  const [pipeline, setPipeline] = useState<any>(null)
  const [movingContact, setMovingContact] = useState<string | null>(null)

  useEffect(() => {
    fetchPipeline()
  }, [])

  async function fetchPipeline() {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/pipeline')

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline')
      }

      const data = await response.json()
      setPipeline(data)
    } catch (error: any) {
      console.error('Error fetching pipeline:', error)
      toast.error('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  async function moveContact(contactId: string, newStage: string) {
    try {
      setMovingContact(contactId)
      const response = await fetch('/api/sales/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: [contactId],
          pipeline_stage: newStage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to move contact')
      }

      toast.success('Contact moved successfully')
      await fetchPipeline()
      onStageChange?.()
    } catch (error: any) {
      console.error('Error moving contact:', error)
      toast.error(error.message || 'Failed to move contact')
    } finally {
      setMovingContact(null)
    }
  }

  const stages = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
    { id: 'qualified', label: 'Qualified', color: 'bg-blue-100' },
    { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100' },
    { id: 'won', label: 'Won', color: 'bg-green-100' },
    { id: 'lost', label: 'Lost', color: 'bg-red-100' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!pipeline) {
    return null
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const contacts = pipeline.pipeline[stage.id] || []

        return (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
            {/* Stage Header */}
            <div className={cn('p-3 rounded-t-lg', stage.color)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <Badge variant="secondary">{contacts.length}</Badge>
              </div>
            </div>

            {/* Stage Content */}
            <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[400px]">
              {contacts.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">No contacts</div>
              ) : (
                contacts.map((contact: any) => (
                  <Card
                    key={contact.id}
                    className={cn(
                      "hover:shadow-md transition-shadow relative",
                      movingContact === contact.id && "opacity-50"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
                            {contact.first_name?.[0] || <User className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onContactClick?.(contact.id)}
                        >
                          <p className="font-medium text-sm truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                          )}
                          {contact.lead_score && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Score: {contact.lead_score}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {stages
                              .filter((s) => s.id !== stage.id)
                              .map((targetStage) => (
                                <DropdownMenuItem
                                  key={targetStage.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveContact(contact.id, targetStage.id)
                                  }}
                                  disabled={movingContact === contact.id}
                                >
                                  <Check className={cn(
                                    "mr-2 h-4 w-4",
                                    contact.pipeline_stage === targetStage.id ? "opacity-100" : "opacity-0"
                                  )} />
                                  Move to {targetStage.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

