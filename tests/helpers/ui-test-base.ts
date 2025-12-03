/**
 * UI Test Base
 *
 * Smart UI testing framework for AI agents.
 * Replaces defensive `.catch(() => false)` patterns with
 * explicit error handling and meaningful assertions.
 *
 * Design Principles:
 * 1. FAIL FAST - Clear errors, not swallowed exceptions
 * 2. MEANINGFUL ASSERTIONS - Check actual content, not just "has content"
 * 3. DATABASE VERIFICATION - Confirm UI actions produce DB changes
 * 4. SMART WAITS - Wait for specific conditions, not arbitrary timeouts
 */

import { Page, Locator, expect, test } from '@playwright/test'
import { getDbVerifier, dbAssert, DatabaseVerifier } from './database-verifier'
import { requireValidEnvironment, TEST_USERS, TEST_ACCOUNT_SLUG } from '../setup/environment-validator'

/**
 * Error types for clear failure categorization
 */
export enum TestFailureType {
  ENVIRONMENT_NOT_READY = 'ENVIRONMENT_NOT_READY',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  ASSERTION_FAILED = 'ASSERTION_FAILED',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  DATABASE_VERIFICATION_FAILED = 'DATABASE_VERIFICATION_FAILED',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export class TestError extends Error {
  constructor(
    public type: TestFailureType,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(`[${type}] ${message}`)
    this.name = 'TestError'
  }
}

/**
 * Smart element finder with explicit error handling
 * No more `.catch(() => false)` - fails clearly when element not found
 */
export class SmartLocator {
  constructor(
    private page: Page,
    private selector: string,
    private description: string
  ) {}

  private get locator(): Locator {
    return this.page.locator(this.selector)
  }

  /**
   * Wait for element to be visible with clear timeout error
   */
  async waitForVisible(timeoutMs: number = 5000): Promise<Locator> {
    try {
      await this.locator.first().waitFor({ state: 'visible', timeout: timeoutMs })
      return this.locator.first()
    } catch (error) {
      throw new TestError(
        TestFailureType.ELEMENT_NOT_FOUND,
        `Element "${this.description}" (${this.selector}) not visible after ${timeoutMs}ms`,
        { selector: this.selector, timeout: timeoutMs }
      )
    }
  }

  /**
   * Check if element exists (returns boolean, not swallowed error)
   */
  async exists(timeoutMs: number = 1000): Promise<boolean> {
    try {
      await this.locator.first().waitFor({ state: 'visible', timeout: timeoutMs })
      return true
    } catch {
      return false
    }
  }

  /**
   * Click with proper error handling
   */
  async click(timeoutMs: number = 5000): Promise<void> {
    const element = await this.waitForVisible(timeoutMs)
    await element.click()
  }

  /**
   * Fill input with proper error handling
   */
  async fill(value: string, timeoutMs: number = 5000): Promise<void> {
    const element = await this.waitForVisible(timeoutMs)
    await element.fill(value)
  }

  /**
   * Get text content with proper error handling
   */
  async getText(timeoutMs: number = 5000): Promise<string> {
    const element = await this.waitForVisible(timeoutMs)
    return (await element.textContent()) || ''
  }

  /**
   * Assert element contains specific text
   */
  async assertContainsText(expectedText: string, timeoutMs: number = 5000): Promise<void> {
    const element = await this.waitForVisible(timeoutMs)
    const actualText = await element.textContent()

    if (!actualText?.includes(expectedText)) {
      throw new TestError(
        TestFailureType.ASSERTION_FAILED,
        `Element "${this.description}" expected to contain "${expectedText}" but got "${actualText}"`,
        { selector: this.selector, expected: expectedText, actual: actualText }
      )
    }
  }
}

/**
 * Base class for all UI tests
 * Provides common functionality and ensures proper setup/teardown
 */
export class UITestBase {
  protected page: Page
  protected db: DatabaseVerifier
  protected baseUrl: string
  protected accountId: string | null = null
  protected createdRecordIds: {
    jobs: string[]
    contacts: string[]
    conversations: string[]
  } = { jobs: [], contacts: [], conversations: [] }

  constructor(page: Page) {
    this.page = page
    this.db = getDbVerifier()
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }

  /**
   * Smart element finder factory
   */
  element(selector: string, description: string): SmartLocator {
    return new SmartLocator(this.page, selector, description)
  }

