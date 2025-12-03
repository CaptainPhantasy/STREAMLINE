'use client'

import { useState, useCallback } from 'react'
import type { InboxFilters } from '@/components/inbox/InboxFilters'

export interface SavedFilterPreset {
  id: string
  name: string
  filters: InboxFilters
}

export function useInboxFilters() {
  const [filters, setFilters] = useState<InboxFilters>({})
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([])

  const updateFilters = useCallback((newFilters: InboxFilters) => {
    setFilters(newFilters)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  const savePreset = useCallback((name: string) => {
    const preset: SavedFilterPreset = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
    }
    setSavedPresets((prev) => [...prev, preset])
    
    // Save to localStorage
    const stored = localStorage.getItem('inbox_filter_presets')
    const presets = stored ? JSON.parse(stored) : []
    presets.push(preset)
    localStorage.setItem('inbox_filter_presets', JSON.stringify(presets))
  }, [filters])

  const loadPreset = useCallback((presetId: string) => {
    const preset = savedPresets.find(p => p.id === presetId)
    if (preset) {
      setFilters(preset.filters)
    }
  }, [savedPresets])

  const deletePreset = useCallback((presetId: string) => {
    setSavedPresets((prev) => prev.filter(p => p.id !== presetId))
    
    // Update localStorage
    const stored = localStorage.getItem('inbox_filter_presets')
    const presets = stored ? JSON.parse(stored) : []
    const updated = presets.filter((p: SavedFilterPreset) => p.id !== presetId)
    localStorage.setItem('inbox_filter_presets', JSON.stringify(updated))
  }, [])

  // Load presets from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem('inbox_filter_presets')
    if (stored) {
      try {
        const presets = JSON.parse(stored)
        setSavedPresets(presets)
      } catch (error) {
        console.error('Error loading filter presets:', error)
      }
    }
  })

  return {
    filters,
    updateFilters,
    resetFilters,
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
  }
}

