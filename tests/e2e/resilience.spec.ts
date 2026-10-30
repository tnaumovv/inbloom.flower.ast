import { expect, test } from '@playwright/test';
import { runtimeErrors, settleFonts } from '../helpers/storefront';

test('page supplies Russian metadata and a keyboard skip link to main', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('In Bloom — цветы в Астане');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /букет.*WhatsApp/iu);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'In Bloom — цветы в Астане');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Перейти к содержимому' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

for (const route of ['/', '/catalog', '/catalog/pink-cloud']) {
  test(`images render without browser errors on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = runtimeErrors(page);
    await page.goto(route);
    await settleFonts(page);
    for (const image of await page.locator('img:visible').all()) {
      await image.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('server home, catalogue and product ordering work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.locator('main h1:visible')).toHaveText(/Цветы\s*выражающие\s*эмоции\s*и чувства/);
    await expect(page.locator('#bouquets .product-card')).toHaveCount(4);
    await expect(page.locator('#custom-bouquet').getByRole('link', { name: 'Собрать свой букет' })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
    await expect(page.locator('#delivery .step')).toHaveCount(3);
    const fallback = page.locator('.mobile-menu-fallback');
    await fallback.locator('summary').click();
    await fallback.getByRole('link', { name: 'Букеты', exact: true }).click();
    await expect(page).toHaveURL(/\/catalog#main$/);
    await expect(page.locator('#catalog-results .product-card')).toHaveCount(24);
    await page.locator('[data-bouquet-id="pink-cloud"] .product-name').click();
    await expect(page).toHaveURL(/\/catalog\/pink-cloud$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pink cloud');
    await expect(page.locator('.detail-price')).toHaveText(/15\s700\s₸/);
    await expect(page.locator('.order-main')).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
    await expect(page.locator('.detail-photo img')).toBeVisible();
  } finally {
    await context.close();
  }
});

for (const route of ['/', '/catalog', '/catalog/pink-cloud']) {
  test(`failed bouquet images retain names, prices and order links on ${route}`, async ({ page }) => {
    await page.route('**/*', route => route.request().resourceType() === 'image' ? route.abort() : route.continue());
    await page.goto(route);
    const root = route.includes('/pink-cloud') ? page.locator('.product-detail') : page.locator('[data-bouquet-id="pink-cloud"]').first();
    await expect(root).toContainText('Pink cloud');
    await expect(root).toContainText(/15\s700\s₸/);
    await root.locator('img').scrollIntoViewIfNeeded();
    await expect(root.locator('img')).toHaveCSS('visibility', 'hidden');
    await expect(root.locator('.photo-fallback')).toBeVisible();
    await expect(root.getByRole('link', { name: route.includes('/pink-cloud') ? 'Заказать в WhatsApp' : 'Заказать', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675/);
  });
}

test('missing public pages return 404 and keep storefront navigation', async ({ page }) => {
  const response = await page.goto('/missing-bouquet-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.getByRole('link', { name: 'На главную', exact: true })).toHaveAttribute('href', '/');
});
