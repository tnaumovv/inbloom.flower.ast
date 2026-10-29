import { expect, test, type Locator, type Page } from '@playwright/test';
import type { CatalogSnapshot } from '../../src/features/catalog/types';

const storageKey = 'inbloom.cart.v1';
const checkoutName = 'Оформить в WhatsApp';

async function openCart(page: Page) {
  await page.getByTestId('cart-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Корзина', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function expectNoCheckout(dialog: Locator) {
  await expect(dialog.getByRole('link', { name: checkoutName, exact: true })).toHaveCount(0);
  const button = dialog.getByRole('button', { name: checkoutName, exact: true });
  if (await button.count()) await expect(button).toBeDisabled();
}

async function expectFourCardRows(cards: Locator, columns: number) {
  await expect(cards).toHaveCount(4);
  const rows = await cards.evaluateAll(elements => {
    const counts = new Map<number, number>();
    for (const element of elements) {
      const top = Math.round(element.getBoundingClientRect().top);
      counts.set(top, (counts.get(top) ?? 0) + 1);
    }
    return [...counts.values()];
  });
  expect(rows).toEqual(Array.from({ length: 4 / columns }, () => columns));
}

test('same-name bouquets stay separate and quantity changes update the complete order', async ({ page }) => {
  await page.goto('/catalog');
  let added = 0;
  for (const id of ['bag-303869', 'bag-301723']) {
    const card = page.locator(`#catalog-results [data-bouquet-id="${id}"]`);
    const directOrder = await card.getByRole('link', { name: 'Заказать', exact: true }).getAttribute('href');
    expect(new URL(directOrder!).searchParams.get('text')).toContain(`Артикул: ${id}.`);
    await card.getByRole('button', { name: 'Добавить Bag в корзину', exact: true }).click();
    await expect(page.getByTestId('cart-trigger')).toHaveAccessibleName(`Открыть корзину, товаров: ${++added}`);
  }
  await page.locator('[data-bouquet-id="bag-303869"]').getByRole('button', { name: 'Добавить Bag в корзину', exact: true }).click();
  await expect(page.getByTestId('cart-trigger')).toHaveAccessibleName('Открыть корзину, товаров: 3');

  const dialog = await openCart(page);
  const first = dialog.locator('[data-cart-item="bag-303869"]');
  const second = dialog.locator('[data-cart-item="bag-301723"]');
  await expect(dialog.locator('[data-cart-item]')).toHaveCount(2);
  await expect(first.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '2');
  await expect(second.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '1');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/21\s000\s₸/);

  await second.getByRole('button', { name: 'Увеличить количество Bag', exact: true }).click();
  await expect(second.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '2');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/28\s000\s₸/);
  await first.getByRole('button', { name: 'Уменьшить количество Bag', exact: true }).click();
  await expect(first.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '1');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/21\s000\s₸/);

  const href = await dialog.getByRole('link', { name: checkoutName, exact: true }).getAttribute('href');
  const orderUrl = new URL(href!);
  expect(orderUrl.origin).toBe('https://wa.me');
  expect(orderUrl.searchParams.get('text')!.replace(/\u00a0|\u202f/g, ' ')).toBe(
    'Здравствуйте! Хочу заказать:\n\n' +
    '1. Bag — 1 шт., 7 000 ₸ (арт. bag-303869)\n' +
    '2. Bag — 2 шт., 14 000 ₸ (арт. bag-301723)\n\n' +
    'Итого за букеты: 21 000 ₸\nСпособ получения: Доставка',
  );

  await first.getByRole('button', { name: 'Удалить Bag из корзины', exact: true }).click();
  await expect(first).toHaveCount(0);
  await expect(dialog.getByTestId('cart-total')).toHaveText(/14\s000\s₸/);
  await second.getByRole('button', { name: 'Удалить Bag из корзины', exact: true }).click();
  await expect(dialog.getByText('Ваша корзина пока пуста', { exact: true })).toBeVisible();
  await expectNoCheckout(dialog);

  await dialog.getByRole('button', { name: 'Закрыть корзину', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const cards = page.locator('#catalog-results .product-card');
  const keyboardCard = cards.last();
  await expect(keyboardCard).toHaveAttribute('data-reveal', 'pending');
  await cards.nth((await cards.count()) - 2).getByRole('link', { name: 'Заказать', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(keyboardCard.locator('.product-photo')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(keyboardCard.getByRole('button', { name: /^Добавить .+ в корзину$/ })).toBeFocused();
  await expect(keyboardCard).toHaveAttribute('data-reveal', 'visible');
  await expect(keyboardCard).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cart-trigger')).toHaveAccessibleName('Открыть корзину, товаров: 1');
});

test('desktop actions align and the receiving choice updates the WhatsApp order', async ({ page }) => {
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/catalog/pink-cloud');
    await page.evaluate(() => document.fonts.ready);
    const details = page.locator('.detail-copy');
    const order = (await details.getByRole('link', { name: 'Заказать в WhatsApp', exact: true }).boundingBox())!;
    const add = (await details.getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).boundingBox())!;
    expect(Math.abs(add.width - order.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(add.height - order.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(add.y - order.y)).toBeLessThanOrEqual(1);
  }
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
  const dialog = await openCart(page);
  const receiving = dialog.getByRole('group', { name: 'Способ получения', exact: true });
  const delivery = receiving.getByRole('radio', { name: 'Доставка', exact: true });
  const pickup = receiving.getByRole('radio', { name: 'Самовывоз', exact: true });
  const message = async () => new URL((await dialog.getByRole('link', { name: checkoutName, exact: true }).getAttribute('href'))!).searchParams.get('text');
  await expect(delivery).toBeChecked();
  expect(await message()).toContain('Способ получения: Доставка');

  await receiving.getByText('Самовывоз', { exact: true }).click();
  await expect(pickup).toBeChecked();
  await expect(delivery).not.toBeChecked();
  expect(await message()).toContain('Способ получения: Самовывоз');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/15\s700\s₸/);
  await expect(dialog.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '1');
  await page.keyboard.press('Escape');
  await openCart(page);
  await expect(pickup).toBeChecked();
  expect(await message()).toContain('Способ получения: Самовывоз');

  await pickup.focus();
  await page.keyboard.press('ArrowRight');
  await expect(delivery).toBeChecked();
  await expect(delivery).toBeFocused();
  expect(await message()).toContain('Способ получения: Доставка');
});

test('tablet product actions keep their painted contents within each button', async ({ page }) => {
  for (const width of [720, 820, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/catalog/pink-cloud');
    await page.evaluate(() => document.fonts.ready);
    const details = page.locator('.detail-copy');
    const order = details.getByRole('link', { name: 'Заказать в WhatsApp', exact: true });
    const add = details.getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true });
    for (const control of [order, add]) {
      const geometry = await control.evaluate(element => ({
        box: element.getBoundingClientRect().toJSON(),
        parts: [...element.querySelectorAll(':scope > span, :scope > b, :scope > svg')].map(part => part.getBoundingClientRect().toJSON()),
      }));
      for (const part of geometry.parts) {
        expect.soft(part.left, `${width}px: control content crosses its left edge`).toBeGreaterThanOrEqual(geometry.box.left - 1);
        expect.soft(part.right, `${width}px: control content crosses its right edge`).toBeLessThanOrEqual(geometry.box.right + 1);
        expect.soft(part.top, `${width}px: control content crosses its top edge`).toBeGreaterThanOrEqual(geometry.box.top - 1);
        expect.soft(part.bottom, `${width}px: control content crosses its bottom edge`).toBeLessThanOrEqual(geometry.box.bottom + 1);
      }
    }
    const a = (await order.boundingBox())!;
    const b = (await add.boundingBox())!;
    const separated = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
    expect.soft(separated, `${width}px: order and cart buttons overlap`).toBe(true);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px: horizontal page overflow`).toBeLessThanOrEqual(width);
  }
});

test('detail additions survive navigation and reload with only IDs and quantities stored', async ({ page }) => {
  await page.goto('/catalog/pink-cloud');
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
  let dialog = await openCart(page);
  await dialog.getByRole('button', { name: 'Увеличить количество Pink cloud', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('cart-trigger')).toBeFocused();

  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Букеты', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog(?:#main)?$/);
  await page.reload();
  dialog = await openCart(page);
  await expect(dialog.locator('[data-cart-item="pink-cloud"]').getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '2');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/31\s400\s₸/);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual([{ id: 'pink-cloud', quantity: 2 }]);
  await dialog.getByRole('button', { name: 'Закрыть корзину', exact: true }).click();
  await expect(page.getByTestId('cart-trigger')).toBeFocused();
});

test('malformed local storage leaves a usable empty cart without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const payload of ['{', '{"items":[]}', '[null,{}, {"id":42,"quantity":1}, {"id":"pink-cloud","quantity":0}]']) {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value: payload });
    await page.goto('/catalog');
    const dialog = await openCart(page);
    await expect(dialog.getByText('Ваша корзина пока пуста', { exact: true })).toBeVisible();
    await expect(dialog.locator('[data-cart-item]')).toHaveCount(0);
    await expectNoCheckout(dialog);
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('catalogue polling refreshes cart prices and blocks checkout for a removed bouquet', async ({ page, request }) => {
  const initial: CatalogSnapshot = await (await request.get('/api/catalog')).json();
  expect(initial.status).toBe('ok');
  let snapshot = initial;
  await page.route('**/api/catalog', route => route.fulfill({ json: snapshot }));
  await page.goto('/catalog/pink-cloud');
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
  const dialog = await openCart(page);
  snapshot = { ...initial, revision: 'cart-price-update', bouquets: initial.bouquets.map(bouquet => bouquet.id === 'pink-cloud' ? { ...bouquet, priceKzt: 16900 } : bouquet) };
  await expect(dialog.getByTestId('cart-total')).toHaveText(/16\s900\s₸/, { timeout: 10000 });
  const href = await dialog.getByRole('link', { name: checkoutName, exact: true }).getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toMatch(/16\s900\s₸/);

  snapshot = { ...snapshot, revision: 'cart-bouquet-removed', bouquets: snapshot.bouquets.filter(bouquet => bouquet.id !== 'pink-cloud') };
  await expect(dialog.getByRole('link', { name: checkoutName, exact: true })).toHaveCount(0, { timeout: 10000 });
  await expect(dialog.locator('[data-cart-item="pink-cloud"]')).toBeVisible();
  await expectNoCheckout(dialog);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual([{ id: 'pink-cloud', quantity: 1 }]);
});

test('catalogue failure retains the selection while withholding checkout', async ({ page }) => {
  await page.goto('/catalog/pink-cloud');
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
  const dialog = await openCart(page);
  await expect(dialog.getByRole('link', { name: checkoutName, exact: true })).toBeVisible();
  await page.route('**/api/catalog', route => route.fulfill({ status: 503, json: { status: 'unavailable', bouquets: [] } }));
  await expect(dialog.getByRole('link', { name: checkoutName, exact: true })).toHaveCount(0, { timeout: 10000 });
  await expect(dialog.locator('[data-cart-item="pink-cloud"]')).toBeVisible();
  await expectNoCheckout(dialog);
});

test('mobile product pages keep one primary WhatsApp CTA and a reachable cart without overlap', async ({ page }) => {
  for (const { width, height } of [{ width: 320, height: 844 }, { width: 390, height: 844 }, { width: 390, height: 640 }]) {
    await page.setViewportSize({ width, height });
    await page.goto('/catalog/pink-cloud');
    await expect(page.locator('.order-main')).not.toBeVisible();
    await expect(page.locator('.detail-note')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Заказать в WhatsApp', exact: true })).toHaveCount(1);
    const sticky = page.locator('.sticky-order');
    const stickyOrder = sticky.getByRole('link', { name: 'Заказать в WhatsApp', exact: true });
    await expect(stickyOrder).toBeVisible();
    const trigger = page.getByTestId('cart-trigger');
    await expect(trigger).toHaveAccessibleName(/^Открыть корзину/);
    await expect(trigger).toBeInViewport();
    const cartBounds = (await trigger.boundingBox())!;
    const stickyBounds = (await stickyOrder.boundingBox())!;
    expect(cartBounds.x).toBeGreaterThan(width / 2);
    expect(cartBounds.x + cartBounds.width).toBeLessThanOrEqual(width);
    expect(cartBounds.y).toBeGreaterThan(height / 2);
    expect(Math.abs(cartBounds.height - stickyBounds.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(cartBounds.y - stickyBounds.y)).toBeLessThanOrEqual(1);
    expect(cartBounds.x - (stickyBounds.x + stickyBounds.width)).toBeGreaterThanOrEqual(8);
    const separated = cartBounds.x + cartBounds.width <= stickyBounds.x
      || stickyBounds.x + stickyBounds.width <= cartBounds.x
      || cartBounds.y + cartBounds.height <= stickyBounds.y
      || stickyBounds.y + stickyBounds.height <= cartBounds.y;
    expect(separated).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
    const dialog = await openCart(page);
    const receiving = dialog.getByRole('group', { name: 'Способ получения', exact: true });
    await receiving.scrollIntoViewIfNeeded();
    await expect(receiving).toBeInViewport({ ratio: 1 });
    await receiving.getByText('Самовывоз', { exact: true }).click();
    await expect(receiving.getByRole('radio', { name: 'Самовывоз', exact: true })).toBeChecked();
    const checkout = dialog.getByRole('link', { name: checkoutName, exact: true });
    await expect(checkout).toBeInViewport({ ratio: 1 });
    expect(new URL((await checkout.getAttribute('href'))!).searchParams.get('text')).toContain('Способ получения: Самовывоз');
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('both homepage selections and related bouquets show four cards in balanced rows', async ({ page }) => {
  for (const { width, columns } of [{ width: 1440, columns: 4 }, { width: 820, columns: 2 }, { width: 390, columns: 2 }, { width: 320, columns: 2 }]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const firstSelection = page.locator('#bouquets .product-card');
    const secondSelection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Другие букеты', exact: true }) }).locator('.product-card');
    await expectFourCardRows(firstSelection, columns);
    await expectFourCardRows(secondSelection, columns);
    await page.goto('/catalog/pink-cloud');
    const related = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Смотрите также', exact: true }) }).locator('.product-card');
    await expectFourCardRows(related, columns);
  }
});
