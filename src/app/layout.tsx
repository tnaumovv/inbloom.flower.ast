import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-dynamic';
const title = 'In Bloom — цветы в Астане';
const description = 'Букеты и индивидуальные композиции In Bloom в Астане. Выберите букет и обсудите заказ с флористом в WhatsApp.';
export const metadata: Metadata = { title: { default: title, template: '%s — In Bloom' }, description, icons: { icon: '/images/logo.png' }, openGraph: { title, description, type: 'website', siteName: 'In Bloom', locale: 'ru_KZ' } };
export default async function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ru" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Перейти к содержимому</a>{children}</body></html>;
}
