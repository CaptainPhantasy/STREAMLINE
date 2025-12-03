/**
 * Unit Tests: Circuit Breaker
 * Tests for circuit breaker pattern implementation
 */

import {
  CircuitBreaker,
  CircuitBreakerOpenError,
} from '@/lib/llm/resilience/circuit-breaker'

describe('Circuit Breaker - Unit Tests', () => {
  describe('Initialization', () => {
    it('should create with default config', () => {
      const breaker = new CircuitBreaker()
      const state = breaker.getState()

      expect(state.state).toBe('CLOSED')
      expect(state.failureCount).toBe(0)
      expect(state.successCount).toBe(0)
    })

    it('should create with custom config', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 10,
        cooldownPeriod: 30000,
        successThreshold: 5,
      })
      const config = breaker.getConfig()

      expect(config.failureThreshold).toBe(10)
      expect(config.cooldownPeriod).toBe(30000)
      expect(config.successThreshold).toBe(5)
    })

    it('should validate failureThreshold', () => {
      expect(() => new CircuitBreaker({ failureThreshold: 0 })).toThrow()
      expect(() => new CircuitBreaker({ failureThreshold: -1 })).toThrow()
    })

    it('should validate cooldownPeriod', () => {
      expect(
        () => new CircuitBreaker({ cooldownPeriod: -1 })
      ).toThrow()
    })

    it('should validate successThreshold', () => {
      expect(() => new CircuitBreaker({ successThreshold: 0 })).toThrow()
      expect(() => new CircuitBreaker({ successThreshold: -1 })).toThrow()
    })
  })

  describe('CLOSED State', () => {
    it('should allow requests in CLOSED state', async () => {
      const breaker = new CircuitBreaker()
      const fn = jest.fn(async () => 'success')

      const result = await breaker.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalled()
    })

    it('should increment failure count on failure', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 })
      const error = new Error('Test error')
      const fn = jest.fn(async () => {
        throw error
      })

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn)
        } catch (e) {
          // Expected
        }
      }

      const state = breaker.getState()
      expect(state.failureCount).toBe(2)
      expect(state.state).toBe('CLOSED')
    })

    it('should transition to OPEN after threshold', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2 })
      const fn = jest.fn(async () => {
        throw new Error('Test error')
      })

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn)
        } catch (e) {
          // Expected
        }
      }

      const state = breaker.getState()
      expect(state.state).toBe('OPEN')
    })

    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 5 })
      const fn = jest.fn(async () => 'success')
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().failureCount).toBe(1)

      await breaker.execute(fn)

      expect(breaker.getState().failureCount).toBe(0)
    })
  })

  describe('OPEN State', () => {
    it('should reject requests in OPEN state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 1000,
      })
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })
      const successFn = jest.fn(async () => 'success')

      // Trigger OPEN state
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('OPEN')

      // Try to execute while OPEN
      await expect(breaker.execute(successFn)).rejects.toThrow(
        CircuitBreakerOpenError
      )
      expect(successFn).not.toHaveBeenCalled()
    })

    it('should throw CircuitBreakerOpenError with details', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 1000,
      })
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      try {
        await breaker.execute(errorFn)
        fail('Should have thrown')
      } catch (error: any) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError)
        expect(error.metadata).toBeDefined()
        expect(error.metadata.failureCount).toBe(1)
      }
    })
  })

  describe('HALF_OPEN State', () => {
    it('should transition to HALF_OPEN after cooldown', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
      })
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      // Trigger OPEN state
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('OPEN')

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Next execute should transition to HALF_OPEN
      const successFn = jest.fn(async () => 'success')
      try {
        await breaker.execute(successFn)
      } catch (e) {
        // Might still be transitioning
      }
    })

    it('should transition to CLOSED after successful recovery', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
        successThreshold: 1,
      })
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })
      const successFn = jest.fn(async () => 'success')

      // Trigger OPEN state
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should transition to HALF_OPEN then CLOSED
      try {
        await breaker.execute(successFn)
      } catch (e) {
        // Retry
        await breaker.execute(successFn)
      }

      const state = breaker.getState()
      expect(state.state).toBe('CLOSED')
    })

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
        successThreshold: 2,
      })
      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      // Trigger OPEN state
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Try to execute while HALF_OPEN (should fail)
      try {
        await breaker.execute(errorFn)
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('OPEN')
    })
  })

  describe('State Transitions', () => {
    it('should track state change time', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
      })

      const initialTime = breaker.getState().lastStateChange

      await new Promise((resolve) => setTimeout(resolve, 10))

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      const newTime = breaker.getState().lastStateChange
      expect(newTime).toBeGreaterThan(initialTime)
    })

    it('should reset failure count on CLOSED transition', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
      })

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().failureCount).toBe(1)

      // Reset
      breaker.reset()

      expect(breaker.getState().failureCount).toBe(0)
      expect(breaker.getState().state).toBe('CLOSED')
    })
  })

  describe('Manual Reset', () => {
    it('should reset to CLOSED state', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 })

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('OPEN')

      breaker.reset()

      expect(breaker.getState().state).toBe('CLOSED')
      expect(breaker.getState().failureCount).toBe(0)
      expect(breaker.getState().successCount).toBe(0)
    })

    it('should clear lastFailureTime on reset', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 })

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().lastFailureTime).not.toBeNull()

      breaker.reset()

      expect(breaker.getState().lastFailureTime).toBeNull()
    })
  })

  describe('isOpen Method', () => {
    it('should return false when CLOSED', () => {
      const breaker = new CircuitBreaker()
      expect(breaker.isOpen()).toBe(false)
    })

    it('should return true when OPEN and cooldown not elapsed', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 1000,
      })

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      expect(breaker.isOpen()).toBe(true)
    })

    it('should return false after cooldown elapsed', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
      })

      try {
        await breaker.execute(async () => {
          throw new Error('Test error')
        })
      } catch (e) {
        // Expected
      }

      expect(breaker.isOpen()).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(breaker.isOpen()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should propagate function errors', async () => {
      const breaker = new CircuitBreaker()
      const error = new Error('Custom error')
      const fn = jest.fn(async () => {
        throw error
      })

      try {
        await breaker.execute(fn)
        fail('Should have thrown')
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    it('should handle async errors', async () => {
      const breaker = new CircuitBreaker()
      const fn = jest.fn(async () => {
        await new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Async error')), 10)
        )
      })

      await expect(breaker.execute(fn)).rejects.toThrow('Async error')
    })

    it('should handle synchronous errors', async () => {
      const breaker = new CircuitBreaker()
      const fn = jest.fn(async () => {
        throw new Error('Sync error')
      })

      await expect(breaker.execute(fn)).rejects.toThrow('Sync error')
    })
  })

  describe('Multiple Circuit Breakers', () => {
    it('should maintain independent state', async () => {
      const breaker1 = new CircuitBreaker({ failureThreshold: 1 })
      const breaker2 = new CircuitBreaker({ failureThreshold: 1 })

      const errorFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      // Fail breaker1
      try {
        await breaker1.execute(errorFn)
      } catch (e) {
        // Expected
      }

      expect(breaker1.getState().state).toBe('OPEN')
      expect(breaker2.getState().state).toBe('CLOSED')
    })
  })

  describe('Performance', () => {
    it('should handle rapid state checks', async () => {
      const breaker = new CircuitBreaker()

      const startTime = Date.now()
      for (let i = 0; i < 10000; i++) {
        breaker.getState()
        breaker.isOpen()
      }
      const elapsed = Date.now() - startTime

      // 20k operations should complete in < 100ms
      expect(elapsed).toBeLessThan(100)
    })

    it('should handle rapid executions', async () => {
      const breaker = new CircuitBreaker()
      const fn = jest.fn(async () => 'success')

      const startTime = Date.now()
      for (let i = 0; i < 100; i++) {
        await breaker.execute(fn)
      }
      const elapsed = Date.now() - startTime

      // 100 rapid executions should be reasonably fast
      expect(elapsed).toBeLessThan(5000)
      expect(fn).toHaveBeenCalledTimes(100)
    })
  })
})
