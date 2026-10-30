import { expect, test } from '@playwright/test';

test('desktop section links reach content and update active navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  for (const [name, id] of [['О студии', 'studio'], ['Доставка', 'delivery'], ['Отзывы', 'reviews'], ['Контакты', 'contacts']]) {
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'location');
  }
});

test('mobile menu supports keyboard, contains focus, closes with Escape and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Открыть меню' });
  const dialog = page.getByRole('dialog', { name: 'Меню', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.getByRole('button', { name: 'Закрыть меню' })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  const links = dialog.locator('a');
  await links.last().focus();
  await page.keyboard.press('Tab');
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await trigger.click();
  await dialog.getByRole('link', { name: 'Контакты', exact: true }).click();
  await expect(page).toHaveURL(/#contacts$/);
  await expect(dialog).toBeHidden();
  await expect(page.locator('#contacts')).toBeInViewport();
});

test('menu survives tablet resize and closes at the desktop breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Открыть меню' });
  const dialog = page.getByRole('dialog', { name: 'Меню', exact: true });
  await trigger.click();
  await page.setViewportSize({ width: 1050, height: 900 });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 1051, height: 900 });
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Закрыть меню' }).click();
  await expect(trigger).toBeFocused();
});
