/**
 * Search history utilities for localStorage persistence
 */

const SEARCH_HISTORY_KEY = 'crm_search_history'
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
  resultCount?: number
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!stored) return []
    
    const history = JSON.parse(stored) as SearchHistoryItem[]
    // Sort by timestamp (most recent first)
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY_ITEMS)
  } catch (error) {
    console.error('Error reading search history:', error)
    return []
  }
}

/**
 * Add a search query to history
 */
export function addToSearchHistory(query: string, resultCount?: number): void {
  if (typeof window === 'undefined') return
  if (!query || query.trim().length < 2) return
  
  try {
    const history = getSearchHistory()
    const trimmedQuery = query.trim()
    
    // Remove existing entry with same query (case-insensitive)
    const filtered = history.filter(
      item => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
    )
    
    // Add new entry at the beginning
    const newHistory: SearchHistoryItem[] = [
      { query: trimmedQuery, timestamp: Date.now(), resultCount },
      ...filtered
    ].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.error('Error saving search history:', error)
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error('Error clearing search history:', error)
  }
}

/**
 * Remove a specific item from search history
 */
export function removeFromSearchHistory(query: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const history = getSearchHistory()
    const filtered = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    )
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing from search history:', error)
  }
}

