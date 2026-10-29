import { expect, test } from '@playwright/test';

for (const route of ['/catalog', '/catalog/bag-303869']) {
  test(`an imported photo failing before hydration keeps the fallback and order available on ${route}`, async ({ page }) => {
    await page.route('**/images/catalogue/bag-303869.webp', route => route.abort());
    await page.goto(route);
    const root = route === '/catalog'
      ? page.locator('[data-bouquet-id="bag-303869"]')
      : page.locator('.product-detail');
    await root.locator('img').scrollIntoViewIfNeeded();
    await expect(root.locator('img')).toHaveCSS('visibility', 'hidden');
    await expect(root.locator('.photo-fallback')).toBeVisible();
    await expect(root).toContainText(/7\s000\s₸/);
    const order = root.getByRole('link', { name: route === '/catalog' ? 'Заказать' : 'Заказать в WhatsApp', exact: true });
    const url = new URL((await order.getAttribute('href'))!);
    expect(url.origin).toBe('https://wa.me');
    expect(url.searchParams.get('text')).toContain('Артикул: bag-303869.');
  });
}
