import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'test@317plumber.com'
const TEST_PASSWORD = 'TestPass123!'
const BASE_URL = 'http://localhost:3000'

test.describe('Marketing Save Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`)

    // Wait for login form and fill credentials
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)

    // Submit login form
    await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click()

    // Wait for navigation to dashboard
    await page.waitForURL(/\/dashboard|\/inbox/, { timeout: 15000 })
  })

  test('should save a new contact tag', async ({ page }) => {
    // Navigate to tags page
    await page.goto(`${BASE_URL}/marketing/tags`)
    await page.waitForLoadState('networkidle')

    // Click "Add Tag" or "New Tag" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first()
    await addButton.click()

    // Wait for dialog/form to appear
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 })

    // Fill in tag form
    const tagName = `Test Tag ${Date.now()}`
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(tagName)

    // Optionally fill color if field exists
    const colorInput = page.locator('input[name="color"], input[type="color"]').first()
    if (await colorInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await colorInput.fill('#FF5733')
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first()
    await submitButton.click()

    // Wait for success message or tag to appear in list
    await Promise.race([
      page.waitForSelector('text=/success/i', { timeout: 5000 }).catch(() => null),
      page.waitForSelector(`text=${tagName}`, { timeout: 5000 }).catch(() => null),
      page.waitForTimeout(2000)
    ])

    // Verify tag appears in the list
    const tagInList = page.locator(`text=${tagName}`).first()
    await expect(tagInList).toBeVisible({ timeout: 5000 })
  })

  test('should save a new email template', async ({ page }) => {
    // Navigate to email templates page
    await page.goto(`${BASE_URL}/marketing/email-templates`)
    await page.waitForLoadState('networkidle')

    // Click "Add Template" or "New Template" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first()
    await addButton.click()

    // Wait for dialog/form to appear
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 })

    // Fill in template form
    const templateName = `Test Template ${Date.now()}`
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(templateName)

    // Fill subject
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first()
    if (await subjectInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await subjectInput.fill('Test Subject')
    }

    // Fill body HTML if field exists
    const bodyInput = page.locator('textarea[name="bodyHtml"], textarea[name="body"], textarea[placeholder*="body" i]').first()
    if (await bodyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bodyInput.fill('<p>Test email body</p>')
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first()
    await submitButton.click()

    // Wait for success message or template to appear in list
    await Promise.race([
      page.waitForSelector('text=/success/i', { timeout: 5000 }).catch(() => null),
      page.waitForSelector(`text=${templateName}`, { timeout: 5000 }).catch(() => null),
      page.waitForTimeout(2000)
    ])

    // Verify template appears in the list
    const templateInList = page.locator(`text=${templateName}`).first()
    await expect(templateInList).toBeVisible({ timeout: 5000 })
  })

  test('should save a new campaign', async ({ page }) => {
    // Navigate to campaigns page
    await page.goto(`${BASE_URL}/marketing/campaigns`)
    await page.waitForLoadState('networkidle')

    // Click "Add Campaign" or "New Campaign" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first()
    await addButton.click()

    // Wait for dialog/form to appear
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 })

    // Fill in campaign form
    const campaignName = `Test Campaign ${Date.now()}`
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(campaignName)

    // Select campaign type if dropdown exists
    const typeSelect = page.locator('select[name="campaignType"], select[name="type"]').first()
    if (await typeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await typeSelect.selectOption({ index: 0 })
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first()
    await submitButton.click()

    // Wait for success message or campaign to appear in list
    await Promise.race([
      page.waitForSelector('text=/success/i', { timeout: 5000 }).catch(() => null),
      page.waitForSelector(`text=${campaignName}`, { timeout: 5000 }).catch(() => null),
      page.waitForTimeout(2000)
    ])

    // Verify campaign appears in the list
    const campaignInList = page.locator(`text=${campaignName}`).first()
    await expect(campaignInList).toBeVisible({ timeout: 5000 })
  })

  test('should handle save errors gracefully', async ({ page }) => {
    // Navigate to tags page
    await page.goto(`${BASE_URL}/marketing/tags`)
    await page.waitForLoadState('networkidle')

    // Click "Add Tag" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first()
    await addButton.click()

    // Wait for dialog/form
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 })

    // Try to submit without filling required fields (should show error)
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first()
    await submitButton.click()

    // Should show validation error or error toast, not crash
    await page.waitForTimeout(1000)

    // Check that page is still responsive (no crash)
    const pageTitle = page.locator('h1, h2, [role="heading"]').first()
    await expect(pageTitle).toBeVisible({ timeout: 3000 })
  })
})

