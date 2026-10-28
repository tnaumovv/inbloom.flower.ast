import { describe, expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { formatPriceKzt } from '@/features/catalog/format-price';

describe('featured bouquet data', () => {
  it('provides five approved preview name/price pairs for the showcase', async () => {
    const bouquets = await getFeaturedBouquets();
    expect(bouquets.map(({name, priceKzt}) => [name, priceKzt])).toEqual([
      ['Pink cloud', 15700], ['Blue dream', 20200], ['Soft pink', 13200], ['Mono Sophie', 15800], ['Кашпо Софи С', 12100],
    ]);
    expect(new Set(bouquets.map(b => b.slug)).size).toBe(5);
    for (const b of bouquets) {
      expect(b.image).toMatch(/^\/images\/(bouquets|catalogue)\/.+\.(png|webp)$/);
      expect(b.imageAlt.length).toBeGreaterThan(15);
    }
  });
  it.each([[18700, '18 700 ₸'], [13200, '13 200 ₸'], [10700, '10 700 ₸'], [12100, '12 100 ₸'], [20300, '20 300 ₸'], [15400, '15 400 ₸']])('formats %s for display', (price, expected) => {
    expect(formatPriceKzt(Number(price)).replace(/[\u00a0\u202f]/g, ' ')).toBe(expected);
  });
});
