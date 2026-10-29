import { expect, test, type Page } from '@playwright/test';
import type { CatalogSnapshot } from '../../src/features/catalog/types';

async function openPinkCloudCart(page: Page) {
  await page.goto('/catalog/pink-cloud');
  await page.locator('.detail-copy').getByRole('button', { name: 'Добавить Pink cloud в корзину', exact: true }).click();
  await page.getByTestId('cart-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Корзина', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('quantity supports typed drafts, keyboard steps and bounded commits', async ({ page }) => {
  const dialog = await openPinkCloudCart(page);
  const quantity = dialog.getByRole('spinbutton', { name: 'Количество Pink cloud', exact: true });
  await quantity.focus();
  await quantity.press('ArrowUp');
  await expect(quantity).toHaveAttribute('aria-valuenow', '2');
  await quantity.press('PageUp');
  await expect(quantity).toHaveAttribute('aria-valuenow', '12');
  await quantity.press('Shift+ArrowDown');
  await expect(quantity).toHaveAttribute('aria-valuenow', '2');
  await quantity.press('Home');
  await expect(quantity).toHaveAttribute('aria-valuenow', '1');

  await quantity.fill('120');
  await expect(quantity).toHaveAttribute('aria-invalid', 'true');
  await quantity.press('Enter');
  await expect(quantity).toHaveValue('99');
  await expect(quantity).toHaveAttribute('aria-valuenow', '99');
  await expect(dialog.getByRole('button', { name: 'Увеличить количество Pink cloud', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await quantity.fill('9'.repeat(40));
  expect(await dialog.locator('ul').evaluate(element => element.parentElement!.scrollWidth <= element.parentElement!.clientWidth)).toBe(true);
  await quantity.press('Enter');
  await expect(quantity).toHaveValue('99');
  await quantity.fill('0');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('1');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/15\s700\s₸/);

  await quantity.fill('5');
  await quantity.press('Enter');
  await quantity.fill('8');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/125\s600\s₸/);
  await quantity.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(quantity).toHaveValue('5');
  await expect(dialog.getByTestId('cart-total')).toHaveText(/78\s500\s₸/);
  await quantity.fill('');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('5');
  const href = await dialog.getByRole('link', { name: 'Оформить в WhatsApp', exact: true }).getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain('Pink cloud — 5 шт.');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('holding a quantity stepper repeats and releasing stops the changes', async ({ page }) => {
  const dialog = await openPinkCloudCart(page);
  const quantity = dialog.getByRole('spinbutton', { name: 'Количество Pink cloud', exact: true });
  const increase = dialog.getByRole('button', { name: 'Увеличить количество Pink cloud', exact: true });
  await increase.hover();
  await page.mouse.down();
  try {
    await expect.poll(async () => Number(await quantity.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(4);
  } finally {
    await page.mouse.up();
  }
  const releasedQuantity = await quantity.getAttribute('aria-valuenow');
  // Observe longer than the initial repeat delay to catch a timer left running after release.
  await page.waitForTimeout(500);
  await expect(quantity).toHaveAttribute('aria-valuenow', releasedQuantity!);
});

test('quantity hold stops when the window loses focus or the cart closes', async ({ page }) => {
  const dialog = await openPinkCloudCart(page);
  const quantity = dialog.getByRole('spinbutton', { name: 'Количество Pink cloud', exact: true });
  const increase = dialog.getByRole('button', { name: 'Увеличить количество Pink cloud', exact: true });
  await increase.hover();
  await page.mouse.down();
  try {
    await expect.poll(async () => Number(await quantity.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(4);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const blurredQuantity = await quantity.getAttribute('aria-valuenow');
    await page.waitForTimeout(500);
    await expect(quantity).toHaveAttribute('aria-valuenow', blurredQuantity!);
  } finally {
    await page.mouse.up();
  }

  const beforeClosingHold = Number(await quantity.getAttribute('aria-valuenow'));
  await increase.hover();
  await page.mouse.down();
  let closedQuantity: string | null = null;
  try {
    await expect.poll(async () => Number(await quantity.getAttribute('aria-valuenow'))).toBeGreaterThan(beforeClosingHold + 1);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    // The dialog stays mounted; its inactive quantity field must stop its repeat timer.
    const hiddenQuantity = page.locator('#shopping-cart input[role="spinbutton"]');
    closedQuantity = await hiddenQuantity.getAttribute('aria-valuenow');
    await page.waitForTimeout(500);
    await expect(hiddenQuantity).toHaveAttribute('aria-valuenow', closedQuantity!);
  } finally {
    await page.mouse.up();
  }
  await page.getByTestId('cart-trigger').click();
  await expect(quantity).toHaveAttribute('aria-valuenow', closedQuantity!);
});

test('search clears with focus restored and optional budgets stay empty when cleared', async ({ page, request }) => {
  const snapshot: CatalogSnapshot = await (await request.get('/api/catalog')).json();
  await page.goto('/catalog');
  const search = page.getByRole('searchbox', { name: 'Поиск букета', exact: true });
  const cards = page.locator('#catalog-results .product-card');
  const shell = search.locator('..');
  const shellBounds = (await shell.boundingBox())!;
  await page.mouse.click(shellBounds.x + shellBounds.width / 2, shellBounds.y + 2);
  await expect(search).toBeFocused();
  await page.getByRole('textbox', { name: 'Бюджет от, ₸', exact: true }).click();
  await shell.locator('svg').first().click();
  await expect(search).toBeFocused();
  await search.fill('Pink');
  await expect(cards).toHaveCount(3);
  await page.getByRole('button', { name: 'Очистить поиск', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(cards).toHaveCount(snapshot.bouquets.length);

  const minimum = page.getByRole('textbox', { name: 'Бюджет от, ₸', exact: true });
  const maximum = page.getByRole('textbox', { name: 'До, ₸', exact: true });
  await minimum.fill('12000');
  await maximum.fill('16000');
  await expect(cards).toHaveCount(snapshot.bouquets.filter(b => b.priceKzt >= 12000 && b.priceKzt <= 16000).length);
  await minimum.fill('');
  await expect(page.getByRole('button', { name: 'Убрать минимальный бюджет', exact: true })).toHaveCount(0);
  await expect(cards).toHaveCount(snapshot.bouquets.filter(b => b.priceKzt <= 16000).length);
  await maximum.fill('');
  await expect(maximum).toHaveValue('');
  await expect(cards).toHaveCount(snapshot.bouquets.length);
  await expect(page.getByRole('button', { name: 'Убрать максимальный бюджет', exact: true })).toHaveCount(0);
});

test('sorting supports keyboard selection, Escape and outside dismissal', async ({ page, request }) => {
  const snapshot: CatalogSnapshot = await (await request.get('/api/catalog')).json();
  await page.goto('/catalog');
  const sort = page.getByRole('combobox', { name: 'Сортировка', exact: true });
  await sort.focus();
  await sort.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('option', { name: 'По названию', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sort).toBeFocused();
  await expect(sort).toContainText('По умолчанию');
  await expect(page.getByRole('listbox')).not.toBeVisible();

  await sort.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('option', { name: 'По названию', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(sort).toContainText('По названию');
  const byName = [...snapshot.bouquets].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  await expect(page.locator('#catalog-results .product-card').first()).toHaveAttribute('data-bouquet-id', byName[0].id);
  await expect(sort).toBeFocused();
  const headingBounds = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
  await sort.click();
  await page.mouse.click(headingBounds.x + headingBounds.width / 2, headingBounds.y + headingBounds.height / 2);
  await expect(page.getByRole('listbox')).not.toBeVisible();
  await expect(sort).toContainText('По названию');
});

test('mobile controls fit small screens, accept touch and keep budget drafts isolated', async ({ browser, baseURL }) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const cart = await openPinkCloudCart(page);
      const quantity = cart.getByRole('spinbutton', { name: 'Количество Pink cloud', exact: true });
      const increase = cart.getByRole('button', { name: 'Увеличить количество Pink cloud', exact: true });
      const decrease = cart.getByRole('button', { name: 'Уменьшить количество Pink cloud', exact: true });
      for (const stepper of [increase, decrease]) {
        const bounds = (await stepper.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
      await increase.tap();
      await expect(quantity).toHaveAttribute('aria-valuenow', '2');
      await decrease.tap();
      await expect(quantity).toHaveAttribute('aria-valuenow', '1');
      expect(await cart.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await cart.getByRole('button', { name: 'Закрыть корзину', exact: true }).tap();
      await page.goto('/catalog');
      const filterTrigger = page.getByRole('button', { name: 'Фильтры', exact: true });
      await filterTrigger.tap();
      const filters = page.getByRole('dialog', { name: 'Фильтры букетов', exact: true });
      const from = filters.getByRole('textbox', { name: 'От', exact: true });
      const to = filters.getByRole('textbox', { name: 'До', exact: true });
      await from.fill('12000');
      await to.fill('16000');
      await filters.getByRole('button', { name: 'Закрыть фильтры', exact: true }).tap();
      await expect(page.locator('#catalog-results .product-card')).toHaveCount(24);
      await filterTrigger.tap();
      await expect(from).toHaveValue('');
      await expect(to).toHaveValue('');
      await from.fill('20000');
      await to.fill('10000');
      await expect(to).toHaveAttribute('aria-invalid', 'true');
      await expect(filters.getByRole('button', { name: 'Показать букеты', exact: true })).toBeDisabled();
      await from.fill('12000');
      await to.fill('16000');
      expect(await filters.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await filters.getByRole('button', { name: 'Показать букеты', exact: true }).tap();
      await expect(page.locator('#catalog-results .product-card')).toHaveCount(6);
      const sort = page.getByRole('combobox', { name: 'Сортировка', exact: true });
      await sort.tap();
      const option = page.getByRole('option', { name: 'Сначала дороже', exact: true });
      await expect(option).toBeInViewport();
      await option.tap();
      await expect(sort).toContainText('Сначала дороже');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
