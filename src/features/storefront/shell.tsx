'use client';
import Link from 'next/link';
import { CinematicFooter } from '@/components/ui/motion-footer';

import { usePathname } from 'next/navigation';
import { useRef, type ReactNode } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildWhatsAppLink, customBouquetMessage } from '@/features/contact/whatsapp';

export const navigation = [{ href: '/catalog', label: 'Букеты' }, { href: '/about', label: 'О студии' }, { href: '/delivery', label: 'Доставка' }, { href: '/contacts', label: 'Контакты' }];
export function Brand() { return <Link className="brand" href="/" aria-label="In Bloom — главная"><img src="/images/logo.png" width="1768" height="890" alt="In Bloom" /></Link>; }
function ButtonShape({ children }: { children: ReactNode }) {
  return <><span>{children}</span><svg className="button-bridge" viewBox="0 0 36 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8C12 8 10 20 18 20S24 8 36 8V42C24 42 26 30 18 30S12 42 0 42Z" /></svg><b aria-hidden="true"><ArrowUpRight /></b></>;
}
export function Pill({ children, href, variant = '', external = false }: { children: ReactNode; href: string; variant?: string; external?: boolean }) {
  const shaped = !variant.includes('outline');
  return <Link className={`pill ${variant} ${shaped ? 'shaped' : ''}`} href={href} {...external ? { target: '_blank', rel: 'noopener noreferrer' } : {}}>{shaped ? <ButtonShape>{children}</ButtonShape> : children}</Link>;
}
export function Compound({ children, href, external = false }: { children: ReactNode; href: string; external?: boolean }) {
  return <Link className="compound" href={href} {...external ? { target: '_blank', rel: 'noopener noreferrer' } : {}}><ButtonShape>{children}</ButtonShape></Link>;
}
export function Header() {
  const path = usePathname(); const dialog = useRef<HTMLDialogElement>(null);
  return <><header className={`container site-header ${path === '/' ? 'home-header' : 'header-tint'}`}><Brand /><nav className="navigation" aria-label="Основная навигация">{navigation.map(item => <Link key={item.href} href={item.href} className={path.startsWith(item.href) ? 'current' : ''} aria-current={path.startsWith(item.href) ? 'page' : undefined}>{item.label}</Link>)}<Link className="nav-whatsapp" href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">WhatsApp</Link></nav><button className="hamburger" aria-label="Открыть меню" onClick={() => dialog.current?.showModal()}><Menu aria-hidden="true" /></button></header><dialog ref={dialog} className="menu-panel" aria-label="Меню" onClick={event => { if (event.target instanceof Element && event.target.closest('a[href]')) dialog.current?.close(); }}><div className="menu-top"><Brand /><button autoFocus className="close-button" aria-label="Закрыть меню" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></div><nav className="menu-links" aria-label="Мобильная навигация">{navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><div className="menu-bottom"><Pill href={buildWhatsAppLink()} external>Заказать в WhatsApp</Pill><Link className="text-link" href={`tel:${siteConfig.phoneE164}`}>{siteConfig.phoneDisplay}</Link><p>{siteConfig.address}</p><Link className="text-link" href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">@{siteConfig.instagramHandle} <ArrowUpRight aria-hidden="true" size={16} /></Link></div></dialog><noscript><details className="mobile-menu-fallback container"><summary>Разделы сайта</summary><nav>{navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></details></noscript></>;
}
export function Footer() { return <CinematicFooter action={<Compound href={buildWhatsAppLink()} external>Написать флористу</Compound>}><div className="footer-main"><div className="footer-brand"><img src="/images/logo.png" width="1768" height="890" alt="In Bloom" /><p>Цветочная студия<br />Букеты в Астане</p></div><div className="footer-column"><h3>Каталог</h3><Link href="/catalog">Все букеты</Link><Link href={buildWhatsAppLink(customBouquetMessage)} target="_blank" rel="noopener noreferrer">Собрать свой букет</Link></div><div className="footer-column"><h3>Покупателям</h3><Link href="/about">О студии</Link><Link href="/delivery">Доставка и заказ</Link><Link href="/contacts">Контакты</Link><Link href={siteConfig.catalogueUrl} target="_blank" rel="noopener noreferrer">Каталог Florax ↗</Link></div><div className="footer-column"><h3>Контакты</h3><Link className="footer-phone" href={`tel:${siteConfig.phoneE164}`}>{siteConfig.phoneDisplay}</Link><Link href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer">{siteConfig.address}</Link><Link href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">@{siteConfig.instagramHandle}</Link></div></div></CinematicFooter>; }
