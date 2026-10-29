import { expect, test, type Locator } from '@playwright/test';

async function movement(panel: Locator) {
  return panel.evaluate(async element => {
    const samples: number[] = [];
    const start = performance.now();
    while (element.hasAttribute('open') && performance.now() - start < 600) {
      samples.push(new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
      if (!element.getAnimations().some(animation => animation.playState === 'running')) break;
      await new Promise(requestAnimationFrame);
    }
    return samples;
  });
}

test('cart slides up, slides down before dismissing and restores focus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/catalog/soft-pink');
  const trigger = page.getByTestId('cart-trigger');
  const panel = page.getByRole('dialog', { name: 'Корзина', exact: true });
  await trigger.click();
  const entrance = await movement(panel);
  expect(entrance.length).toBeGreaterThan(2);
  expect(entrance[0] - entrance.at(-1)!).toBeGreaterThan(20);
  await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(panel.getByRole('button', { name: 'Закрыть корзину' })).toBeFocused();

  await panel.getByRole('button', { name: 'Закрыть корзину' }).click();
  await expect(panel).toHaveAttribute('open');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  const exit = await movement(panel);
  expect(exit.length).toBeGreaterThan(2);
  expect(exit.at(-1)! - exit[0]).toBeGreaterThan(40);
  await expect(panel).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

  // Reverse direction before the entrance finishes; a cancelled entrance must not reopen the sheet.
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  await trigger.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion removes sheet movement and the header has no WhatsApp action', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/catalog/soft-pink');
    await expect(page.locator('header a[href*="wa.me"]')).toHaveCount(0);
    const trigger = page.getByTestId('cart-trigger');
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Корзина', exact: true });
    await expect(panel).toBeVisible();
    expect(await panel.evaluate(element => element.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});
