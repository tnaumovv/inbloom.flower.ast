import { expect, test } from '@playwright/test';

test('desktop presents the main navigation and a transparent header logo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Нежность в каждом лепестке');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  for (const name of ['Букеты', 'О студии', 'Контакты']) {
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('.site-header .brand-link')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.site-header img')).toHaveAttribute('src', /logo/);
  await expect(page.locator('section[aria-labelledby="hero-title"] a')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'За букетом', exact: true })).toHaveAttribute('href', '#bouquets');
});

test('mobile menu supports keyboard, Escape focus restoration and desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByLabel('Меню', { exact: true });
  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  await toggle.focus();
  await toggle.press('Enter');
  await expect(nav).toBeVisible();
  await expect(page.locator('.mobile-nav-panel[data-state="open"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.mobile-nav-item').last()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '.frontend-workbench/header-carousel/mobile-menu.png' });
  await nav.getByRole('menuitem', { name: 'Букеты', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(nav.getByRole('menuitem', { name: 'Контакты', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(nav.getByRole('menuitem', { name: 'Букеты', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(nav).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.press('Enter');
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(nav).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(toggle).not.toBeVisible();
  await expect(nav).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Нежность в каждом лепестке', exact: true })).toBeVisible();
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
  const whatsapp = page.getByRole('link', { name: 'Написать в WhatsApp', exact: true });
  await expect(whatsapp).toBeInViewport();
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
  expect(await whatsapp.evaluate(el => getComputedStyle(el).position)).toBe('fixed');
  await toggle.click();
  const nav = page.getByRole('navigation', { name: 'Мобильная навигация' });
  await nav.getByRole('menuitem', { name: 'Букеты', exact: true }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#bouquets$/);
  await expect.poll(async () => (await page.locator('#showcase-title').boundingBox())!.y).toBeGreaterThan((await header.boundingBox())!.height);
});
