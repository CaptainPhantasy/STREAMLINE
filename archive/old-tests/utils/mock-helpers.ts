/**
 * Mock Helpers for Playwright Tests
 * 
 * Utilities for mocking API calls (90% of tests should use mocks)
 * 
 * Usage:
 *   import { mockApiRoute, mockSupabaseResponse } from './utils/mock-helpers'
 */

import { Page, Route } from '@playwright/test'

/**
 * Mock an API route with a custom response
 */
export async function mockApiRoute(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  status: number = 200
) {
  await page.route(urlPattern, (route: Route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Mock a Supabase API response
 */
export async function mockSupabaseResponse(
  page: Page,
  endpoint: string,
  data: any,
  error: any = null
) {
  const response = error
    ? { error: { message: error.message, code: error.code } }
    : { data, error: null }

  await mockApiRoute(page, new RegExp(`.*${endpoint}.*`), response)
}

/**
 * Mock a successful API response
 */
export async function mockSuccessResponse(
  page: Page,
  urlPattern: string | RegExp,
  data: any
) {
  await mockApiRoute(page, urlPattern, { success: true, ...data }, 200)
}

/**
 * Mock an error API response
 */
export async function mockErrorResponse(
  page: Page,
  urlPattern: string | RegExp,
  errorMessage: string,
  status: number = 500
) {
  await mockApiRoute(
    page,
    urlPattern,
    { error: errorMessage },
    status
  )
}

/**
 * Mock a delayed response (for testing loading states)
 */
export async function mockDelayedResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  delayMs: number = 1000
) {
  await page.route(urlPattern, async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Remove all route mocks
 */
export async function clearMocks(page: Page) {
  await page.unroute('**/*')
}

/**
 * Mock common API endpoints
 */
export const commonMocks = {
  /**
   * Mock GET /api/jobs
   */
  async mockJobsList(page: Page, jobs: any[] = []) {
    await mockSuccessResponse(page, /.*\/api\/jobs.*/, { jobs })
  },

  /**
   * Mock GET /api/contacts
   */
  async mockContactsList(page: Page, contacts: any[] = []) {
    await mockSuccessResponse(page, /.*\/api\/contacts.*/, { contacts })
  },

  /**
   * Mock GET /api/conversations
   */
  async mockConversationsList(page: Page, conversations: any[] = []) {
    await mockSuccessResponse(page, /.*\/api\/conversations.*/, { conversations })
  },

  /**
   * Mock GET /api/users
   */
  async mockUsersList(page: Page, users: any[] = []) {
    await mockSuccessResponse(page, /.*\/api\/users.*/, { users })
  },
}

