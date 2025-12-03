/**
 * Simple performance monitoring utilities
 * Helps identify slow operations in development
 */

const SLOW_THRESHOLD = 100 // Log operations slower than 100ms

/**
 * Measure and log performance of a function
 */
export function measurePerformance<T>(
    name: string,
    fn: () => T,
    threshold: number = SLOW_THRESHOLD
): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    if (duration > threshold) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }

    return result
}

/**
 * Measure async function performance
 */
export async function measurePerformanceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    threshold: number = SLOW_THRESHOLD
): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    if (duration > threshold) {
        console.warn(`⚠️ Slow async operation: ${name} took ${duration.toFixed(2)}ms`)
    }

    return result
}

/**
 * Create a performance timer
 */
export function createTimer(name: string) {
    const start = performance.now()

    return {
        stop: (threshold: number = SLOW_THRESHOLD) => {
            const duration = performance.now() - start

            if (duration > threshold) {
                console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms`)
            }

            return duration
        },
        log: () => {
            const duration = performance.now() - start
            console.log(`✓ ${name} completed in ${duration.toFixed(2)}ms`)
            return duration
        }
    }
}

/**
 * Log component render performance (use in useEffect)
 */
export function logRenderTime(componentName: string) {
    const timer = createTimer(`${componentName} render`)

    return () => {
        timer.log()
    }
}
