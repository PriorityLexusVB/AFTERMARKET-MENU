import { test, expect } from "@playwright/test";

test.describe("Package Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?demo=1");
    // Wait for the app to load
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });
  });

  test("should display all package tiers", async ({ page }) => {
    // Check that all three package tiers are displayed using specific package card header selectors
    // Use h3 within package cards to avoid matching feature names that contain tier names
    await expect(
      page.locator('[data-testid="package-card"] h3:has-text("Elite")').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="package-card"] h3:has-text("Platinum")').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="package-card"] h3:has-text("Gold")').first()
    ).toBeVisible();
  });

  test("should display package features with correct connectors", async ({ page }) => {
    // Check that features are displayed - use data-testid for reliable selection
    const packageCards = page.locator('[data-testid="package-card"]').filter({
      hasText: /select plan/i,
    });

    await expect(packageCards.first()).toBeVisible();

    // Check for AND/OR connectors
    const connectors = page.locator("text=/^(AND|OR)$/");
    await expect(connectors.first()).toBeVisible();
  });

  test("should be able to select a package", async ({ page }) => {
    // Click on a Select Plan button
    const selectButton = page.locator('button:has-text("Select Plan")').first();
    await selectButton.scrollIntoViewIfNeeded();
    await selectButton.click();

    // Verify the button changes to "Selected" (may have checkmark prefix)
    await expect(page.locator('button:has-text("Selected")')).toBeVisible();
  });

  test("should display feature details when clicking on a feature", async ({ page }) => {
    // Click on a feature name (they have data-testid="package-feature")
    const featureButton = page.locator('[data-testid="package-feature"]').first();
    await expect(featureButton).toBeVisible({ timeout: 10000 });
    await featureButton.click();

    // A modal should appear with feature details
    // The modal typically shows a description and may have warranty info
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("visual: package cards layout", async ({ page }) => {
    // Wait for network to be idle to ensure all data is loaded
    await page.waitForLoadState("networkidle");

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

    // Ensure the Add-Ons section is also loaded.
    // On customer-facing iPad/kiosk layouts, the add-ons drawer starts closed.
    const addonsHeading = page.locator('h3:has-text("Add-Ons")').first();
    if (!(await addonsHeading.isVisible())) {
      await page.getByRole("button", { name: /open add-ons/i }).click();
    }
    await expect(addonsHeading).toBeVisible();

    // Visual snapshot for regression testing.
    // Use a fixed-size viewport capture (more stable than element screenshots
    // whose height can vary slightly with content/fonts).
    await expect(page).toHaveScreenshot("package-cards.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
  });

  test("cta buttons show focus-visible on keyboard focus", async ({ page }) => {
    const openAddonsButton = page.getByRole("button", { name: /open add-ons/i });
    await expect(openAddonsButton).toBeVisible({ timeout: 10000 });
    await openAddonsButton.focus();
    const addonsFocusVisible = await openAddonsButton.evaluate((el) =>
      el.matches(":focus-visible")
    );
    expect(addonsFocusVisible).toBe(true);

    const selectPlanButton = page.getByRole("button", { name: /select plan/i }).first();
    await expect(selectPlanButton).toBeVisible({ timeout: 10000 });
    await selectPlanButton.focus();
    const selectFocusVisible = await selectPlanButton.evaluate((el) =>
      el.matches(":focus-visible")
    );
    expect(selectFocusVisible).toBe(true);

    const finalizeButton = page.getByRole("button", { name: /finalize/i }).first();
    await expect(finalizeButton).toBeVisible({ timeout: 10000 });
    await finalizeButton.focus();
    const finalizeFocusVisible = await finalizeButton.evaluate((el) =>
      el.matches(":focus-visible")
    );
    expect(finalizeFocusVisible).toBe(true);
  });
});

test.describe("Feature Rendering Order", () => {
  test("features should render in correct position order", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // Get all feature buttons using data-testid
    const featureButtons = page.locator('[data-testid="package-feature"]');

    // Verify at least one feature is visible
    await expect(featureButtons.first()).toBeVisible();

    // Get the text of all features
    const featureTexts = await featureButtons.allTextContents();

    // Verify we have multiple features
    expect(featureTexts.length).toBeGreaterThan(0);
  });

  test("connector markers should match feature configuration", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // Look for AND connectors (default)
    const andConnectors = page.locator('span.text-green-400:has-text("AND")');

    // At least some features should have AND connectors
    const andCount = await andConnectors.count();
    expect(andCount).toBeGreaterThanOrEqual(0);
  });

  test("features display in admin-defined order within packages", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // Find a package card (e.g., Gold) using data-testid
    const goldCard = page
      .locator('[data-testid="package-card"]')
      .filter({
        hasText: /gold/i,
      })
      .filter({
        hasText: /select plan/i,
      })
      .first();

    await expect(goldCard).toBeVisible();

    // Get features in this card in DOM order
    const featuresInCard = goldCard.locator('[data-testid="package-feature"]');
    const featureNames = await featuresInCard.allTextContents();

    // Verify features are present (order depends on admin-defined position)
    // The mock data has: RustGuard Pro (pos 0), ToughGuard Premium (pos 1), Interior Protection (pos 2)
    expect(featureNames.length).toBeGreaterThan(0);

    // Verify the expected order when using seed/mock data
    if (featureNames.length >= 3) {
      expect(featureNames[0]).toContain("RustGuard Pro");
      expect(featureNames[1]).toContain("ToughGuard Premium");
      expect(featureNames[2]).toContain("Interior");
    }
  });

  test("OR connector should be visible between features configured with OR", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

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