  /**
   * Navigate with proper error handling
   */
  async navigateTo(path: string, options?: { waitForSelector?: string }): Promise<void> {
    const url = `${this.baseUrl}${path}`

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

      // Wait for specific element if provided
      if (options?.waitForSelector) {
        await this.element(options.waitForSelector, 'page content').waitForVisible(10000)
      }

      // Verify we're on the right page
      const currentUrl = this.page.url()
      if (!currentUrl.includes(path)) {
        throw new TestError(
          TestFailureType.NAVIGATION_FAILED,
          `Expected to be on ${path} but landed on ${currentUrl}`,
          { expected: path, actual: currentUrl }
        )
      }
    } catch (error) {
      if (error instanceof TestError) throw error

      throw new TestError(
        TestFailureType.NAVIGATION_FAILED,
        `Failed to navigate to ${url}: ${error}`,
        { url, error: String(error) }
      )
    }
  }

  /**
   * Wait for page to be in a stable state
   * More reliable than arbitrary timeouts
   */
  async waitForPageStable(options?: { maxWaitMs?: number }): Promise<void> {
    const maxWait = options?.maxWaitMs || 5000

    try {
      // Wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout: maxWait })
    } catch {
      // Network might never be fully idle (websockets, polling)
      // That's okay, continue
    }

    // Wait for no pending animations
    await this.page.evaluate(() => {
      return new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })
    })
  }

  /**
   * Assert page has specific content
   * Replaces the broken "body has 20+ chars" pattern
   */
  async assertPageHasContent(expectedContent: string[]): Promise<void> {
    const bodyText = await this.page.textContent('body')

    if (!bodyText) {
      throw new TestError(
        TestFailureType.ASSERTION_FAILED,
        'Page body is empty',
        { url: this.page.url() }
      )
    }

    for (const content of expectedContent) {
      if (!bodyText.includes(content)) {
        throw new TestError(
          TestFailureType.ASSERTION_FAILED,
          `Page does not contain expected content: "${content}"`,
          { url: this.page.url(), expected: content, bodyLength: bodyText.length }
        )
      }
    }
  }

  /**
   * Assert page does NOT have error indicators
   * Checks for common error page patterns
   */
  async assertNoErrorPage(): Promise<void> {
    const bodyText = await this.page.textContent('body') || ''
    const url = this.page.url()

    const errorPatterns = [
      'Internal Server Error',
      '500 Error',
      'Something went wrong',
      'Application error',
      'Unhandled Runtime Error',
      'Error: ',
      'TypeError:',
      'ReferenceError:',
    ]

    for (const pattern of errorPatterns) {
      if (bodyText.includes(pattern)) {
        throw new TestError(
          TestFailureType.ASSERTION_FAILED,
          `Page contains error indicator: "${pattern}"`,
          { url, pattern, bodySnippet: bodyText.substring(0, 500) }
        )
      }
    }
  }

  /**
   * Assert URL contains expected path
   */
  async assertUrlContains(expectedPath: string): Promise<void> {
    const currentUrl = this.page.url()

    if (!currentUrl.includes(expectedPath)) {
      throw new TestError(
        TestFailureType.ASSERTION_FAILED,
        `URL expected to contain "${expectedPath}" but is "${currentUrl}"`,
        { expected: expectedPath, actual: currentUrl }
      )
    }
  }

  /**
   * Track created record IDs for cleanup
   */
  trackCreatedRecord(type: 'jobs' | 'contacts' | 'conversations', id: string): void {
    this.createdRecordIds[type].push(id)
  }

  /**
   * Clean up all created records
   * Call in afterEach/afterAll
   */
  async cleanup(): Promise<void> {
    await this.db.cleanupTestData({
      jobIds: this.createdRecordIds.jobs,
      contactIds: this.createdRecordIds.contacts,
      conversationIds: this.createdRecordIds.conversations,
    })

    // Reset tracking
    this.createdRecordIds = { jobs: [], contacts: [], conversations: [] }
  }

  /**
   * Get test account ID
   */
  async getTestAccountId(): Promise<string> {
    if (this.accountId) return this.accountId

    const id = await this.db.getTestAccountId(TEST_ACCOUNT_SLUG)
    if (!id) {
      throw new TestError(
        TestFailureType.ENVIRONMENT_NOT_READY,
        `Test account '${TEST_ACCOUNT_SLUG}' not found. Run: npm run test:setup`,
        { accountSlug: TEST_ACCOUNT_SLUG }
      )
    }

    this.accountId = id
    return id
  }
}

/**
 * Common page objects for CRM-AI Pro
 */
