import { expect, test } from '@playwright/test';

const mapUrl = 'https://2gis.kz/astana/firm/70000001105801781';

test('custom order and delivery guide describe the current ordering flow', async ({ page }) => {
  await page.goto('/');
  const custom = page.locator('#custom-bouquet');
  await expect(custom.getByRole('heading')).toHaveText(/Соберём букет.*по вашим пожеланиям.*и бюджету/);
  const link = new URL((await custom.getByRole('link', { name: 'Собрать свой букет' }).getAttribute('href'))!);
  expect(link.origin + link.pathname).toBe('https://wa.me/77082204675');
  expect(link.searchParams.get('text')).toContain('букет');
  await expect(page.locator('#delivery .step h3')).toHaveText(['Выберите букет', 'Напишите в WhatsApp', 'Согласуйте детали']);
  await expect(page.locator('#delivery').getByRole('link', { name: 'Уточнить доставку' })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  await expect(page.locator('#delivery').getByRole('link', { name: 'Построить маршрут' })).toHaveAttribute('href', mapUrl);
});

test('contacts use a static map and retain real external destinations', async ({ page }) => {
  await page.goto('/#contacts');
  const contacts = page.locator('#contacts');
  await expect(contacts.locator('address')).toHaveText('Астана, проспект Женис, 8/1');
  await expect(contacts.getByRole('link', { name: '+7 708 220 46 75', exact: true })).toHaveAttribute('href', 'tel:+77082204675');
  await expect(contacts.getByRole('link', { name: '@inbloom.flower.ast', exact: true })).toHaveAttribute('href', 'https://www.instagram.com/inbloom.flower.ast/');
  const map = contacts.getByRole('link', { name: 'Открыть магазин In Bloom в 2ГИС' });
  await expect(map).toHaveAttribute('href', mapUrl);
  await expect(map.locator('img')).toHaveAttribute('src', '/images/map-2gis.png');
  await expect(contacts.locator('iframe')).toHaveCount(0);
  const footer = page.getByRole('contentinfo');
  const whatsapp = new URL((await footer.getByRole('link', { name: 'Написать флористу', exact: true }).getAttribute('href'))!);
  expect(whatsapp.origin + whatsapp.pathname).toBe('https://wa.me/77082204675');
  expect(whatsapp.searchParams.get('text')).toContain('Хочу заказать букет');
  await expect(page.locator('a[href*="florax.kz"]')).toHaveCount(0);
  for (const link of await page.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
  }
});

test('address, directions and ordering survive a failed map image', async ({ page }) => {
  await page.route('**/images/map-2gis.png', route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#contacts');
  const contacts = page.locator('#contacts');
  await expect(contacts.locator('address')).toBeVisible();
  await expect(contacts.getByRole('link', { name: 'Заказать в WhatsApp' })).toBeVisible();
  await expect(contacts.getByRole('link', { name: 'Открыть магазин In Bloom в 2ГИС' })).toHaveAttribute('href', mapUrl);
  await expect(contacts.getByRole('link', { name: 'Построить маршрут', exact: true }).first()).toBeVisible();
});
