import type { ReactNode } from 'react';
import '@/components/arc/theme.css';
import { Header, Footer } from '@/features/storefront/shell';
import { CatalogProvider } from '@/features/catalog/live-catalog';
import { getCatalog } from '@/features/catalog/sheets';
import { RouteMotion } from '@/features/storefront/route-motion';
import { CartProvider } from '@/features/cart/cart-provider';
import { CartPanel } from '@/features/cart/cart-ui';
export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const initial = await getCatalog();
  return <CatalogProvider initial={initial}><CartProvider><Header /><RouteMotion>{children}</RouteMotion><Footer /><CartPanel /></CartProvider></CatalogProvider>;
}
