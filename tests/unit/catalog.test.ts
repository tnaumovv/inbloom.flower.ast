import { describe, expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { formatPriceKzt } from '@/features/catalog/format-price';
import { createImportPlan } from '../../scripts/import-florax-catalog.mjs';

describe('featured bouquet data', () => {
  it('keeps the original bouquets and includes the complete imported catalogue', async () => {
    const bouquets = await getFeaturedBouquets();
    expect(bouquets.slice(0, 5).map(({name, priceKzt}) => [name, priceKzt])).toEqual([
      ['Pink cloud', 15700], ['Blue dream', 20200], ['Soft pink', 13200], ['Mono Sophie', 15800], ['Кашпо Софи С', 12100],
    ]);
    expect(bouquets).toHaveLength(24);
    expect(new Set(bouquets.map(b => b.slug)).size).toBe(24);
    expect(bouquets.filter(b => b.name === 'Bag').map(b => [b.id, b.priceKzt])).toEqual([
      ['bag-303869', 7000], ['bag-301723', 7000], ['bag-296189', 7000], ['bag-291807', 5500],
    ]);
    for (const b of bouquets) {
      expect(b.image).toMatch(/^\/images\/(bouquets|catalogue)\/.+\.(png|webp)$/);
      expect(b.imageAlt.length).toBeGreaterThan(15);
    }
  });
  it.each([[18700, '18 700 ₸'], [13200, '13 200 ₸'], [10700, '10 700 ₸'], [12100, '12 100 ₸'], [20300, '20 300 ₸'], [15400, '15 400 ₸']])('formats %s for display', (price, expected) => {
    expect(formatPriceKzt(Number(price)).replace(/[\u00a0\u202f]/g, ' ')).toBe(expected);
  });
});

describe('append-only catalogue import', () => {
  const headers = ['ID', 'Название', 'Цена', 'Фото', 'Описание', 'Состав', 'Показывать', 'Порядок', 'Категория'];
  const products = [
    { sourceId: 1, slug: 'pink-cloud-1', existingSiteId: 'pink-cloud', name: 'Pink cloud', priceKzt: 15700, image: '/images/catalogue/pink-cloud.webp', composition: [], sourcePosition: 1 },
    { sourceId: 2, slug: 'bag-2', existingSiteId: null, name: 'Bag', priceKzt: 7000, image: '/images/catalogue/bag-2.png', composition: [{ name: 'Роза', quantity: 3 }], sourcePosition: 2 },
    { sourceId: 3, slug: 'bag-3', existingSiteId: null, name: 'Bag', priceKzt: 5500, image: '/images/catalogue/bag-3.png', composition: [], sourcePosition: 3 },
  ];
  it('preserves a hidden edited bouquet and manual rows while keeping repeated names distinct', () => {
    const rows = [headers, ['pink-cloud', 'Редактированный', 19900, '/images/catalogue/pink-cloud.webp', '', '', false, 4, ''], ['manual', 'Свой букет', 59990, '/images/catalogue/pink-cloud.webp', '', '', true, 0, '']];
    const before = structuredClone(rows);
    const plan = createImportPlan(rows, products);
    expect(rows).toEqual(before);
    expect(plan.preservedIds).toEqual(['pink-cloud']);
    expect(plan.rowsToAppend).toEqual([
      ['bag-2', 'Bag', 7000, '/images/catalogue/bag-2.png', '', 'Роза — 3 шт.', true, 5, ''],
      ['bag-3', 'Bag', 5500, '/images/catalogue/bag-3.png', '', '', true, 6, ''],
    ]);
    expect(createImportPlan([...rows, ...plan.rowsToAppend], products).rowsToAppend).toEqual([]);
  });
  it('maps existing header order and rejects duplicate source identities', () => {
    const reordered = ['Название', 'ID', ...headers.slice(2)];
    expect(createImportPlan([reordered], products.slice(1)).rowsToAppend[0].slice(0, 2)).toEqual(['Bag', 'bag-2']);
    expect(() => createImportPlan([headers], [products[1], products[1]])).toThrow(/duplicate/i);
  });
});
