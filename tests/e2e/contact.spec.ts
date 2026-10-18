import { expect, test } from '@playwright/test';

test('custom composition opens a distinct enquiry and explains the three order steps', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Не нашли свой букет?', exact: true })).toBeVisible();
  await expect(page.getByText('Расскажите о поводе и пожеланиях — обсудим композицию в WhatsApp.', { exact: true })).toBeVisible();
  const href = await page.getByRole('link', { name: 'Обсудить букет', exact: true }).getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain('индивидуальный букет');
  const steps = page.getByRole('list', { name: 'Как заказать' }).getByRole('listitem');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText('Выберите букет');
  await expect(steps.nth(1)).toContainText('Напишите в WhatsApp');
  await expect(steps.nth(2)).toContainText('Согласуйте детали');
});

test('footer presents the source contacts and correct external destinations', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByText('Астана, проспект Женис, 8/1', { exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: '+7 708 220 46 75', exact: true })).toHaveAttribute('href', 'tel:+77082204675');
  await expect(footer.getByRole('link', { name: 'Открыть в 2ГИС', exact: false })).toHaveAttribute('href', 'https://2gis.kz/astana/firm/70000001105801781');
  await expect(footer.getByRole('link', { name: 'Instagram', exact: false }).first()).toHaveAttribute('href', 'https://www.instagram.com/inbloom.flower.ast/');
  const whatsapp = new URL((await footer.getByRole('link', { name: 'WhatsApp Написать флористу', exact: true }).getAttribute('href'))!);
  expect(whatsapp.origin + whatsapp.pathname).toBe('https://wa.me/77082204675');
  expect(whatsapp.searchParams.get('text')).toContain('Хочу заказать букет');
  const map = footer.getByTitle('Магазин In Bloom на карте 2ГИС');
  await expect(map).toHaveAttribute('loading', 'lazy');
  const embed = new URL((await map.getAttribute('src'))!);
  expect(embed.origin + embed.pathname).toBe('https://widgets.2gis.com/widget');
  const options = JSON.parse(embed.searchParams.get('options')!);
  expect(options.org).toBe('70000001105801781');
  expect(options.pos).toMatchObject({ lat: 51.164454, lon: 71.414802 });
  await expect(page.getByRole('link', { name: 'Больше букетов', exact: false })).toHaveAttribute('href', 'https://app.florax.kz/ru/in_bloom/bouquets');
  const external = page.locator('a[target="_blank"]');
  for (const link of await external.all()) {
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  }
});

test('contact links and address remain available when the external map fails', async ({ page }) => {
  await page.route('https://widgets.2gis.com/**', route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#contacts');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByText('Астана, проспект Женис, 8/1', { exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'WhatsApp Написать флористу', exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Instagram', exact: false })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Открыть в 2ГИС', exact: false })).toHaveAttribute('href', 'https://2gis.kz/astana/firm/70000001105801781');
});

test('desktop navigation leads to actual visible sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  for (const [label, id] of [['Букеты', 'bouquets'], ['О студии', 'studio'], ['Контакты', 'contacts']]) {
    await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});
