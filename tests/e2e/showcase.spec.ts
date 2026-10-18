import { expect, test } from '@playwright/test';

const products = [
  ['Cloud', '18 700'], ['White bloom', '13 200'], ['Soft s', '10 700'], ['Sophie basket S', '12 100'],
];

test('desktop shows the four source bouquets in one row with matching enquiries', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(4);
  const y: number[] = [];
  for (const [name, price] of products) {
    const card = page.getByRole('article', { name, exact: true });
    await expect(card).toBeVisible();
    const text = (await card.innerText()).replace(/[\u00a0\u202f]/g, ' ');
    expect(text).toContain(price);
    const href = await card.getByRole('link', { name: `Заказать ${name} в WhatsApp` }).getAttribute('href');
    const url = new URL(href!);
    expect(url.pathname).toBe('/77082204675');
    expect(url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ')).toContain(`«${name}» (${price} ₸)`);
    y.push((await card.boundingBox())!.y);
  }
  expect(Math.max(...y) - Math.min(...y)).toBeLessThan(2);
});

test('mobile carousel follows keyboard, manual scrolling and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const status = page.getByRole('status');
  await viewport.focus();
  await viewport.press('End');
  await expect(status).toContainText('4 из 4');
  await expect(page.getByRole('button', { name: 'Следующий букет' })).toBeDisabled();
  await viewport.press('Home');
  await expect(status).toContainText('1 из 4');
  await expect(page.getByRole('button', { name: 'Предыдущий букет' })).toBeDisabled();
  await page.getByRole('button', { name: 'Следующий букет' }).click();
  await expect(status).toContainText('2 из 4');
  await page.getByRole('button', { name: 'Предыдущий букет' }).click();
  await expect(status).toContainText('1 из 4');
  await viewport.focus();
  await viewport.press('ArrowRight');
  await expect(status).toContainText('2 из 4');
  await viewport.evaluate(el => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
  await expect(status).toContainText('4 из 4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('button', { name: 'Следующий букет' })).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await viewport.focus();
  await viewport.press('Home');
  await expect(status).toContainText('1 из 4');
});

test('changing reduced motion preserves navigation and neutralizes image transforms', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const image = page.getByRole('article', { name: 'Cloud', exact: true }).getByRole('img');
  await expect(image).toBeVisible();
  expect(await image.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await viewport.focus();
  await viewport.press('End');
  await expect(page.getByRole('status')).toContainText('4 из 4');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await viewport.press('Home');
  await expect(page.getByRole('status')).toContainText('1 из 4');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await image.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await viewport.press('End');
  await expect(page.getByRole('status')).toContainText('4 из 4');
});
