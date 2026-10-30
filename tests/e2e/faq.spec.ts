import { expect, test } from '@playwright/test';

test('FAQ supports single disclosure, collapse and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#faq');
  const faq = page.getByRole('region', { name: 'Частые вопросы' });
  const questions = faq.getByRole('button');
  await expect(questions).toHaveCount(6);
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await questions.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowDown');
  await expect(questions.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await expect(faq.getByRole('region').filter({ hasText: 'Да, доставляем цветы по Астане.' })).toBeVisible();
  await questions.nth(3).click();
  await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await expect(questions.nth(3)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('End');
  await expect(questions.nth(5)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(questions.nth(0)).toBeFocused();
  await questions.nth(0).click();
  await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await faq.evaluate(async root => {
    await Promise.all(root.getAnimations({ subtree: true }).map(animation => animation.finished));
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await page.locator('#faq-title').click();
});

test('FAQ gives the verified schedule, payment methods and pickup address', async ({ page }) => {
  await page.goto('/#faq');
  const faq = page.locator('#faq');
  await faq.getByRole('button', { name: 'Когда работает студия?', exact: true }).click();
  await expect(faq.getByRole('region', { name: 'Когда работает студия?' })).toContainText('Пн–пт 08:30–22:30 · Сб 09:00–22:30 · Вс 09:00–22:00');
  await faq.getByRole('button', { name: 'Как оплатить?', exact: true }).click();
  await expect(faq.getByRole('region', { name: 'Как оплатить?' })).toContainText('В магазине — наличные, карта, QR, перевод или оплата через банк.');
  await faq.getByRole('button', { name: 'Где забрать букет?', exact: true }).click();
  await expect(faq.getByRole('region', { name: 'Где забрать букет?' })).toContainText('Астана, проспект Женис, 8/1');
  await expect(faq.getByRole('link', { name: 'Маршрут в 2ГИС' })).toHaveAttribute('href', 'https://2gis.kz/astana/firm/70000001105801781');
});

test('FAQ works on mobile with reduced motion and remains within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#faq');
  const delivery = page.locator('#faq').getByRole('button', { name: 'Есть ли доставка?' });
  await delivery.click();
  await expect(delivery).toHaveAttribute('aria-expanded', 'true');
  const answer = page.locator('#faq').getByRole('region', { name: 'Есть ли доставка?' });
  await expect(answer).toBeVisible();
  expect(await answer.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#faq').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
});

test('all FAQ answers remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/#faq');
  const faq = page.locator('#faq');
  await expect(faq.locator('details')).toHaveCount(6);
  await faq.locator('summary').filter({ hasText: 'Как оплатить?' }).click();
  await expect(faq.getByText('В магазине — наличные, карта, QR', { exact: false })).toBeVisible();
  await context.close();
});
