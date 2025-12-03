/**
 * Tech Mobile Components - Barrel Export
 * All mobile-optimized components for field technicians
 */

export { TechJobCard, TechJobCardSkeleton } from './TechJobCard'
export { JobPhotoGallery, PhotoGalleryThumbnail } from './JobPhotoGallery'
export { QuickJobActions, CompactJobActions } from './QuickJobActions'
export { MaterialsQuickAdd } from './MaterialsQuickAdd'
export { VoiceNoteRecorder } from './VoiceNoteRecorder'
export { TimeClockCard, CompactTimeClock } from './TimeClockCard'
export { OfflineQueueIndicator, CompactSyncStatus } from './OfflineQueueIndicator'
export { JobCompletionWizard } from './JobCompletionWizard'

// Export types
export type {
  TechJobCardProps,
  JobPhotoGalleryProps,
  QuickJobActionsProps,
  MaterialsQuickAddProps,
  VoiceNoteRecorderProps,
  TimeClockCardProps,
  OfflineQueueIndicatorProps,
  JobCompletionWizardProps,
} from '@/lib/types/tech-mobile'
