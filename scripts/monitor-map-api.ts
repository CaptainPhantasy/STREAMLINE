#!/usr/bin/env node

/**
 * Real-time Map API Monitor
 * 
 * Monitors the server logs for dispatch map API calls and performance
 * Run this in a separate terminal while testing the map
 */

import { createServer } from 'http'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { performance } from 'perf_hooks'

const PORT = 3001
const LOG_FILE = '/tmp/map-api-monitor.log'

interface APICall {
  timestamp: string
  endpoint: string
  method: string
  status?: number
  responseTime?: number
  error?: string
}

class MapAPIMonitor {
  private apiCalls: Map<string, APICall[]> = new Map()
  private startTime = performance.now()
  private totalRequests = 0

  constructor() {
    this.setupServer()
    this.startMonitoring()
  }

  private setupServer() {
    const server = createServer((req, res) => {
      if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(this.getMetrics()))
      } else if (req.url === '/calls') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(Object.fromEntries(this.apiCalls)))
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    })

    server.listen(PORT, () => {
      console.log(`🗺️  Map API Monitor running on http://localhost:${PORT}`)
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`)
      console.log(`📞 API Calls: http://localhost:${PORT}/calls`)
      console.log('')
      console.log('🔄 Monitoring dispatch map API calls...')
      console.log('')
    })
  }

  private startMonitoring() {
    // Monitor console output for API calls
    const originalLog = console.log
    const originalError = console.error

    console.log = (...args) => {
      this.parseLogMessage(args.join(' '))
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      this.parseLogMessage(args.join(' '), true)
      originalError.apply(console, args)
    }

    // Monitor fetch requests by patching global fetch
    const originalFetch = global.fetch
    global.fetch = async (url: string | Request, init?: RequestInit) => {
      const startTime = performance.now()
      const urlStr = typeof url === 'string' ? url : url.url
      
      if (urlStr.includes('/api/dispatch')) {
        this.logAPICall('fetch', urlStr, init?.method || 'GET', startTime)
      }

      try {
        const response = await originalFetch(url, init)
        const responseTime = performance.now() - startTime
        
        if (urlStr.includes('/api/dispatch')) {
          this.updateAPICall(urlStr, response.status, responseTime)
        }
        
        return response
      } catch (error) {
        const responseTime = performance.now() - startTime
        
        if (urlStr.includes('/api/dispatch')) {
          this.updateAPICall(urlStr, 0, responseTime, error instanceof Error ? error.message : 'Unknown error')
        }
        
        throw error
      }
    }
  }

  private parseLogMessage(message: string, isError = false): void {
    // Look for API endpoint patterns in logs
    const patterns = [
      /GET\s+\/api\/dispatch\/([^\s]+)/,
      /POST\s+\/api\/dispatch\/([^\s]+)/,
      /PUT\s+\/api\/dispatch\/([^\s]+)/,
      /DELETE\s+\/api\/dispatch\/([^\s]+)/,
      /Fetching:\s+\/api\/dispatch\/([^\s]+)/,
      /API Call:\s+\/api\/dispatch\/([^\s]+)/
    ]

    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match) {
        const endpoint = `/api/dispatch/${match[1]}`
        const method = match[0].split(' ')[0]
        
        if (isError) {
          this.logAPICall('log', endpoint, method, performance.now(), undefined, undefined, message)
        } else {
          this.logAPICall('log', endpoint, method, performance.now())
        }
        break
      }
    }

    // Look for response time patterns
    const timePattern = /(\d+(?:\.\d+)?)\s*ms/i
    const timeMatch = message.match(timePattern)
    if (timeMatch && message.includes('/api/dispatch')) {
      const responseTime = parseFloat(timeMatch[1])
      // This would need to be associated with a specific endpoint
      // For now, just log it
      console.log(`⏱️  Response time detected: ${responseTime}ms`)
    }
  }

  private logAPICall(
    source: string,
    endpoint: string,
    method: string,
    startTime: number,
    status?: number,
    responseTime?: number,
    error?: string
  ): void {
    const timestamp = new Date().toISOString()
    
    if (!this.apiCalls.has(endpoint)) {
      this.apiCalls.set(endpoint, [])
    }

    const call: APICall = {
      timestamp,
      endpoint,
      method,
      status,
      responseTime,
      error
    }

    this.apiCalls.get(endpoint)!.push(call)
    this.totalRequests++

    // Log to console with formatting
    const statusEmoji = status ? (status >= 200 && status < 300 ? '✅' : '❌') : '⏳'
    const responseTimeStr = responseTime ? `${responseTime.toFixed(2)}ms` : 'pending'
    const sourceEmoji = source === 'fetch' ? '🌐' : '📝'
    
    console.log(`${sourceEmoji} ${statusEmoji} ${method} ${endpoint} - ${responseTimeStr}`)
    
    if (error) {
      console.log(`   ❌ Error: ${error}`)
    }
  }

  private updateAPICall(endpoint: string, status: number, responseTime: number, error?: string): void {
    const calls = this.apiCalls.get(endpoint)
    if (calls && calls.length > 0) {
      const lastCall = calls[calls.length - 1]
      lastCall.status = status
      lastCall.responseTime = responseTime
      lastCall.error = error
    }
  }

  private getMetrics() {
    const now = performance.now()
    const uptime = now - this.startTime
    
    const endpointStats: Record<string, {
      count: number
      avgResponseTime: number
      successRate: number
      lastCall: string
    }> = {}

    this.apiCalls.forEach((calls, endpoint) => {
      const completedCalls = calls.filter(c => c.responseTime !== undefined)
      const successfulCalls = completedCalls.filter(c => c.status && c.status >= 200 && c.status < 300)
      
      const totalResponseTime = completedCalls.reduce((sum, c) => sum + (c.responseTime || 0), 0)
      const avgResponseTime = completedCalls.length > 0 ? totalResponseTime / completedCalls.length : 0
      
      endpointStats[endpoint] = {
        count: calls.length,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        successRate: completedCalls.length > 0 ? successfulCalls.length / completedCalls.length : 0,
        lastCall: calls.length > 0 ? calls[calls.length - 1].timestamp : 'never'
      }
    })

    return {
      uptime: Math.round(uptime),
      totalRequests: this.totalRequests,
      endpoints: endpointStats,
      summary: {
        totalEndpoints: this.apiCalls.size,
        totalCalls: this.totalRequests,
        averageResponseTime: this.calculateOverallAverageResponseTime()
      }
    }
  }

  private calculateOverallAverageResponseTime(): number {
    let totalTime = 0
    let totalCalls = 0
    
    this.apiCalls.forEach(calls => {
      calls.forEach(call => {
        if (call.responseTime) {
          totalTime += call.responseTime
          totalCalls++
        }
      })
    })
    
    return totalCalls > 0 ? Math.round((totalTime / totalCalls) * 100) / 100 : 0
  }
}

// Start monitoring
console.log('🗺️  Starting Map API Monitor...')
console.log('📊 This will track all dispatch map API calls in real-time')
console.log('')

new MapAPIMonitor()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down monitor...')
  process.exit(0)
})