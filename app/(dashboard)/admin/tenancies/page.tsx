'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreateTenancyDialog } from '@/components/admin/create-tenancy-dialog'
import { Button } from '@/components/ui/button'

export default function TenanciesPage() {
  const [open, setOpen] = useState(false)

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <Link href="/" className="text-sm text-sky-400 hover:underline">Back to STREAMLINE</Link>
      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/80 p-8">
        <h1 className="text-3xl font-bold">Tenant provisioning</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Create an account and its first owner. The server verifies a super-admin session before using the service-role client.
        </p>
        <Button className="mt-8" onClick={() => setOpen(true)}>Create tenant</Button>
      </div>
      <CreateTenancyDialog open={open} onOpenChange={setOpen} />
    </main>
  )
}
