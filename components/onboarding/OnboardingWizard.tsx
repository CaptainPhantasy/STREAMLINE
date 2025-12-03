/**
 * OnboardingWizard Component
 *
 * Main onboarding wizard with multi-step flow, progress tracking,
 * and confetti celebration on completion.
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { OnboardingProgress } from './OnboardingProgress'
import { OnboardingStep } from './OnboardingStep'
import { useOnboarding } from '@/lib/hooks/use-onboarding'
import { trackOnboardingEvent } from '@/lib/api/onboarding'
import { getOnboardingFlowForRole } from '@/lib/config/onboarding-flows'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/lib/hooks/use-window-size'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { OnboardingWizardProps } from '@/lib/types/onboarding'

/**
 * OnboardingWizard - Multi-step onboarding wizard
 *
 * @description
 * Guides users through role-specific onboarding flows with progress tracking,
 * step validation, and completion celebration.
 *
 * @example
 * ```tsx
 * <OnboardingWizard
 *   role="owner"
 *   userId={user.id}
 *   onComplete={() => navigate('/dashboard')}
 *   progressIndicator="steps"
 * />
 * ```
 */
export function OnboardingWizard({
  role,
  userId,
  onComplete: onCompleteCallback,
  onDismiss: onDismissCallback,
  onExit: onExitCallback,
  customSteps,
  progressIndicator = 'steps',
  allowSkip = true,
  allowExit = true,
  showConfetti = true,
  className,
}: OnboardingWizardProps) {
  const { width, height } = useWindowSize()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepData, setStepData] = useState<Record<string, any>>({})
  const [showCompletionConfetti, setShowCompletionConfetti] = useState(false)

  // Get onboarding flow for role
  const flow = customSteps
    ? { role, steps: customSteps }
    : getOnboardingFlowForRole(role)

  // Use onboarding hook
  const {
    status,
    loading,
    error,
    updateStatus,
    completeOnboarding,
    dismissOnboarding,
  } = useOnboarding({
    userId,
    enabled: true,
    onComplete: onCompleteCallback,
    onDismiss: onDismissCallback,
  })

  // Restore current step from status
  useEffect(() => {
    if (status && status.current_step !== undefined) {
      setCurrentStepIndex(status.current_step)
    }
  }, [status])

  const currentStep = flow.steps[currentStepIndex]
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === flow.steps.length - 1

  /**
   * Handle next step
   */
  const handleNext = async () => {
    const nextIndex = currentStepIndex + 1

    // Mark current step as completed
    const completedSteps = [...(status?.steps_completed || []), currentStep.id]

    // Update status in database
    await updateStatus({
      current_step: nextIndex,
      steps_completed: completedSteps,
    })

    if (isLast) {
      // Complete onboarding
      await completeOnboarding()

      // Show confetti
      if (showConfetti) {
        setShowCompletionConfetti(true)
        setTimeout(() => setShowCompletionConfetti(false), 5000)
      }

      // Track completion event
      await trackOnboardingEvent({
        event: 'onboarding_completed',
        userId,
        role,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Move to next step
      setCurrentStepIndex(nextIndex)
    }
  }

  /**
   * Handle previous step
   */
  const handlePrevious = async () => {
    const prevIndex = Math.max(0, currentStepIndex - 1)
    setCurrentStepIndex(prevIndex)

    // Update status
    await updateStatus({
      current_step: prevIndex,
    })
  }

  /**
   * Handle skip step
   */
  const handleSkip = async () => {
    if (!allowSkip) return
    await handleNext()
  }

  /**
   * Handle exit onboarding
   */
  const handleExit = async () => {
    if (!allowExit) return

    // Save current progress
    await updateStatus({
      current_step: currentStepIndex,
    })

    // Track exit event
    await trackOnboardingEvent({
      event: 'onboarding_exited',
      userId,
      role,
      stepNumber: currentStepIndex,
      timestamp: new Date().toISOString(),
    })

    onExitCallback?.()
  }

  /**
   * Handle dismiss onboarding
   */
  const handleDismiss = async () => {
    await dismissOnboarding()

    // Track dismiss event
    await trackOnboardingEvent({
      event: 'onboarding_dismissed',
      userId,
      role,
      timestamp: new Date().toISOString(),
    })
  }

  // Loading state
  if (loading && !status) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load onboarding: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      {/* Confetti on completion */}
      {showCompletionConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Wizard Container */}
      <div className={cn('flex min-h-screen items-center justify-center bg-background p-4', className)}>
        <Card className="w-full max-w-4xl p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <OnboardingProgress
              currentStep={currentStepIndex}
              totalSteps={flow.steps.length}
              steps={flow.steps}
              completedSteps={status?.steps_completed || []}
              variant={progressIndicator}
            />
          </div>

          {/* Current Step */}
          <OnboardingStep
            config={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onExit={allowExit ? handleExit : undefined}
            isFirst={isFirst}
            isLast={isLast}
            stepData={stepData}
            setStepData={setStepData}
          />
        </Card>
      </div>
    </>
  )
}

// Export types
export type { OnboardingWizardProps }
