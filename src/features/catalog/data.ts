import type { Bouquet } from './types';

const bouquets: readonly Bouquet[] = [
  { id: 'cloud', slug: 'cloud', name: 'Cloud', priceKzt: 18700, image: '/images/bouquets/cloud.png', imageAlt: 'Белые хризантемы, розы и эустомы с эвкалиптом в белой упаковке' },
  { id: 'white-bloom', slug: 'white-bloom', name: 'White bloom', priceKzt: 13200, image: '/images/bouquets/white-bloom.png', imageAlt: 'Кремовые и нежно-жёлтые розы с эвкалиптом и большим белым бантом' },
  { id: 'soft-s', slug: 'soft-s', name: 'Soft s', priceKzt: 10700, image: '/images/bouquets/soft-s.png', imageAlt: 'Розовые розы, белые хризантемы и жёлтые цветы в пудровой упаковке' },
  { id: 'sophie-basket-s', slug: 'sophie-basket-s', name: 'Sophie basket S', priceKzt: 12100, image: '/images/bouquets/sophie-basket-s.png', imageAlt: 'Ярко-розовые кустовые розы в плетёной корзине с розовой лентой' },
];

export async function getFeaturedBouquets(): Promise<readonly Bouquet[]> {
  return bouquets;
}
