import { expect, test } from '@playwright/test';

for (const width of [320, 390, 430]) {
  test(`mobile hero actions stay near the copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect((await page.locator('[data-hero-scene]').boundingBox())!.height).toBeCloseTo(844, 0);
    await expect(page.locator('.site-header img')).toHaveAttribute('src', /logo/);
    await expect(page.locator('.footer-brand img')).toHaveAttribute('src', /logo/);
    const choose = page.getByRole('link', { name: 'Выбрать букет', exact: true });
    const florist = page.getByRole('link', { name: 'Написать флористу', exact: true });
    const first = (await choose.boundingBox())!;
    const second = (await florist.boundingBox())!;
    expect(first.height).toBeGreaterThanOrEqual(56);
    expect(first.width).toBeGreaterThanOrEqual(width - 48);
    expect(second.y + second.height).toBeLessThan(660);
    expect(await choose.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
    expect((await page.locator('[data-hero-bouquet]').boundingBox())!.y).toBeLessThan(220);
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
