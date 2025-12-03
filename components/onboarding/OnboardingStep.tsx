/**
 * OnboardingStep Component
 *
 * Individual step wrapper for onboarding wizard.
 * Handles validation before allowing progression.
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { OnboardingStepConfig, OnboardingStepProps } from '@/lib/types/onboarding'

/**
 * OnboardingStep - Individual step in onboarding wizard
 *
 * @description
 * Wraps step content with title, description, and navigation buttons.
 * Handles validation before allowing user to proceed to next step.
 *
 * @example
 * ```tsx
 * <OnboardingStep
 *   config={stepConfig}
 *   onNext={handleNext}
 *   onPrevious={handlePrevious}
 *   onSkip={handleSkip}
 *   isFirst={index === 0}
 *   isLast={index === steps.length - 1}
 * />
 * ```
 */
export function OnboardingStep({
  config,
  onNext,
  onPrevious,
  onSkip,
  onExit,
  isFirst,
  isLast,
  stepData,
  setStepData,
  className,
}: {
  config: OnboardingStepConfig
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onExit?: () => void
  isFirst: boolean
  isLast: boolean
  stepData?: Record<string, any>
  setStepData?: (data: Record<string, any>) => void
  className?: string
}) {
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleNext = async () => {
    // Clear previous validation error
    setValidationError(null)

    // Run validation if provided
    if (config.validation) {
      setValidating(true)
      try {
        const isValid = await config.validation()
        if (!isValid) {
          setValidationError('Please complete this step before continuing.')
          setValidating(false)
          return
        }
      } catch (error: any) {
        setValidationError(error.message || 'Validation failed.')
        setValidating(false)
        return
      }
      setValidating(false)
    }

    onNext()
  }

  const Icon = config.icon

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {config.title}
            </h2>
            {config.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {config.description}
              </p>
            )}
          </div>
        </div>

        {onExit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Exit onboarding</span>
          </Button>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {validationError}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {config.component ? (
          <config.component
            onNext={handleNext}
            onPrevious={onPrevious}
            onSkip={onSkip}
            onComplete={onNext}
            isFirst={isFirst}
            isLast={isLast}
            stepData={stepData}
            setStepData={setStepData}
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {config.content}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={validating}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {config.skippable && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={validating}
            >
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={validating}
          >
            {isLast ? 'Complete' : 'Next'}
            {!isLast && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export types
export type { OnboardingStepConfig, OnboardingStepProps }
