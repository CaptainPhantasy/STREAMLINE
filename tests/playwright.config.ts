import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: '../playwright-report',
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Default project (no auth)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Role-based test projects
    // These use storageState files created by auth-helpers.ts
    {
      name: 'owner',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '../playwright/.auth/owner.json',
      },
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '../playwright/.auth/admin.json',
      },
    },
    {
      name: 'dispatcher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '../playwright/.auth/dispatcher.json',
      },
    },
    {
      name: 'tech',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '../playwright/.auth/tech.json',
      },
    },
    {
      name: 'sales',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '../playwright/.auth/sales.json',
      },
    },

    // Mobile projects
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 15'] },
    },
    {
      name: 'mobile-sales',
      use: {
        ...devices['iPhone 15'],
        storageState: '../playwright/.auth/sales.json',
      },
    },
  ],

  // webServer disabled - using existing dev server on port 8473
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:8473',
  //   reuseExistingServer: true,
  //   timeout: 180 * 1000,
  // },
});

