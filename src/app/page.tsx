import { SiteHeader } from '@/components/layout/site-header';
import { Hero } from '@/features/landing/hero';
import { getFeaturedBouquets } from '@/features/catalog/data';
import { Showcase } from '@/features/catalog/showcase';
import { CustomBouquet } from '@/features/landing/custom-bouquet';
import { OrderSteps } from '@/features/landing/order-steps';
import { Faq } from '@/features/landing/faq';
import { SiteFooter } from '@/components/layout/site-footer';
import { ScrollReveals } from '@/features/landing/scroll-reveals';

export default async function Home() {
  const bouquets = await getFeaturedBouquets();
  return <><SiteHeader/><main id="main"><Hero/><Showcase bouquets={bouquets}/><div className="studio-shell"><CustomBouquet/><OrderSteps/></div><Faq/></main><SiteFooter/><ScrollReveals/></>;
}
