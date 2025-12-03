/**
 * Onboarding Components Barrel Export
 *
 * Centralized exports for all onboarding components.
 */

export { OnboardingWizard } from './OnboardingWizard'
export { OnboardingStep } from './OnboardingStep'
export { OnboardingProgress } from './OnboardingProgress'
export { OnboardingTooltip, OnboardingTooltipManager } from './OnboardingTooltip'
export { OnboardingChecklist } from './OnboardingChecklist'

// Re-export types
export type { OnboardingWizardProps } from '@/lib/types/onboarding'
export type { OnboardingStepConfig, OnboardingStepProps } from '@/lib/types/onboarding'
export type { OnboardingProgressProps } from '@/lib/types/onboarding'
export type { OnboardingTooltipProps, OnboardingTooltipConfig } from '@/lib/types/onboarding'
export type { OnboardingChecklistProps, OnboardingChecklistItem } from '@/lib/types/onboarding'
