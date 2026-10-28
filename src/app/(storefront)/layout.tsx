import type { ReactNode } from 'react';
import { Header, Footer } from '@/features/storefront/shell';
import { CatalogProvider } from '@/features/catalog/live-catalog';
import { getCatalog } from '@/features/catalog/sheets';
import { RouteMotion } from '@/features/storefront/route-motion';
export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const initial = await getCatalog();
  return <CatalogProvider initial={initial}><Header /><RouteMotion>{children}</RouteMotion><Footer /></CatalogProvider>;
}
