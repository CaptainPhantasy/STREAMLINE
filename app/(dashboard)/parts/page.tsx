'use client'

import { useState } from 'react'
import { PartsListView } from '@/components/parts/PartsListView'
import { PartsManagerDialog } from '@/components/parts/PartsManagerDialog'
import type { Part } from '@/lib/types/parts'

export default function PartsPage() {
  const [showManager, setShowManager] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | undefined>(undefined)

  const handleEditPart = (part: Part) => {
    setSelectedPart(part)
    setShowManager(true)
  }

  const handleCreateNew = () => {
    setSelectedPart(undefined)
    setShowManager(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PartsListView 
        onCreateNew={handleCreateNew} 
        onSelectPart={handleEditPart}
      />
      <PartsManagerDialog
        open={showManager}
        onOpenChange={(open) => {
          setShowManager(open)
          if (!open) setSelectedPart(undefined)
        }}
        part={selectedPart}
        onSave={() => {
          setShowManager(false)
          setSelectedPart(undefined)
        }}
      />
    </div>
  )
}