'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Search, Filter, Phone, Mail, Calendar, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  value?: number
  source: string
  createdAt: string
  lastContact?: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchLeads()
  }, [statusFilter])

  const fetchLeads = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/leads' 
        : `/api/leads?status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setStats({
          total: data.leads?.length || 0,
          qualified: data.leads?.filter((l: Lead) => l.status === 'qualified').length || 0,
          totalValue: data.leads?.reduce((sum: number, l: Lead) => sum + (l.value || 0), 0) || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700 border-blue-300',
      contacted: 'bg-purple-100 text-purple-700 border-purple-300',
      qualified: 'bg-green-100 text-green-700 border-green-300',
      proposal: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      negotiation: 'bg-orange-100 text-orange-700 border-orange-300',
      won: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      lost: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colors[status as keyof typeof colors] || colors.new
  }

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Sales Leads</h1>
          <p className="text-xs text-theme-secondary">
            Manage your sales pipeline and opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <Link href="/contacts/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-4 py-4">
        <Card className="border-theme-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-accent-primary" />
                <Input
                  placeholder="Search leads..."
                  className="pl-10 border-theme-border bg-theme-input text-theme-primary placeholder:text-theme-secondary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-theme-border rounded-md bg-theme-input text-theme-primary"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l border-l-theme-accent-secondary border-theme-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-theme-secondary">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-theme-primary">{stats.total}</div>
              <p className="text-xs mt-1 font-medium text-theme-accent-secondary">Active pipeline</p>
            </CardContent>
          </Card>
          <Card className="border-l border-l-theme-accent-primary border-theme-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-theme-secondary">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-theme-primary">{stats.qualified}</div>
              <p className="text-xs mt-1 font-medium text-theme-accent-secondary">Ready to close</p>
            </CardContent>
          </Card>
          <Card className="border-l border-l-orange-500 border-theme-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-theme-secondary">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-theme-primary">
                ${stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs mt-1 font-medium text-theme-accent-secondary">Total potential</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        <section className="flex-1 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="h-full flex flex-col">
            <CardHeader className="border-b border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <CardTitle className="text-ops-text">All Leads</CardTitle>
              <CardDescription className="text-ops-textMuted">Track and manage your sales opportunities</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-accent-primary" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <Card className="m-4 border-0 bg-transparent">
                  <CardContent className="py-12 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-ops-textMuted font-medium">No leads found</p>
                    <p className="text-sm text-ops-textMuted mt-1">
                      {searchQuery ? 'Try a different search term' : 'Add your first lead to get started'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="hover:shadow-card transition-all border-2 bg-theme-surface border-theme-border hover:border-theme-accent-primary cursor-pointer"
                      onClick={() => router.push(`/contacts/${lead.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-theme-accent-primary/20 text-theme-accent-primary font-semibold">
                              {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-base text-theme-primary">{lead.name}</CardTitle>
                            {lead.company && (
                              <p className="text-sm text-theme-secondary">{lead.company}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(lead.status)} border font-semibold text-xs`}>
                          {lead.status.toUpperCase()}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-theme-secondary">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-theme-secondary">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.value && (
                          <div className="flex items-center gap-2 text-sm text-theme-secondary">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">${lead.value.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-theme-secondary pt-2 border-t border-theme-border">
                          <Calendar className="w-3 h-3" />
                          <span>Added {new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </section>
      </div>
    </div>
  )
}
