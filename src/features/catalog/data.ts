import type { Bouquet } from './types';

const bouquets: readonly Bouquet[] = [
  { id: 'cloud', slug: 'cloud', name: 'Cloud', priceKzt: 18700, image: '/images/catalogue/cloud.webp', imageAlt: 'Букет Cloud: белые цветы и эвкалипт в светлой упаковке' },
  { id: 'white-bloom', slug: 'white-bloom', name: 'White bloom', priceKzt: 13200, image: '/images/catalogue/white-bloom.webp', imageAlt: 'Букет White bloom с кремовыми розами и большим светлым бантом' },
  { id: 'soft-s', slug: 'soft-s', name: 'Soft s', priceKzt: 10700, image: '/images/bouquets/soft-s.png', imageAlt: 'Розовые розы, белые хризантемы и жёлтые цветы в пудровой упаковке' },
  { id: 'sophie-basket-s', slug: 'sophie-basket-s', name: 'Sophie basket S', priceKzt: 12100, image: '/images/catalogue/sophie-basket-s.webp', imageAlt: 'Розовые кустовые розы Sophie basket S в плетёной корзине' },
  { id: 'green-red', slug: 'green-red', name: 'Green red', priceKzt: 20300, image: '/images/catalogue/green-red.webp', imageAlt: 'Букет Green red из публичного каталога цветочной студии In Bloom' },
  { id: 'autumn', slug: 'autumn', name: 'Autumn', priceKzt: 15400, image: '/images/catalogue/autumn.webp', imageAlt: 'Осенний букет Autumn из публичного каталога цветочной студии In Bloom', imagePosition: '50% 90%' },
];

export async function getFeaturedBouquets(): Promise<readonly Bouquet[]> {
  return bouquets;
}
