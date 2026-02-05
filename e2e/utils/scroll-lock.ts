import { expect, type Page } from "@playwright/test";

export const isScrollLocked = async (page: Page): Promise<boolean> =>
  page.evaluate(async () => {
    const beforeWindow = window.scrollY;
    const beforeDoc = document.scrollingElement?.scrollTop ?? 0;
    window.scrollTo(0, 1000);
    await new Promise((r) => setTimeout(r, 50));
    const afterWindow = window.scrollY;
    const afterDoc = document.scrollingElement?.scrollTop ?? 0;
    return beforeWindow === 0 && afterWindow === 0 && beforeDoc === 0 && afterDoc === 0;
  });

export const assertScrollLocked = async (page: Page): Promise<void> => {
  const locked = await isScrollLocked(page);
  expect(locked).toBe(true);
};
