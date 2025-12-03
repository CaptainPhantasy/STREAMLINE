'use client'

import { useEffect, useState } from 'react'
import { gpsTracker } from '@/lib/gps/tracker'
import { usePermissions } from '@/lib/hooks/usePermissions'

export function useGpsTracking() {
    const { user: authUser } = usePermissions()
    const [isTracking, setIsTracking] = useState(false)

    useEffect(() => {
        if (!authUser || authUser.role !== 'tech') return

        let mounted = true

        const checkActiveJob = async () => {
            try {
                // Fetch tech's jobs to find active one
                const res = await fetch('/api/tech/jobs')
                if (!res.ok) return

                const data = await res.json()
                const activeJob = data.jobs?.find((j: any) =>
                    j.status === 'in_progress' || j.status === 'en_route'
                )

                if (mounted) {
                    if (activeJob) {
                        if (!gpsTracker.isCurrentlyTracking() || gpsTracker.getCurrentJobId() !== activeJob.id) {
                            console.log('📍 Starting GPS tracking for job:', activeJob.id)
                            gpsTracker.startTracking(activeJob.id)
                            setIsTracking(true)
                        }
                    } else {
                        if (gpsTracker.isCurrentlyTracking()) {
                            console.log('📍 Stopping GPS tracking (no active job)')
                            gpsTracker.stopTracking()
                            setIsTracking(false)
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking active job for GPS:', error)
            }
        }

        // Check immediately and then every minute
        checkActiveJob()
        const interval = setInterval(checkActiveJob, 60000)

        return () => {
            mounted = false
            clearInterval(interval)
            // Optional: Stop tracking on unmount? 
            // Probably better to keep tracking if navigating within the app, 
            // but stop if leaving the tech section.
            // Since this hook will be in Layout, unmount means leaving the app/section.
            gpsTracker.stopTracking()
        }
    }, [authUser])

    return { isTracking }
}
