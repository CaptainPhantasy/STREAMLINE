/**
 * Onboarding System Type Definitions
 *
 * Reusable type definitions for the onboarding wizard system.
 * Can be extracted to other projects with different onboarding flows.
 */

/**
 * User role types
 */
export type UserRole = 'owner' | 'admin' | 'dispatcher' | 'tech' | 'sales'

/**
 * Onboarding step configuration
 */
export interface OnboardingStepConfig {
  id: string
  title: string
  description: string
  component?: React.ComponentType<OnboardingStepProps>
  content?: React.ReactNode
  validation?: () => Promise<boolean> | boolean
  skippable?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Props passed to each onboarding step component
 */
export interface OnboardingStepProps {
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onComplete: () => void
  isFirst: boolean
  isLast: boolean
  stepData?: Record<string, any>
  setStepData?: (data: Record<string, any>) => void
}

/**
 * Onboarding flow configuration
 */
export interface OnboardingFlowConfig {
  role: UserRole
  steps: OnboardingStepConfig[]
  completionMessage?: string
  completionAction?: () => void
}

/**
 * User onboarding status (database record)
 */
export interface UserOnboardingStatus {
  id: string
  user_id: string
  role: UserRole
  current_step: number
  steps_completed: string[]
  completed_at: string | null
  dismissed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Onboarding wizard configuration props
 */
export interface OnboardingWizardProps {
  role: UserRole
  userId: string
  onComplete?: () => void
  onDismiss?: () => void
  onExit?: () => void
  customSteps?: OnboardingStepConfig[]
  progressIndicator?: 'steps' | 'dots' | 'progress-bar'
  allowSkip?: boolean
  allowExit?: boolean
  showConfetti?: boolean
  className?: string
}

/**
 * Onboarding progress indicator props
 */
export interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  steps: OnboardingStepConfig[]
  completedSteps: string[]
  variant?: 'steps' | 'dots' | 'progress-bar'
  className?: string
}

/**
 * Onboarding checklist item
 */
export interface OnboardingChecklistItem {
  id: string
  title: string
  description?: string
  completed: boolean
  link?: string
  action?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Onboarding checklist props
 */
export interface OnboardingChecklistProps {
  items: OnboardingChecklistItem[]
  onItemComplete: (itemId: string) => void
  onDismiss?: () => void
  showProgress?: boolean
  className?: string
}

/**
 * Onboarding tooltip configuration
 */
export interface OnboardingTooltipConfig {
  id: string
  target: string // CSS selector for element to highlight
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
  nextTooltip?: string // ID of next tooltip
}

/**
 * Onboarding tooltip props
 */
export interface OnboardingTooltipProps {
  config: OnboardingTooltipConfig
  onNext: () => void
  onDismiss: () => void
  visible: boolean
  className?: string
}

/**
 * API request/response types
 */

export interface GetOnboardingStatusParams {
  userId: string
}

export interface GetOnboardingStatusResponse {
  status: UserOnboardingStatus | null
  error?: string
}

export interface UpdateOnboardingStatusParams {
  userId: string
  currentStep?: number
  stepsCompleted?: string[]
}

export interface UpdateOnboardingStatusResponse {
  status: UserOnboardingStatus
  error?: string
}

export interface CompleteOnboardingParams {
  userId: string
}

export interface CompleteOnboardingResponse {
  success: boolean
  error?: string
}

export interface DismissOnboardingParams {
  userId: string
}

export interface DismissOnboardingResponse {
  success: boolean
  error?: string
}

export interface RestartOnboardingParams {
  userId: string
}

export interface RestartOnboardingResponse {
  success: boolean
  error?: string
}

/**
 * Hook return types
 */

export interface UseOnboardingReturn {
  status: UserOnboardingStatus | null
  loading: boolean
  error: Error | null
  updateStatus: (updates: Partial<UserOnboardingStatus>) => Promise<void>
  completeOnboarding: () => Promise<void>
  dismissOnboarding: () => Promise<void>
  restartOnboarding: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Onboarding analytics event
 */
export interface OnboardingAnalyticsEvent {
  event: 'onboarding_started' | 'onboarding_step_completed' | 'onboarding_completed' | 'onboarding_dismissed' | 'onboarding_exited'
  userId: string
  role: UserRole
  step?: string
  stepNumber?: number
  timestamp: string
  metadata?: Record<string, any>
}
