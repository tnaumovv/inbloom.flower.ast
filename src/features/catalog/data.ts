import type { Bouquet } from './types';

// Explicit preview only. A configured Google connection never falls back to these prices.
export const previewBouquets: readonly Bouquet[] = [
  { id: 'pink-cloud', slug: 'pink-cloud', name: 'Pink cloud', priceKzt: 15700, image: '/images/catalogue/pink-cloud.webp', imageAlt: 'Букет Pink cloud — исходная фотография In Bloom', description: 'Композиция в розово-кремовых оттенках с розами, гвоздиками, эустомой и эвкалиптом.', composition: ['Гвоздика микс — 3 шт.', 'Эустома микс — 2 шт.', 'Кустовая бэби хамелеон — 3 шт.', 'Кустовая Салинеро — 2 шт.', 'Эвкалипт биг лиф — 1 шт.', 'Роза пинк охара — 4 шт.'] },
  { id: 'blue-dream', slug: 'blue-dream', name: 'Blue dream', priceKzt: 20200, image: '/images/catalogue/blue-dream.webp', imageAlt: 'Букет Blue dream — исходная фотография In Bloom' },
  { id: 'soft-pink', slug: 'soft-pink', name: 'Soft pink', priceKzt: 13200, image: '/images/catalogue/soft-pink.webp', imageAlt: 'Букет Soft pink — исходная фотография In Bloom' },
  { id: 'mono-sophie', slug: 'mono-sophie', name: 'Mono Sophie', priceKzt: 15800, image: '/images/catalogue/mono-sophie.webp', imageAlt: 'Букет Mono Sophie — исходная фотография In Bloom' },
  { id: 'sophie-planter', slug: 'sophie-planter', name: 'Кашпо Софи С', priceKzt: 12100, image: '/images/catalogue/sophie-planter.webp', imageAlt: 'Кашпо Софи С — исходная фотография In Bloom' },
];
export async function getFeaturedBouquets(): Promise<readonly Bouquet[]> {
  const { getCatalog } = await import('./sheets');
  return (await getCatalog()).bouquets;
}
