import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Include patterns (relative to project root)
    include: ['**/*.test.ts'],

    // Exclude patterns
    exclude: ['**/*.spec.ts', '../node_modules'],

    // Root directory for tests
    root: './',

    // Global test timeout
    testTimeout: 30000,

    // Hook timeout
    hookTimeout: 30000,

    // Retry failed tests once
    retry: 1,

    // Reporter
    reporters: ['verbose'],

    // Coverage (optional)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },

    // Setup files
    setupFiles: ['dotenv/config'],
  },

  // Path aliases (point to project root)
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
    },
  },
})
