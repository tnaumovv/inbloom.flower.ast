import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('page supplies Russian metadata and a visible keyboard skip link', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('In Bloom — цветы в Астане');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /букет.*WhatsApp/iu);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'In Bloom — цветы в Астане');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Commissioner');
  expect(await page.getByRole('heading', { level: 1 }).evaluate(el => getComputedStyle(el).fontFamily)).toContain('Prata');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Перейти к содержимому' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

for (const width of [360, 390, 601, 768, 1023, 1440]) {
  test(`renders cleanly at ${width}px with every image available and no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    await page.goto('/');
    for (const image of await page.locator('img').all()) {
      // The decorative hero continuously floats; resource checks must not wait for it to stop.
      await image.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    if (width <= 600) {
      const title = await page.getByRole('heading', { level: 1 }).boundingBox();
      const bouquet = await page.locator('[data-hero-scene] img').boundingBox();
      const hero = await page.locator('[data-hero-scene]').boundingBox();
      expect(bouquet!.y).toBeLessThan(title!.y + title!.height);
      expect(bouquet!.x + bouquet!.width).toBeGreaterThan(width);
      // The compact mobile composition no longer stretches actions to the viewport bottom.
      expect(hero!.height).toBeLessThanOrEqual(844);
      const action = (await page.getByRole('link', { name: 'Написать флористу', exact: true }).boundingBox())!;
      expect(action.y + action.height).toBeLessThan(hero!.y + hero!.height);
    }
    if ([390, 601, 768, 1023, 1440].includes(width)) {
      await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
      if (width === 390) {
        const carousel = page.getByRole('region', { name: 'Лента букетов', exact: true });
        await carousel.focus();
        await carousel.press('Home');
        await expect(page.getByRole('status')).toContainText('1 из 6');
        await expect.poll(() => carousel.evaluate(el => Math.round(el.scrollLeft))).toBe(0);
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      if (width === 390) await page.screenshot({ path: '.frontend-workbench/header-carousel/mobile-hero.png' });
      const capture = width === 1440 ? 'desktop' : width === 390 ? 'mobile' : `tablet-${width}`;
      await page.screenshot({ path: `.frontend-workbench/inbloom-runtime/${capture}.png`, fullPage: true });
      if ([601, 768, 1023].includes(width)) await page.screenshot({ path: `.frontend-workbench/inbloom-runtime/hero-${width}.png` });
      if (width === 390) await expect(page.getByRole('status')).toContainText('1 из 6');
      if (width === 1440) await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/preview.png' });
    }
  });
}

test('server HTML preserves the catalogue and native mobile navigation without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Цветы в Астане', exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(6);
  for (const name of ['Cloud', 'White bloom', 'Soft s', 'Sophie basket S', 'Green red', 'Autumn']) {
    await expect(page.getByRole('link', { name: `Заказать ${name} в WhatsApp` })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
  }
  await page.getByLabel('Меню', { exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Мобильная навигация' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Мобильная навигация' }).getByRole('link', { name: 'Букеты', exact: true }).click();
  await expect(page).toHaveURL(/#bouquets$/);
  await expect(page.locator('#bouquets')).toBeInViewport();
  await context.close();
});

test('failed images leave bouquet names, prices and ordering links usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/*', route => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.goto('/');
  const cloud = page.getByRole('article', { name: 'Cloud', exact: true });
  await expect(cloud.getByRole('heading', { name: 'Cloud', exact: true })).toBeVisible();
  expect((await cloud.innerText()).replace(/[\u00a0\u202f]/g, ' ')).toContain('18 700 ₸');
  await expect(cloud.getByRole('link', { name: 'Заказать Cloud в WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675/);
  expect((await cloud.boundingBox())!.height).toBeGreaterThan(300);
});
