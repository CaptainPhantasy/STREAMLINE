/**
 * OnboardingProgress Component
 *
 * Visual progress indicator for onboarding wizard.
 * Supports multiple display variants: steps, dots, progress-bar.
 */

'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { OnboardingProgressProps } from '@/lib/types/onboarding'

/**
 * OnboardingProgress - Display onboarding progress indicator
 *
 * @description
 * Shows user's progress through onboarding steps with visual indicators.
 * Supports three variants: step numbers, dots, or progress bar.
 *
 * @example
 * ```tsx
 * <OnboardingProgress
 *   currentStep={2}
 *   totalSteps={5}
 *   steps={steps}
 *   completedSteps={['step-1', 'step-2']}
 *   variant="steps"
 * />
 * ```
 */
export function OnboardingProgress({
  currentStep,
  totalSteps,
  steps,
  completedSteps = [],
  variant = 'steps',
  className,
}: OnboardingProgressProps) {
  if (variant === 'progress-bar') {
    return (
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        className={className}
      />
    )
  }

  if (variant === 'dots') {
    return (
      <Dots
        currentStep={currentStep}
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        steps={steps}
        className={className}
      />
    )
  }

  return (
    <Steps
      currentStep={currentStep}
      totalSteps={totalSteps}
      completedSteps={completedSteps}
      steps={steps}
      className={className}
    />
  )
}

/**
 * Progress Bar Variant
 */
function ProgressBar({
  currentStep,
  totalSteps,
  className,
}: {
  currentStep: number
  totalSteps: number
  className?: string
}) {
  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Progress</span>
        <span className="text-muted-foreground">
          {currentStep} of {totalSteps} complete
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Dots Variant
 */
function Dots({
  currentStep,
  totalSteps,
  completedSteps,
  steps,
  className,
}: {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  steps: any[]
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = steps[index]
        const isCompleted = step && completedSteps.includes(step.id)
        const isCurrent = index === currentStep

        return (
          <div
            key={index}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all duration-200',
              isCurrent && 'h-3 w-3 bg-primary',
              isCompleted && !isCurrent && 'bg-primary/60',
              !isCompleted && !isCurrent && 'bg-secondary'
            )}
            title={step?.title}
          />
        )
      })}
    </div>
  )
}

/**
 * Steps Variant (Default)
 */
function Steps({
  currentStep,
  totalSteps,
  completedSteps,
  steps,
  className,
}: {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  steps: any[]
  className?: string
}) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = index === currentStep
          const isLast = index === totalSteps - 1

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-200',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground',
                    isCompleted &&
                      !isCurrent &&
                      'border-primary bg-primary text-primary-foreground',
                    !isCompleted &&
                      !isCurrent &&
                      'border-secondary bg-secondary text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>

                {/* Step Label (hidden on mobile) */}
                <div className="mt-2 hidden text-center sm:block">
                  <div
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isCurrent && 'text-primary',
                      !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="mx-2 h-0.5 flex-1 bg-secondary">
                  <div
                    className={cn(
                      'h-full bg-primary transition-all duration-300',
                      isCompleted ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current Step Label (mobile) */}
      <div className="mt-4 text-center sm:hidden">
        <div className="text-sm font-medium text-primary">
          {steps[currentStep]?.title}
        </div>
        <div className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>
    </div>
  )
}

// Export types
export type { OnboardingProgressProps }
