'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Contact = {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [message, setMessage] = useState('Loading contacts…')

  useEffect(() => {
    fetch('/api/contacts')
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Unable to load contacts')
        setContacts(body.contacts)
        setMessage(body.contacts.length ? '' : 'No contacts yet.')
      })
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load contacts'))
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-sky-400 hover:underline">Back to STREAMLINE</Link>
          <h1 className="mt-4 text-3xl font-bold">Contacts</h1>
        </div>
        <Button asChild><Link href="/contacts/new">Add contact</Link></Button>
      </div>
      {message ? <p className="mt-10 text-slate-300">{message}</p> : (
        <div className="mt-10 overflow-hidden rounded-xl border border-slate-700">
          {contacts.map(contact => (
            <article key={contact.id} className="border-b border-slate-800 bg-slate-900/80 p-5 last:border-0">
              <h2 className="font-semibold">{contact.first_name} {contact.last_name}</h2>
              <p className="mt-1 text-sm text-slate-400">{contact.email}{contact.phone ? ` · ${contact.phone}` : ''}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
