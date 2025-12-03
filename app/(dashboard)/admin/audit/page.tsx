'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter } from 'lucide-react'
import type { AuditLog } from '@/types/admin'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

function AuditPageContent() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchLogs()
    }
  }, [isAdmin, filters])

  async function checkAdminAccess() {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user && (data.user.role === 'admin' || data.user.role === 'owner')) {
          setIsAdmin(true)
        } else {
          router.push('/inbox')
        }
      } else {
        router.push('/inbox')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/inbox')
    } finally {
      setLoading(false)
    }
  }

  async function fetchLogs() {
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.action && filters.action !== 'all') params.append('action', filters.action)
      if (filters.entityType && filters.entityType !== 'all') params.append('entityType', filters.entityType)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/audit?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-neutral-500">Checking access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Audit Logs</h1>
        <p className="text-sm text-neutral-500 mt-1">View system activity and changes</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search logs..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="assign">Assign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => setFilters({ ...filters, entityType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="conversation">Conversation</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>{logs.length} log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No audit logs found</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">{log.action}</span>
                        {log.entity_type && (
                          <Badge className="text-xs bg-[#EBF0FF] text-[#4B79FF]">
                            {log.entity_type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {log.user?.full_name || 'System'} • {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.details && (
                        <div className="text-xs text-neutral-400 mt-2 font-mono bg-neutral-50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


export default function AuditPage() {
  return (
    <AdminErrorBoundary errorMessage="Failed to load audit log page">
      <AuditPageContent />
    </AdminErrorBoundary>
  )
}
