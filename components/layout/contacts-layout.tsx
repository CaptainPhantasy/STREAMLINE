'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Phone, MapPin, Search, UserPlus, Trash2, Filter, Users, Edit } from 'lucide-react'
import { Contact } from '@/types'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/hooks/usePermissions'

interface ContactsLayoutProps {
  contacts: Contact[]
  loading: boolean
  searchQuery: string
  selectedContactIds: Set<string>
  bulkDeleting: boolean
  stats: {
    total: number
    active: number
    newThisMonth: number
  }
  onSearchChange: (query: string) => void
  onToggleContactSelection: (contactId: string) => void
  onSelectAllContacts: () => void
  onBulkDelete: () => void
  onViewContact: (contactId: string) => void
  onMessageContact: (contactId: string, email: string) => void
  onAddContact: () => void
  onOpenFilters: () => void
  onEditContact?: (contactId: string) => void
  activeFilterCount: number
  children?: ReactNode
}

function StatCard({ title, value, change, changeType, borderColor }: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  borderColor: string
}) {
  return (
    <Card className={`border-l ${borderColor} border-theme-border`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-theme-secondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-theme-primary">{value}</div>
        {change && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            changeType === 'positive' && "text-theme-accent-secondary",
            changeType === 'negative' && "text-red-500",
            changeType === 'neutral' && "text-theme-secondary"
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ContactsLayout({
  contacts,
  loading,
  searchQuery,
  selectedContactIds,
  bulkDeleting,
  stats,
  onSearchChange,
  onToggleContactSelection,
  onSelectAllContacts,
  onBulkDelete,
  onViewContact,
  onMessageContact,
  onAddContact,
  onOpenFilters,
  onEditContact,
  activeFilterCount,
  children
}: ContactsLayoutProps) {
  const { hasPermission, userRole, isOwner, isAdmin, isSales, isCSR, isDispatcher } = usePermissions()
  const canEditContacts = hasPermission('edit_contacts')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Contacts</h1>
          <p className="text-xs text-theme-secondary">
            Manage your customer database
          </p>
        </div>
        <div className="flex gap-2">
          {selectedContactIds.size > 0 && (
            <Button
              onClick={onBulkDelete}
              variant="destructive"
              disabled={bulkDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedContactIds.size})
            </Button>
          )}
          <Button
            onClick={onAddContact}
            className="bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="px-4 py-4">
        <Card className="border-theme-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-accent-primary" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10 border-theme-border bg-theme-input text-theme-primary placeholder:text-theme-secondary"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="border-theme-border text-theme-primary hover:bg-theme-surface"
                onClick={onOpenFilters}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-theme-accent-primary text-black font-bold rounded-full px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Contacts"
            value={stats.total}
            change="+8 this week"
            changeType="positive"
            borderColor="border-l-theme-accent-secondary"
          />
          <StatCard
            title="Active"
            value={stats.active}
            change="90% active rate"
            changeType="positive"
            borderColor="border-l-theme-accent-primary"
          />
          <StatCard
            title="New This Month"
            value={stats.newThisMonth}
            change="Growing fast!"
            changeType="positive"
            borderColor="border-l-orange-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        {/* Contacts Grid */}
        <section className="flex-1 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="h-full flex flex-col">
            <CardHeader className="border-b border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <CardTitle className="text-ops-text">All Contacts</CardTitle>
              <CardDescription className="text-ops-textMuted">View and manage your customers</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="bg-ops-surfaceSoft border-ops-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-12 w-12 rounded-full bg-ops-bg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 bg-ops-bg" />
                            <Skeleton className="h-3 w-24 bg-ops-bg" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full mb-2 bg-ops-bg" />
                        <Skeleton className="h-8 w-full bg-ops-bg" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <Card className="m-4 border-0 bg-transparent">
                  <CardContent className="py-12 text-center">
                    <p className="text-ops-textMuted font-medium">No contacts found</p>
                    <p className="text-sm text-ops-textMuted mt-1">
                      {searchQuery ? 'Try a different search term' : 'Create your first contact to get started'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-4 space-y-4">
                  {contacts.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b border-ops-border">
                      <Checkbox
                        checked={selectedContactIds.size === contacts.length && contacts.length > 0}
                        onCheckedChange={onSelectAllContacts}
                        className="border-ops-border"
                      />
                      <span className="text-sm text-ops-textMuted">
                        {selectedContactIds.size > 0 ? `${selectedContactIds.size} selected` : 'Select all'}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((contact) => (
                      <Card
                        key={contact.id}
                        className={cn(
                          "hover:shadow-card transition-all border-2 bg-theme-surface",
                          selectedContactIds.has(contact.id)
                            ? "border-theme-accent-primary bg-theme-accent-secondary/20"
                            : "border-theme-border hover:border-theme-accent-primary"
                        )}
                        onClick={(e) => {
                          if (
                            e.target instanceof HTMLElement &&
                            !e.target.closest('button') &&
                            !e.target.closest('[role="checkbox"]')
                          ) {
                            onToggleContactSelection(contact.id)
                          }
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedContactIds.has(contact.id)}
                              onCheckedChange={() => onToggleContactSelection(contact.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-ops-border"
                            />
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="text-ops-accent bg-ops-accentSoft">
                                {contact.first_name?.[0]}{contact.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-base text-ops-text">
                                {contact.first_name} {contact.last_name}
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="mt-1 bg-ops-accentSoft text-ops-accent border border-ops-accent"
                              >
                                active
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                              <Mail className="w-4 h-4 text-ops-accent" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                              <Phone className="w-4 h-4 text-ops-success" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center gap-2 text-sm text-ops-textMuted">
                              <MapPin className="w-4 h-4 text-ops-warning" />
                              <span className="truncate">{contact.address}</span>
                            </div>
                          )}
                          <div className="pt-2 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-ops-border text-ops-text hover:bg-ops-surface"
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewContact(contact.id)
                              }}
                            >
                              View
                            </Button>
                            {canEditContacts && onEditContact && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-theme-border text-theme-primary hover:bg-theme-surface flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditContact(contact.id)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 bg-ops-accent hover:bg-ops-accent/90 text-black"
                              onClick={(e) => {
                                e.stopPropagation()
                                onMessageContact(contact.id, contact.email || '')
                              }}
                            >
                              Message
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </section>

        {/* Inspector Panel */}
        <section className="w-80 ml-4 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-lg shadow-card transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
          <div className="p-4">
            <h3 className="font-semibold text-ops-text mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contact Details
            </h3>
            <div className="text-ops-textMuted text-sm">
              Select a contact to view details
            </div>
          </div>
        </section>
      </div>

      {/* Additional content (modals, dialogs, etc.) */}
      {children}
    </div>
  )
}
