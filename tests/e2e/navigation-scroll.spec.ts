import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  for (const source of ['header', 'footer'] as const) {
    test(`${source} catalogue link opens the top of the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/#contacts');
      await expect(page.locator('#faq button').first()).toBeVisible();

      for (let visit = 0; visit < 2; visit++) {
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        const footerLink = page.getByRole('contentinfo').getByRole('link', { name: 'Все букеты', exact: true });
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await expect(footerLink).toBeInViewport();
        expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

        if (source === 'footer') {
          await footerLink.click();
        } else if (width < 701) {
          await page.getByRole('button', { name: 'Открыть меню' }).click();
          await page.getByRole('navigation', { name: 'Мобильная навигация' }).getByRole('link', { name: 'Букеты', exact: true }).click();
        } else {
          await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Букеты', exact: true }).click();
        }

        await expect(page).toHaveURL(/\/catalog(?:#main)?$/);
        await expect(page.getByRole('heading', { name: 'Букеты', exact: true, level: 1 })).toBeInViewport();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(150);
      }
    });
  }
}
