/**
 * OnboardingTooltip Component
 *
 * Interactive tooltip for highlighting UI features during onboarding.
 * Points to specific elements and explains their functionality.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'
import type { OnboardingTooltipProps } from '@/lib/types/onboarding'

/**
 * OnboardingTooltip - Feature highlighting tooltip
 *
 * @description
 * Highlights a UI element and displays an explanatory tooltip.
 * Can be chained together for sequential feature tours.
 *
 * @example
 * ```tsx
 * <OnboardingTooltip
 *   config={{
 *     id: 'dispatch-map',
 *     target: '#dispatch-map-button',
 *     title: 'Dispatch Map',
 *     content: 'View real-time technician locations and assign jobs.',
 *     position: 'bottom'
 *   }}
 *   visible={true}
 *   onNext={handleNext}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function OnboardingTooltip({
  config,
  onNext,
  onDismiss,
  visible,
  className,
}: OnboardingTooltipProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [overlayVisible, setOverlayVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) {
      setOverlayVisible(false)
      return
    }

    // Find target element
    const element = document.querySelector(config.target) as HTMLElement
    if (!element) {
      console.warn(`Onboarding tooltip target not found: ${config.target}`)
      return
    }

    setTargetElement(element)
    setOverlayVisible(true)

    // Calculate tooltip position
    const calculatePosition = () => {
      const rect = element.getBoundingClientRect()
      const tooltipRect = tooltipRef.current?.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (config.position || 'bottom') {
        case 'top':
          top = rect.top - (tooltipRect?.height || 0) - 16
          left = rect.left + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 16
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - (tooltipRect?.width || 0) - 16
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 16
          break
      }

      setTooltipPosition({ top, left })
    }

    calculatePosition()

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition)
    return () => window.removeEventListener('resize', calculatePosition)
  }, [visible, config.target, config.position])

  if (!visible || !targetElement) {
    return null
  }

  const targetRect = targetElement.getBoundingClientRect()

  return createPortal(
    <>
      {/* Overlay */}
      {overlayVisible && (
        <div className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300">
          {/* Highlighted area cutout */}
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <mask id="onboarding-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              mask="url(#onboarding-mask)"
              fill="rgba(0, 0, 0, 0.6)"
            />
          </svg>

          {/* Highlight border */}
          <div
            className="absolute rounded-lg border-2 border-primary shadow-lg"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </div>
      )}

      {/* Tooltip Card */}
      <Card
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] w-80 p-4 shadow-xl',
          config.position === 'top' && '-translate-x-1/2',
          config.position === 'bottom' && '-translate-x-1/2',
          config.position === 'left' && '-translate-y-1/2',
          config.position === 'right' && '-translate-y-1/2',
          className
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold">{config.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="mb-4 text-sm text-muted-foreground">{config.content}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {config.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={config.action.onClick}
            >
              {config.action.label}
            </Button>
          )}

          <Button
            size="sm"
            onClick={onNext}
            className={cn(!config.action && 'ml-auto')}
          >
            {config.nextTooltip ? 'Next' : 'Got it'}
          </Button>
        </div>

        {/* Arrow pointer */}
        <div
          className={cn(
            'absolute h-0 w-0 border-8 border-transparent',
            config.position === 'top' &&
              'left-1/2 top-full -translate-x-1/2 border-t-card',
            config.position === 'bottom' &&
              'bottom-full left-1/2 -translate-x-1/2 border-b-card',
            config.position === 'left' &&
              'left-full top-1/2 -translate-y-1/2 border-l-card',
            config.position === 'right' &&
              'right-full top-1/2 -translate-y-1/2 border-r-card'
          )}
        />
      </Card>
    </>,
    document.body
  )
}

/**
 * OnboardingTooltipManager - Manage sequence of tooltips
 *
 * @description
 * Manages a sequence of onboarding tooltips, showing them one at a time.
 *
 * @example
 * ```tsx
 * const tooltips = [
 *   { id: '1', target: '#button1', title: 'Button 1', content: '...' },
 *   { id: '2', target: '#button2', title: 'Button 2', content: '...' }
 * ]
 *
 * <OnboardingTooltipManager
 *   tooltips={tooltips}
 *   onComplete={handleComplete}
 * />
 * ```
 */
export function OnboardingTooltipManager({
  tooltips,
  onComplete,
  autoStart = true,
}: {
  tooltips: any[]
  onComplete: () => void
  autoStart?: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(autoStart ? 0 : -1)
  const [visible, setVisible] = useState(autoStart)

  const currentTooltip = tooltips[currentIndex]

  const handleNext = () => {
    if (currentIndex < tooltips.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setVisible(false)
      onComplete()
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    onComplete()
  }

  if (!currentTooltip || !visible) {
    return null
  }

  return (
    <OnboardingTooltip
      config={currentTooltip}
      visible={visible}
      onNext={handleNext}
      onDismiss={handleDismiss}
    />
  )
}

// Export types
export type { OnboardingTooltipProps }
