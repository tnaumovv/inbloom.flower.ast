import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`sections reveal once on scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const copy = page.locator('.custom-copy');
    await expect(copy).toHaveAttribute('data-reveal', 'pending');
    await copy.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(copy).toHaveAttribute('data-reveal', 'visible');
    await expect(copy).toHaveCSS('opacity', '1');
    await expect(copy).toHaveCSS('transform', 'none');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(copy).toHaveAttribute('data-reveal', 'visible');
    await page.locator('#contacts').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    const brand = page.locator('.site-header .brand-link');
    await expect(brand).toBeInViewport();
    expect((await page.locator('.site-header').boundingBox())!.y).toBe(0);
  });
}

test('reduced motion keeps offscreen content visible and updates without a reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const copy = page.locator('.custom-copy');
  await expect(copy).toHaveAttribute('data-reveal', 'pending');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(copy).toHaveCSS('opacity', '1');
  await expect(copy).toHaveCSS('transform', 'none');
  await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(copy).toHaveCSS('opacity', '1');
});

test('scroll content stays readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const copy = page.locator('.custom-copy');
  await copy.evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await expect(copy).toHaveCSS('opacity', '1');
  await expect(copy.getByRole('link', { name: 'Обсудить букет' })).toBeInViewport();
  await expect(page.locator('.site-header .brand-link')).toBeInViewport();
  await context.close();
});
