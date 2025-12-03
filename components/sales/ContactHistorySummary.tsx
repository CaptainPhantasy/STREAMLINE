'use client'

/**
 * ContactHistorySummary - Timeline of past interactions with a contact
 *
 * Shows job history, meetings, conversations, and total revenue.
 *
 * @example
 * ```tsx
 * <ContactHistorySummary contactId="contact-123" history={contactHistory} />
 * ```
 */

import { cn } from '@/lib/utils'
import {
  Briefcase,
  Calendar,
  MessageSquare,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import type { ContactHistorySummaryProps } from '@/lib/types/sales'

export function ContactHistorySummary({ history, className }: ContactHistorySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'in_progress':
        return 'text-blue-400'
      case 'scheduled':
        return 'text-yellow-400'
      case 'cancelled':
        return 'text-gray-500'
      default:
        return 'text-gray-400'
    }
  }

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😟'
      default:
        return '😐'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-semibold">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(history.total_revenue)}</p>
        </div>

        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm font-semibold">Total Jobs</span>
          </div>
          <p className="text-2xl font-bold text-white">{history.jobs.length}</p>
        </div>
      </div>

      {/* Last Contact */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-semibold">Last Contact</span>
        </div>
        <p className="text-gray-300">{formatDate(history.last_contact_date)}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Recent Activity
        </h3>

        <div className="space-y-3">
          {/* Jobs */}
          {history.jobs.slice(0, 3).map((job) => (
            <div key={job.id} className="flex gap-4 bg-gray-800/50 rounded-xl p-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-semibold truncate">{job.description}</h4>
                  <span className="text-green-400 font-bold flex-shrink-0 ml-2">
                    {formatCurrency(job.total_amount)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn('capitalize', getStatusColor(job.status))}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500">{formatDate(job.created_at)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Meetings */}
          {history.meetings.slice(0, 2).map((meeting) => (
            <div key={meeting.id} className="flex gap-4 bg-gray-800/50 rounded-xl p-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold">Meeting</h4>
                  <span className="text-xl">{getSentimentEmoji(meeting.sentiment)}</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">{meeting.summary}</p>
                <span className="text-gray-500 text-sm">{formatDate(meeting.scheduled_at)}</span>
              </div>
            </div>
          ))}

          {/* Open Conversations */}
          {history.conversations
            .filter((c) => c.status === 'open')
            .slice(0, 2)
            .map((conv) => (
              <div key={conv.id} className="flex gap-4 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold mb-1">{conv.subject}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-sm font-semibold">Open Issue</span>
                    <span className="text-gray-500 text-sm">{formatDate(conv.last_message_at)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Empty State */}
        {history.jobs.length === 0 && history.meetings.length === 0 && history.conversations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity history yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactHistorySummary
