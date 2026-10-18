import type { ReactNode } from 'react';
import { bodyFont, displayFont } from './fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ru" className={`${bodyFont.variable} ${displayFont.variable}`}><body><a className="skip-link" href="#main">Перейти к содержимому</a>{children}</body></html>;
}
