import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('FAQ supports single disclosure, collapse and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#faq');
  const faq = page.getByRole('region', { name: 'Оплата и частые вопросы' });
  const questions = faq.getByRole('button');
  await expect(questions).toHaveCount(7);
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await questions.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowDown');
  await expect(questions.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await expect(faq.getByRole('region').filter({ hasText: 'Возможность сборки, состав' })).toBeVisible();
  await questions.nth(3).click();
  await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await expect(questions.nth(3)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('End');
  await expect(questions.nth(6)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(questions.nth(0)).toBeFocused();
  await questions.nth(0).click();
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await faq.evaluate(async root => {
    await Promise.all(root.getAnimations({ subtree: true }).map(animation => animation.finished));
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await page.locator('#faq-title').click();
  await mkdir('.frontend-workbench/inbloom-runtime', { recursive: true });
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/faq-desktop.png' });
});

test('FAQ keeps the catalogue link and florist action', async ({ page }) => {
  await page.goto('/#faq');
  const faq = page.locator('#faq');
  await faq.getByRole('button', { name: 'Где посмотреть полный ассортимент?', exact: true }).click();
  await expect(faq.getByRole('link', { name: 'Открыть каталог Florax ↗' })).toHaveAttribute('href', 'https://app.florax.kz/ru/in_bloom/bouquets');
  await expect(faq.getByRole('link', { name: 'Написать флористу', exact: false })).toHaveAttribute('href', /wa.me/);
});

test('FAQ works on mobile with reduced motion and remains within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#faq');
  const delivery = page.locator('#faq').getByRole('button', { name: 'Сколько стоит доставка?' });
  await delivery.click();
  await expect(delivery).toHaveAttribute('aria-expanded', 'true');
  const answer = page.locator('#faq').getByRole('region', { name: 'Сколько стоит доставка?' });
  await expect(answer).toBeVisible();
  expect(await answer.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#faq').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: '.frontend-workbench/inbloom-runtime/faq-mobile.png' });
});

test('all FAQ answers remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/#faq');
  const faq = page.locator('#faq');
  await expect(faq.locator('details')).toHaveCount(7);
  await faq.locator('summary').filter({ hasText: 'Какие способы оплаты доступны?' }).click();
  await expect(faq.getByText('В магазине доступны карта', { exact: false })).toBeVisible();
  await context.close();
});
