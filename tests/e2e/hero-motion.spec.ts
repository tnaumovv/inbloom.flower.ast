import { expect, test } from '@playwright/test';

test('the enlarged hero scene responds to the pointer and header navigation reaches bouquets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.site-header').getByRole('link', { name: 'WhatsApp', exact: true })).toHaveCount(0);
  await page.mouse.move(20, 700);
  const bouquet = page.locator('[data-hero-bouquet]');
  await page.mouse.move(1000, 300);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).not.toBe('');
  await page.mouse.move(1200, 700);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-x'))).not.toBe('0deg');
  await page.mouse.move(1400, 990);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).toBe('');
  await expect(page.locator('section[aria-labelledby="hero-title"] a')).toHaveCount(0);
  const choose = page.getByRole('link', { name: 'За букетом', exact: true });
  await choose.click();
  await expect(page).toHaveURL(/#bouquets$/);
  await expect(page.locator('#bouquets')).toBeInViewport();
});

test('reduced motion stops the scene initially and after changing the setting', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const bouquet = page.locator('[data-hero-bouquet]');
  expect(await bouquet.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await bouquet.locator('div').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.mouse.move(1100, 300);
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).not.toBe('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => bouquet.evaluate(el => (el as HTMLElement).style.getPropertyValue('--tilt-y'))).toBe('');
  expect(await bouquet.evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
