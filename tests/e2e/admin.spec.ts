import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { SignJWT } from 'jose';
import { adminTestEnv } from '../helpers/admin-env';
import type { AdminBouquet } from '../../src/features/admin/model';

const first: AdminBouquet = { id: 'pink-cloud', name: 'Pink cloud', priceKzt: 15700, image: '/images/catalogue/pink-cloud.webp', description: 'Розы и эвкалипт', composition: 'Роза; Эвкалипт', category: 'Авторские', order: 1, visible: true, version: 'version-1' };
const evidence = '/tmp/inbloom-admin-qa';
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });
async function authenticate(page: Page) {
  const value = await new SignJWT({ email: 'owner@gmail.com', sub: 'test-google-owner', sid: 'isolated-e2e-session' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('inbloom-admin').setAudience('session').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(adminTestEnv.ADMIN_SESSION_SECRET));
  await page.context().addCookies([{ name: 'inbloom-admin-session', value, url: adminTestEnv.SITE_URL, httpOnly: true, sameSite: 'Lax' }]);
}
async function catalogMock(page: Page, options: { initial?: AdminBouquet[]; failFirstSave?: boolean; failFirstRead?: boolean } = {}) {
  let bouquets = structuredClone(options.initial ?? [first]); let posts = 0, uploads = 0; let failReads = options.failFirstRead;
  const ids: string[] = [];
  await page.route('**/api/admin/bouquets', async route => {
    if (route.request().method() === 'GET') {
      if (failReads) return route.fulfill({ status: 503, json: { message: 'Каталог временно недоступен. Повторите попытку.' } });
      return route.fulfill({ json: { bouquets } });
    }
    const body = route.request().postDataJSON(); posts++; ids.push(body.draft.id);
    if (options.failFirstSave && posts === 1) return route.fulfill({ status: 503, json: { message: 'Не удалось подтвердить сохранение. Попробуйте ещё раз.' } });
    const saved = { ...body.draft, version: `saved-${posts}` };
    bouquets = [...bouquets.filter(item => item.id !== saved.id), saved];
    return route.fulfill({ json: { bouquet: saved } });
  });
  const image = await readFile('public/images/catalogue/pink-cloud.webp');
  await page.route('**/api/admin/uploads', route => {
    const body = route.request().postDataJSON();
    return route.fulfill({ json: body.action === 'sign' ? { url: 'https://api.cloudinary.com/v1_1/admin-e2e/image/upload', fields: { api_key: 'fake' }, ticket: 'test-ticket' } : { image: 'https://res.cloudinary.com/admin-e2e/image/upload/v1/test.webp', receipt: 'test-receipt' } });
  });
  await page.route('https://api.cloudinary.com/v1_1/admin-e2e/image/upload', route => { uploads++; return route.fulfill({ json: { public_id: 'test', version: 1, signature: 'test' } }); });
  await page.route('https://res.cloudinary.com/admin-e2e/**', route => route.fulfill({ contentType: 'image/webp', body: image }));
  return { get posts() { return posts; }, get uploads() { return uploads; }, ids, recoverReads: () => { failReads = false; } };
}
test('missing configuration blocks admin and API without demo data', async ({ page, request }) => {
  await page.goto('http://127.0.0.1:3105/admin');
  await expect(page.getByRole('heading', { name: 'Админка готовится к запуску' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить букет' })).toHaveCount(0);
  const response = await request.post('http://127.0.0.1:3105/api/admin/bouquets', { data: {} });
  expect(response.status()).toBe(503);
  expect(await response.text()).not.toContain(adminTestEnv.ADMIN_SESSION_SECRET);
  await page.screenshot({ path: `${evidence}/setup-mobile.png`, fullPage: true });
});
test('Google login is separate from storefront and API rejects unauthorized requests', async ({ page, request }) => {
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize(){},renderButton(parent){parent.innerHTML="<button>Войти через Google</button>"},disableAutoSelect(){}}}};' }));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Каталог под рукой' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти через Google' })).toBeVisible();
  await expect(page.locator('.home-header,.site-footer')).toHaveCount(0);
  for (const path of ['bouquets', 'uploads', 'logout']) {
    const response = await request.post(`/api/admin/${path}`, { data: {}, headers: { origin: adminTestEnv.SITE_URL } });
    expect(response.status()).toBe(401);
  }
  expect((await request.post('/api/admin/login', { data: {}, headers: { origin: 'https://evil.example' } })).status()).toBe(403);
});
test('mobile list filters, hides and stays within a 360px screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await authenticate(page); await catalogMock(page);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Букеты', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Редактировать Pink cloud' })).toBeVisible();
  await page.screenshot({ path: `${evidence}/catalog-mobile.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Скрыть Pink cloud' }).click();
  await expect(page.getByRole('button', { name: 'Показать Pink cloud' })).toBeVisible();
  await page.getByRole('button', { name: 'Только на сайте' }).click();
  await expect(page.getByText('В этой подборке пока нет букетов.')).toBeVisible();
  await page.getByRole('button', { name: 'Только скрытые' }).click();
  await expect(page.getByRole('button', { name: 'Редактировать Pink cloud' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('photo upload and save retry retain the same draft ID and do not upload twice', async ({ page }) => {
  await authenticate(page); const state = await catalogMock(page, { failFirstSave: true }); await page.goto('/admin');
  await page.getByRole('button', { name: 'Добавить букет' }).click();
  await page.getByLabel('Название букета').fill('Утро в саду'); await page.getByLabel('Цена, ₸').fill('18500');
  await page.getByLabel('Фотография букета').setInputFiles('public/images/catalogue/pink-cloud.webp');
  await page.screenshot({ path: `${evidence}/editor-mobile.png`, fullPage: true });
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Не удалось подтвердить сохранение');
  await expect(page.getByLabel('Название букета')).toHaveValue('Утро в саду');
  await expect(page.locator('main').getByRole('alert')).toBeFocused();
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Редактировать Утро в саду' })).toBeVisible();
  expect(state.uploads).toBe(1); expect(state.posts).toBe(2); expect(state.ids[0]).toBe(state.ids[1]);
});
test('desktop editor updates existing bouquet and can keep a draft hidden', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 }); await authenticate(page); const state = await catalogMock(page); await page.goto('/admin');
  await page.getByRole('button', { name: 'Редактировать Pink cloud' }).click();
  await page.getByLabel('Название букета').fill('Розовое утро'); await page.getByLabel('Цена, ₸').fill('16500');
  await page.screenshot({ path: `${evidence}/editor-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Скрыть с сайта' }).click();
  await expect(page.getByRole('button', { name: 'Редактировать Розовое утро' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Показать Розовое утро' })).toBeVisible();
  expect(state.uploads).toBe(0);
});
test('failed catalogue read offers retry and does not substitute products', async ({ page }) => {
  await authenticate(page); const state = await catalogMock(page, { initial: [], failFirstRead: true }); await page.goto('/admin');
  await expect(page.locator('main').getByRole('alert')).toContainText('Каталог временно недоступен');
  await expect(page.getByRole('button', { name: /Редактировать/ })).toHaveCount(0);
  state.recoverReads(); await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('heading', { name: 'Добавьте первый букет' })).toBeVisible();
});
