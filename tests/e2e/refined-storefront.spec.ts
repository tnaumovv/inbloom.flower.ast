import { expect, test } from '@playwright/test';

for (const width of [320, 390, 430]) {
  test(`mobile hero overlays the enlarged bouquet with readable copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect((await page.locator('[data-hero-scene]').boundingBox())!.height).toBeCloseTo(844, 0);
    await expect(page.locator('.site-header img')).toHaveAttribute('src', /logo/);
    await expect(page.locator('.footer-brand img')).toHaveAttribute('src', /logo/);
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(hero.getByRole('link')).toHaveCount(0);
    const title = (await hero.getByRole('heading', { level: 1 }).boundingBox())!;
    const bouquet = (await page.locator('[data-hero-bouquet]').boundingBox())!;
    expect(bouquet.width).toBeGreaterThan(width * 1.5);
    expect(bouquet.y).toBeLessThan(title.y + title.height);
    expect(bouquet.x).toBeLessThan(title.x + title.width);
    expect(bouquet.x + bouquet.width).toBeGreaterThan(width);
    expect(title.y).toBeGreaterThan((await page.locator('.header-content').boundingBox())!.height);
    await expect(page.locator('.site-header .brand-link')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.screenshot({ path: `.frontend-workbench/mobile-hero-update/hero-${width}.png` });
  });
}

for (const width of [390, 1440]) {
  test(`cards retain spacing across the loop at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#bouquets');
    const viewport = page.getByRole('region', { name: 'Лента букетов', exact: true });
    await expect(viewport).toHaveAttribute('data-enhanced', 'true');
    await viewport.focus();
    await viewport.press('End');
    for (let i = 0; i < 8; i++) {
      const gap = await page.locator('.bouquet-product').evaluateAll(cards => {
        const visible = cards.map(card => card.getBoundingClientRect()).filter(r => r.right > 0 && r.left < innerWidth).sort((a, b) => a.left - b.left);
        return Math.min(...visible.slice(1).map((r, j) => r.left - visible[j].right));
      });
      expect(gap).toBeGreaterThanOrEqual(20);
      await viewport.press('ArrowRight');
    }
  });
}
