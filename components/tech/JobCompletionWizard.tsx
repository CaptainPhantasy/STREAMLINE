'use client'

import { useState, useRef } from 'react'
import { Camera, MessageSquare, Package, PenTool, CheckCircle, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import SignatureCanvas from 'react-signature-canvas'
import type { JobCompletionWizardProps, CompletionStep } from '@/lib/types/tech-mobile'

/**
 * JobCompletionWizard - Step-by-step job completion flow
 *
 * Features:
 * - 5-step guided completion process
 * - Progress indicator
 * - Photo capture at each step
 * - Material tracking
 * - Customer signature
 * - Offline-capable
 *
 * Steps:
 * 1. Add Photos
 * 2. Add Notes
 * 3. Materials Used
 * 4. Customer Signature
 * 5. Complete & Sync
 *
 * @example
 * ```tsx
 * <JobCompletionWizard
 *   jobId={job.id}
 *   job={job}
 *   onStepComplete={(stepId, data) => saveStep(stepId, data)}
 *   onWizardComplete={() => router.push('/m/tech/dashboard')}
 * />
 * ```
 */
export function JobCompletionWizard({
  jobId,
  job,
  steps: customSteps,
  onStepComplete,
  onWizardComplete,
  onCancel,
  className,
}: JobCompletionWizardProps) {
  const defaultSteps: CompletionStep[] = [
    {
      id: 'photos',
      title: 'Add Photos',
      description: 'Take before and after photos',
      required: true,
      completed: false,
    },
    {
      id: 'notes',
      title: 'Add Notes',
      description: 'Document work performed',
      required: false,
      completed: false,
    },
    {
      id: 'materials',
      title: 'Materials Used',
      description: 'Record materials and parts',
      required: false,
      completed: false,
    },
    {
      id: 'signature',
      title: 'Customer Signature',
      description: 'Get customer approval',
      required: true,
      completed: false,
    },
    {
      id: 'complete',
      title: 'Complete Job',
      description: 'Finalize and sync',
      required: true,
      completed: false,
    },
  ]

  const [steps, setSteps] = useState<CompletionStep[]>(customSteps || defaultSteps)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepData, setStepData] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const signatureRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentStep = steps[currentStepIndex]
  const completedCount = steps.filter((s) => s.completed).length
  const progress = (completedCount / steps.length) * 100

  const handleStepData = (stepId: string, data: any) => {
    setStepData((prev) => ({
      ...prev,
      [stepId]: data,
    }))
  }

  const handleStepComplete = async () => {
    setIsProcessing(true)
    try {
      if (onStepComplete) {
        await onStepComplete(currentStep.id, stepData[currentStep.id])
      }

      // Mark step as completed
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === currentStepIndex ? { ...step, completed: true } : step
        )
      )

      // Move to next step or complete wizard
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1)
      } else {
        // Wizard complete
        if (onWizardComplete) {
          await onWizardComplete()
        }
      }
    } catch (error) {
      console.error('Step completion failed:', error)
      alert('Failed to complete step. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipStep = () => {
    if (currentStep.required) {
      alert('This step is required and cannot be skipped.')
      return
    }

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const existingPhotos = stepData.photos?.photos || []
    const photoUrls = files.map((file) => URL.createObjectURL(file))

    handleStepData('photos', {
      photos: [...existingPhotos, ...photoUrls],
      files: [...(stepData.photos?.files || []), ...files],
    })
  }

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const captureSignature = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please provide a signature')
      return
    }

    const signatureDataUrl = signatureRef.current.toDataURL('image/png')
    handleStepData('signature', { signatureUrl: signatureDataUrl })
  }

  const canProceed = () => {
    switch (currentStep.id) {
      case 'photos':
        return stepData.photos?.photos?.length > 0
      case 'signature':
        return !!stepData.signature?.signatureUrl
      case 'complete':
        return true
      default:
        return true
    }
  }

  return (
    <div className={cn('min-h-screen bg-gray-900 flex flex-col', className)}>
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Job</h2>
            <p className="text-sm text-gray-400">
              {job.contact.firstName} {job.contact.lastName}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center active:bg-gray-600"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="font-bold text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(idx)}
              disabled={idx > currentStepIndex && !step.completed}
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                'transition-colors disabled:opacity-50',
                idx === currentStepIndex && 'bg-blue-600 text-white',
                step.completed && idx !== currentStepIndex && 'bg-green-600 text-white',
                !step.completed && idx !== currentStepIndex && 'bg-gray-700 text-gray-400'
              )}
            >
              {step.completed && '✓ '}
              {step.title}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handlePhotoFile}
      />

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Photos */}
        {currentStep.id === 'photos' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Camera className="w-16 h-16 mx-auto text-amber-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentStep.title}
              </h3>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>

            {stepData.photos?.photos && stepData.photos.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {stepData.photos.photos.map((url: string, idx: number) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handlePhotoCapture}
              className="w-full h-20 rounded-2xl bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-3 font-bold text-xl active:scale-95 transition-all"
            >
              <Camera className="w-8 h-8" />
              TAKE PHOTO
            </button>
          </div>
        )}

        {/* Step 2: Notes */}
        {currentStep.id === 'notes' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentStep.title}
              </h3>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>

            <textarea
              value={stepData.notes?.text || ''}
              onChange={(e) => handleStepData('notes', { text: e.target.value })}
              placeholder="Enter notes about the work performed..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-gray-800 text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {/* Step 3: Materials */}
        {currentStep.id === 'materials' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentStep.title}
              </h3>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>

            <textarea
              value={stepData.materials?.list || ''}
              onChange={(e) => handleStepData('materials', { list: e.target.value })}
              placeholder="List materials used (one per line)..."
              className="w-full h-48 px-4 py-3 rounded-xl bg-gray-800 text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        )}

        {/* Step 4: Signature */}
        {currentStep.id === 'signature' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <PenTool className="w-16 h-16 mx-auto text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentStep.title}
              </h3>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>

            <div className="bg-white rounded-xl overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-64 touch-none',
                  style: { touchAction: 'none' },
                }}
                backgroundColor="white"
                penColor="black"
                minWidth={1}
                maxWidth={3}
                onEnd={captureSignature}
              />
            </div>

            <button
              onClick={clearSignature}
              className="w-full h-12 rounded-xl bg-gray-700 hover:bg-gray-600 font-bold text-sm active:scale-95 transition-all"
            >
              Clear Signature
            </button>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep.id === 'complete' && (
          <div className="space-y-4 text-center py-12">
            <CheckCircle className="w-24 h-24 mx-auto text-green-400" />
            <h3 className="text-3xl font-bold text-white">Ready to Complete!</h3>
            <p className="text-gray-400">
              Review the information and tap Complete to finish this job.
            </p>

            {/* Summary */}
            <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Photos</span>
                <span className="font-bold text-white">
                  {stepData.photos?.photos?.length || 0} photos
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Notes</span>
                <span className="font-bold text-white">
                  {stepData.notes?.text ? 'Added' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Materials</span>
                <span className="font-bold text-white">
                  {stepData.materials?.list ? 'Added' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Signature</span>
                <span className="font-bold text-white">
                  {stepData.signature?.signatureUrl ? 'Captured' : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-800 p-4 border-t border-gray-700 space-y-3">
        <button
          onClick={handleStepComplete}
          disabled={isProcessing || (currentStep.required && !canProceed())}
          className={cn(
            'w-full h-16 rounded-2xl',
            'flex items-center justify-center gap-3',
            'font-bold text-xl uppercase',
            'transition-all active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            currentStep.id === 'complete'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700',
            'text-white'
          )}
        >
          {isProcessing ? (
            'PROCESSING...'
          ) : currentStep.id === 'complete' ? (
            <>
              <CheckCircle className="w-6 h-6" />
              COMPLETE JOB
            </>
          ) : (
            <>
              {currentStep.title}
              <ChevronRight className="w-6 h-6" />
            </>
          )}
        </button>

        {!currentStep.required && currentStepIndex < steps.length - 1 && (
          <button
            onClick={handleSkipStep}
            disabled={isProcessing}
            className="w-full h-12 rounded-xl bg-gray-700 hover:bg-gray-600 font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            Skip This Step
          </button>
        )}
      </div>
    </div>
  )
}

export type { JobCompletionWizardProps }
