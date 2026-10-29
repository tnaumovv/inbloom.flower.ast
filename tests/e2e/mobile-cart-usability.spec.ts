import { expect, test, type Page } from '@playwright/test';

const cartItems = ['pink-cloud', 'blue-dream', 'soft-pink', 'mono-sophie'].map(id => ({ id, quantity: 1 }));

async function swipe(page: Page, x: number, from: number, to: number) {
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] });
  for (let step = 1; step <= 5; step++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (to - from) * step / 5 }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
}

test('mobile cart gives the list room, has no spacer and closes with a downward swipe', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(items => localStorage.setItem('inbloom.cart.v1', JSON.stringify(items)), cartItems);
  try {
    await page.goto('/catalog');
    const trigger = page.getByTestId('cart-trigger');
    await trigger.tap();
    const panel = page.getByRole('dialog', { name: 'Корзина', exact: true });
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    const body = page.getByTestId('cart-scroll-area');
    expect((await body.boundingBox())!.height).toBeGreaterThan(844 * .5);
    const bounds = (await body.boundingBox())!;
    await swipe(page, 190, bounds.y + bounds.height - 30, bounds.y + 30);
    await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
    await expect(panel).toBeVisible();
    // Swiping down in a scrolled list scrolls towards its top instead of dismissing the cart.
    await swipe(page, 190, bounds.y + 40, bounds.y + 180);
    await expect(panel).toBeVisible();
    // A tap on the empty gutter stops native touch momentum before positioning the next section.
    await body.tap({ position: { x: 5, y: 30 } });
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    const receiving = panel.getByRole('group', { name: 'Способ получения', exact: true });
    await expect(receiving).toBeInViewport({ ratio: 1 });
    const lastRow = (await receiving.locator('label').last().boundingBox())!;
    const total = (await panel.getByTestId('cart-total').boundingBox())!;
    expect(total.y - (lastRow.y + lastRow.height)).toBeLessThan(45);
    await expect(receiving.locator('label > span[aria-hidden="true"]')).toHaveCount(0);
    const title = (await panel.getByRole('heading', { name: 'Корзина', exact: true }).boundingBox())!;
    await swipe(page, title.x + title.width / 2, title.y + 10, title.y + 140);
    await expect(panel).toHaveAttribute('data-state', 'closing');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test('one bouquet does not leave a large gap and search keeps a single focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(item => localStorage.setItem('inbloom.cart.v1', JSON.stringify([item])), cartItems[0]);
  await page.goto('/catalog');
  const search = page.getByRole('searchbox', { name: 'Поиск букета' });
  await search.fill('Pink');
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS('outline-style', 'none');
  const shell = search.locator('..');
  await expect(shell).not.toHaveCSS('box-shadow', 'none');
  await page.getByTestId('cart-trigger').click();
  const panel = page.getByRole('dialog', { name: 'Корзина', exact: true });
  await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  const body = page.getByTestId('cart-scroll-area');
  const cards = panel.locator('[data-cart-item]');
  const receiving = panel.getByRole('group', { name: 'Способ получения', exact: true });
  const card = (await cards.last().boundingBox())!;
  const group = (await receiving.boundingBox())!;
  expect(group.y - (card.y + card.height)).toBeLessThan(30);
  expect(await body.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThan(2);
  expect((await panel.boundingBox())!.height).toBeLessThan(844 * .9);
});

test('optimized images and deferred footer remain readable on mobile and desktop', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const logo = page.locator('header img');
    await expect(logo).toHaveAttribute('src', '/images/logo.webp');
    await expect.poll(() => logo.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(400);
    if (width === 390) await expect(page.locator('header')).toHaveCSS('backdrop-filter', 'none');
    // The desktop footer is fixed behind its frame, so scroll the page to the frame's end.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    if (width === 1440) await expect.poll(() => page.locator('[data-footer-wordmark]').evaluate(element => (element as HTMLElement).style.transform)).not.toBe('');
    await expect(page.locator('[data-footer-reveal]').first()).toHaveCSS('opacity', '1');
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Написать флористу' })).toBeInViewport();
    await page.getByRole('button', { name: 'Вернуться наверх' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  expect(errors).toEqual([]);
});
