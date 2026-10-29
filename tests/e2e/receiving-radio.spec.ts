import { expect, test } from '@playwright/test';

test('receiving radio group slides between stacked rows and preserves the WhatsApp choice', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog/soft-pink');
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Soft pink в корзину', exact: true }).click();
  await page.getByTestId('cart-trigger').click();
  const cart = page.getByRole('dialog', { name: 'Корзина', exact: true });
  await expect(cart).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  const receiving = cart.getByRole('group', { name: 'Способ получения', exact: true });
  const delivery = receiving.getByRole('radio', { name: 'Доставка', exact: true });
  const pickup = receiving.getByRole('radio', { name: 'Самовывоз', exact: true });
  const highlight = receiving.locator(':scope > div > span[aria-hidden="true"]');
  await expect(delivery).toBeChecked();
  await expect(delivery).toHaveAccessibleDescription('По Астане · стоимость доставки в WhatsApp');
  const rows = receiving.locator('label');
  const first = (await rows.nth(0).boundingBox())!;
  const second = (await rows.nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height + 7);

  await delivery.focus();
  await page.keyboard.press('ArrowDown');
  await expect(pickup).toBeChecked();
  await expect(pickup).toBeFocused();
  await expect(delivery).not.toBeChecked();
  const message = async () => new URL((await cart.getByRole('link', { name: 'Оформить в WhatsApp' }).getAttribute('href'))!).searchParams.get('text');
  expect(await message()).toContain('Способ получения: Самовывоз');
  await expect.poll(async () => {
    const mark = (await highlight.boundingBox())!;
    const row = (await rows.nth(1).boundingBox())!;
    return Math.abs(mark.y - row.y) + Math.abs(mark.height - row.height);
  }).toBeLessThan(1);

  await page.setViewportSize({ width: 320, height: 640 });
  await expect(receiving).toBeInViewport({ ratio: 1 });
  await expect(cart.getByRole('link', { name: 'Оформить в WhatsApp' })).toBeInViewport({ ratio: 1 });
  await expect.poll(async () => {
    const mark = (await highlight.boundingBox())!;
    const row = (await rows.nth(1).boundingBox())!;
    return Math.abs(mark.y - row.y) + Math.abs(mark.width - row.width);
  }).toBeLessThan(1);
  await page.keyboard.press('ArrowUp');
  await expect(delivery).toBeChecked();
  expect(await message()).toContain('Способ получения: Доставка');
  expect(await cart.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('removed catalogue copy stays absent and the mobile order panel has larger controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/catalog', '/catalog/soft-pink']) {
    await page.goto(route);
    await expect(page.getByText('Предварительный каталог. Наличие и цены уточните у флориста.', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Состав и стоимость обсудим с флористом/)).toHaveCount(0);
  }
  const bar = page.locator('.sticky-order');
  const order = bar.getByRole('link', { name: 'Заказать в WhatsApp' });
  const trigger = page.getByTestId('cart-trigger');
  expect((await order.boundingBox())!.height).toBe(64);
  expect((await trigger.boundingBox())!.height).toBe(64);
  expect((await bar.boundingBox())!.height).toBeGreaterThanOrEqual(145);
  await expect(bar.locator('.sticky-price')).toHaveCSS('font-size', '26px');
});
