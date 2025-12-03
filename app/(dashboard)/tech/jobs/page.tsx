'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock, User, Phone, Mail, Calendar, CheckCircle, XCircle, AlertTriangle, Filter, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  description: string
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled' | 'delayed'
  scheduledStart: string
  scheduledEnd: string
  contact: {
    firstName: string
    lastName: string
    address: string
    phone: string
    email?: string
  }
  location: {
    lat: number
    lng: number
  }
  serviceType: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export default function TechJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = jobs
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(job => 
        job.contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(job => job.status === statusFilter)
    }
    
    setFilteredJobs(result)
  }, [jobs, searchTerm, statusFilter])

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/tech/jobs')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <p className="text-[var(--color-text-secondary)]">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} scheduled
        </p>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-subtle)] w-4 h-4" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-subtle)]"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="text-[var(--color-text-subtle)] w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="en_route">En Route</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Link key={job.id} href={`/jobs?id=${job.id}`}>
            <Card className="p-6 hover:shadow-card-hover transition-all duration-200 cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{job.title || job.description}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      job.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      job.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      job.priority === 'normal' ? 'bg-[var(--color-bg-surface)]/50 text-[var(--color-text-subtle)] border-[var(--color-border)]' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {job.priority}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)] text-sm">
                      <User className="w-4 h-4" />
                      <span>{job.contact.firstName} {job.contact.lastName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)] text-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{job.contact.address}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-subtle)]">Date</span>
                      <span className="text-sm">{formatDate(job.scheduledStart)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-subtle)]">Time</span>
                      <span className="text-sm">{formatTime(job.scheduledStart)} - {formatTime(job.scheduledEnd)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-subtle)]">Service</span>
                      <span className="text-sm">{job.serviceType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-subtle)]">Status</span>
                      <div className={`text-sm font-medium ${
                        job.status === 'completed' ? 'text-green-400' :
                        job.status === 'in_progress' ? 'text-[var(--color-accent-primary)]' :
                        job.status === 'en_route' ? 'text-blue-400' :
                        job.status === 'delayed' ? 'text-amber-400' :
                        job.status === 'cancelled' ? 'text-red-400' :
                        'text-[var(--color-text-secondary)]'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={`tel:${job.contact.phone}`} 
                      className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                    {job.contact.email && (
                      <a 
                        href={`mailto:${job.contact.email}`} 
                        className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col items-end">
                  <div className={`p-2 rounded-lg ${
                    job.status === 'completed' ? 'bg-green-500/20' :
                    job.status === 'in_progress' ? 'bg-[var(--color-accent-primary)]/20' :
                    job.status === 'en_route' ? 'bg-blue-500/20' :
                    job.status === 'delayed' ? 'bg-amber-500/20' :
                    job.status === 'cancelled' ? 'bg-red-500/20' :
                    'bg-[var(--color-bg-surface)]/50'
                  }`}>
                    {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {job.status === 'in_progress' && <AlertTriangle className="w-5 h-5 text-[var(--color-accent-primary)]" />}
                    {job.status === 'en_route' && <AlertTriangle className="w-5 h-5 text-blue-400" />}
                    {job.status === 'delayed' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {job.status === 'cancelled' && <XCircle className="w-5 h-5 text-red-400" />}
                    {['scheduled', 'normal'].includes(job.status) && <Calendar className="w-5 h-5 text-[var(--color-text-subtle)]" />}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {filteredJobs.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-[var(--color-text-subtle)]">
              {searchTerm || statusFilter !== 'all' ? 'No jobs match your filters' : 'No jobs scheduled'}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}