/**
 * GPS Tracker Service
 * 
 * Handles geolocation for field workers:
 * - Arrival/departure logging
 * - Periodic location updates
 * - Background tracking (when supported)
 */

import { saveGpsLogOffline, type OfflineGpsLog } from '../offline/db'

export interface GpsPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type GpsEventType = 'arrival' | 'departure' | 'checkpoint' | 'auto'

class GpsTracker {
  private watchId: number | null = null
  private lastPosition: GpsPosition | null = null
  private listeners: Set<(position: GpsPosition) => void> = new Set()
  private currentJobId: string | null = null
  private isTracking = false

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator
  }

  /**
   * Get current position (one-time)
   */
  async getCurrentPosition(): Promise<GpsPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Geolocation not available'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition: GpsPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          this.lastPosition = gpsPosition
          resolve(gpsPosition)
        },
        (error) => {
          reject(this.handleError(error))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }

  private syncInterval: any | null = null
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Start continuous tracking for a job
   */
  startTracking(jobId: string): void {
    if (!this.isAvailable() || this.watchId !== null) return

    this.currentJobId = jobId
    this.isTracking = true

    // Start watching position for local updates
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const gpsPosition: GpsPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        this.lastPosition = gpsPosition
        this.listeners.forEach(listener => listener(gpsPosition))
      },
      (error) => {
        console.error('GPS tracking error:', this.handleError(error))
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 30000,
      }
    )

    // Start periodic sync to server
    this.syncInterval = setInterval(() => {
      if (this.lastPosition) {
        this.logEvent(jobId, 'auto', { background: true }).catch(console.error)
      }
    }, this.SYNC_INTERVAL_MS)

    // Log initial start
    this.logEvent(jobId, 'auto', { action: 'start_tracking' }).catch(console.error)
  }

  /**
   * Stop continuous tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.currentJobId = null
    this.isTracking = false
  }

  /**
   * Log arrival at job site
   */
  async logArrival(jobId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent(jobId, 'arrival', metadata)
  }

  /**
   * Log departure from job site
   */
  async logDeparture(jobId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent(jobId, 'departure', metadata)
  }

  /**
   * Log a checkpoint during the job
   */
  async logCheckpoint(jobId: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEvent(jobId, 'checkpoint', metadata)
  }

  /**
   * Log GPS event to offline storage (syncs when online)
   */
  private async logEvent(
    jobId: string,
    eventType: GpsEventType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const position = await this.getCurrentPosition()

      const log: OfflineGpsLog = {
        id: crypto.randomUUID(),
        localId: crypto.randomUUID(),
        jobId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        eventType,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
        lastModified: Date.now(),
      }

      await saveGpsLogOffline(log)

      // Also try to sync immediately if online
      if (navigator.onLine) {
        this.syncGpsLog(log).catch(console.error)
      }
    } catch (error) {
      console.error('Failed to log GPS event:', error)
      throw error
    }
  }

  /**
   * Sync a GPS log to the server
   */
  private async syncGpsLog(log: OfflineGpsLog): Promise<void> {
    const response = await fetch('/api/gps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: log.jobId,
        latitude: log.latitude,
        longitude: log.longitude,
        accuracy: log.accuracy,
        eventType: log.eventType,
        metadata: log.metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync GPS log: ${response.status}`)
    }
  }

  /**
   * Subscribe to position updates
   */
  subscribe(listener: (position: GpsPosition) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get last known position
   */
  getLastPosition(): GpsPosition | null {
    return this.lastPosition
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  /**
   * Get current job being tracked
   */
  getCurrentJobId(): string | null {
    return this.currentJobId
  }

  private handleError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location permission denied. Please enable location services.')
      case error.POSITION_UNAVAILABLE:
        return new Error('Location unavailable. Please check your GPS settings.')
      case error.TIMEOUT:
        return new Error('Location request timed out. Please try again.')
      default:
        return new Error('Unknown location error.')
    }
  }
}

// Singleton instance
export const gpsTracker = new GpsTracker()

/**
 * Calculate distance between two points in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

