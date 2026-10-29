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
  await expect(first.getByTestId('cart-quantity')).toHaveText('2');
  await expect(second.getByTestId('cart-quantity')).toHaveText('1');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/21\s000\s₸/);

  await second.getByRole('button', { name: 'Увеличить количество Bag', exact: true }).click();
  await expect(second.getByTestId('cart-quantity')).toHaveText('2');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/28\s000\s₸/);
  await first.getByRole('button', { name: 'Уменьшить количество Bag', exact: true }).click();
  await expect(first.getByTestId('cart-quantity')).toHaveText('1');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/21\s000\s₸/);

  const href = await dialog.getByRole('link', { name: checkoutName, exact: true }).getAttribute('href');
  const orderUrl = new URL(href!);
  expect(orderUrl.origin).toBe('https://wa.me');
  expect(orderUrl.searchParams.get('text')!.replace(/\u00a0|\u202f/g, ' ')).toBe(
    'Здравствуйте! Хочу заказать:\n\n' +
    '1. «Bag» (артикул: bag-303869) — 1 шт. × 7 000 ₸ = 7 000 ₸\n' +
    '2. «Bag» (артикул: bag-301723) — 2 шт. × 7 000 ₸ = 14 000 ₸\n\n' +
    'Итого: 21 000 ₸.\nПодскажите, пожалуйста, наличие букетов и варианты доставки.',
  );

  await first.getByRole('button', { name: 'Удалить Bag из корзины', exact: true }).click();
  await expect(first).toHaveCount(0);
  await expect(dialog.getByTestId('cart-total')).toHaveText(/14\s000\s₸/);
  await second.getByRole('button', { name: 'Удалить Bag из корзины', exact: true }).click();
  await expect(dialog.getByText('Ваша корзина пока пуста', { exact: true })).toBeVisible();
  await expectNoCheckout(dialog);

  await dialog.getByRole('button', { name: 'Закрыть корзину', exact: true }).click();
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
  await expect(dialog.locator('[data-cart-item="pink-cloud"]').getByTestId('cart-quantity')).toHaveText('2');
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
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
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
    expect(cartBounds.y).toBeGreaterThan(844 / 2);
    const separated = cartBounds.x + cartBounds.width <= stickyBounds.x
      || stickyBounds.x + stickyBounds.width <= cartBounds.x
      || cartBounds.y + cartBounds.height <= stickyBounds.y
      || stickyBounds.y + stickyBounds.height <= cartBounds.y;
    expect(separated).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const dialog = await openCart(page);
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