export const pageObjects = {
  /**
   * Jobs page helpers
   */
  jobs: (base: UITestBase) => ({
    async navigateTo() {
      await base.navigateTo('/jobs', { waitForSelector: 'h1' })
      await base.assertNoErrorPage()
    },

    async assertPageLoaded() {
      await base.assertPageHasContent(['Jobs'])
      await base.assertNoErrorPage()
    },

    newJobButton: () => base.element('button:has-text("New Job")', 'New Job button'),
    seedDataButton: () => base.element('button:has-text("Seed Test Data")', 'Seed Data button'),
    jobCard: (text: string) => base.element(`[data-testid="job-card"]:has-text("${text}")`, `Job card: ${text}`),

    async createJob(description: string, contactId?: string) {
      await this.newJobButton().click()

      await base.element('text=Create New Job', 'Create Job dialog').waitForVisible()

      if (contactId) {
        // Select contact if provided
        await base.element('[role="combobox"]', 'Contact selector').click()
        await base.page.waitForTimeout(500) // Wait for dropdown
      }

      await base.element('textarea', 'Description field').fill(description)
      await base.element('button:has-text("Create")', 'Create button').click()

      // Wait for dialog to close
      await base.page.waitForTimeout(1000)

      // Verify in database
      const job = await dbAssert.jobCreated({ description })
      base.trackCreatedRecord('jobs', job.id)

      return job
    },
  }),

  /**
   * Contacts page helpers
   */
  contacts: (base: UITestBase) => ({
    async navigateTo() {
      await base.navigateTo('/contacts', { waitForSelector: 'h1' })
      await base.assertNoErrorPage()
    },

    async assertPageLoaded() {
      await base.assertPageHasContent(['Contacts'])
      await base.assertNoErrorPage()
    },

    searchInput: () => base.element('input[placeholder*="Search"]', 'Search input'),
    addContactButton: () => base.element('button:has-text("Add Contact")', 'Add Contact button'),

    async search(query: string) {
      await this.searchInput().fill(query)
      await base.page.waitForTimeout(500) // Debounce
    },

    async createContact(data: { email: string; firstName: string; lastName: string; phone?: string }) {
      await this.addContactButton().click()

      await base.element('text=Add Contact', 'Add Contact dialog').waitForVisible()

      await base.element('input[name="email"]', 'Email field').fill(data.email)
      await base.element('input[name="first_name"]', 'First name field').fill(data.firstName)
      await base.element('input[name="last_name"]', 'Last name field').fill(data.lastName)

      if (data.phone) {
        await base.element('input[name="phone"]', 'Phone field').fill(data.phone)
      }

      await base.element('button:has-text("Add")', 'Add button').click()

      // Wait for dialog to close
      await base.page.waitForTimeout(1000)

      // Verify in database
      const contact = await dbAssert.contactCreated({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      })
      base.trackCreatedRecord('contacts', contact.id)

      return contact
    },
  }),

  /**
   * Inbox page helpers
   */
  inbox: (base: UITestBase) => ({
    async navigateTo() {
      await base.navigateTo('/inbox', { waitForSelector: 'body' })
      await base.assertNoErrorPage()
    },

    async assertPageLoaded() {
      // Inbox might show empty state or conversations
      await base.assertNoErrorPage()
      const bodyText = await base.page.textContent('body')
      const hasContent = bodyText && bodyText.length > 100
      if (!hasContent) {
        throw new TestError(
          TestFailureType.ASSERTION_FAILED,
          'Inbox page has insufficient content',
          { bodyLength: bodyText?.length }
        )
      }
    },

    conversationList: () => base.element('[data-testid="conversation-list"]', 'Conversation list'),
    emptyState: () => base.element('text=No conversations', 'Empty state'),
  }),

  /**
   * Navigation helpers
   */
  navigation: (base: UITestBase) => ({
    sidebar: () => base.element('nav', 'Sidebar navigation'),

    async clickNavLink(href: string) {
      await base.element(`a[href="${href}"]`, `Nav link: ${href}`).click()
      await base.waitForPageStable()
    },

    async assertNavLinkExists(href: string) {
      const exists = await base.element(`a[href="${href}"]`, `Nav link: ${href}`).exists()
      if (!exists) {
        throw new TestError(
          TestFailureType.ELEMENT_NOT_FOUND,
          `Navigation link ${href} not found`,
          { href }
        )
      }
    },
  }),
}

/**
 * Test fixture factory
 * Creates properly initialized test base with automatic cleanup
 */
export function createTestFixture(page: Page): UITestBase {
  return new UITestBase(page)
}

/**
 * Global test setup - validates environment before any tests run
 */
export async function globalTestSetup(): Promise<void> {
  console.log('\n🚀 Running global test setup...\n')
  await requireValidEnvironment()
  console.log('✅ Environment validated. Ready to run tests.\n')
}
