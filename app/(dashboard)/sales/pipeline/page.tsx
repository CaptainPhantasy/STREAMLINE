'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineView } from '@/components/sales/PipelineView'
import { LeadScoring } from '@/components/sales/LeadScoring'
import { CompetitorAnalysis } from '@/components/sales/CompetitorAnalysis'
import { MeetingBooker } from '@/components/sales/MeetingBooker'
import { FollowUpManager } from '@/components/sales/FollowUpManager'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function PipelinePage() {
  const searchParams = useSearchParams()
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  // Initialize tab from URL parameter or default to 'pipeline'
  const initialTab = searchParams.get('tab') || 'pipeline'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== 'pipeline') {
      setActiveTab('pipeline')
    }
  }, [searchParams, activeTab])
  
  function handleTabChange(value: string) {
    setActiveTab(value)
    // Update URL without page reload
    const url = new URL(window.location.href)
    if (value === 'pipeline') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', value)
    }
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Sales Pipeline</h1>
          <p className="text-xs text-theme-secondary">
            Manage your sales opportunities and track progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <Link href="/contacts/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pipeline View - Main Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="follow-ups">Follow-Ups</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Pipeline</CardTitle>
                  <CardDescription>
                    Drag contacts between stages to update their pipeline status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PipelineView
                    onContactClick={(contactId) => {
                      setSelectedContactId(contactId)
                      setActiveTab('details')
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="follow-ups" className="space-y-4">
              <FollowUpManager />
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              <CompetitorAnalysis />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Contact Details */}
        {selectedContactId && (
          <div className="w-96 border-l border-theme-border bg-theme-surface overflow-y-auto p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContactId(null)}
                    className="mt-2"
                  >
                    Close
                  </Button>
                </CardDescription>
              </CardHeader>
            </Card>

            <LeadScoring contactId={selectedContactId} />

            <MeetingBooker
              contactId={selectedContactId}
              onMeetingBooked={() => {
                // Refresh pipeline
                window.location.reload()
              }}
            />

            <FollowUpManager
              contactId={selectedContactId}
              onFollowUpScheduled={() => {
                // Refresh follow-ups
              }}
            />

            <CompetitorAnalysis contactId={selectedContactId} />
          </div>
        )}
      </div>
    </div>
  )
}

