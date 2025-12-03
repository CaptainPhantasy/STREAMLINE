/**
 * OnboardingChecklist Component
 *
 * Quick start checklist displayed on dashboard for incomplete onboarding items.
 * Helps users complete remaining setup tasks.
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { OnboardingChecklistProps, OnboardingChecklistItem } from '@/lib/types/onboarding'

/**
 * OnboardingChecklist - Quick start checklist for dashboard
 *
 * @description
 * Displays remaining onboarding tasks as a checklist on the dashboard.
 * Users can mark items complete or navigate to complete them.
 *
 * @example
 * ```tsx
 * <OnboardingChecklist
 *   items={[
 *     { id: '1', title: 'Add first customer', link: '/contacts', completed: false },
 *     { id: '2', title: 'Create first job', link: '/jobs', completed: false }
 *   ]}
 *   onItemComplete={handleComplete}
 *   onDismiss={handleDismiss}
 *   showProgress={true}
 * />
 * ```
 */
export function OnboardingChecklist({
  items,
  onItemComplete,
  onDismiss,
  showProgress = true,
  className,
}: OnboardingChecklistProps) {
  const totalItems = items.length
  const completedItems = items.filter((item) => item.completed).length
  const progress = Math.round((completedItems / totalItems) * 100)
  const allComplete = completedItems === totalItems

  // Don't show if all complete
  if (allComplete && onDismiss) {
    return null
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Quick Start Checklist</CardTitle>
          <CardDescription>
            Complete these steps to get the most out of the system
          </CardDescription>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss checklist</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {completedItems} of {totalItems} complete
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onComplete={() => onItemComplete(item.id)}
            />
          ))}
        </div>

        {/* Completion Message */}
        {allComplete && (
          <div className="rounded-lg bg-primary/10 p-3 text-center text-sm font-medium text-primary">
            Great job! You've completed all setup tasks.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual checklist item
 */
function ChecklistItem({
  item,
  onComplete,
}: {
  item: OnboardingChecklistItem
  onComplete: () => void
}) {
  const Icon = item.icon

  const handleClick = () => {
    if (item.action) {
      item.action()
    }
    if (!item.completed) {
      onComplete()
    }
  }

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent',
        item.completed && 'bg-muted/50'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.completed}
        onCheckedChange={() => !item.completed && onComplete()}
        className="flex-shrink-0"
      />

      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded',
            item.completed ? 'bg-primary/10' : 'bg-primary/20'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              item.completed ? 'text-primary/60' : 'text-primary'
            )}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-0.5">
        <div
          className={cn(
            'font-medium',
            item.completed && 'text-muted-foreground line-through'
          )}
        >
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
      </div>

      {/* Action Arrow */}
      {(item.link || item.action) && !item.completed && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )}
    </div>
  )

  // Wrap in Link if link provided
  if (item.link && !item.completed) {
    return (
      <Link href={item.link} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  // Otherwise just a clickable div
  return (
    <div
      onClick={handleClick}
      className={cn(!item.completed && (item.action || item.link) && 'cursor-pointer')}
    >
      {content}
    </div>
  )
}

// Export types
export type { OnboardingChecklistProps, OnboardingChecklistItem }
