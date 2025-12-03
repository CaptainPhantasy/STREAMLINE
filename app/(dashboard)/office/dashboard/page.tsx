'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Office/Dispatcher Dashboard Page
 *
 * Redirects office/dispatcher users to the dispatch map,
 * which is their primary workspace for managing tech assignments
 * and real-time GPS tracking.
 */
export default function OfficeDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dispatch map (primary workspace for dispatcher role)
    router.push('/dispatch/map')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B79FF] mx-auto mb-4"></div>
        <p className="text-neutral-600">Redirecting to Dispatch Map...</p>
      </div>
    </div>
  )
}
