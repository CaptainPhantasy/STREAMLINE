'use client'

/**
 * TalkingPointsList - Interactive checklist of AI-generated talking points
 *
 * Allows sales reps to track which topics they've covered during meetings.
 *
 * @example
 * ```tsx
 * <TalkingPointsList
 *   points={talkingPoints}
 *   onCheck={(id, checked) => console.log('Point checked:', id)}
 *   editable
 * />
 * ```
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Plus, GripVertical, Trash2 } from 'lucide-react'
import type { TalkingPoint, TalkingPointsListProps } from '@/lib/types/sales'

export function TalkingPointsList({
  points: initialPoints,
  onCheck,
  onAdd,
  onReorder,
  editable = false,
  className,
}: TalkingPointsListProps) {
  const [points, setPoints] = useState<TalkingPoint[]>(initialPoints)
  const [newPointText, setNewPointText] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleCheck = (pointId: string) => {
    const updatedPoints = points.map((p) =>
      p.id === pointId ? { ...p, checked: !p.checked } : p
    )
    setPoints(updatedPoints)
    const point = updatedPoints.find((p) => p.id === pointId)
    if (point) {
      onCheck?.(pointId, point.checked || false)
    }
  }

  const handleAdd = () => {
    if (!newPointText.trim()) return

    const newPoint: TalkingPoint = {
      id: `custom-${Date.now()}`,
      text: newPointText,
      priority: 'medium',
      category: 'follow_up',
      checked: false,
    }

    const updatedPoints = [...points, newPoint]
    setPoints(updatedPoints)
    onAdd?.(newPointText)
    setNewPointText('')
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPoints = [...points]
    const [draggedItem] = newPoints.splice(draggedIndex, 1)
    newPoints.splice(index, 0, draggedItem)

    setPoints(newPoints)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      onReorder?.(points)
    }
    setDraggedIndex(null)
  }

  const handleDelete = (pointId: string) => {
    const updatedPoints = points.filter((p) => p.id !== pointId)
    setPoints(updatedPoints)
    onReorder?.(updatedPoints)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50 bg-red-900/20'
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-900/10'
      case 'low':
        return 'border-gray-500/30 bg-gray-800/50'
      default:
        return 'border-gray-500/30 bg-gray-800/50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'relationship':
        return '👥'
      case 'technical':
        return '🔧'
      case 'pricing':
        return '💰'
      case 'follow_up':
        return '📅'
      default:
        return '•'
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {points.map((point, index) => (
        <div
          key={point.id}
          draggable={editable}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border transition-all',
            getPriorityColor(point.priority),
            point.checked && 'opacity-50',
            editable && 'cursor-move hover:shadow-lg'
          )}
        >
          {editable && (
            <div className="text-gray-500 pt-1">
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={() => handleCheck(point.id)}
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              point.checked
                ? 'bg-green-500 border-green-500'
                : 'border-gray-500 hover:border-green-400'
            )}
          >
            {point.checked && <Check className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{getCategoryIcon(point.category)}</span>
              <span className="text-xs text-gray-400 capitalize">{point.category}</span>
              {point.priority === 'high' && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  High Priority
                </span>
              )}
            </div>
            <p
              className={cn(
                'text-gray-200 text-sm',
                point.checked && 'line-through text-gray-500'
              )}
            >
              {point.text}
            </p>
          </div>

          {editable && point.id.startsWith('custom-') && (
            <button
              onClick={() => handleDelete(point.id)}
              className="text-gray-500 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPointText}
            onChange={(e) => setNewPointText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add custom talking point..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newPointText.trim()}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      )}
    </div>
  )
}

export default TalkingPointsList
