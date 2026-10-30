import { expect, test } from '@playwright/test';
import { settleFonts } from '../helpers/storefront';

for (const width of [390, 1440]) {
  test(`ticker runs only in view and responds to reduced motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const ticker = page.locator('.ticker');
    await ticker.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(ticker).toHaveAttribute('data-running', 'true');
    await expect(ticker.locator('.ticker-track')).toHaveCSS('animation-play-state', 'running');
    await page.locator('#contacts').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(ticker).toHaveAttribute('data-running', 'false');
    await expect(ticker.locator('.ticker-track')).toHaveCSS('animation-play-state', 'paused');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ticker.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(ticker).toHaveAttribute('data-running', 'false');
    await expect(ticker.locator('.ticker-track')).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(ticker).toHaveAttribute('data-running', 'true');
  });
}

test('footer reveal follows scroll in both directions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await settleFonts(page);
  const reveal = page.locator('[data-footer-reveal]').first();
  const opacity = () => reveal.evaluate(element => Number(getComputedStyle(element).opacity));
  await expect.poll(opacity).toBeLessThan(0.3);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(opacity).toBeGreaterThan(0.95);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Написать флористу' })).toBeInViewport();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(opacity).toBeLessThan(0.3);
});

test('reduced motion keeps footer readable and back-to-top usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(page.locator('[data-footer-reveal]').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-footer-wordmark]')).toHaveCSS('transform', 'none');
  await footer.getByRole('button', { name: 'Вернуться наверх' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('main h1:visible')).toBeInViewport();
});
