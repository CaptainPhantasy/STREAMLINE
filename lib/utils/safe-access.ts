/**
 * Null-safe utility functions to prevent crashes from accessing null/undefined values
 */

/**
 * Safely get a property from an object, returning undefined if object is null/undefined
 */
export function safeGet<T, K extends keyof T>(
    obj: T | null | undefined,
    key: K,
    defaultValue?: T[K]
): T[K] | undefined {
    if (obj == null) return defaultValue
    return obj[key] ?? defaultValue
}

/**
 * Safely access nested properties with dot notation
 * Example: safeAccess(user, 'profile.settings.theme', 'light')
 */
export function safeAccess<T = any>(
    obj: any,
    path: string,
    defaultValue?: T
): T | undefined {
    const keys = path.split('.')
    let result = obj

    for (const key of keys) {
        if (result == null) return defaultValue
        result = result[key]
    }

    return result ?? defaultValue
}

/**
 * Safely return an array, never null/undefined
 */
export function safeArray<T>(arr: T[] | null | undefined): T[] {
    return arr ?? []
}

/**
 * Safely return a string, never null/undefined
 */
export function safeString(str: string | null | undefined, defaultValue = ''): string {
    return str ?? defaultValue
}

/**
 * Safely return a number, never null/undefined
 */
export function safeNumber(num: number | null | undefined, defaultValue = 0): number {
    return num ?? defaultValue
}

/**
 * Safely parse JSON, returning default value on error
 */
export function safeJsonParse<T = any>(
    json: string | null | undefined,
    defaultValue: T
): T {
    if (!json) return defaultValue

    try {
        return JSON.parse(json)
    } catch (error) {
        console.warn('Failed to parse JSON:', error)
        return defaultValue
    }
}

/**
 * Safely format a date, returning fallback on invalid date
 */
export function safeDate(
    date: string | Date | null | undefined,
    fallback = 'N/A'
): string {
    if (!date) return fallback

    try {
        const d = typeof date === 'string' ? new Date(date) : date
        if (isNaN(d.getTime())) return fallback
        return d.toLocaleDateString()
    } catch (error) {
        return fallback
    }
}

/**
 * Safely call a function, catching and logging errors
 */
export function safeTry<T>(
    fn: () => T,
    fallback: T,
    errorMessage?: string
): T {
    try {
        return fn()
    } catch (error) {
        console.error(errorMessage || 'Error in safeTry:', error)
        return fallback
    }
}
