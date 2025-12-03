'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Briefcase, MessageSquare, FileText, DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CustomerHistoryPanelProps {
  contactId: string
}

export function CustomerHistoryPanel({ contactId }: CustomerHistoryPanelProps) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<any>(null)

  useEffect(() => {
    fetchHistory()
  }, [contactId])

  async function fetchHistory() {
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts/${contactId}/history`)

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setHistory(data)
    } catch (error: any) {
      console.error('Error fetching history:', error)
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

  if (!history) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer History</CardTitle>
        <CardDescription>
          {history.summary.total_jobs} jobs • {history.summary.total_conversations} conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="jobs">
          <TabsList>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs ({history.jobs.length})
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversations ({history.conversations.length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="w-4 h-4 mr-2" />
              Notes ({history.notes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-2 mt-4">
            {history.jobs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No jobs yet</p>
            ) : (
              history.jobs.map((job: any) => (
                <div key={job.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{job.description || 'No description'}</p>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  {job.total_amount && (
                    <p className="text-sm text-green-600">
                      ${(job.total_amount / 100).toFixed(2)}
                    </p>
                  )}
                  {job.scheduled_start && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(job.scheduled_start).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="conversations" className="space-y-2 mt-4">
            {history.conversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
            ) : (
              history.conversations.map((conv: any) => (
                <div key={conv.id} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{conv.subject || 'No subject'}</p>
                  <Badge variant="outline" className="mt-1">{conv.status}</Badge>
                  {conv.last_message_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last message: {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-2 mt-4">
            {!history.notes || history.notes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              history.notes.map((note: any) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <p className="text-sm">{note.content || note.note}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

