import { expect, test } from '@playwright/test';

test('desktop presents the main navigation and both hero actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Цветы в Астане');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  for (const name of ['Букеты', 'О студии', 'Контакты']) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Выбрать букет', exact: true })).toHaveAttribute('href', '#bouquets');
  await expect(page.getByRole('link', { name: 'Написать флористу', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
});

test('mobile menu supports keyboard, Escape focus restoration and desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByLabel('Меню', { exact: true });
  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  await toggle.focus();
  await toggle.press('Enter');
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Букеты', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(nav).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.press('Enter');
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(nav).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(toggle).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Выбрать букет', exact: true })).toBeVisible();
});

test('mobile header stays usable after scrolling and anchors clear the fixed header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#faq').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  const header = page.locator('.site-header');
  const toggle = page.getByLabel('Меню', { exact: true });
  await expect(header.getByRole('link', { name: 'In Bloom — на главную' })).toBeInViewport();
  await expect(toggle).toBeInViewport();
  expect((await header.boundingBox())!.y).toBe(0);
  await expect(header.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveCount(0);
  await toggle.click();
  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  await nav.getByRole('link', { name: 'Букеты', exact: true }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#bouquets$/);
  await expect.poll(async () => (await page.locator('#showcase-title').boundingBox())!.y).toBeGreaterThan((await header.boundingBox())!.height);
});
