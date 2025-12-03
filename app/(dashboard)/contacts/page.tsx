"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Contact } from '@/types'
import { ContactDetailModal } from '@/components/contacts/contact-detail-modal'
import { AddContactDialog } from '@/components/contacts/add-contact-dialog'
import { useRouter } from 'next/navigation'
import { ContactsLayout } from '@/components/layout/contacts-layout'
import { useModalState } from '@/hooks/use-modal-state'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'
import { confirmDialog } from '@/lib/confirm'
import { ContactsFilterDialog, type ContactFilters } from '@/components/contacts/contacts-filter-dialog'
import { ErrorBoundary } from '@/components/error-boundary'

function ContactsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  // Use modal state hook to sync with URL query parameter
  const { isOpen: detailModalOpen, modalId: urlContactId, open: openModal, close: closeModal } = useModalState('id', {
    onOpen: (id) => {
      setSelectedContactId(id)
    },
    onClose: () => {
      setSelectedContactId(null)
    }
  })

  // Sync selectedContactId with URL param
  useEffect(() => {
    if (urlContactId && urlContactId !== selectedContactId) {
      setSelectedContactId(urlContactId)
    } else if (!urlContactId && selectedContactId) {
      setSelectedContactId(null)
    }
  }, [urlContactId, selectedContactId])
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState<ContactFilters>({
    tags: [],
    status: [],
    dateRange: { start: '', end: '' },
    search: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  // Handle query parameter on mount and when it changes
  useEffect(() => {
    const contactIdParam = searchParams.get('id')
    if (contactIdParam && contactIdParam !== selectedContactId) {
      setSelectedContactId(contactIdParam)
      openModal(contactIdParam)
    }
  }, [searchParams.get('id')]) // Only depend on the actual param value

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, JSON.stringify(filters)]) // Stringify filters to avoid reference changes

  async function fetchContacts(search = '') {
    try {
      setLoading(true)
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : '/api/contacts'
      // Add cache control for faster subsequent loads
      const response = await fetch(url, {
        next: { revalidate: 30 }, // Cache for 30 seconds
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })

      if (!response.ok) {
        // API failed, but continue with empty state
        console.warn('API call failed, using empty state')
        setContacts([])
        setStats({ total: 0, active: 0, newThisMonth: 0 })
        return
      }

      if (response.ok) {
        const data = await response.json()
        const contactsArray = data.contacts || []
        setContacts(contactsArray)

        // Calculate stats efficiently
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        let newThisMonth = 0

        for (const contact of contactsArray) {
          const created = new Date(contact.created_at)
          if (created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
            newThisMonth++
          }
        }

        setStats({
          total: data.total || contactsArray.length,
          active: contactsArray.length,
          newThisMonth
        })
      }
    } catch (error) {
      // API failed, but continue with empty state
      console.error('Error fetching contacts:', error)
      setContacts([])
      setStats({ total: 0, active: 0, newThisMonth: 0 })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddContact() {
    setAddContactDialogOpen(true)
  }

  async function handleContactAdded() {
    // Refresh contacts list
    fetchContacts(searchQuery)
  }

  async function handleViewContact(contactId: string) {
    setSelectedContactId(contactId)
    openModal(contactId)
  }

  async function handleEditContact(contactId: string) {
    setSelectedContactId(contactId)
    openModal(contactId)
  }

  async function handleMessageContact(contactId: string, email: string) {
    try {
      // Find or create conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          subject: `Conversation with ${email}`,
          channel: 'email',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.conversation) {
          // Navigate to inbox with conversation pre-selected
          router.push(`/inbox?conversation=${data.conversation.id}`)
        } else {
          console.error('Failed to create/find conversation:', data.error)
          toastError('Failed to open conversation', data.error || 'Please try again.')
        }
      } else {
        const data = await response.json().catch(() => ({}))
        toastError('Failed to open conversation', data.error || 'Please try again.')
      }
    } catch (error) {
      console.error('Error handling message contact:', error)
      toastError('Failed to open conversation', 'Network error. Please try again.')
    }
  }


  function handleToggleContactSelection(contactId: string) {
    const newSelected = new Set(selectedContactIds)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContactIds(newSelected)
  }

  function handleSelectAllContacts() {
    if (selectedContactIds.size === contacts.length) {
      setSelectedContactIds(new Set())
    } else {
      setSelectedContactIds(new Set(contacts.map(c => c.id)))
    }
  }

  async function handleBulkDelete() {
    if (selectedContactIds.size === 0) return

    const confirmed = await confirmDialog({
      title: `Delete ${selectedContactIds.size} contact(s)?`,
      description: 'This action cannot be undone. Are you sure you want to continue?',
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })

    if (!confirmed) {
      return
    }

    setBulkDeleting(true)
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          contactIds: Array.from(selectedContactIds),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toastSuccess(`Successfully deleted ${data.deleted} contact(s)`)
          setSelectedContactIds(new Set())
          fetchContacts(searchQuery)
        } else {
          toastError('Failed to delete contacts', data.error || 'Unknown error occurred')
        }
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        toastError('Failed to delete contacts', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error deleting contacts:', error)
      toastError('Failed to delete contacts', 'Network error. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const activeFilterCount = filters.tags.length + filters.status.length + (filters.dateRange.start ? 1 : 0) + (filters.dateRange.end ? 1 : 0)

  return (
    <ErrorBoundary context="contacts">
      <ContactsLayout
        contacts={contacts}
        loading={loading}
        searchQuery={searchQuery}
        selectedContactIds={selectedContactIds}
        bulkDeleting={bulkDeleting}
        stats={stats}
        onSearchChange={setSearchQuery}
        onToggleContactSelection={handleToggleContactSelection}
        onSelectAllContacts={handleSelectAllContacts}
        onBulkDelete={handleBulkDelete}
        onViewContact={handleViewContact}
        onMessageContact={handleMessageContact}
        onAddContact={handleAddContact}
        onEditContact={handleEditContact}
        onOpenFilters={() => setFilterDialogOpen(true)}
        activeFilterCount={activeFilterCount}
      >
        {/* Contact Detail Modal */}
        <ContactDetailModal
          open={detailModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeModal()
            } else {
              if (selectedContactId) {
                openModal(selectedContactId)
              }
            }
          }}
          contactId={selectedContactId}
        />

        {/* Add Contact Dialog */}
        <AddContactDialog
          open={addContactDialogOpen}
          onOpenChange={setAddContactDialogOpen}
          onSuccess={handleContactAdded}
        />

        {/* Filter Dialog */}
        <ContactsFilterDialog
          open={filterDialogOpen}
          onOpenChange={setFilterDialogOpen}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters)
            fetchContacts(searchQuery)
          }}
        />
      </ContactsLayout>
    </ErrorBoundary>
  )
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between border-b border-ops-border px-4 py-3 bg-ops-surface">
          <div>
            <div className="h-5 bg-ops-surfaceSoft rounded animate-pulse w-16 mb-1" />
            <div className="h-3 bg-ops-surfaceSoft rounded animate-pulse w-48" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden px-4 py-4">
          <div className="flex-1 bg-ops-surface rounded-lg border border-ops-border shadow-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-ops-surfaceSoft border border-ops-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-ops-bg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-ops-bg rounded animate-pulse" />
                      <div className="h-3 w-24 bg-ops-bg rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-ops-bg rounded animate-pulse mb-2" />
                  <div className="h-8 w-full bg-ops-bg rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-80 ml-4 border border-ops-border bg-ops-surfaceSoft rounded-lg shadow-card" />
        </div>
      </div>
    }>
      <ContactsPageContent />
    </Suspense>
  )
}
