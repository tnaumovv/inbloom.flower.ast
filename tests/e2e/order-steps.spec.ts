import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('order guide switches its explanation with pointer and native keyboard controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#how-to-order');
  const guide = page.getByRole('region', { name: 'Как заказать', exact: true });
  const choices = guide.getByRole('radio');
  await expect(choices).toHaveCount(3);
  await expect(choices.nth(0)).toBeChecked();
  await expect(guide.getByRole('region', { name: 'Начните с букета' })).toBeVisible();
  await guide.locator('label[for="order-step-chat"]').click();
  await expect(choices.nth(1)).toBeChecked();
  await expect(guide.getByRole('region', { name: 'Начните с букета' })).toHaveCount(0);
  await expect(guide.getByRole('region', { name: 'Расскажите о вашем поводе' })).toBeVisible();
  await expect(guide.getByRole('link', { name: 'Открыть WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
  expect(await guide.locator('.step-option').first().locator('.step-check').evaluate(el => getComputedStyle(el).display)).toBe('block');

  await choices.nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await expect(choices.nth(2)).toBeChecked();
  await expect(choices.nth(2)).toBeFocused();
  await expect(guide.getByRole('region', { name: 'Обсудите всё с флористом' })).toBeVisible();
  expect(await guide.locator('label[for="order-step-details"]').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('ArrowLeft');
  await expect(choices.nth(1)).toBeChecked();
  await guide.locator('h2').click();
  await guide.evaluate(async root => {
    await Promise.all(root.getAnimations({ subtree: true }).map(animation => animation.finished));
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/order-steps-desktop.png' });
});

test('order guide remains usable without JavaScript on a narrow screen', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/#how-to-order');
  const guide = page.getByRole('region', { name: 'Как заказать', exact: true });
  await guide.locator('label[for="order-step-details"]').click();
  await expect(guide.getByRole('radio', { name: 'Шаг 3: Согласуйте детали', exact: true })).toBeChecked();
  const panel = guide.getByRole('region', { name: 'Обсудите всё с флористом' });
  await expect(panel).toBeVisible();
  expect(await panel.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const enquiry = new URL((await panel.getByRole('link', { name: 'Обсудить детали' }).getAttribute('href'))!);
  expect(enquiry.pathname).toBe('/77082204675');
  expect(enquiry.searchParams.get('text')).toContain('состав, стоимость и получение');
  await guide.locator('label[for="order-step-bouquet"]').click();
  await expect(guide.getByRole('link', { name: 'Перейти к витрине' })).toHaveAttribute('href', '#bouquets');
  await guide.locator('label[for="order-step-chat"]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await guide.evaluate(root => root.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/order-steps-mobile.png' });
  await context.close();
});
