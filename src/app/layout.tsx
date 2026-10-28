import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Header, Footer } from '@/features/storefront/shell';
import { CatalogProvider } from '@/features/catalog/live-catalog';
import { getCatalog } from '@/features/catalog/sheets';
import { RouteMotion } from '@/features/storefront/route-motion';
import './globals.css';
export const dynamic = 'force-dynamic';
const title = 'In Bloom — цветы в Астане';
const description = 'Букеты и индивидуальные композиции In Bloom в Астане. Выберите букет и обсудите заказ с флористом в WhatsApp.';
export const metadata: Metadata = { title: { default: title, template: '%s — In Bloom' }, description, icons: { icon: '/images/logo.png' }, openGraph: { title, description, type: 'website', siteName: 'In Bloom', locale: 'ru_KZ' } };
export default async function RootLayout({ children }: { children: ReactNode }) {
  const initial = await getCatalog();
  return <html lang="ru"><body><a className="skip-link" href="#main">Перейти к содержимому</a><CatalogProvider initial={initial}><Header /><RouteMotion>{children}</RouteMotion><Footer /></CatalogProvider></body></html>;
}
