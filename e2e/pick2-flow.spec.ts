import { test, expect } from "@playwright/test";
import { assertScrollLocked } from "./utils/scroll-lock";

const parseUsd = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) throw new Error(`Failed to parse USD from: ${raw}`);
  return parsed;
};

const focusViaKeyboard = async (
  page: import("@playwright/test").Page,
  testId: string,
  maxTabs = 160
) => {
  await page.evaluate(() => {
    (document.body as HTMLElement).focus();
  });

  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return {
        testId: el?.getAttribute("data-testid"),
        focusVisible: el ? el.matches(":focus-visible") : false,
      };
    });
    if (active.testId === testId && active.focusVisible) {
      return true;
    }
  }
  return false;
};

const getSelectionTotal = async (page: import("@playwright/test").Page) => {
  const bar = page.getByTestId("selection-drawer-bar");
  await expect(bar).toBeVisible({ timeout: 10000 });

  const totalBox = bar.getByText("Total", { exact: true }).locator("..");
  const raw = await totalBox.locator("p").filter({ hasText: /\$/ }).first().innerText();
  return parseUsd(raw);
};

const getPick2BundlePrice = async (page: import("@playwright/test").Page) => {
  const header = page.getByTestId("pick2-header");
  await expect(header).toBeVisible({ timeout: 10000 });
  const priceLine = page.getByTestId("pick2-price");
  await expect(priceLine).toBeVisible({ timeout: 10000 });
  const raw = await priceLine.innerText();
  return parseUsd(raw);
};

