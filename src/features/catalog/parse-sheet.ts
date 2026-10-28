import type { Bouquet } from './types';

const required = ['id', 'название', 'цена', 'фото', 'показывать'];
const text = (value: unknown) => String(value ?? '').trim();

export function parseSheet(input: unknown): readonly Bouquet[] {
  if (!Array.isArray(input) || !Array.isArray(input[0]) || input.length > 1001) throw new Error('Не найдена строка заголовков каталога');
  const headers: string[] = input[0].map((v: unknown) => text(v).toLowerCase());
  if (required.some(h => !headers.includes(h)) || new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error('Проверьте заголовки таблицы: ID, Название, Цена, Фото, Показывать');
  const ids = new Set<string>();
  const products: (Bouquet & { order: number })[] = [];
  for (let index = 1; index < input.length; index++) {
    const row = input[index];
    if (!Array.isArray(row) || row.every(v => !text(v))) continue;
    const get = (name: string) => row[headers.indexOf(name)];
    const visible = text(get('показывать')).toLowerCase();
    if (['', 'false', 'нет', '0'].includes(visible)) continue;
    const fail = (reason: string): never => { throw new Error(`Строка ${index + 1}: ${reason}`); };
    if (!['true', 'да', '1'].includes(visible)) fail('в Показывать укажите TRUE или FALSE');
    const id = text(get('id'));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 80 || ids.has(id)) fail('нужен уникальный ID латиницей, например pink-cloud');
    const name = text(get('название'));
    if (!name || name.length > 120) fail('проверьте название');
    const rawPrice = text(get('цена')).replace(/[\s\u00a0\u202f]/g, '').replace(/₸$/, '');
    const priceKzt = Number(rawPrice);
    if (!/^\d+$/.test(rawPrice) || !Number.isSafeInteger(priceKzt) || priceKzt <= 0 || priceKzt > 100_000_000) fail('цена должна быть положительным целым числом в тенге');
    const image = text(get('фото'));
    let safeImage = /^\/images\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp|avif)$/i.test(image) && !image.includes('..');
    try { const url = new URL(image); safeImage ||= url.protocol === 'https:' && !url.username && !url.password; } catch { /* Local image paths are validated above. */ }
    if (!safeImage || image.length > 2048) fail('нужна HTTPS-ссылка на фото или путь /images/...');
    const description = text(get('описание'));
    const composition = text(get('состав')).split(';').map(s => s.trim()).filter(Boolean);
    const category = text(get('категория'));
    const orderText = text(get('порядок'));
    const order = orderText ? Number(orderText) : index;
    if (!Number.isFinite(order) || order < 0 || description.length > 3000 || composition.join(';').length > 4000 || category.length > 80) fail('слишком длинный текст или неверный порядок');
    ids.add(id);
    products.push({ id, slug: id, name, priceKzt, image, imageAlt: `Букет ${name} — фотография In Bloom`, description, composition, category, order });
  }
  return products.sort((a, b) => a.order - b.order).map(({ order: _order, ...bouquet }) => bouquet);
}
