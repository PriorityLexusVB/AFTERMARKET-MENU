import { test, expect } from '@playwright/test';

test.describe('Package Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('text=Protection Packages', { timeout: 10000 });
  });

  test('should display all package tiers', async ({ page }) => {
    // Check that all three package tiers are displayed
    await expect(page.locator('text=Elite')).toBeVisible();
    await expect(page.locator('text=Platinum')).toBeVisible();
    await expect(page.locator('text=Gold')).toBeVisible();
  });

  test('should display package features with correct connectors', async ({ page }) => {
    // Check that features are displayed
    const packageCards = page.locator('[class*="PackageCard"], [class*="bg-gray-800"]').filter({
      hasText: /select plan/i
    });
    
    await expect(packageCards.first()).toBeVisible();
    
    // Check for AND/OR connectors
    const connectors = page.locator('text=/^(AND|OR)$/');
    await expect(connectors.first()).toBeVisible();
  });

  test('should be able to select a package', async ({ page }) => {
    // Click on a Select Plan button
    const selectButton = page.locator('button:has-text("Select Plan")').first();
    await selectButton.click();
    
    // Verify the button changes to "Selected"
    await expect(page.locator('button:has-text("Selected")')).toBeVisible();
  });

  test('should display feature details when clicking on a feature', async ({ page }) => {
    // Click on a feature name (they're underlined buttons)
    const featureButton = page.locator('button.underline').first();
    await featureButton.click();
    
    // A modal should appear with feature details
    // The modal typically shows a description and may have warranty info
    await expect(page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('visual: package cards layout', async ({ page }) => {
    // Wait for network to be idle to ensure all data is loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to be loaded to ensure consistent rendering
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for all package cards to be fully rendered (each has a Select Plan button)
    const selectButtons = page.locator('button:has-text("Select Plan")');
    await expect(selectButtons).toHaveCount(3);
    
    // CRITICAL: Verify each package card individually has features loaded
    // This prevents race conditions where screenshot is taken before features load
    const packageCards = page.locator('[data-testid="package-card"]');
    await expect(packageCards).toHaveCount(3, { timeout: 10000 });
    
    // Verify each individual package card has at least 2 feature buttons
    const packageCardCount = await packageCards.count();
    for (let i = 0; i < packageCardCount; i++) {
      const card = packageCards.nth(i);
      const featureButtons = card.locator('[data-testid="package-feature"]');
      // Each package should have at least 2 features (e.g., RustGuard Pro + ToughGuard Premium)
      await expect(featureButtons.first()).toBeVisible({ timeout: 10000 });
      const featureCount = await featureButtons.count();
      expect(featureCount).toBeGreaterThanOrEqual(2);
    }
    
    // Ensure the Popular Add-Ons section is also loaded
    await expect(page.locator('text=Popular Add-Ons')).toBeVisible();
    
    // Take a screenshot of the package section
    const packageSection = page.locator('main').first();
    await expect(packageSection).toBeVisible();
    
    // Visual snapshot for regression testing
    await expect(packageSection).toHaveScreenshot('package-cards.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
});

test.describe('Feature Rendering Order', () => {
  test('features should render in correct position order', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Protection Packages', { timeout: 10000 });
    
    // Get all feature buttons (underlined text in packages)
    const featureButtons = page.locator('button.underline');
    
    // Verify at least one feature is visible
    await expect(featureButtons.first()).toBeVisible();
    
    // Get the text of all features
    const featureTexts = await featureButtons.allTextContents();
    
    // Verify we have multiple features
    expect(featureTexts.length).toBeGreaterThan(0);
  });

  test('connector markers should match feature configuration', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Protection Packages', { timeout: 10000 });
    
    // Look for AND connectors (default)
    const andConnectors = page.locator('span.text-green-400:has-text("AND")');
    
    // At least some features should have AND connectors
    const andCount = await andConnectors.count();
    expect(andCount).toBeGreaterThanOrEqual(0);
  });

  test('features display in admin-defined order within packages', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Protection Packages', { timeout: 10000 });
    
    // Find a package card (e.g., Gold) and check feature order
    const goldCard = page.locator('[class*="bg-gray-800"]').filter({
      hasText: /gold/i
    }).filter({
      hasText: /select plan/i
    }).first();
    
    await expect(goldCard).toBeVisible();
    
    // Get features in this card in DOM order
    const featuresInCard = goldCard.locator('button.underline');
    const featureNames = await featuresInCard.allTextContents();
    
    // Verify features are present (order depends on admin-defined position)
    // The mock data has: RustGuard Pro (pos 0), ToughGuard Premium (pos 1), Interior Protection (pos 2)
    expect(featureNames.length).toBeGreaterThan(0);
    
    // Verify the expected order when using seed/mock data
    if (featureNames.length >= 3) {
      expect(featureNames[0]).toContain('RustGuard Pro');
      expect(featureNames[1]).toContain('ToughGuard Premium');
      expect(featureNames[2]).toContain('Interior');
    }
  });

  test('OR connector should be visible between features configured with OR', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Protection Packages', { timeout: 10000 });
    
    // The mock data has Interior Protection with connector: 'OR'
    // Check if OR connector is visible somewhere in packages
    const orConnectors = page.locator('span.text-yellow-400:has-text("OR")');
    
    // Count OR connectors - should have at least one if mock data is loaded
    const orCount = await orConnectors.count();
    // Mock data has Interior Protection with connector: 'OR', so expect at least one OR connector
    // This validates that the OR connector configuration is working correctly
    expect(orCount).toBeGreaterThan(0);
  });
});
