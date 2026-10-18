import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { bodyFont, displayFont } from './fonts';
import './globals.css';

const title = 'In Bloom — цветы в Астане';
const description = 'Букеты и индивидуальные композиции In Bloom в Астане. Выберите букет и обсудите заказ с флористом в WhatsApp.';
const siteUrl = process.env.SITE_URL?.trim();
const publicBase = siteUrl ? new URL('/', siteUrl) : undefined;

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: '/images/logo.png' },
  ...(publicBase ? { metadataBase: publicBase, alternates: { canonical: '/' } } : {}),
  openGraph: {
    title, description, type: 'website', siteName: 'In Bloom', locale: 'ru_KZ',
    ...(publicBase ? { url: publicBase, images: [{ url: '/images/hero.png', width: 1536, height: 1024, alt: 'Цветочная композиция In Bloom' }] } : {}),
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ru" className={`${bodyFont.variable} ${displayFont.variable}`}><body><a className="skip-link" href="#main">Перейти к содержимому</a>{children}</body></html>;
}
