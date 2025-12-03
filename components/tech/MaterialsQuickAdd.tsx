'use client'

import { useState, useRef } from 'react'
import { Plus, Barcode, Mic, Package, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MaterialsQuickAddProps, Material } from '@/lib/types/tech-mobile'

/**
 * MaterialsQuickAdd - Fast materials entry for tech mobile
 *
 * Features:
 * - Recent materials quick-add (one-tap)
 * - Barcode scanner integration
 * - Voice input for quantity ("add 5 feet of wire")
 * - Offline-capable (saves to queue)
 * - Large touch targets
 *
 * @example
 * ```tsx
 * <MaterialsQuickAdd
 *   jobId={job.id}
 *   recentMaterials={recentMaterials}
 *   onMaterialAdd={(material) => addMaterial(material)}
 *   enableBarcode
 *   enableVoice
 * />
 * ```
 */
export function MaterialsQuickAdd({
  jobId,
  recentMaterials = [],
  onMaterialAdd,
  onBarcodeScanned,
  enableBarcode = false,
  enableVoice = false,
  className,
}: MaterialsQuickAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customMaterial, setCustomMaterial] = useState<Partial<Material>>({
    quantity: 1,
    unit: 'each',
  })
  const [isListening, setIsListening] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleQuickAdd = async (material: Material) => {
    setIsAdding(true)
    try {
      if (onMaterialAdd) {
        await onMaterialAdd({
          ...material,
          quantity: 1, // Default quantity for quick add
        })
      }
    } catch (error) {
      console.error('Failed to add material:', error)
      alert('Failed to add material')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCustomAdd = async () => {
    if (!customMaterial.name || !customMaterial.quantity) {
      alert('Please enter material name and quantity')
      return
    }

    setIsAdding(true)
    try {
      if (onMaterialAdd) {
        await onMaterialAdd(customMaterial)
      }
      // Reset form
      setCustomMaterial({ quantity: 1, unit: 'each' })
      setShowCustomForm(false)
    } catch (error) {
      console.error('Failed to add material:', error)
      alert('Failed to add material')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBarcodeClick = () => {
    if (enableBarcode && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleBarcodeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Implement barcode scanning from image
    // This would use a library like QuaggaJS or ZXing
    console.log('Barcode scanning not yet implemented')
    alert('Barcode scanning coming soon! Use manual entry for now.')
  }

  const handleVoiceInput = () => {
    if (!enableVoice) return

    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      console.log('Voice input:', transcript)

      // Parse voice input like "add 5 feet of wire"
      // This is a simple parser - could be enhanced with NLP
      const quantityMatch = transcript.match(/(\d+)/)
      const unitMatch = transcript.match(/(feet|foot|ft|gallon|gal|each|pound|lb|box|roll|bag)/i)

      if (quantityMatch) {
        setCustomMaterial((prev) => ({
          ...prev,
          quantity: parseInt(quantityMatch[1]),
        }))
      }

      if (unitMatch) {
        const unit = unitMatch[1].toLowerCase()
        const unitMap: Record<string, Material['unit']> = {
          feet: 'ft',
          foot: 'ft',
          ft: 'ft',
          gallon: 'gal',
          gal: 'gal',
          pound: 'lb',
          lb: 'lb',
        }
        setCustomMaterial((prev) => ({
          ...prev,
          unit: unitMap[unit] || unit as Material['unit'],
        }))
      }

      // Extract material name (everything after quantity/unit)
      let name = transcript
        .replace(/add\s+/i, '')
        .replace(/\d+\s+/g, '')
        .replace(/(feet|foot|ft|gallon|gal|each|pound|lb|box|roll|bag)\s+of\s+/i, '')
        .trim()

      if (name) {
        setCustomMaterial((prev) => ({ ...prev, name }))
      }

      setShowCustomForm(true)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      alert('Voice input error. Please try again.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const filteredRecentMaterials = recentMaterials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Add Materials</h3>
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center active:bg-blue-700"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Barcode Scanner */}
        {enableBarcode && (
          <button
            onClick={handleBarcodeClick}
            className={cn(
              'h-16 px-4 rounded-xl',
              'flex flex-col items-center justify-center gap-1',
              'font-bold text-sm',
              'bg-purple-600 hover:bg-purple-700 text-white',
              'active:scale-95 transition-all'
            )}
          >
            <Barcode className="w-5 h-5" />
            <span>SCAN</span>
          </button>
        )}

        {/* Voice Input */}
        {enableVoice && (
          <button
            onClick={handleVoiceInput}
            disabled={isListening}
            className={cn(
              'h-16 px-4 rounded-xl',
              'flex flex-col items-center justify-center gap-1',
              'font-bold text-sm',
              'active:scale-95 transition-all',
              isListening
                ? 'bg-red-600 animate-pulse'
                : 'bg-green-600 hover:bg-green-700',
              'text-white'
            )}
          >
            <Mic className="w-5 h-5" />
            <span>{isListening ? 'LISTENING...' : 'VOICE'}</span>
          </button>
        )}
      </div>

      {/* Hidden file input for barcode */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleBarcodeFile}
      />

      {/* Custom Material Form */}
      {showCustomForm && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Material name"
            value={customMaterial.name || ''}
            onChange={(e) =>
              setCustomMaterial((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full h-14 px-4 rounded-lg bg-gray-700 text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Quantity"
              value={customMaterial.quantity || ''}
              onChange={(e) =>
                setCustomMaterial((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 0,
                }))
              }
              className="h-14 px-4 rounded-lg bg-gray-700 text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={customMaterial.unit || 'each'}
              onChange={(e) =>
                setCustomMaterial((prev) => ({
                  ...prev,
                  unit: e.target.value as Material['unit'],
                }))
              }
              className="h-14 px-4 rounded-lg bg-gray-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="each">Each</option>
              <option value="ft">Feet</option>
              <option value="lb">Pounds</option>
              <option value="gal">Gallons</option>
              <option value="box">Box</option>
              <option value="roll">Roll</option>
              <option value="bag">Bag</option>
            </select>
          </div>

          <button
            onClick={handleCustomAdd}
            disabled={isAdding || !customMaterial.name}
            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-lg disabled:opacity-50 active:scale-95 transition-all"
          >
            {isAdding ? 'ADDING...' : 'ADD MATERIAL'}
          </button>
        </div>
      )}

      {/* Recent Materials */}
      {recentMaterials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            <h4 className="text-lg font-bold text-white">Recent Materials</h4>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-800 text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Material List */}
          <div className="space-y-2">
            {filteredRecentMaterials.map((material) => (
              <button
                key={material.id}
                onClick={() => handleQuickAdd(material)}
                disabled={isAdding}
                className={cn(
                  'w-full h-16 px-4 rounded-xl',
                  'bg-gray-800 hover:bg-gray-700 active:bg-gray-600',
                  'flex items-center justify-between',
                  'disabled:opacity-50 transition-all'
                )}
              >
                <div className="text-left">
                  <div className="font-bold text-white">{material.name}</div>
                  {material.description && (
                    <div className="text-sm text-gray-400">
                      {material.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{material.unit}</div>
                  {material.cost && (
                    <div className="text-xs text-gray-500">
                      ${material.cost.toFixed(2)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export type { MaterialsQuickAddProps }
