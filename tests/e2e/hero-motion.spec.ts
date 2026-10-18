import { expect, test } from '@playwright/test';

test('hero motion runs without hovering WhatsApp and responds to the pointer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const whatsapp = page.getByRole('link', { name: 'WhatsApp', exact: true });
  await page.mouse.move(20, 700);
  const angle = await whatsapp.evaluate(el => getComputedStyle(el, '::before').getPropertyValue('--whatsapp-angle'));
  await expect.poll(() => whatsapp.evaluate(el => getComputedStyle(el, '::before').getPropertyValue('--whatsapp-angle'))).not.toBe(angle);
  const bouquet = page.locator('[data-hero-bouquet]');
  await page.mouse.move(1000, 300);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).not.toBe('');
  await page.mouse.move(1200, 700);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-x'))).not.toBe('0deg');
  await page.mouse.move(1400, 990);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).toBe('');
  const choose = page.getByRole('link', { name: 'Выбрать букет', exact: true });
  await choose.hover();
  await expect.poll(() => choose.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await expect(page.getByRole('link', { name: 'Написать флористу', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/77082204675\?text=/);
  await choose.click();
  await expect(page).toHaveURL(/#bouquets$/);
  await expect(page.locator('#bouquets')).toBeInViewport();
});

test('reduced motion stops the scene and border both initially and after changing the setting', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const whatsapp = page.getByRole('link', { name: 'WhatsApp', exact: true });
  const bouquet = page.locator('[data-hero-bouquet]');
  expect(await whatsapp.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  expect(await bouquet.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await bouquet.locator('div').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.mouse.move(1100, 300);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).not.toBe('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).toBe('');
  expect(await bouquet.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await whatsapp.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
});
