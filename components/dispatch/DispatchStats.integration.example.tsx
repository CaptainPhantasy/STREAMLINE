/**
 * Integration Example: How to use DispatchStats component in the dispatch map page
 *
 * This example shows how to integrate the DispatchStats component into the
 * dispatch map dashboard page.
 */

'use client'

import { useState, useEffect } from 'react'
import DispatchStats from '@/components/dispatch/DispatchStats'
import type { TechLocation, JobLocation } from '@/types/dispatch'

/**
 * Example: Dispatch Map Page with Statistics Dashboard
 */
export default function DispatchMapPageExample() {
  const [techs, setTechs] = useState<TechLocation[]>([])
  const [jobs, setJobs] = useState<JobLocation[]>([])
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  // Fetch techs and jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techsRes, jobsRes] = await Promise.all([
          fetch('/api/dispatch/techs'),
          fetch('/api/dispatch/jobs/active'),
        ])

        if (techsRes.ok) {
          const techsData = await techsRes.json()
          setTechs(techsData.techs || [])
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          setJobs(jobsData.jobs || [])
        }
      } catch (error) {
        console.error('Failed to fetch dispatch data:', error)
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <h1 className="text-2xl font-bold">Dispatch Map Dashboard</h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Statistics Dashboard - Collapsible */}
        <DispatchStats
          techs={techs}
          jobs={jobs}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Map Component Below */}
        <div className="h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg">
          {/* Your map component here */}
          <p className="text-center pt-32 text-gray-500">
            Map component would be rendered here
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Integration Notes:
 *
 * 1. The DispatchStats component is positioned ABOVE the map
 * 2. It's collapsible to save screen space when viewing the map
 * 3. The timeRange state is shared with parent for coordination
 * 4. The component fetches its own stats data via API
 * 5. techs and jobs props are passed but not currently used
 *    (could be used for real-time updates in future)
 *
 * Layout Structure:
 * ├── Header (fixed)
 * ├── Content Area (scrollable)
 *     ├── DispatchStats (collapsible)
 *     └── Map (main view)
 *
 * Responsive Behavior:
 * - Mobile: KPIs stack vertically (1 column)
 * - Tablet: KPIs in 2 columns, Charts in 1 column
 * - Desktop: KPIs in 4 columns, Charts in 2 columns
 *
 * Features:
 * ✅ Auto-refresh stats every 5 minutes
 * ✅ Time range selector (Today, Week, Month)
 * ✅ Export to PDF/CSV
 * ✅ Loading skeletons
 * ✅ Error handling with retry
 * ✅ Collapse/expand toggle
 * ✅ Dark mode support
 */
