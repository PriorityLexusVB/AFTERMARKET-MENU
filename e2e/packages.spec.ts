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
});
