import { test, expect } from "@playwright/test";

async function openPresentation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

  const showButton = page.locator('button[aria-label="Show presentation"]');
  if (await showButton.count()) {
    await showButton.first().click();
  } else {
    await page
      .getByRole("button", { name: /presentation/i })
      .first()
      .click();
  }

  await expect(page.locator("#rs1")).toBeVisible({ timeout: 10000 });
}

async function expectSlideFitsViewport(
  page: import("@playwright/test").Page,
  slideId: string,
  screenshotName: string,
  requiredText?: string[]
) {
  const slide = page.locator(`#${slideId}`);
  await slide.scrollIntoViewIfNeeded();
  await expect(slide).toBeVisible({ timeout: 10000 });

  // Wait for the slide to become the active slide (content fades in via opacity classes).
  const contentWrapper = page.locator(`#${slideId} > div`).first();
  await expect(contentWrapper).toHaveClass(/\bopacity-100\b/, { timeout: 10000 });

  if (requiredText && requiredText.length > 0) {
    for (const text of requiredText) {
      await expect(slide.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  }

  // Sanity: bullet dots should be present for bullet lists on these slides.
  // (These are real DOM nodes in BulletRow, not CSS list markers.)
  const bulletDots = page.locator(
    `#${slideId} .bg-blue-600.rounded-full, #${slideId} [class*="bg-blue-600"] [class*="rounded-full"]`
  );
  await expect(bulletDots.first()).toBeVisible({ timeout: 10000 });

  // The slide container is `h-screen`. Ensure the main content wrapper fits inside it.
  const fits = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { ok: false, reason: "missing" };

    const viewportH = window.innerHeight;
    const slideRect = el.getBoundingClientRect();

    // Content wrapper is the first child div inside the slide.
    const content = el.querySelector(":scope > div") as HTMLElement | null;
    if (!content) return { ok: false, reason: "missing-content" };

    const contentRect = content.getBoundingClientRect();

    // Allow a small safety margin for subpixel rounding.
    const margin = 6;
    const ok =
      contentRect.top >= slideRect.top - margin &&
      contentRect.bottom <= slideRect.bottom + margin &&
      slideRect.height <= viewportH + margin;

    return {
      ok,
      viewportH,
      slideH: slideRect.height,
      contentTop: contentRect.top,
      contentBottom: contentRect.bottom,
      slideTop: slideRect.top,
      slideBottom: slideRect.bottom,
    };
  }, slideId);

  expect(fits, `Slide ${slideId} content should fit in viewport`).toMatchObject({ ok: true });

  // Save a screenshot artifact for quick visual inspection without requiring
  // committed snapshot baselines.
  await slide.screenshot({ path: screenshotName });

  // Also capture a tight screenshot of the bullet list area so it's obvious in artifacts.
  // This helps avoid confusion if the full slide is viewed at a small zoom.
  const bulletList = page.locator(`#${slideId} ul`).first();
  if (await bulletList.count()) {
    const bulletOnlyName = screenshotName.replace(/\.png$/i, "-bullets.png");
    await bulletList.screenshot({ path: bulletOnlyName });
  }
}

test.describe("Presentation Layout", () => {
  test("slides 5, 7, 9, 10, and 11 fit iPad viewport", async ({ page }, testInfo) => {
    await openPresentation(page);

    await expectSlideFitsViewport(page, "rs5", testInfo.outputPath("presentation-slide-5.png"), [
      "RustGuard",
      "Molecular Barrier",
      "LIFETIME STRUCTURE WARRANTY",
    ]);

    await expectSlideFitsViewport(page, "rs7", testInfo.outputPath("presentation-slide-7.png"), [
      "Chemical Resistance",
      "Climate Barrier",
    ]);

    await expectSlideFitsViewport(page, "rs9", testInfo.outputPath("presentation-slide-9.png"), [
      "InteriorGuard",
      "Cabin Preservation",
      "Stain Hydrophobicity",
    ]);

    await expectSlideFitsViewport(page, "rs10", testInfo.outputPath("presentation-slide-10.png"), [
      "Diamond Shield",
      "Windshield",
      "Impact Resistance",
    ]);

    await expectSlideFitsViewport(page, "rs11", testInfo.outputPath("presentation-slide-11.png"), [
      "Evernew",
      "Digital Reconditioning",
      "Shield Your CARFAX",
    ]);
  });
});
