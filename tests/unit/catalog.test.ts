import { describe, expect, it } from 'vitest';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { formatPriceKzt } from '@/features/catalog/format-price';

describe('featured bouquet data', () => {
  it('provides the four source name/price pairs for the showcase', async () => {
    const bouquets = await getFeaturedBouquets();
    expect(bouquets.map(({name, priceKzt}) => [name, priceKzt])).toEqual([
      ['Cloud', 18700], ['White bloom', 13200], ['Soft s', 10700], ['Sophie basket S', 12100],
    ]);
    expect(new Set(bouquets.map(b => b.slug)).size).toBe(4);
    for (const b of bouquets) {
      expect(b.image).toMatch(/^\/images\/bouquets\/.+\.png$/);
      expect(b.imageAlt.length).toBeGreaterThan(15);
    }
  });
  it.each([[18700, '18 700 ₸'], [13200, '13 200 ₸'], [10700, '10 700 ₸'], [12100, '12 100 ₸']])('formats %s for display', (price, expected) => {
    expect(formatPriceKzt(Number(price)).replace(/[\u00a0\u202f]/g, ' ')).toBe(expected);
  });
});
