import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const products = [
  ['Cloud', '18 700'], ['White bloom', '13 200'], ['Soft s', '10 700'], ['Sophie basket S', '12 100'],
  ['Green red', '20 300'], ['Autumn', '15 400'],
];

test('desktop carousel shows three of six cards and moves the next bouquets from right to left', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#bouquets');
  const cards = page.getByRole('article');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const status = page.getByRole('status');
  await expect(cards).toHaveCount(6);
  await expect(status).toContainText('Букеты 1–3 из 6');
  for (const [name, price] of products) {
    const card = page.getByRole('article', { name, exact: true });
    await expect(card.getByRole('link')).toHaveCount(1);
    expect((await card.innerText()).replace(/[\u00a0\u202f]/g, ' ')).toContain(price);
    const href = await card.getByRole('link', { name: `Заказать ${name} в WhatsApp` }).getAttribute('href');
    const url = new URL(href!);
    expect(url.pathname).toBe('/77082204675');
    expect(url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ')).toContain(`«${name}» (${price} ₸)`);
  }
  await expect(cards.nth(0)).toBeInViewport({ ratio: .95 });
  await expect(cards.nth(2)).toBeInViewport({ ratio: .95 });
  await expect(cards.nth(3)).not.toBeInViewport({ ratio: .95 });
  await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/showcase-desktop.png' });
  const cloudX = (await cards.nth(0).boundingBox())!.x;
  await page.getByRole('button', { name: 'Следующий букет' }).click();
  await expect(status).toContainText('Букеты 2–4 из 6');
  expect((await cards.nth(0).boundingBox())!.x).toBeLessThan(cloudX - 100);
  await viewport.focus();
  await viewport.press('End');
  await expect(status).toContainText('Букеты 4–6 из 6');
  await expect(cards.nth(5)).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Следующий букет' })).toBeDisabled();
  await viewport.press('Home');
  await expect(status).toContainText('Букеты 1–3 из 6');
  await expect(page.getByRole('button', { name: 'Предыдущий букет' })).toBeDisabled();
});

test('mobile carousel follows keyboard, arrows, native scrolling and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#bouquets');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const status = page.getByRole('status');
  await viewport.focus();
  await viewport.press('End');
  await expect(status).toContainText('6 из 6');
  await expect(page.getByRole('button', { name: 'Следующий букет' })).toBeDisabled();
  await viewport.press('Home');
  await expect(status).toContainText('1 из 6');
  await expect(page.getByRole('button', { name: 'Предыдущий букет' })).toBeDisabled();
  await page.getByRole('heading', { name: 'Витрина букетов', exact: true }).click();
  await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/showcase-mobile.png' });
  await page.getByRole('button', { name: 'Следующий букет' }).click();
  await expect(status).toContainText('2 из 6');
  await page.getByRole('button', { name: 'Предыдущий букет' }).click();
  await expect(status).toContainText('1 из 6');
  await viewport.focus();
  await viewport.press('ArrowRight');
  await expect(status).toContainText('2 из 6');
  await viewport.evaluate(el => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
  await expect(status).toContainText('6 из 6');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(status).toContainText('Букеты 4–6 из 6');
  await expect(page.getByRole('button', { name: 'Следующий букет' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await viewport.focus();
  await viewport.press('Home');
  await expect(status).toContainText('1 из 6');
});

test('changing reduced motion preserves native carousel navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#bouquets');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const card = page.getByRole('article', { name: 'Cloud', exact: true }).locator('[data-tilt-card]');
  expect(await card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await viewport.focus();
  await viewport.press('End');
  await expect(page.getByRole('status')).toContainText('6 из 6');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await viewport.press('Home');
  await expect(page.getByRole('status')).toContainText('1 из 6');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await viewport.press('End');
  await expect(page.getByRole('status')).toContainText('6 из 6');
});

test('the supplied 3D card tilts, resets and disables motion when the preference changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#bouquets');
  const article = page.getByRole('article', { name: 'Cloud', exact: true });
  const card = article.locator('[data-tilt-card]');
  await expect(article.getByRole('link', { name: 'Заказать Cloud в WhatsApp' })).toHaveAttribute('target', '_blank');
  const bounds = (await card.boundingBox())!;
  await page.mouse.move(bounds.x + 30, bounds.y + 35);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.mouse.move(10, 40);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.mouse.move(bounds.x + 30, bounds.y + 35);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
