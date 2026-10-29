import { expect, test } from '@playwright/test';

test('storefront pages and legacy redirects render current content', async ({ page }) => {
  for (const route of ['/', '/catalog', '/catalog/pink-cloud', '/about', '/delivery', '/contacts']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main h1:visible')).toHaveCount(1);
    await expect(page.locator('a[href*="florax.kz"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const target = ({ '/about': '/#studio', '/delivery': '/#delivery', '/contacts': '/#contacts' } as Record<string, string>)[route];
    if (target) {
      await expect(page).toHaveURL(new URL(target, page.url()).href);
      await expect.poll(() => page.locator(target.slice(1)).evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)))).toBeLessThan(4);
    }
  }
});

test('search, price sorting and empty reset operate on the same catalogue', async ({ page }) => {
  await page.goto('/catalog');
  await page.getByRole('combobox', { name: 'Сортировка' }).click();
  await page.getByRole('option', { name: 'Сначала дешевле', exact: true }).click();
  await expect(page.locator('#catalog-results .product-card').first()).toHaveAttribute('data-bouquet-id', 'bag-291807');
  await page.getByRole('searchbox').fill('Pink');
  await expect(page.locator('#catalog-results .product-card')).toHaveCount(3);
  await page.getByRole('searchbox').fill('несуществующий букет');
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click();
  await expect(page.locator('#catalog-results .product-card')).toHaveCount(24);
});

test('mobile menu restores focus and budget sheet applies', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog');
  const trigger = page.getByRole('button', { name: 'Открыть меню' });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Меню', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
  await page.getByRole('button', { name: '12 000–16 000 ₸', exact: true }).click();
  await page.getByRole('button', { name: 'Показать букеты', exact: true }).click();
  await expect(page.locator('#catalog-results .product-card')).toHaveCount(6);
});

test('same-name bouquets retain separate detail pages and identifiable order messages', async ({ page }) => {
  await page.goto('/catalog');
  const ids = ['bag-303869', 'bag-301723'];
  const orderLinks: string[] = [];
  for (const id of ids) {
    const card = page.locator(`#catalog-results [data-bouquet-id="${id}"]`);
    await expect(card.locator('.product-name')).toHaveText('Bag');
    await expect(card.locator('.price')).toHaveText(/7\s000\s₸/);
    await expect(card.locator('.product-name')).toHaveAttribute('href', `/catalog/${id}`);
    const href = await card.getByRole('link', { name: 'Заказать', exact: true }).getAttribute('href');
    orderLinks.push(href!);
    expect(new URL(href!).searchParams.get('text')).toContain(`Артикул: ${id}.`);
  }
  expect(orderLinks[0]).not.toBe(orderLinks[1]);
  await page.locator('[data-bouquet-id="bag-303869"] .product-name').click();
  await expect(page).toHaveURL(/\/catalog\/bag-303869$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bag');
  await expect(page.getByRole('heading', { name: 'Состав букета', exact: true })).toBeVisible();
  await expect(page.locator('.detail-photo img')).toHaveAttribute('src', '/images/catalogue/bag-303869.webp');
  await expect(page.locator('a[href*="florax.kz"]')).toHaveCount(0);
});

test('polling refreshes price and prepared WhatsApp message without reload', async ({ page, request }) => {
  const initial = await (await request.get('/api/catalog')).json();
  let snapshot = initial;
  await page.route('**/api/catalog', route => route.fulfill({ json: snapshot }));
  await page.goto('/catalog/pink-cloud');
  snapshot = { ...initial, revision: 'test-price-change', bouquets: initial.bouquets.map((p: { id: string }) => p.id === 'pink-cloud' ? { ...p, priceKzt: 16900 } : p) };
  await expect(page.locator('.detail-price')).toHaveText(/16\s900\s₸/, { timeout: 10000 });
  const url = new URL((await page.locator('.order-main').getAttribute('href'))!);
  expect(url.searchParams.get('text')!.replace(/\s/g, ' ')).toContain('16 900');
  snapshot = { ...snapshot, revision: 'test-hidden', bouquets: snapshot.bouquets.filter((p: { id: string }) => p.id !== 'pink-cloud') };
  await expect(page.getByRole('heading', { name: 'Букет снят с витрины' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.order-main,.sticky-order')).toHaveCount(0);
});

test('failed refresh hides prices and offers retry instead of local fallback', async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({ status: 503, json: { status: 'unavailable', bouquets: [] } }));
  await page.goto('/catalog');
  await expect(page.getByRole('button', { name: 'Попробовать снова' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#catalog-results .product-card')).toHaveCount(0);
});

test('server content and order links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/catalog');
  await expect(page.locator('#catalog-results .product-card')).toHaveCount(24);
  await expect(page.getByText('Разделы сайта', { exact: true })).toBeVisible();
  await context.close();
});
