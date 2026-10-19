import { expect, test, type Locator } from '@playwright/test';

async function movement(track: Locator) {
  return track.evaluate(el => new Promise<number>(resolve => {
    const x = () => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    const start = x();
    let frames = 0;
    const sample = () => ++frames < 24 ? requestAnimationFrame(sample) : resolve(x() - start);
    requestAnimationFrame(sample);
  }));
}

test('desktop carousel fills the screen, moves continuously left and pauses on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#bouquets');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const track = viewport.locator('> div');
  await expect(page.getByRole('article')).toHaveCount(6);
  await expect(viewport).toHaveAttribute('data-enhanced', 'true');
  expect((await viewport.boundingBox())!.width).toBe(1920);
  await page.mouse.move(10, 200);
  await expect.poll(() => movement(track)).toBeLessThan(-5);
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(200, box.y + 150);
  await expect.poll(async () => Math.abs(await movement(track))).toBeLessThan(.5);
  await page.screenshot({ path: '.frontend-workbench/header-carousel/desktop-carousel.png' });
  await page.mouse.move(10, 200);
  await expect.poll(() => movement(track)).toBeLessThan(-5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('carousel wraps in both directions and preserves product links and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#bouquets');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const status = page.getByRole('status');
  await expect(page.locator('#bouquets').getByRole('button')).toHaveCount(0);
  for (const [name, price] of [['Cloud', '18 700'], ['White bloom', '13 200'], ['Soft s', '10 700'], ['Sophie basket S', '12 100'], ['Green red', '20 300'], ['Autumn', '15 400']]) {
    const card = page.getByRole('article', { name, exact: true });
    await expect(card.getByRole('link')).toHaveCount(1);
    const url = new URL((await card.getByRole('link').getAttribute('href'))!);
    expect(url.pathname).toBe('/77082204675');
    expect(url.searchParams.get('text')!.replace(/[\u00a0\u202f]/g, ' ')).toContain(`«${name}» (${price} ₸)`);
  }
  await viewport.focus();
  await viewport.press('Home');
  await expect(status).toContainText('1 из 6');
  await viewport.press('ArrowLeft');
  await expect(status).toContainText('6 из 6');
  await viewport.press('ArrowRight');
  await expect(status).toContainText('1 из 6');
  await viewport.focus();
  await viewport.press('End');
  await expect(status).toContainText('6 из 6');
  await expect(page.getByRole('article', { name: 'Autumn', exact: true })).toBeInViewport();
  await viewport.press('ArrowRight');
  await expect(status).toContainText('1 из 6');
  expect(Math.abs(await movement(viewport.locator('> div')))).toBeLessThan(.5);
});

test('touch pauses the carousel while held and resumes after release without buttons', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('/#bouquets');
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  const track = viewport.locator('> div');
  await expect.poll(() => movement(track)).toBeLessThan(-5);
  const box = (await viewport.boundingBox())!;
  const touch = await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: box.y + 160 }] });
  await expect(page.locator('#bouquets').getByRole('button')).toHaveCount(0);
  await expect.poll(async () => Math.abs(await movement(track))).toBeLessThan(.5);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => movement(track)).toBeLessThan(-5);
  await viewport.focus();
  await viewport.press('End');
  await expect(page.getByRole('status')).toContainText('6 из 6');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await viewport.focus();
  await viewport.press('Home');
  await expect(page.getByRole('status')).toContainText('1 из 6');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(Math.abs(await movement(track))).toBeLessThan(.5);
  await context.close();
});

test('the supplied 3D card tilts, resets and disables motion when the preference changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#bouquets');
  const article = page.getByRole('article', { name: 'Cloud', exact: true });
  const card = article.locator('[data-tilt-card]');
  await expect(article.getByRole('link')).toHaveAttribute('target', '_blank');
  // Pause autoplay and select the card before measuring pointer coordinates.
  const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
  await viewport.focus();
  await viewport.press('Home');
  await expect(article).toBeInViewport();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 100);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.mouse.move(10, 200);
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card).toHaveCSS('transform', 'none');
});
