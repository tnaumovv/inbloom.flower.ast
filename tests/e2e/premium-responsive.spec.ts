import { expect, test } from '@playwright/test';

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`landing controls and sections fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydrat|React|uncaught/i.test(message.text())) errors.push(message.text()); });
    await page.goto('/');
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toBeInViewport();
    await expect(page.locator('section[aria-labelledby="hero-title"] a')).toHaveCount(0);
    const box = (await title.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
    const hero = (await page.locator('section[aria-labelledby="hero-title"]').boundingBox())!;
    expect(hero.width).toBe(width);
    expect(hero.height).toBeGreaterThanOrEqual(844);
    if (width >= 1024) {
      const nav = (await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox())!;
      expect(nav.x + nav.width / 2).toBeCloseTo(width / 2, 0);
    }
    await expect(page.locator('.site-header .brand-link')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    for (const id of ['bouquets', 'studio', 'faq', 'contacts']) {
      await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(page.locator('.site-header .brand-link')).toBeInViewport();
    }
    if (width < 1024) {
      const menu = page.getByRole('button', { name: 'Меню', exact: true });
      await menu.click();
      const panel = page.locator('.mobile-nav-panel[data-state="open"]');
      await expect(panel).toBeVisible();
      const bounds = (await panel.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
      await expect(menu).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}
