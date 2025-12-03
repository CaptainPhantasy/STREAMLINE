import { test, expect } from '@playwright/test';

test.describe('Sales Mobile Features', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('sales dashboard loads and displays correctly', async ({ page }) => {
    await page.goto('/m/sales/dashboard');

    // Check main elements
    await expect(page.locator('h1')).toContainText(/Good (Morning|Afternoon|Evening)!/);

    // Check for navigation elements
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Leads')).toBeVisible();
    await expect(page.locator('text=Meetings')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();

    // Check for quick actions
    await expect(page.locator('text=NEW MEETING')).toBeVisible();
    await expect(page.locator('text=VOICE NOTE')).toBeVisible();
  });

  test('leads page displays and navigates correctly', async ({ page }) => {
    await page.goto('/m/sales/leads');

    // Check page title
    await expect(page.locator('h1')).toContainText('Sales Pipeline');

    // Check for leads list (may be empty)
    await expect(page.locator('text=active leads')).toBeVisible();

    // Test navigation back to dashboard
    await page.click('nav[role="navigation"] a:has-text("Home")');
    await expect(page).toHaveURL('/m/sales/dashboard');
  });

  test('profile page loads correctly', async ({ page }) => {
    await page.goto('/m/sales/profile');

    // Check page title
    await expect(page.locator('h1')).toContainText('Profile');

    // Test navigation
    await expect(page.locator('text=Settings')).toBeVisible();

    // Verify stats display
    await expect(page.locator('text=Deals Won')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=Conv. Rate')).toBeVisible();
  });

  test('voice note page functionality', async ({ page }) => {
    await page.goto('/m/sales/voice-note');

    // Check page elements
    await expect(page.locator('h1')).toContainText('Voice Note');
    await expect(page.locator('text=START RECORDING')).toBeVisible();

    // Check timer displays
    await expect(page.locator('text=0:00')).toBeVisible();

    // Test back navigation
    await page.click('button[aria-label="Back"]');
    await expect(page).toHaveURL('/m/sales/dashboard');
  });

  test('meeting recording page loads', async ({ page }) => {
    await page.goto('/m/sales/meeting/new');

    // Check page elements
    await expect(page.locator('text=Meeting Mode')).toBeVisible();
    await expect(page.locator('text=START RECORDING')).toBeVisible();
    await expect(page.locator('text=Tap to begin transcription')).toBeVisible();

    // Test exit prompt
    await page.click('button[aria-label="Discard"]');
    await expect(page.locator('text=Discard this recording?')).toBeVisible();
  });

  test('bottom navigation works correctly', async ({ page }) => {
    await page.goto('/m/sales/dashboard');

    // Test all navigation links
    const navLinks = [
      { text: 'Leads', url: '/m/sales/leads' },
      { text: 'Profile', url: '/m/sales/profile' },
    ];

    for (const link of navLinks) {
      await page.click(`nav[role="navigation"] a:has-text("${link.text}")`);
      await expect(page).toHaveURL(link.url);
    }
  });

  test('mobile UI elements are responsive', async ({ page }) => {
    await page.goto('/m/sales/dashboard');

    // Check for mobile-specific components
    await expect(page.locator('.bg-gradient-to-b')).toBeVisible();
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible();

    // Test that BigButton components are present
    await expect(page.locator('[data-testid="big-button"]')).toHaveCount(2);
  });

  test('voice button component is present', async ({ page }) => {
    await page.goto('/m/sales/dashboard');

    // Check for voice button (fixed position button)
    const voiceButton = page.locator('[aria-label="Voice commands"]');
    await expect(voiceButton).toBeVisible();
  });

  test('mobile sidebar functionality', async ({ page }) => {
    await page.goto('/m/sales/dashboard');

    // Test menu button
    const menuButton = page.locator('button[aria-label="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Sidebar would open - check for any sidebar content
      await expect(page.locator('.fixed')).toContain('sidebar');
    }
  });
});

test.describe('Sales Mobile - Authenticated Tests', () => {
  // These tests require authentication
  test.use({ storageState: 'playwright/.auth/sales.json' });

  test('authenticated sales dashboard loads', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/m/sales/dashboard');

    // Should show personalized content
    await expect(page.locator('h1')).toContainText(/Good (Morning|Afternoon|Evening)!/);

    // Should show meeting data if present
    // Note: This depends on test data
  });

  test('can access briefing page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // First get a contact ID from leads
    await page.goto('/m/sales/leads');

    // If leads exist, try to access briefing
    const leadLink = page.locator('a[href*="/m/sales/lead/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      await expect(page.locator('h1')).toContainText('Contact Information');
    }
  });
});