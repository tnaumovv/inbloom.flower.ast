import { expect, type Locator, type Page } from '@playwright/test';

export async function expectWithinViewport(locator: Locator, width: number) {
  const bounds = await locator.boundingBox();
  expect(bounds, 'The element must have a rendered box').not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
  expect(await locator.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Content must fit inside its own box, even when ancestors clip overflow').toBe(true);
}

export async function settleFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

export function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|React|uncaught/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}
