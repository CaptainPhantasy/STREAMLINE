/**
 * Task Queue
 * 
 * Manages task prioritization and execution order
 */

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  request: string
  priority: TaskPriority
  agentTypes: Array<'bug-hunter' | 'code-smith' | 'migrator' | 'stage-agent'>
  context?: Record<string, any>
  createdAt: Date
  scheduledFor?: Date
}

export interface TaskQueueOptions {
  maxConcurrentTasks?: number
}

/**
 * Task Queue class
 */
export class TaskQueue {
  private queue: Task[] = []
  private maxConcurrent: number
  private runningTasks: Set<string> = new Set()

  constructor(options: TaskQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrentTasks || 5
  }

  /**
   * Add task to queue
   */
  enqueue(task: Task): void {
    this.queue.push(task)
    this.sortQueue()
  }

  /**
   * Get next task from queue
   */
  dequeue(): Task | undefined {
    // Filter out tasks that are scheduled for future
    const now = new Date()
    const readyTasks = this.queue.filter(
      task => !task.scheduledFor || task.scheduledFor <= now
    )

    if (readyTasks.length === 0) {
      return undefined
    }

    // Get highest priority task
    const task = readyTasks[0]
    
    // Remove from queue
    const index = this.queue.indexOf(task)
    if (index > -1) {
      this.queue.splice(index, 1)
    }

    return task
  }

  /**
   * Check if queue has available capacity
   */
  hasCapacity(): boolean {
    return this.runningTasks.size < this.maxConcurrent
  }

  /**
   * Mark task as running
   */
  markRunning(taskId: string): void {
    this.runningTasks.add(taskId)
  }

  /**
   * Mark task as complete
   */
  markComplete(taskId: string): void {
    this.runningTasks.delete(taskId)
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Get running tasks count
   */
  runningCount(): number {
    return this.runningTasks.size
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return [...this.queue]
  }

  /**
   * Remove task by ID
   */
  removeTask(taskId: string): boolean {
    const index = this.queue.findIndex(task => task.id === taskId)
    if (index > -1) {
      this.queue.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = []
    this.runningTasks.clear()
  }

  /**
   * Sort queue by priority and creation time
   */
  private sortQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    }

    this.queue.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }
}