test.describe("Pick2 flow", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });
  });

  test.afterEach(() => {
    expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("demo: Pick2 tab visible, select 2, third blocked, swap works, bundle priced once", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const pick2Tab = page.getByRole("button", { name: /you pick 2/i });
    await expect(pick2Tab).toBeVisible({ timeout: 10000 });
    await pick2Tab.click();

    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("pick2-header")).toContainText(
      /Choose any (two|2) featured add-ons for one price\.?/i
    );
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("0 of 2 selected");
    await expect(page.getByTestId("pick2-savings")).toHaveCount(0);

    const bundlePrice = await getPick2BundlePrice(page);

    const totalBefore = await getSelectionTotal(page);

    const list = page.getByTestId("pick2-list");
    await expect(list).toBeVisible({ timeout: 10000 });

    // Use stable aria labels emitted by Pick2Selector/AddOnItem.
    const selectButtons = list.getByRole("button", { name: /Select .* for Pick 2/i });
    expect(await selectButtons.count()).toBeGreaterThan(2);

    // Select first item: bundle not complete -> total unchanged.
    await selectButtons.nth(0).click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("1 of 2 selected");
    const totalAfter1 = await getSelectionTotal(page);
    expect(totalAfter1).toBe(totalBefore);

    // Select second item: bundle completes -> total increases by bundle price once.
    await selectButtons.nth(1).click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText(/All set [—-] 2 selected/);
    const savingsBlock = page.getByTestId("pick2-savings");
    await expect(savingsBlock).toBeVisible({ timeout: 2000 });
    await expect(savingsBlock).toContainText(/Individually/i);
    await expect(savingsBlock).toContainText(/Bundle/i);
    const savingsText = await savingsBlock.innerText();
    const savingsLine = savingsText
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /Savings:/i.test(line));
    if (savingsLine) {
      expect(parseUsd(savingsLine)).toBeGreaterThanOrEqual(0);
    }

    const selectedChips = page.getByTestId("pick2-selected-chip");
    await expect(selectedChips).toHaveCount(2);
    const chipTexts = (await selectedChips.allTextContents()).map((text) => text.trim());
    expect(new Set(chipTexts).size).toBe(chipTexts.length);

    const totalAfter2 = await getSelectionTotal(page);
    expect(totalAfter2 - totalBefore).toBe(bundlePrice);

    // Attempt third selection: blocked (CTA disabled) and message visible.
    const extraSelect = list.getByRole("button", { name: /Select .* for Pick 2/i }).first();
    const extraSelectLabel = await extraSelect.getAttribute("aria-label");
    await extraSelect.scrollIntoViewIfNeeded();
    await extraSelect.click();
    await expect(page.getByRole("status")).toContainText(/You.?re at 2.*Remove one to swap\./, {
      timeout: 2000,
    });
    const totalAfterBlocked = await getSelectionTotal(page);
    expect(totalAfterBlocked).toBe(totalAfter2);

    // Swap: remove one, then select a different item.
    await list
      .getByRole("button", { name: /Remove .* from Pick 2/i })
      .first()
      .click();

    if (extraSelectLabel) {
      await list.getByRole("button", { name: extraSelectLabel }).click();
    } else {
      await list
        .getByRole("button", { name: /Select .* for Pick 2/i })
        .first()
        .click();
    }
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText(/All set [—-] 2 selected/);

    const totalAfterSwap = await getSelectionTotal(page);
    expect(totalAfterSwap).toBe(totalAfter2);
  });

  test("presets, clear picks, done returns to packages", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });

    const presets = page.getByTestId("pick2-presets");
    await expect(presets).toBeVisible({ timeout: 10000 });
    const presetButtons = presets.getByTestId("pick2-preset-button");
    expect(await presetButtons.count()).toBeGreaterThanOrEqual(4);
    const presetLabels = (await presetButtons.allInnerTexts()).map((label) =>
      label.replace(/recommended/i, "").trim()
    );
    expect(presetLabels.slice(0, 4)).toEqual([
      "Best Protection",
      "Resale Focus",
      "Visibility + Daily Wear",
      "Coastal Defense",
    ]);
    await expect(presetButtons.first().getByTestId("pick2-featured-badge")).toBeVisible();
    await expect(page.getByTestId("pick2-featured-badge")).toHaveCount(1);

    await presetButtons.first().click();
    await expect(page.getByTestId("pick2-selected-chip")).toHaveCount(2);

    await expect(page.getByTestId("pick2-thumbnail-suntek-complete")).toBeVisible();

    const list = page.getByTestId("pick2-list");
    await list
      .getByRole("button", { name: /Select .* for Pick 2/i })
      .nth(0)
      .click();
    await list
      .getByRole("button", { name: /Select .* for Pick 2/i })
      .nth(1)
      .click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText(/All set [—-] 2 selected/);

    const clearButton = page.getByTestId("pick2-clear");
    await clearButton.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await clearButton.click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("0 of 2 selected");
    await expect(page.getByTestId("pick2-selected-chip")).toHaveCount(0);

    await page.getByTestId("pick2-done").click();
    await expect(page.getByTestId("package-card").first()).toBeVisible({ timeout: 10000 });
  });

  test("info panel toggles without window scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });

    const toggle = page.getByTestId("pick2-info-toggle");
    await toggle.click();
    await expect(page.getByTestId("pick2-info-panel")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("pick2-info-panel")).toContainText(
      /Bundle advantage: two protections for one price\./i
    );
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 }).toBe(0);

    await toggle.click();
    await expect(page.getByTestId("pick2-info-panel")).toHaveCount(0);
  });

  test("pick2 buttons show focus-visible on keyboard focus", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });

    const list = page.getByTestId("pick2-list");
    await expect(list).toBeVisible({ timeout: 10000 });
    await list.getByRole("button", { name: /Select .* for Pick 2/i }).first().click();

    expect(await focusViaKeyboard(page, "pick2-done")).toBe(true);
    expect(await focusViaKeyboard(page, "pick2-clear")).toBe(true);
  });

  test("summaries shown + fix action reopens Pick2 when incomplete", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const selectButton = page.locator('button:has-text("Select Plan")').first();
    await selectButton.click();
    await expect(page.locator('button:has-text("Selected")')).toBeVisible();

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("pick2-header")).toContainText(
      /Choose any (two|2) featured add-ons for one price\.?/i
    );

    const list = page.getByTestId("pick2-list");
    await expect(list).toBeVisible({ timeout: 10000 });
    await list
      .getByRole("button", { name: /Select .* for Pick 2/i })
      .first()
      .click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("1 of 2 selected");

    await page.getByRole("button", { name: /protection packages/i }).click();
    await expect(page.locator('[data-testid="package-card"]').first()).toBeVisible({
      timeout: 10000,
    });

    const selectedCard = page
      .locator('[data-testid="package-card"]')
      .filter({ hasText: /selected/i })
      .first();
    await expect(selectedCard).toContainText(/Pick-2:/i);

    const selectionBar = page.getByTestId("selection-drawer-bar");
    await expect(selectionBar).toContainText(/Pick-2: 1\/2/i);
    const fixAction = page.getByTestId("pick2-fix-action");
    await expect(fixAction).toBeVisible();
    await fixAction.click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });
  });

  test("iPad paper mode: window scroll locked; Pick2 list can scroll internally", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1194, height: 834 });

    await page.goto("/?forceIpad=1&demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("pick2-header")).toContainText(
      /Choose any (two|2) featured add-ons for one price\.?/i
    );

    await expect(page.getByTestId("selection-drawer-bar")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });

    await assertScrollLocked(page);

    const list = page.getByTestId("pick2-list");
    await expect(list).toBeVisible({ timeout: 10000 });

    const dims = await list.evaluate((el) => ({
      sh: el.scrollHeight,
      ch: el.clientHeight,
      top: el.scrollTop,
    }));

    if (dims.sh > dims.ch + 2) {
      await list.evaluate((el) => {
        el.scrollTop = 250;
      });
      await expect
        .poll(() => list.evaluate((el) => el.scrollTop), { timeout: 2000 })
        .toBeGreaterThan(0);

      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 }).toBe(0);
      await assertScrollLocked(page);
    } else {
      await testInfo.attach("pick2-list-note", {
        body: "Pick2 list did not overflow; scroll assertion skipped",
        contentType: "text/plain",
      });
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 }).toBe(0);
    }
  });

  test("Surface-ish: no horizontal overflow; CTAs visible", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await expect(page.getByTestId("pick2-header")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("pick2-header")).toContainText(
      /Choose any (two|2) featured add-ons for one price\.?/i
    );

    const metrics = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });

    expect(
      metrics.scrollWidth,
      `No horizontal overflow expected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
    ).toBeLessThanOrEqual(metrics.clientWidth);

    await expect(page.getByTestId("selection-drawer-bar")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });

    const list = page.getByTestId("pick2-list");
    await expect(list.getByRole("button", { name: /Select .* for Pick 2/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
