import { expect, test } from '@playwright/test';
import { expectWithinViewport, runtimeErrors, settleFonts } from '../helpers/storefront';

// Include both sides of the navigation and approach-grid breakpoint. Document
// scrollWidth alone cannot detect content clipped by an overflow:hidden parent.
for (const width of [320, 390, 701, 768, 1024, 1050, 1051, 1440]) {
  test(`home content and navigation fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = runtimeErrors(page);
    await page.goto('/');
    await settleFonts(page);
    const title = page.locator('main h1:visible');
    await expect(title).toHaveCount(1);
    await expect(title).toHaveText(/Цветы\s*выражающие\s*эмоции\s*и чувства/);
    await expectWithinViewport(title, width);
    await expect(page.locator('.home-hero a:visible').first()).toHaveAttribute('href', '/catalog');

    for (const id of ['bouquets', 'studio', 'delivery', 'reviews', 'contacts']) {
      await page.locator(`#${id}`).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      await expectWithinViewport(page.locator(`#${id}`), width);
      await expect(page.locator('.site-header .brand')).toBeInViewport();
    }
    for (const card of await page.locator('.approach article').all()) {
      await card.scrollIntoViewIfNeeded();
      await expectWithinViewport(card, width);
      await expectWithinViewport(card.locator('h3'), width);
      await expectWithinViewport(card.locator('p'), width);
    }
    if (width <= 1050) {
      await expect(page.getByRole('button', { name: 'Открыть меню' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeHidden();
    } else {
      await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Открыть меню' })).toBeHidden();
    }
    expect(errors).toEqual([]);
  });
}
