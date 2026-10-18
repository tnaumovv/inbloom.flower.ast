import { SiteHeader } from '@/components/layout/site-header';
import { Hero } from '@/features/landing/hero';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { Showcase } from '@/features/catalog/showcase';

export default async function Home() {
  const bouquets = await getFeaturedBouquets();
  return <><SiteHeader/><main id="main"><Hero/><Showcase bouquets={bouquets}/></main></>;
}
